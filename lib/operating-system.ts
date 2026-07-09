import type {
  AiPriorityItem,
  ContactModel,
  OperatingJourneyModel,
  OperatingSystemState,
  PropertyModel,
  RepairModel,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

function todayValue() {
  return new Date().toLocaleDateString("sv-SE");
}

export function calculateAiPriorityScore(input: {
  dealValue: number;
  probability: number;
  urgency: number;
  overdueDays: number;
}) {
  const valueScore = Math.max(1, input.dealValue / 100);
  const probabilityScore = Math.max(1, input.probability);
  const urgencyScore = Math.max(1, input.urgency);
  const overdueBoost = Math.max(1, input.overdueDays + 1);
  return Math.round(valueScore * probabilityScore * urgencyScore * overdueBoost);
}

export const seedOperatingSystem: OperatingSystemState = {
  contacts: [
    {
      id: "contact-claire",
      name: "Claire",
      phone: "",
      line: "Claire",
      email: "",
      job: "長榮航空",
      birthday: "",
      roles: ["Buyer"],
      tags: ["高成交率", "2~3房車"],
      aiSummary: "需求明確，預算約 1500 萬，南崁與桃園區可看，屋齡 15 年內。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "contact-owner-wang",
      name: "王屋主",
      phone: "",
      line: "",
      email: "",
      job: "",
      birthday: "",
      roles: ["Owner"],
      tags: ["委託前", "需回訪"],
      aiSummary: "已七天未聯絡，接近委託關鍵期。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "contact-tenant-chen",
      name: "陳租客",
      phone: "",
      line: "",
      email: "",
      job: "",
      birthday: "",
      roles: ["Tenant"],
      tags: ["修繕"],
      aiSummary: "等待冷氣修繕報價。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  properties: [
    {
      id: "property-nankan-a",
      community: "南崁三房車",
      address: "桃園市蘆竹區",
      propertyType: "電梯大樓",
      totalPrice: "1500萬",
      area: "待確認",
      status: "出售中",
      ownerIds: ["contact-owner-wang"],
      buyerIds: ["contact-claire"],
      tenantIds: [],
      journeyIds: ["op-journey-claire", "op-journey-owner-wang"],
      repairIds: [],
      fileIds: [],
      financialIds: [],
      caseIds: ["case-nankan-sale"],
      aiAnalysis: "買方需求明確，屋主委託機會高，今日應優先推進。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "property-rental-a",
      community: "社宅租賃案",
      address: "桃園市桃園區",
      propertyType: "住宅",
      totalPrice: "租賃",
      area: "待確認",
      status: "出租中",
      ownerIds: [],
      buyerIds: [],
      tenantIds: ["contact-tenant-chen"],
      journeyIds: ["op-journey-tenant-chen"],
      repairIds: ["repair-ac"],
      fileIds: [],
      financialIds: [],
      caseIds: ["case-rental-management"],
      aiAnalysis: "修繕與租客回覆需追蹤。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  journeys: [
    {
      id: "op-journey-claire",
      type: "Buyer",
      propertyId: "property-nankan-a",
      contactIds: ["contact-claire"],
      currentStage: "第二次看屋",
      nextStep: "今天確認週六看屋並傳 2 間符合物件",
      probability: 82,
      aiSuggestion: "先傳符合條件物件，再確認週六看屋時間。",
      reminderDate: todayValue(),
      completedRecords: [],
      history: [],
      dealValue: 1500,
      urgency: 5,
      overdueDays: 0,
      status: "待處理",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "op-journey-owner-wang",
      type: "Owner",
      propertyId: "property-nankan-a",
      contactIds: ["contact-owner-wang"],
      currentStage: "委託前",
      nextStep: "再次拜訪，確認是否願意委託",
      probability: 76,
      aiSuggestion: "不要急著談條件，先建立信任與再次拜訪。",
      reminderDate: todayValue(),
      completedRecords: [],
      history: [],
      dealValue: 1200,
      urgency: 4,
      overdueDays: 7,
      status: "待處理",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "op-journey-tenant-chen",
      type: "Tenant",
      propertyId: "property-rental-a",
      contactIds: ["contact-tenant-chen"],
      currentStage: "等待修繕",
      nextStep: "確認冷氣報價與施工時間",
      probability: 40,
      aiSuggestion: "先處理修繕，避免租客滿意度下降。",
      reminderDate: todayValue(),
      completedRecords: [],
      history: [],
      dealValue: 120,
      urgency: 5,
      overdueDays: 2,
      status: "待處理",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  repairs: [
    {
      id: "repair-ac",
      propertyId: "property-rental-a",
      issue: "冷氣不冷，等待師傅報價",
      photoUrls: [],
      videoUrls: [],
      status: "報價中",
      quote: "待報價",
      constructionDate: "",
      completedDate: "",
      warranty: "",
      contractor: "待確認",
      cost: "",
      aiReminder: "今天追師傅報價，避免租客等待太久。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  files: [],
  financials: [],
  marketingContents: [],
  cases: [
    {
      id: "case-nankan-sale",
      propertyId: "property-nankan-a",
      type: "Sale",
      caseRole: "買方",
      title: "南崁三房車買賣案",
      status: "Active",
      timeline: ["建立物件", "建立案件", "行銷曝光"],
      journeyIds: ["op-journey-claire", "op-journey-owner-wang"],
      eventIds: ["event-claire-showing"],
      taskIds: ["task-claire-confirm-showing"],
      notes: "以 Claire 看屋與王屋主委託為同一物件下的買賣推進案。",
      aiSummary: "買方需求明確，屋主委託機會高，今天應優先推進看屋與屋主回訪。",
      aiInsight: "Claire 已進入第二次看屋，適合推進到斡旋前準備。",
      aiBrain: "此案同時有買方需求與屋主委託機會，適合用成交案例建立雙方信任。",
      fileIds: [],
      financialIds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "case-rental-management",
      propertyId: "property-rental-a",
      type: "Management",
      caseRole: "承租方",
      title: "社宅租賃代管案",
      status: "Active",
      timeline: ["建立物件", "租賃追蹤", "修繕處理"],
      journeyIds: ["op-journey-tenant-chen"],
      eventIds: ["event-repair-followup"],
      taskIds: ["task-repair-quote"],
      notes: "租客等待冷氣修繕報價，今日需回覆進度。",
      aiSummary: "租客等待修繕，若拖延會影響滿意度與續租意願。",
      aiInsight: "此案重點不是成交，而是降低租客等待焦慮。",
      aiBrain: "社宅代管案件要優先處理修繕回覆速度，避免小問題累積成信任問題。",
      fileIds: [],
      financialIds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  calendarEvents: [
    {
      id: "event-claire-showing",
      title: "Claire 第二次看屋",
      propertyId: "property-nankan-a",
      caseId: "case-nankan-sale",
      contactIds: ["contact-claire"],
      eventType: "第二次看屋",
      eventDate: todayValue(),
      startDate: todayValue(),
      endDate: todayValue(),
      startTime: "10:00",
      endTime: "11:00",
      location: "桃園市蘆竹區",
      description: "確認週六看屋時間與符合條件物件。",
      status: "Scheduled",
      priority: "高",
      source: "Manual",
      createdBy: "蔡名廣",
      completedAt: "",
      googleCalendarEventId: "",
      syncStatus: "NotSynced",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "event-repair-followup",
      title: "追冷氣修繕報價",
      propertyId: "property-rental-a",
      caseId: "case-rental-management",
      contactIds: ["contact-tenant-chen"],
      eventType: "修繕",
      eventDate: todayValue(),
      startDate: todayValue(),
      endDate: todayValue(),
      startTime: "15:00",
      endTime: "15:30",
      location: "電話",
      description: "追師傅報價並回覆租客。",
      status: "Scheduled",
      priority: "高",
      source: "Manual",
      createdBy: "蔡名廣",
      completedAt: "",
      googleCalendarEventId: "",
      syncStatus: "NotSynced",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  caseTasks: [
    {
      id: "task-claire-confirm-showing",
      caseId: "case-nankan-sale",
      title: "確認 Claire 週六看屋時間",
      status: "待處理",
      dueDate: todayValue(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "task-repair-quote",
      caseId: "case-rental-management",
      title: "追冷氣修繕報價並回覆租客",
      status: "待處理",
      dueDate: todayValue(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  closingRecords: [],
  aiCenter: [
    {
      id: "ai-top5",
      title: "今日 TOP5 排序",
      task: "排序TOP5",
      input: "成交價值、成交機率、時效性、逾期天數",
      output: "優先推進 Claire 看屋、王屋主委託、冷氣修繕。",
      confirmed: true,
      createdAt: nowIso(),
    },
  ],
};

function findProperty(properties: PropertyModel[], id: string) {
  return properties.find((property) => property.id === id);
}

function contactNames(contacts: ContactModel[], ids: string[]) {
  const names = ids.map((id) => contacts.find((contact) => contact.id === id)?.name).filter(Boolean);
  return names.length ? names.join("、") : "未關聯客戶";
}

function findCaseByProperty(state: OperatingSystemState, propertyId: string) {
  return state.cases.find((caseItem) => caseItem.propertyId === propertyId);
}

function todayKey() {
  return new Date().toLocaleDateString("sv-SE");
}

export function buildAiPriorityItems(state: OperatingSystemState): AiPriorityItem[] {
  const calendarItems = (state.calendarEvents || [])
    .filter((event) => event.status !== "Cancelled" && event.startDate === todayKey())
    .map((event) => {
      const property = findProperty(state.properties, event.propertyId);
      const journey = state.journeys.find((item) => item.propertyId === event.propertyId);
      const caseItem = state.cases.find((item) => item.id === event.caseId) || findCaseByProperty(state, event.propertyId);
      return {
        id: event.id,
        title: event.title,
        subtitle: `${event.startTime || "未設定時間"}｜${property?.community || "未關聯物件"}｜${event.eventType}`,
        nextStep: event.description || "依行程推進下一步",
        propertyId: event.propertyId,
        caseId: caseItem?.id,
        contactIds: event.contactIds,
        type: "Calendar" as const,
        displayTag: event.startTime ? "🔥 今天有約" : "🟢 今日行程",
        reason: event.description || "今日有已排定行程，需要準時推進。",
        probability: journey?.probability || 50,
        score: calculateAiPriorityScore({
          dealValue: journey?.dealValue || 100,
          probability: journey?.probability || 50,
          urgency: 5,
          overdueDays: 1,
        }),
      };
    });

  const journeyItems = state.journeys
    .filter((journey) => journey.status !== "已完成")
    .map((journey) => {
      const property = findProperty(state.properties, journey.propertyId);
      const caseItem = findCaseByProperty(state, journey.propertyId);
      return {
        id: journey.id,
        title: contactNames(state.contacts, journey.contactIds),
        subtitle: `${property?.community || "未關聯物件"}｜${journey.currentStage}`,
        nextStep: journey.nextStep,
        propertyId: journey.propertyId,
        caseId: caseItem?.id,
        contactIds: journey.contactIds,
        type: "Journey" as const,
        displayTag: journey.overdueDays > 0 ? "🔥 已逾期" : journey.reminderDate === todayKey() ? "🟢 今天要做" : "🟡 建議推進",
        reason: journey.aiSuggestion || "依成交價值與成交機率排序，建議今天處理。",
        probability: journey.probability,
        score: calculateAiPriorityScore({
          dealValue: journey.dealValue,
          probability: journey.probability,
          urgency: journey.urgency,
          overdueDays: journey.overdueDays,
        }),
      };
    });

  const repairItems = state.repairs
    .filter((repair) => repair.status !== "已完成")
    .map((repair) => {
      const property = findProperty(state.properties, repair.propertyId);
      const caseItem = findCaseByProperty(state, repair.propertyId);
      return {
        id: repair.id,
        title: repair.issue,
        subtitle: `${property?.community || "未關聯物件"}｜${repair.status}`,
        nextStep: repair.aiReminder,
        propertyId: repair.propertyId,
        caseId: caseItem?.id,
        contactIds: property?.tenantIds || [],
        type: "Repair" as const,
        displayTag: "🔴 修繕待處理",
        reason: repair.aiReminder || "修繕會影響服務品質，需追蹤進度。",
        probability: 50,
        score: calculateAiPriorityScore({
          dealValue: Number(repair.cost) || 80,
          probability: 50,
          urgency: repair.status === "報價中" ? 4 : 3,
          overdueDays: 1,
        }),
      };
    });

  const closingItems = (state.closingRecords || []).flatMap((record) => {
    const property = findProperty(state.properties, record.propertyId);
    return record.tasks
      .filter((task) => task.status !== "Done")
      .map((task) => ({
        id: `${record.id}-${task.id}`,
        title: task.title,
        subtitle: `${property?.community || "未關聯物件"}｜成交中心`,
        nextStep: `完成${task.title}`,
        propertyId: record.propertyId,
        caseId: record.caseId,
        contactIds: [],
        type: "Closing" as const,
        displayTag: "🔥 成交流程",
        reason: "成交流程不能漏件，需優先完成。",
        probability: 95,
        score: calculateAiPriorityScore({
          dealValue: Number(record.dealPrice.replace(/\D/g, "")) || 100,
          probability: 95,
          urgency: 5,
          overdueDays: 1,
        }),
      }));
  });

  const marketingItems = (state.marketingContents || [])
    .filter((item) => item.publishStatus === "NeedUpdate")
    .map((item) => {
      const property = findProperty(state.properties, item.propertyId);
      return {
        id: item.id,
        title: item.title,
        subtitle: `${property?.community || "未關聯物件"}｜行銷需要更新`,
        nextStep: "更新已發布行銷內容",
        propertyId: item.propertyId,
        caseId: findCaseByProperty(state, item.propertyId)?.id,
        contactIds: [],
        type: "Marketing" as const,
        displayTag: "🟡 行銷更新",
        reason: "物件價格已變更，已發布內容需要同步更新。",
        probability: 70,
        score: calculateAiPriorityScore({
          dealValue: Number(property?.totalPrice.replace(/\D/g, "")) || 100,
          probability: 70,
          urgency: 4,
          overdueDays: 1,
        }),
      };
    });

  return [...calendarItems, ...journeyItems, ...repairItems, ...closingItems, ...marketingItems].sort((a, b) => b.score - a.score);
}

export function normalizeOperatingSystemState(state: Partial<OperatingSystemState>): OperatingSystemState {
  const cases = (state.cases || seedOperatingSystem.cases).map((caseItem) => ({
    ...caseItem,
    caseRole: caseItem.caseRole || "其他",
    taskIds: caseItem.taskIds || [],
    notes: caseItem.notes || "",
    aiSummary: caseItem.aiSummary || "",
    aiInsight: caseItem.aiInsight || "",
    aiBrain: caseItem.aiBrain || "",
  }));
  const calendarEvents = (state.calendarEvents || seedOperatingSystem.calendarEvents).map((event) => ({
    ...event,
    eventDate: event.eventDate || event.startDate,
    priority: event.priority || "中",
    source: event.source || "Manual",
    createdBy: event.createdBy || "蔡名廣",
    completedAt: event.completedAt || "",
  }));

  return {
    properties: state.properties || seedOperatingSystem.properties,
    contacts: state.contacts || seedOperatingSystem.contacts,
    journeys: state.journeys || seedOperatingSystem.journeys,
    repairs: state.repairs || seedOperatingSystem.repairs,
    files: state.files || [],
    financials: state.financials || [],
    marketingContents: state.marketingContents || [],
    cases,
    calendarEvents,
    caseTasks: state.caseTasks || seedOperatingSystem.caseTasks,
    closingRecords: state.closingRecords || [],
    aiCenter: state.aiCenter || seedOperatingSystem.aiCenter,
  };
}
