export type TaskStatus = "must" | "suggested" | "waiting" | "done";
export type ModuleKey = "dashboard" | "buyer" | "seller" | "housing" | "inbox";

export interface Task {
  id: string;
  title: string;
  detail: string;
  dueDate?: string;
  time?: string;
  status: TaskStatus;
  previousStatus?: Exclude<TaskStatus, "done">;
  module: ModuleKey;
  priority: number;
  completedAt?: string;
  delayedAt?: string;
}

export interface Buyer {
  id: string;
  name: string;
  need: string;
  lastContactDate: string;
  nextFollowUpDate: string;
  chatUrl: string;
  note: string;
}

export interface Seller {
  id: string;
  name: string;
  listingStatus: string;
  need: string;
  nextContactDate: string;
  note: string;
}

export interface HousingCase {
  id: string;
  tenant: string;
  landlord: string;
  item: string;
  date: string;
  status: string;
  note: string;
}

export interface InboxItem {
  id: string;
  source: string;
  title: string;
  content: string;
  createdAt: string;
  convertedTaskId?: string;
}
