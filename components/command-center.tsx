"use client";

import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  Clock3,
  Home,
  Inbox,
  Lightbulb,
  LoaderCircle,
  Megaphone,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedTasks } from "@/lib/seed";
import type { ModuleKey, Task, TaskStatus } from "@/lib/types";

const STORAGE_KEY = "mgAiosV2Tasks";

const statusMeta: Record<TaskStatus, { title: string; subtitle: string; color: string }> = {
  must: { title: "今日必做", subtitle: "先完成這些，今天就不會漏事", color: "red" },
  suggested: { title: "建議今天完成", subtitle: "AI 根據追蹤時間整理", color: "yellow" },
  waiting: { title: "等待別人回覆", subtitle: "不用一直記在腦中", color: "blue" },
  done: { title: "已完成", subtitle: "今天完成的工作", color: "green" },
};

const modules: Array<{
  key: ModuleKey;
  title: string;
  caption: string;
  icon: typeof BriefcaseBusiness;
  items: string[];
}> = [
  { key: "sales", title: "買賣", caption: "看屋、追蹤、議價與簽約", icon: BriefcaseBusiness, items: ["今日看屋", "今日交屋", "今日追蹤", "今日議價", "今日簽約", "AI 優先聯絡建議"] },
  { key: "socialHousing", title: "社宅", caption: "公證、點交、收租與報修", icon: Building2, items: ["今日公證", "今日簽約", "今日點交", "今日收租", "今日報修", "今日待補件"] },
  { key: "media", title: "自媒體", caption: "拍攝、剪輯與發布", icon: Megaphone, items: ["今天要拍攝", "今天要發文", "待剪影片", "待發布貼文"] },
  { key: "ai", title: "AI 專案", caption: "開發進度、Bug 與新想法", icon: Bot, items: ["Codex 待完成任務", "MG-AIOS 開發進度", "Bug 紀錄", "新想法收集"] },
];

function todayLabel() {
  return new Intl.DateTimeFormat("zh-TW", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
}

function todayValue() {
  return new Date().toLocaleDateString("sv-SE");
}

function sortTasks(tasks: Task[], status: TaskStatus) {
  return [...tasks].sort((a, b) => {
    if (status === "done") {
      return String(b.completedAt || "").localeCompare(String(a.completedAt || ""));
    }
    const aSchedule = `${a.dueDate || "9999-12-31"}T${a.time || "23:59"}`;
    const bSchedule = `${b.dueDate || "9999-12-31"}T${b.time || "23:59"}`;
    return aSchedule.localeCompare(bSchedule) || a.priority - b.priority;
  });
}

function scheduleLabel(task: Task) {
  if (task.status === "done" && task.completedAt) {
    return new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(task.completedAt));
  }
  const date = task.dueDate
    ? task.dueDate === todayValue() ? "今天" : task.dueDate.slice(5).replace("-", "/")
    : "今天";
  return task.time ? `${date} ${task.time}` : date;
}

export function CommandCenter() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [ready, setReady] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Task[];
        if (Array.isArray(parsed)) setTasks(parsed);
      }
    } catch {
      // The dashboard remains usable when storage is temporarily unavailable.
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage is unavailable. */ }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* Keep the current session usable. */ }
  }, [tasks, ready]);

  const counts = useMemo(() => ({
    must: tasks.filter((task) => task.status === "must").length,
    suggested: tasks.filter((task) => task.status === "suggested").length,
    waiting: tasks.filter((task) => task.status === "waiting").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  function completeTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, previousStatus: task.status === "done" ? task.previousStatus : task.status, status: "done", completedAt: new Date().toISOString() }
      : task));
  }

  function restoreTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, status: task.previousStatus || "must", previousStatus: undefined, completedAt: undefined }
      : task));
  }

  function addTask(task: Task) {
    setTasks((current) => [task, ...current]);
    setShowAdd(false);
  }

  if (!ready) {
    return <div className="loading-screen"><LoaderCircle className="animate-spin" /><span>正在整理今日重點</span></div>;
  }

  if (activeModule) {
    const module = modules.find((item) => item.key === activeModule)!;
    return <ModuleView module={module} tasks={tasks} onBack={() => setActiveModule(null)} onComplete={completeTask} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">M</div>
        <div className="brand-copy"><strong>MG-AIOS</strong><span>AI 房仲作戰中心</span></div>
        <button className="icon-button" aria-label="更多選項"><MoreHorizontal /></button>
      </header>

      <section className="morning-brief">
        <div>
          <p>{todayLabel()}</p>
          <h1>早安，名廣</h1>
          <span>{counts.must ? `今天有 ${counts.must} 件重要事情` : "今天的必做事項已清空"}</span>
        </div>
        <div className="focus-score"><strong>{counts.must}</strong><span>必做</span></div>
      </section>

      <div className="dashboard-grid">
        <div className="task-column">
          {(["must", "suggested", "waiting", "done"] as TaskStatus[]).map((status) => (
            <TaskSection
              key={status}
              status={status}
              tasks={sortTasks(tasks.filter((task) => task.status === status), status)}
              onComplete={completeTask}
              onRestore={restoreTask}
            />
          ))}
        </div>

        <aside className="module-column">
          <div className="section-heading"><div><p>工作入口</p><h2>四大模組</h2></div></div>
          <div className="module-grid">
            {modules.map((module) => {
              const Icon = module.icon;
              const count = tasks.filter((task) => task.module === module.key && task.status !== "done").length;
              return (
                <button className="module-card" key={module.key} onClick={() => setActiveModule(module.key)}>
                  <span className={`module-icon ${module.key}`}><Icon /></span>
                  <span><strong>{module.title}</strong><small>{module.caption}</small></span>
                  <b>{count || ""}</b><ChevronRight />
                </button>
              );
            })}
          </div>

          <button className="inbox-entry" onClick={() => setShowInbox(true)}>
            <Inbox /><span><strong>AI Inbox</strong><small>截圖、語音、照片統一入口</small></span><em>預留</em>
          </button>
        </aside>
      </div>

      <button className="floating-add" onClick={() => setShowAdd(true)}><CirclePlus /><span>新增待辦</span></button>

      <nav className="bottom-nav" aria-label="主要導覽">
        <button className="active"><Home /><span>今日</span></button>
        <button onClick={() => setActiveModule("sales")}><BriefcaseBusiness /><span>買賣</span></button>
        <button onClick={() => setActiveModule("socialHousing")}><Building2 /><span>社宅</span></button>
        <button onClick={() => setShowInbox(true)}><Inbox /><span>Inbox</span></button>
      </nav>

      {showAdd && <AddTaskSheet onClose={() => setShowAdd(false)} onAdd={addTask} />}
      {showInbox && <InboxSheet onClose={() => setShowInbox(false)} />}
    </main>
  );
}

function TaskSection({ status, tasks, onComplete, onRestore }: {
  status: TaskStatus;
  tasks: Task[];
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const meta = statusMeta[status];
  return (
    <section className={`task-section ${meta.color}`} id={status === "must" ? "must-section" : undefined}>
      <div className="section-heading">
        <span className="status-dot" />
        <div><p>{meta.subtitle}</p><h2>{meta.title}<b>{tasks.length}</b></h2></div>
      </div>
      <div className="task-list">
        {tasks.length === 0 ? <div className="empty-state"><Check /><span>{status === "done" ? "今天還沒有完成紀錄" : "這個區塊目前是空的"}</span></div> : tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="task-time">{status === "suggested" && !task.time ? <Lightbulb /> : <Clock3 />}<span>{scheduleLabel(task)}</span></div>
            <div className="task-copy"><strong>{task.title}</strong><span>{task.detail}</span></div>
            {status === "done"
              ? <button className="task-action restore" onClick={() => onRestore(task.id)} aria-label="恢復任務"><RotateCcw /></button>
              : <button className="task-action" onClick={() => onComplete(task.id)} aria-label="標示完成"><Check /></button>}
          </article>
        ))}
      </div>
    </section>
  );
}

function ModuleView({ module, tasks, onBack, onComplete }: {
  module: typeof modules[number]; tasks: Task[]; onBack: () => void; onComplete: (id: string) => void;
}) {
  const Icon = module.icon;
  const moduleTasks = tasks.filter((task) => task.module === module.key && task.status !== "done");
  return (
    <main className="app-shell module-page">
      <header className="module-header"><button className="icon-button" onClick={onBack}><ArrowLeft /></button><span className={`module-icon ${module.key}`}><Icon /></span><div><p>今日工作</p><h1>{module.title}</h1></div></header>
      <section className="module-summary"><strong>{moduleTasks.length}</strong><span>件待處理</span><p>{module.caption}</p></section>
      <section className="module-quick-list"><h2>常用入口</h2><div>{module.items.map((item) => <button key={item}>{item}<ChevronRight /></button>)}</div></section>
      <section className="module-tasks"><h2>今天相關任務</h2>{moduleTasks.length ? moduleTasks.map((task) => <article className="task-card" key={task.id}><div className="task-copy"><strong>{task.title}</strong><span>{task.detail}</span></div><button className="task-action" onClick={() => onComplete(task.id)}><Check /></button></article>) : <div className="empty-state"><Check /><span>今天沒有待處理事項</span></div>}</section>
    </main>
  );
}

function AddTaskSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [dueDate, setDueDate] = useState(todayValue());
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<TaskStatus>("must");
  const [module, setModule] = useState<ModuleKey>("sales");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: crypto.randomUUID(), title: title.trim(), detail: detail.trim() || "沒有備註", dueDate, time, status, module, priority: Date.now() });
  }

  return <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="bottom-sheet" onSubmit={submit}><div className="sheet-handle" /><header><div><p>快速記錄</p><h2>新增待辦</h2></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header><label><span>要做什麼？</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：回覆王先生" /></label><div className="date-time-grid"><label><span>日期</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label><span>時間</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div><label className="detail-field"><span>備註</span><input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="可先留空" /></label><div className="choice-group"><span>放在哪裡</span><div>{(["must", "suggested", "waiting"] as TaskStatus[]).map((value) => <button type="button" className={status === value ? "selected" : ""} onClick={() => setStatus(value)} key={value}>{statusMeta[value].title}</button>)}</div></div><div className="choice-group"><span>工作模組</span><div>{modules.map((item) => <button type="button" className={module === item.key ? "selected" : ""} onClick={() => setModule(item.key)} key={item.key}>{item.title}</button>)}</div></div><button className="sheet-submit" type="submit" disabled={!title.trim()}>加入今日作戰</button></form></div>;
}

function InboxSheet({ onClose }: { onClose: () => void }) {
  const sources = [{ icon: UserRound, label: "LINE 截圖" }, { icon: CalendarDays, label: "語音紀錄" }, { icon: Home, label: "售屋資料" }, { icon: Wrench, label: "照片／PDF" }];
  return <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="bottom-sheet inbox-sheet"><div className="sheet-handle" /><header><div><p>第二階段預留</p><h2>AI Inbox</h2></div><button className="icon-button" onClick={onClose}><X /></button></header><p className="inbox-note">未來所有資訊都先進這裡，再由 AI 判斷要建立什麼工作。</p><div className="inbox-source-grid">{sources.map(({ icon: Icon, label }) => <button type="button" key={label} disabled><Icon /><span>{label}</span></button>)}</div><div className="coming-soon"><Sparkles /><span><strong>入口已預留</strong><small>MVP 暫不處理檔案與辨識</small></span></div></section></div>;
}
