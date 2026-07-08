import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type CalendarPayload = {
  event: {
    id: string;
    title: string;
    propertyId: string;
    caseId: string;
    contactIds: string[];
    eventType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    googleCalendarEventId: string;
  };
  property?: {
    community: string;
    address: string;
    totalPrice: string;
  };
  caseTitle?: string;
  contacts?: Array<{
    name: string;
    phone: string;
    line: string;
    email: string;
  }>;
};

function getRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/google-calendar/callback`;
}

function authUrl(request: NextRequest) {
  return `${request.nextUrl.origin}/api/google-calendar/auth`;
}

function isSecure(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

function jsonError(message: string, status: number, request?: NextRequest) {
  return NextResponse.json(
    {
      error: message,
      authUrl: status === 401 && request ? authUrl(request) : undefined,
    },
    { status },
  );
}

async function refreshAccessToken(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = request.cookies.get("mg_gcal_refresh_token")?.value;

  if (!clientId || !clientSecret) {
    return { error: "GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET 尚未設定。" };
  }

  if (!refreshToken) {
    return { error: "尚未登入 Google，請先完成授權。" };
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    return { error: "Google 授權已失效，請重新登入。" };
  }

  const token = await response.json() as { access_token: string; expires_in?: number };
  return { accessToken: token.access_token, expiresIn: token.expires_in || 3600 };
}

async function getAccessToken(request: NextRequest) {
  const accessToken = request.cookies.get("mg_gcal_access_token")?.value;
  if (accessToken) return { accessToken };
  return refreshAccessToken(request);
}

function applyAccessCookie(response: NextResponse, request: NextRequest, accessToken?: string, expiresIn?: number) {
  if (!accessToken || !expiresIn) return response;
  response.cookies.set("mg_gcal_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure(request),
    path: "/",
    maxAge: Math.max(60, expiresIn - 60),
  });
  return response;
}

function dateTime(date: string, time: string) {
  return `${date}T${time || "09:00"}:00+08:00`;
}

function normalizeGoogleEvent(event: any) {
  const startDateTime = String(event.start?.dateTime || "");
  const endDateTime = String(event.end?.dateTime || "");
  return {
    googleCalendarEventId: event.id || "",
    title: event.summary || "",
    location: event.location || "",
    description: event.description || "",
    startDate: startDateTime.slice(0, 10),
    startTime: startDateTime.slice(11, 16),
    endDate: endDateTime.slice(0, 10),
    endTime: endDateTime.slice(11, 16),
    syncStatus: "Synced",
  };
}

function buildGoogleEvent(payload: CalendarPayload) {
  const contacts = payload.contacts || [];
  const contactText = contacts
    .map((contact) => `${contact.name}${contact.phone ? ` ${contact.phone}` : ""}${contact.line ? ` LINE:${contact.line}` : ""}`)
    .join("、");

  return {
    summary: payload.event.title,
    location: payload.event.location,
    description: [
      payload.event.description,
      "",
      "MG-AIOS 關聯資訊",
      `物件：${payload.property?.community || "未指定"}`,
      `地址：${payload.property?.address || ""}`,
      `總價：${payload.property?.totalPrice || ""}`,
      `案件：${payload.caseTitle || "未指定"}`,
      `聯絡人：${contactText || "未指定"}`,
    ].join("\n"),
    start: {
      dateTime: dateTime(payload.event.startDate, payload.event.startTime),
      timeZone: "Asia/Taipei",
    },
    end: {
      dateTime: dateTime(payload.event.endDate, payload.event.endTime),
      timeZone: "Asia/Taipei",
    },
    extendedProperties: {
      private: {
        mgAiosEventId: payload.event.id,
        propertyId: payload.event.propertyId,
        caseId: payload.event.caseId,
        contactIds: payload.event.contactIds.join(","),
        eventType: payload.event.eventType,
      },
    },
  };
}

async function googleRequest(request: NextRequest, url: string, init: RequestInit) {
  const token = await getAccessToken(request);
  if ("error" in token) {
    const message = token.error || "Google Calendar 授權失敗。";
    const status = message.includes("尚未登入") || message.includes("失效") ? 401 : 503;
    return { errorResponse: jsonError(message, status, request) };
  }

  const googleResponse = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token.accessToken}`,
      ...(init.headers || {}),
    },
  });

  if (googleResponse.status === 401) {
    const refreshed = await refreshAccessToken(request);
    if ("error" in refreshed) {
      return { errorResponse: jsonError(refreshed.error || "Google 授權已失效，請重新登入。", 401, request) };
    }

    const retry = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${refreshed.accessToken}`,
        ...(init.headers || {}),
      },
    });

    return { googleResponse: retry, accessToken: refreshed.accessToken, expiresIn: refreshed.expiresIn };
  }

  return { googleResponse };
}

export async function POST(request: NextRequest) {
  const payload = await request.json() as CalendarPayload;
  const result = await googleRequest(request, GOOGLE_EVENTS_URL, {
    method: "POST",
    body: JSON.stringify(buildGoogleEvent(payload)),
  });

  if (result.errorResponse) return result.errorResponse;
  if (!result.googleResponse?.ok) {
    const detail = await result.googleResponse?.text();
    return jsonError(`建立 Google 行事曆失敗：${detail || "未知錯誤"}`, 502);
  }

  const googleEvent = await result.googleResponse.json();
  const response = NextResponse.json({ event: normalizeGoogleEvent(googleEvent) });
  return applyAccessCookie(response, request, result.accessToken, result.expiresIn);
}

export async function GET(request: NextRequest) {
  const googleEventId = request.nextUrl.searchParams.get("googleEventId");
  if (!googleEventId) return jsonError("缺少 Google Calendar Event ID。", 400);

  const result = await googleRequest(request, `${GOOGLE_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: "GET",
  });

  if (result.errorResponse) return result.errorResponse;
  if (!result.googleResponse?.ok) {
    const detail = await result.googleResponse?.text();
    return jsonError(`讀取 Google 行事曆失敗：${detail || "未知錯誤"}`, 502);
  }

  const googleEvent = await result.googleResponse.json();
  const response = NextResponse.json({ event: normalizeGoogleEvent(googleEvent) });
  return applyAccessCookie(response, request, result.accessToken, result.expiresIn);
}

export async function PUT(request: NextRequest) {
  const payload = await request.json() as CalendarPayload;
  const googleEventId = payload.event.googleCalendarEventId;
  if (!googleEventId) return jsonError("缺少 Google Calendar Event ID，請先加入 Google 行事曆。", 400);

  const result = await googleRequest(request, `${GOOGLE_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: "PUT",
    body: JSON.stringify(buildGoogleEvent(payload)),
  });

  if (result.errorResponse) return result.errorResponse;
  if (!result.googleResponse?.ok) {
    const detail = await result.googleResponse?.text();
    return jsonError(`更新 Google 行事曆失敗：${detail || "未知錯誤"}`, 502);
  }

  const googleEvent = await result.googleResponse.json();
  const response = NextResponse.json({ event: normalizeGoogleEvent(googleEvent) });
  return applyAccessCookie(response, request, result.accessToken, result.expiresIn);
}

export async function DELETE(request: NextRequest) {
  const googleEventId = request.nextUrl.searchParams.get("googleEventId");
  if (!googleEventId) return jsonError("缺少 Google Calendar Event ID。", 400);

  const result = await googleRequest(request, `${GOOGLE_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: "DELETE",
  });

  if (result.errorResponse) return result.errorResponse;
  if (!result.googleResponse?.ok && result.googleResponse?.status !== 410) {
    const detail = await result.googleResponse?.text();
    return jsonError(`刪除 Google 行事曆失敗：${detail || "未知錯誤"}`, 502);
  }

  const response = NextResponse.json({ ok: true });
  return applyAccessCookie(response, request, result.accessToken, result.expiresIn);
}
