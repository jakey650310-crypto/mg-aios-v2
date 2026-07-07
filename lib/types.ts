export type TaskStatus = "must" | "suggested" | "waiting" | "done";
export type ModuleKey = "sales" | "socialHousing" | "media" | "ai";

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
}
