import type {
  CalendarEventModel,
  CaseModel,
  ContactModel,
  OperatingJourneyModel,
  OperatingSystemState,
  PromptTemplateType,
  PropertyModel,
} from "./types";

function names(contacts: ContactModel[]) {
  return contacts.map((contact) => contact.name).filter(Boolean).join("、") || "未指定";
}

function eventLine(event: CalendarEventModel) {
  const time = event.startTime ? ` ${event.startTime}` : "";
  return `${event.startDate}${time}｜${event.eventType}｜${event.title}`;
}

export function buildCaseContext(state: OperatingSystemState, caseItem: CaseModel) {
  const property = state.properties.find((item) => item.id === caseItem.propertyId);
  const journeys = state.journeys.filter((journey) => caseItem.journeyIds.includes(journey.id));
  const events = state.calendarEvents
    .filter((event) => event.caseId === caseItem.id)
    .sort((a, b) => `${b.startDate} ${b.startTime}`.localeCompare(`${a.startDate} ${a.startTime}`));
  const contactIds = new Set<string>();
  journeys.forEach((journey) => journey.contactIds.forEach((id) => contactIds.add(id)));
  events.forEach((event) => event.contactIds.forEach((id) => contactIds.add(id)));
  property?.ownerIds.forEach((id) => contactIds.add(id));
  property?.buyerIds.forEach((id) => contactIds.add(id));
  property?.tenantIds.forEach((id) => contactIds.add(id));
  const contacts = state.contacts.filter((contact) => contactIds.has(contact.id));
  const primaryJourney = journeys[0];
  const attachments = state.files.filter((file) => caseItem.fileIds.includes(file.id));

  return [
    `案件名稱：${caseItem.title}`,
    `角色：${caseItem.caseRole}`,
    `案件類型：${caseTypeLabel(caseItem.type)}`,
    `案件狀態：${caseStatusLabel(caseItem.status)}`,
    "",
    "物件：",
    propertyContext(property),
    "",
    `關聯聯絡人：${names(contacts)}`,
    contacts.length ? contacts.map((contact) => `- ${contact.name}｜${contact.phone || contact.line || "無聯絡方式"}｜${contact.aiSummary || "無摘要"}`).join("\n") : "- 尚未關聯聯絡人",
    "",
    "目前旅程：",
    journeys.length ? journeys.map(journeyContext).join("\n") : "- 尚未建立旅程",
    "",
    "下一步：",
    primaryJourney?.nextStep || "請先判斷下一步。",
    "",
    "目前原因：",
    primaryJourney?.aiSuggestion || caseItem.aiSummary || "尚未建立原因。",
    "",
    "主要風險：",
    primaryJourney && primaryJourney.overdueDays > 0 ? `已超過 ${primaryJourney.overdueDays} 天未追蹤，可能降低成交機會。` : "目前沒有明確逾期風險。",
    "",
    "最近事件：",
    events.length ? events.slice(0, 8).map(eventLine).join("\n") : "- 尚無事件紀錄",
    "",
    "AI Summary：",
    caseItem.aiSummary || "尚未建立 AI Summary。",
    "",
    "AI Insight：",
    caseItem.aiInsight || "尚未建立 AI Insight。",
    "",
    "AI Brain：",
    caseItem.aiBrain || "尚未建立 AI 長期理解。",
    "",
    "附件 metadata：",
    attachments.length ? attachments.map((file) => `- ${file.category}｜${file.name}｜${file.aiSummary || "無摘要"}`).join("\n") : "- 尚無附件",
  ].join("\n");
}

export function buildPromptFromTemplate(context: string, type: PromptTemplateType, customQuestion = "") {
  const template = promptTemplate(type, customQuestion);
  return `${context}\n\n---\n\n任務：\n${template}\n\n請使用繁體中文，結論先行，避免臆測未提供資料。`;
}

function propertyContext(property?: PropertyModel) {
  if (!property) return "- 尚未關聯物件";
  return [
    `- 社區：${property.community || "未填"}`,
    `- 地址：${property.address || "未填"}`,
    `- 屋型：${property.propertyType || "未填"}`,
    `- 總價：${property.totalPrice || "未填"}`,
    `- 坪數：${property.area || "未填"}`,
    `- 狀態：${property.status}`,
    `- AI 分析：${property.aiAnalysis || "無"}`,
  ].join("\n");
}

function journeyContext(journey: OperatingJourneyModel) {
  return [
    `- 類型：${journeyTypeLabel(journey.type)}`,
    `  階段：${journey.currentStage}`,
    `  成交機率：${journey.probability}%`,
    `  成交價值：${journey.dealValue}`,
    `  下一步：${journey.nextStep}`,
    `  AI 建議：${journey.aiSuggestion || "無"}`,
  ].join("\n");
}

function promptTemplate(type: PromptTemplateType, customQuestion: string) {
  switch (type) {
    case "快速摘要":
      return "請用 5 點整理本案件目前狀態、最重要下一步、主要風險。";
    case "LINE 回覆":
      return "請產生一則可直接傳 LINE 的回覆。口吻自然、簡短、有溫度，不要強迫推銷。";
    case "電話話術":
      return "請產生一段電話開場、核心問題、收尾約定下一步的話術。";
    case "成交分析":
      return "請分析成交機率、推進阻礙、今天最值得做的動作，並說明理由。";
    case "下一步建議":
      return "請只給 3 個下一步建議，依成交價值排序，並標出今天最該做的一件事。";
    case "591 文案":
      return "請依物件資料產生 591 刊登標題與文案。不得臆測未提供資訊。";
    case "FB 文案":
      return "請產生 Facebook 美編版貼文，分段清楚，適合手機閱讀。";
    case "短影音腳本":
      return "請產生 40 到 60 秒短影音腳本，包含前三秒鉤子、口播、畫面建議與 CTA。";
    case "自由詢問":
      return customQuestion.trim() || "請根據案件脈絡提出專業建議。";
  }
}

function caseTypeLabel(type: CaseModel["type"]) {
  return ({ Sale: "買賣", Rental: "租賃", Repair: "修繕", Warranty: "保固", Management: "管理" } as const)[type];
}

function caseStatusLabel(status: CaseModel["status"]) {
  return ({ Active: "進行中", Closing: "成交中", Closed: "已結案", Archived: "已封存" } as const)[status];
}

function journeyTypeLabel(type: OperatingJourneyModel["type"]) {
  return ({ Buyer: "買方", Owner: "屋主", Tenant: "租客", Repair: "修繕" } as const)[type];
}
