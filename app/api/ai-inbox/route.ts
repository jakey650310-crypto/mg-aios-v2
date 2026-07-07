import { NextResponse } from "next/server";
import type { AiJourneyDraft } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const journeySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "person",
    "journey",
    "stage",
    "priority",
    "nextAction",
    "summary",
    "reason",
    "risk",
    "estimatedDealValue",
    "eventKind",
    "waitingKind",
    "confidence",
  ],
  properties: {
    person: { type: "string" },
    journey: { type: "string", enum: ["屋主旅程", "案件旅程", "買方旅程", "出租旅程"] },
    stage: { type: "string" },
    priority: { type: "integer", minimum: 1, maximum: 99 },
    nextAction: { type: "string" },
    summary: { type: "string" },
    reason: { type: "string" },
    risk: { type: "string" },
    estimatedDealValue: { type: "string" },
    eventKind: { type: "string", enum: ["", "收斡旋", "見面談", "今天交屋", "今天簽約", "屋主等待回覆", "買方等待回覆"] },
    waitingKind: { type: "string", enum: ["", "等待屋主", "等待買方", "等待貸款", "等待代書", "等待租客"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
  },
};

function getOutputText(response: unknown) {
  const data = response as { output_text?: string; output?: Array<{ content?: Array<{ text?: string; type?: string }> }> };
  if (data.output_text) return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function normalizeDraft(draft: AiJourneyDraft): AiJourneyDraft {
  return {
    ...draft,
    person: draft.person || "待確認",
    stage: draft.stage || "AI 已整理",
    priority: Math.max(1, Math.min(99, Number(draft.priority) || 70)),
    nextAction: draft.nextAction || "請確認下一步",
    summary: draft.summary || "AI 已整理，但摘要需要人工確認。",
    reason: draft.reason || "AI 判斷此項目值得進一步確認。",
    risk: draft.risk || "若未追蹤，可能錯過成交機會。",
    estimatedDealValue: draft.estimatedDealValue || "待確認成交價值",
    eventKind: draft.eventKind || "",
    waitingKind: draft.waitingKind || "",
    confidence: Math.max(0, Math.min(100, Number(draft.confidence) || 0)),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY 尚未設定，AI Inbox v2 無法呼叫 ChatGPT API。" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const inputType = String(formData.get("inputType") || "text");
  const text = String(formData.get("text") || "").trim();
  const file = formData.get("file");

  const content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }> = [
    {
      type: "input_text",
      text: [
        "你是 MG-AIOS 的 AI 房仲作戰助理。",
        "請從使用者提供的文字、LINE 截圖或照片中，整理出今天可推進成交的 Journey。",
        "請不要建立 CRM 清單，只輸出一個最值得追蹤的 Journey。",
        "若資訊不足，仍輸出可確認草稿，並降低 confidence。",
        "priority 代表成交推進優先度，1 到 99，收斡旋、見面談、今天簽約、今天交屋、等待回覆要提高 priority。",
        `輸入類型：${inputType}`,
        text ? `補充文字：${text}` : "補充文字：未提供",
      ].join("\n"),
    },
  ];

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "目前 AI Inbox v2 先支援 LINE 截圖與照片。" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "圖片太大，請先壓縮到 8MB 以下。" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    content.push({
      type: "input_image",
      image_url: `data:${file.type};base64,${buffer.toString("base64")}`,
    });
  }

  if (!text && content.length === 1) {
    return NextResponse.json({ error: "請貼文字，或上傳 LINE 截圖／照片。" }, { status: 400 });
  }

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "mg_aios_journey_draft",
          strict: true,
          schema: journeySchema,
        },
      },
    }),
  });

  const raw = await openaiResponse.json();
  if (!openaiResponse.ok) {
    return NextResponse.json(
      { error: "ChatGPT API 呼叫失敗，請稍後再試。", detail: raw?.error?.message || "" },
      { status: openaiResponse.status },
    );
  }

  const outputText = getOutputText(raw);
  if (!outputText) {
    return NextResponse.json({ error: "AI 沒有回傳可建立 Journey 的 JSON。" }, { status: 502 });
  }

  try {
    return NextResponse.json({ draft: normalizeDraft(JSON.parse(outputText) as AiJourneyDraft) });
  } catch {
    return NextResponse.json({ error: "AI 回傳格式無法解析，請重新送出。" }, { status: 502 });
  }
}
