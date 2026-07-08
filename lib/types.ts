export type JourneyKind = "屋主旅程" | "案件旅程" | "買方旅程" | "出租旅程";
export type JourneyStatus = "active" | "waiting" | "done";
export type PriorityEventKind = "收斡旋" | "見面談" | "今天交屋" | "今天簽約" | "屋主等待回覆" | "買方等待回覆";
export type WaitingKind = "等待屋主" | "等待買方" | "等待貸款" | "等待代書" | "等待租客";

export interface JourneyHistoryEntry {
  id: string;
  changedAt: string;
  changedBy: string;
  before: Partial<JourneyCard>;
  after: Partial<JourneyCard>;
}

export interface JourneyCard {
  id: string;
  person: string;
  journey: JourneyKind;
  stage: string;
  nextStep: string;
  reason: string;
  risk: string;
  estimatedDealValue: string;
  priorityScore: number;
  estimatedCloseDate?: string;
  aiSuggestion?: string;
  notes?: string;
  phone?: string;
  roleTag?: string;
  potentialTag?: string;
  relationshipLevel?: number;
  listingProbability?: number;
  referralProbability?: number;
  dealValueLevel?: string;
  aiNextSteps?: string;
  latestFollowUp?: string;
  customerProfile?: string;
  propertyInfo?: string;
  lineRecords?: string;
  fileRecords?: string;
  eventKind?: PriorityEventKind;
  waitingKind?: WaitingKind;
  status: JourneyStatus;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  history?: JourneyHistoryEntry[];
}

export interface AiInboxItem {
  id: string;
  source: "ChatGPT" | "Gemini" | "Claude" | "Codex" | "其他";
  summary: string;
  createdAt: string;
  synced: boolean;
}

export interface AiJourneyDraft {
  person: string;
  journey: JourneyKind;
  stage: string;
  priority: number;
  nextAction: string;
  summary: string;
  reason: string;
  risk: string;
  estimatedDealValue: string;
  eventKind: PriorityEventKind | "";
  waitingKind: WaitingKind | "";
  confidence: number;
}

export type ImpactLevel = "高" | "中" | "低";
export type BacklogStatus = "待做" | "開發中" | "完成";

export interface ProductBacklogItem {
  id: string;
  friction: string;
  discoveredDate: string;
  impact: ImpactLevel;
  solution: string;
  status: BacklogStatus;
}

export type PropertyStatus = "出售中" | "出租中" | "已成交" | "已出租" | "已結案";
export type ContactRole = "Owner" | "Buyer" | "Tenant" | "Referrer";
export type OperatingJourneyType = "Buyer" | "Owner" | "Tenant" | "Repair";
export type MarketingPlatform =
  | "591"
  | "Facebook"
  | "LINE"
  | "Instagram"
  | "Threads"
  | "YouTubeShorts"
  | "TikTok"
  | "SalesPresentation";
export type PublishStatus = "Draft" | "Published" | "NeedUpdate" | "Archived";
export type OperatingJourneyStatus = "待處理" | "進行中" | "等待回覆" | "已完成";
export type RepairStatus = "待處理" | "報價中" | "施工中" | "已完成" | "保固中";
export type FileCategory = "契約" | "名片" | "照片" | "格局圖" | "逐字稿" | "錄音" | "其他";

export interface ContactModel {
  id: string;
  name: string;
  phone: string;
  line: string;
  email: string;
  job: string;
  birthday: string;
  roles: ContactRole[];
  tags: string[];
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyModel {
  id: string;
  community: string;
  address: string;
  propertyType: string;
  totalPrice: string;
  area: string;
  status: PropertyStatus;
  ownerIds: string[];
  buyerIds: string[];
  tenantIds: string[];
  journeyIds: string[];
  repairIds: string[];
  fileIds: string[];
  financialIds: string[];
  aiAnalysis: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingJourneyModel {
  id: string;
  type: OperatingJourneyType;
  propertyId: string;
  contactIds: string[];
  currentStage: string;
  nextStep: string;
  probability: number;
  aiSuggestion: string;
  reminderDate: string;
  completedRecords: string[];
  history: JourneyHistoryEntry[];
  dealValue: number;
  urgency: number;
  overdueDays: number;
  status: OperatingJourneyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RepairModel {
  id: string;
  propertyId: string;
  issue: string;
  photoUrls: string[];
  videoUrls: string[];
  status: RepairStatus;
  quote: string;
  constructionDate: string;
  completedDate: string;
  warranty: string;
  contractor: string;
  cost: string;
  aiReminder: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileModel {
  id: string;
  propertyId: string;
  contactId?: string;
  category: FileCategory;
  name: string;
  url: string;
  aiSummary: string;
  createdAt: string;
}

export interface FinancialModel {
  id: string;
  propertyId: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "待收" | "待付" | "已完成";
  note: string;
}

export interface MarketingContentModel {
  id: string;
  propertyId: string;
  platform: MarketingPlatform;
  title: string;
  content: string;
  publishStatus: PublishStatus;
  propertyPriceSnapshot: string;
  generatedAt: string;
  updatedAt: string;
}

export interface AiAssistantModel {
  id: string;
  title: string;
  task: "整理摘要" | "排序TOP5" | "生成LINE訊息" | "生成追蹤建議" | "預測成交率" | "提醒風險";
  input: string;
  output: string;
  confirmed: boolean;
  createdAt: string;
}

export interface OperatingSystemState {
  properties: PropertyModel[];
  contacts: ContactModel[];
  journeys: OperatingJourneyModel[];
  repairs: RepairModel[];
  files: FileModel[];
  financials: FinancialModel[];
  marketingContents: MarketingContentModel[];
  aiCenter: AiAssistantModel[];
}

export interface AiPriorityItem {
  id: string;
  title: string;
  subtitle: string;
  nextStep: string;
  score: number;
  propertyId: string;
  contactIds: string[];
  type: "Journey" | "Repair" | "Financial" | "AI";
}
