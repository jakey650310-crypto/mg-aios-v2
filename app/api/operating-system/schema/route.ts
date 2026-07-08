import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    version: "MG-AIOS v2",
    principle: "Property first. AI first, human confirms.",
    priorityFormula: "成交價值 × 成交機率 × 時效性 × 逾期天數",
    models: {
      Property: [
        "Owner",
        "Buyer",
        "Tenant",
        "Repair",
        "Journey",
        "Files",
        "Financial",
        "AI分析",
      ],
      Contact: ["Owner", "Buyer", "Tenant", "Referrer"],
      Journey: ["Buyer", "Owner", "Tenant", "Repair"],
      Repair: [
        "物件",
        "問題",
        "照片",
        "影片",
        "狀態",
        "報價",
        "施工日期",
        "完成日期",
        "保固",
        "師傅",
        "費用",
        "AI提醒",
      ],
      AiCenter: [
        "整理摘要",
        "排序TOP5",
        "生成LINE訊息",
        "生成追蹤建議",
        "預測成交率",
        "提醒風險",
      ],
    },
  });
}
