export type JourneyKind = "屋主旅程" | "案件旅程" | "買方旅程" | "出租旅程";
export type JourneyStatus = "active" | "waiting" | "done";
export type PriorityEventKind = "收斡旋" | "見面談" | "今天交屋" | "今天簽約" | "屋主等待回覆" | "買方等待回覆";
export type WaitingKind = "等待屋主" | "等待買方" | "等待貸款" | "等待代書" | "等待租客";

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
  eventKind?: PriorityEventKind;
  waitingKind?: WaitingKind;
  status: JourneyStatus;
  completedAt?: string;
}

export interface AiInboxItem {
  id: string;
  source: "ChatGPT" | "Gemini" | "Claude" | "Codex" | "其他";
  summary: string;
  createdAt: string;
  synced: boolean;
}
