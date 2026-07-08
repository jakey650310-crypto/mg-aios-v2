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

export function buildAiPriorityItems(state: OperatingSystemState): AiPriorityItem[] {
  const journeyItems = state.journeys
    .filter((journey) => journey.status !== "已完成")
    .map((journey) => {
      const property = findProperty(state.properties, journey.propertyId);
      return {
        id: journey.id,
        title: contactNames(state.contacts, journey.contactIds),
        subtitle: `${property?.community || "未關聯物件"}｜${journey.currentStage}`,
        nextStep: journey.nextStep,
        propertyId: journey.propertyId,
        contactIds: journey.contactIds,
        type: "Journey" as const,
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
      return {
        id: repair.id,
        title: repair.issue,
        subtitle: `${property?.community || "未關聯物件"}｜${repair.status}`,
        nextStep: repair.aiReminder,
        propertyId: repair.propertyId,
        contactIds: property?.tenantIds || [],
        type: "Repair" as const,
        score: calculateAiPriorityScore({
          dealValue: Number(repair.cost) || 80,
          probability: 50,
          urgency: repair.status === "報價中" ? 4 : 3,
          overdueDays: 1,
        }),
      };
    });

  return [...journeyItems, ...repairItems].sort((a, b) => b.score - a.score);
}

export function normalizeOperatingSystemState(state: Partial<OperatingSystemState>): OperatingSystemState {
  return {
    properties: state.properties || seedOperatingSystem.properties,
    contacts: state.contacts || seedOperatingSystem.contacts,
    journeys: state.journeys || seedOperatingSystem.journeys,
    repairs: state.repairs || seedOperatingSystem.repairs,
    files: state.files || [],
    financials: state.financials || [],
    marketingContents: state.marketingContents || [],
    aiCenter: state.aiCenter || seedOperatingSystem.aiCenter,
  };
}
