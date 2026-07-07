import type { Buyer, HousingCase, InboxItem, Seller, Task } from "./types";

const today = new Date().toLocaleDateString("sv-SE");

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

export const seedTasks: Task[] = [
  { id: "must-1", title: "今天帶看中泰宏國", detail: "出門前確認鑰匙與客戶時間", dueDate: today, time: "11:30", status: "must", module: "buyer", priority: 1 },
  { id: "must-2", title: "回覆屋主價格討論", detail: "整理近三筆成交與目前競品", dueDate: today, time: "14:00", status: "must", module: "seller", priority: 2 },
  { id: "suggest-1", title: "追蹤三天未回覆買方", detail: "用 LINE 關心需求是否有變", dueDate: today, status: "suggested", module: "buyer", priority: 3 },
  { id: "waiting-1", title: "等待修繕廠商報價", detail: "收到後回覆房東與租客", dueDate: today, status: "waiting", module: "housing", priority: 4 },
];

export const seedBuyers: Buyer[] = [
  { id: "buyer-1", name: "王先生", need: "桃園區三房，1000萬內，近學區", lastContactDate: addDays(-4), nextFollowUpDate: today, chatUrl: "", note: "偏好低總價、採光佳" },
  { id: "buyer-2", name: "林小姐", need: "南崁兩房車，首購自住", lastContactDate: addDays(-1), nextFollowUpDate: addDays(2), chatUrl: "", note: "可接受屋齡 20 年內" },
];

export const seedSellers: Seller[] = [
  { id: "seller-1", name: "陳屋主", listingStatus: "委售中", need: "希望一個月內有明確出價", nextContactDate: today, note: "先回報本週詢問量" },
];

export const seedHousing: HousingCase[] = [
  { id: "housing-1", tenant: "張租客", landlord: "黃房東", item: "報修", date: today, status: "等待報價", note: "冷氣排水需確認" },
  { id: "housing-2", tenant: "李租客", landlord: "吳房東", item: "公證", date: addDays(1), status: "待處理", note: "明天確認文件" },
];

export const seedInboxItems: InboxItem[] = [
  { id: "inbox-1", source: "Codex", title: "Sprint 2 待辦", content: "把重要輸出轉成今天可執行的待辦。", createdAt: new Date().toISOString() },
];
