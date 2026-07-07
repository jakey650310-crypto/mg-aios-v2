import type { Task } from "./types";

const today = new Date().toLocaleDateString("sv-SE");

export const seedTasks: Task[] = [
  { id: "must-1", title: "林先生｜中午看屋", detail: "南崁・佳瑞向學", dueDate: today, time: "11:30", status: "must", module: "sales", priority: 1 },
  { id: "must-2", title: "張小姐｜回覆議價結果", detail: "屋主等待最終答覆", dueDate: today, time: "14:00", status: "must", module: "sales", priority: 2 },
  { id: "must-3", title: "社宅點交文件確認", detail: "點交前缺身分證影本", dueDate: today, time: "16:30", status: "must", module: "socialHousing", priority: 3 },
  { id: "suggest-1", title: "回訪王先生", detail: "買方已 4 天未追蹤", dueDate: today, status: "suggested", module: "sales", priority: 1 },
  { id: "suggest-2", title: "傳送兩房車新物件", detail: "3 位買方需求相符", dueDate: today, status: "suggested", module: "sales", priority: 2 },
  { id: "waiting-1", title: "等待屋主確認開價", detail: "昨日 18:20 已傳訊息", dueDate: today, status: "waiting", module: "sales", priority: 1 },
  { id: "waiting-2", title: "等待修繕廠商報價", detail: "冷氣漏水維修", dueDate: today, status: "waiting", module: "socialHousing", priority: 2 },
];
