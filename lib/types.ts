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
