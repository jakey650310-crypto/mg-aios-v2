import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/google-calendar/callback`;
}

function isSecure(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const code = request.nextUrl.searchParams.get("code");

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?googleCalendar=missing-config", request.nextUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?googleCalendar=missing-code", request.nextUrl.origin));
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/?googleCalendar=oauth-failed", request.nextUrl.origin));
  }

  const token = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const response = NextResponse.redirect(new URL("/?googleCalendar=connected", request.nextUrl.origin));
  response.cookies.set("mg_gcal_access_token", token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure(request),
    path: "/",
    maxAge: Math.max(60, (token.expires_in || 3600) - 60),
  });

  if (token.refresh_token) {
    response.cookies.set("mg_gcal_refresh_token", token.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure(request),
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }

  return response;
}
