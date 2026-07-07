"use client";

import {
  ArrowLeft,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  Clock3,
  Home,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Pencil,
  RotateCcw,
  TimerReset,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { seedBuyers, seedHousing, seedInboxItems, seedSellers, seedTasks } from "@/lib/seed";
import type { Buyer, HousingCase, InboxItem, ModuleKey, Seller, Task, TaskStatus } from "@/lib/types";

const TASKS_KEY = "mgAiosV2Tasks";
const BUYERS_KEY = "mgAiosV2Buyers";
const SELLERS_KEY = "mgAiosV2Sellers";
const HOUSING_KEY = "mgAiosV2Housing";
const INBOX_KEY = "mgAiosV2Inbox";

const statusMeta: Record<TaskStatus, { title: string; subtitle: string; color: string }> = {
  must: { title: "今日必做", subtitle: "今天不能漏掉的事", color: "red" },
  suggested: { title: "建議今天完成", subtitle: "值得今天順手處理", color: "yellow" },
  waiting: { title: "等待別人回覆", subtitle: "先放著，但不能忘", color: "blue" },
  done: { title: "已完成", subtitle: "今天已經處理好的事", color: "green" },
};

const moduleMeta: Record<Exclude<ModuleKey, "dashboard">, { title: string; caption: string; icon: typeof UsersRound }> = {
  buyer: { title: "買方監控", caption: "追蹤需求、聯絡日、聊天紀錄", icon: UsersRound },
  seller: { title: "屋主監控", caption: "委售狀態、屋主需求、下次聯絡", icon: UserRound },
  housing: { title: "社宅管理", caption: "公證、撥款、點交、報修、到期", icon: Building2 },
  inbox: { title: "AI Inbox", caption: "把 AI 輸出變成待辦", icon: Inbox },
};

function todayValue() {
  return new Date().toLocaleDateString("sv-SE");
}

function addDays(dateText: string | undefined, days: number) {
  const date = dateText ? new Date(`${dateText}T12:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

function dayDiff(dateText: string) {
  const today = new Date(`${todayValue()}T12:00:00`).getTime();
  const target = new Date(`${dateText}T12:00:00`).getTime();
  return Math.floor((today - target) / 86400000);
}

function daysUntil(dateText: string) {
  return -dayDiff(dateText);
}

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the current session usable when storage is unavailable.
  }
}

function sortTasks(tasks: Task[], status: TaskStatus) {
  return [...tasks].sort((a, b) => {
    if (status === "done") return String(b.completedAt || "").localeCompare(String(a.completedAt || ""));
    const aSchedule = `${a.dueDate || "9999-12-31"}T${a.time || "23:59"}`;
    const bSchedule = `${b.dueDate || "9999-12-31"}T${b.time || "23:59"}`;
    return aSchedule.localeCompare(bSchedule) || a.priority - b.priority;
  });
}

function scheduleLabel(task: Task) {
  if (task.status === "done" && task.completedAt) {
    return new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(task.completedAt));
  }
  if (!task.dueDate) return "今天";
  const date = task.dueDate === todayValue() ? "今天" : task.dueDate.slice(5).replace("-", "/");
  return task.time ? `${date} ${task.time}` : date;
}

function emptyTask(): Task {
  return {
    id: crypto.randomUUID(),
    title: "",
    detail: "",
    dueDate: todayValue(),
    time: "",
    status: "must",
    module: "dashboard",
    priority: Date.now(),
  };
}

export function CommandCenter() {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [buyers, setBuyers] = useState<Buyer[]>(seedBuyers);
  const [sellers, setSellers] = useState<Seller[]>(seedSellers);
  const [housing, setHousing] = useState<HousingCase[]>(seedHousing);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(seedInboxItems);
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(loadStorage(TASKS_KEY, seedTasks));
    setBuyers(loadStorage(BUYERS_KEY, seedBuyers));
    setSellers(loadStorage(SELLERS_KEY, seedSellers));
    setHousing(loadStorage(HOUSING_KEY, seedHousing));
    setInboxItems(loadStorage(INBOX_KEY, seedInboxItems));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) saveStorage(TASKS_KEY, tasks); }, [tasks, ready]);
  useEffect(() => { if (ready) saveStorage(BUYERS_KEY, buyers); }, [buyers, ready]);
  useEffect(() => { if (ready) saveStorage(SELLERS_KEY, sellers); }, [sellers, ready]);
  useEffect(() => { if (ready) saveStorage(HOUSING_KEY, housing); }, [housing, ready]);
  useEffect(() => { if (ready) saveStorage(INBOX_KEY, inboxItems); }, [inboxItems, ready]);

  const counts = useMemo(() => ({
    must: tasks.filter((task) => task.status === "must").length,
    suggested: tasks.filter((task) => task.status === "suggested").length,
    waiting: tasks.filter((task) => task.status === "waiting").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  function upsertTask(task: Task) {
    setTasks((current) => current.some((item) => item.id === task.id)
      ? current.map((item) => item.id === task.id ? task : item)
      : [task, ...current]);
    setEditingTask(null);
  }

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

  function delayTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, dueDate: addDays(task.dueDate, 1), delayedAt: new Date().toISOString() }
      : task));
  }

  function inboxToTask(item: InboxItem) {
    const task = {
      ...emptyTask(),
      title: item.title,
      detail: item.content,
      status: "suggested" as TaskStatus,
      module: "inbox" as ModuleKey,
    };
    setTasks((current) => [task, ...current]);
    setInboxItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, convertedTaskId: task.id } : entry));
  }

  if (!ready) {
    return <div className="loading-screen"><LoaderCircle className="animate-spin" /><span>載入今日作戰中心</span></div>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-mark" onClick={() => setActiveModule("dashboard")} aria-label="回首頁">M</button>
        <div className="brand-copy"><strong>MG-AIOS</strong><span>AI 房仲作戰中心</span></div>
        {activeModule !== "dashboard" && <button className="icon-button" onClick={() => setActiveModule("dashboard")} aria-label="回首頁"><ArrowLeft /></button>}
      </header>

      {activeModule === "dashboard" && (
        <Dashboard
          counts={counts}
          tasks={tasks}
          onComplete={completeTask}
          onRestore={restoreTask}
          onDelay={delayTask}
          onEdit={setEditingTask}
          onAdd={() => setEditingTask(emptyTask())}
          onOpenModule={setActiveModule}
        />
      )}
      {activeModule === "buyer" && <BuyerModule buyers={buyers} onChange={setBuyers} />}
      {activeModule === "seller" && <SellerModule sellers={sellers} onChange={setSellers} />}
      {activeModule === "housing" && <HousingModule cases={housing} onChange={setHousing} />}
      {activeModule === "inbox" && <InboxModule items={inboxItems} onChange={setInboxItems} onCreateTask={inboxToTask} />}

      <button className="floating-add" onClick={() => setEditingTask(emptyTask())}><CirclePlus /><span>新增待辦</span></button>
      <BottomNav active={activeModule} onOpen={setActiveModule} />
      {editingTask && <TaskSheet task={editingTask} onClose={() => setEditingTask(null)} onSave={upsertTask} />}
    </main>
  );
}

function Dashboard({ counts, tasks, onComplete, onRestore, onDelay, onEdit, onAdd, onOpenModule }: {
  counts: Record<TaskStatus, number>;
  tasks: Task[];
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
  onDelay: (id: string) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onOpenModule: (module: ModuleKey) => void;
}) {
  return (
    <>
      <section className="morning-brief">
        <div>
          <p>{new Intl.DateTimeFormat("zh-TW", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</p>
          <h1>今天先處理什麼？</h1>
          <span>{counts.must ? `今日必做 ${counts.must} 件，先完成最急的。` : "今日必做已清空，節奏很好。"}</span>
        </div>
        <button className="focus-score" onClick={onAdd}><strong>{counts.must}</strong><span>必做</span></button>
      </section>

      <div className="dashboard-grid">
        <div className="task-column">
          {(["must", "suggested", "waiting", "done"] as TaskStatus[]).map((status) => (
            <TaskSection
              key={status}
              status={status}
              tasks={sortTasks(tasks.filter((task) => task.status === status), status)}
              onComplete={onComplete}
              onRestore={onRestore}
              onDelay={onDelay}
              onEdit={onEdit}
            />
          ))}
        </div>

        <aside className="module-column">
          <div className="section-heading"><div><p>四大入口</p><h2>每天會用的工具</h2></div></div>
          <div className="module-grid">
            {(Object.entries(moduleMeta) as Array<[Exclude<ModuleKey, "dashboard">, typeof moduleMeta.buyer]>).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button className="module-card" key={key} onClick={() => onOpenModule(key)}>
                  <span className={`module-icon ${key}`}><Icon /></span>
                  <span><strong>{item.title}</strong><small>{item.caption}</small></span>
                  <ChevronRight />
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}

function TaskSection({ status, tasks, onComplete, onRestore, onDelay, onEdit }: {
  status: TaskStatus;
  tasks: Task[];
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
  onDelay: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const meta = statusMeta[status];
  return (
    <section className={`task-section ${meta.color}`}>
      <div className="section-heading">
        <span className="status-dot" />
        <div><p>{meta.subtitle}</p><h2>{meta.title}<b>{tasks.length}</b></h2></div>
      </div>
      <div className="task-list">
        {tasks.length === 0 ? <div className="empty-state"><Check /><span>目前沒有項目</span></div> : tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="task-time">{status === "suggested" ? <TimerReset /> : <Clock3 />}<span>{scheduleLabel(task)}</span></div>
            <div className="task-copy"><strong>{task.title}</strong><span>{task.detail || "沒有備註"}</span></div>
            <div className="task-actions">
              {status !== "done" && <button className="mini-action" onClick={() => onDelay(task.id)} aria-label="延後一天"><CalendarDays /></button>}
              <button className="mini-action" onClick={() => onEdit(task)} aria-label="編輯"><Pencil /></button>
              {status === "done"
                ? <button className="task-action restore" onClick={() => onRestore(task.id)} aria-label="復原"><RotateCcw /></button>
                : <button className="task-action" onClick={() => onComplete(task.id)} aria-label="完成"><Check /></button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TaskSheet({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (task: Task) => void }) {
  const [draft, setDraft] = useState<Task>(task);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim(), detail: draft.detail.trim(), priority: draft.priority || Date.now() });
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <header><div><p>待辦中心</p><h2>{task.title ? "編輯待辦" : "新增待辦"}</h2></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
        <label><span>事項</span><input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：回覆王先生看屋時間" /></label>
        <label className="detail-field"><span>備註</span><input value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} placeholder="補充重點，可留空" /></label>
        <div className="date-time-grid">
          <label><span>日期</span><input type="date" value={draft.dueDate || todayValue()} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></label>
          <label><span>時間</span><input type="time" value={draft.time || ""} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
        </div>
        <div className="choice-group"><span>分類</span><div>{(["must", "suggested", "waiting"] as TaskStatus[]).map((value) => <button type="button" className={draft.status === value ? "selected" : ""} onClick={() => setDraft({ ...draft, status: value })} key={value}>{statusMeta[value].title}</button>)}</div></div>
        <button className="sheet-submit" type="submit" disabled={!draft.title.trim()}>儲存待辦</button>
      </form>
    </div>
  );
}

function BuyerModule({ buyers, onChange }: { buyers: Buyer[]; onChange: (buyers: Buyer[]) => void }) {
  const [editing, setEditing] = useState<Buyer | null>(null);
  const blank: Buyer = { id: crypto.randomUUID(), name: "", need: "", lastContactDate: todayValue(), nextFollowUpDate: todayValue(), chatUrl: "", note: "" };
  return <ModuleFrame title="買方監控" caption="AI 先提醒多久沒追蹤，名廣負責建立關係。" onAdd={() => setEditing(blank)}>
    {buyers.map((buyer) => <article className="data-card" key={buyer.id}><div><strong>{buyer.name}</strong><span>{buyer.need}</span><small>上次聯絡：{buyer.lastContactDate}｜下次追蹤：{buyer.nextFollowUpDate}</small><em>{dayDiff(buyer.lastContactDate) >= 3 ? `AI提醒：已 ${dayDiff(buyer.lastContactDate)} 天未追蹤` : "AI提醒：追蹤節奏正常"}</em></div><div className="card-actions"><button onClick={() => setEditing(buyer)}><Pencil />編輯</button><button disabled={!buyer.chatUrl} onClick={() => buyer.chatUrl ? window.open(buyer.chatUrl, "_blank") : undefined}><MessageCircle />{buyer.chatUrl ? "聊天紀錄" : "未設定"}</button></div></article>)}
    {editing && <BuyerSheet buyer={editing} onClose={() => setEditing(null)} onSave={(buyer) => { onChange(buyers.some((item) => item.id === buyer.id) ? buyers.map((item) => item.id === buyer.id ? buyer : item) : [buyer, ...buyers]); setEditing(null); }} />}
  </ModuleFrame>;
}

function SellerModule({ sellers, onChange }: { sellers: Seller[]; onChange: (sellers: Seller[]) => void }) {
  const [editing, setEditing] = useState<Seller | null>(null);
  const blank: Seller = { id: crypto.randomUUID(), name: "", listingStatus: "委售中", need: "", nextContactDate: todayValue(), note: "" };
  return <ModuleFrame title="屋主監控" caption="掌握委售狀態、屋主需求與下次聯絡。" onAdd={() => setEditing(blank)}>
    {sellers.map((seller) => <article className="data-card" key={seller.id}><div><strong>{seller.name}</strong><span>{seller.listingStatus}｜{seller.need}</span><small>下次聯絡：{seller.nextContactDate}</small><em>{seller.nextContactDate < todayValue() ? `AI提醒：已超過 ${dayDiff(seller.nextContactDate)} 天` : seller.nextContactDate === todayValue() ? "AI提醒：今天應該聯絡" : `AI提醒：${daysUntil(seller.nextContactDate)} 天後聯絡`}</em></div><div className="card-actions"><button onClick={() => setEditing(seller)}><Pencil />編輯</button></div></article>)}
    {editing && <SellerSheet seller={editing} onClose={() => setEditing(null)} onSave={(seller) => { onChange(sellers.some((item) => item.id === seller.id) ? sellers.map((item) => item.id === seller.id ? seller : item) : [seller, ...sellers]); setEditing(null); }} />}
  </ModuleFrame>;
}

function HousingModule({ cases, onChange }: { cases: HousingCase[]; onChange: (cases: HousingCase[]) => void }) {
  const [editing, setEditing] = useState<HousingCase | null>(null);
  const blank: HousingCase = { id: crypto.randomUUID(), tenant: "", landlord: "", item: "公證", date: todayValue(), status: "待處理", note: "" };
  return <ModuleFrame title="社宅管理" caption="公證、撥款、點交、報修與到期提醒。" onAdd={() => setEditing(blank)}>
    {cases.map((item) => <article className="data-card" key={item.id}><div><strong>{item.item}｜{item.status}</strong><span>租客：{item.tenant}｜房東：{item.landlord}</span><small>日期：{item.date}</small><em>{item.date <= todayValue() ? "AI提醒：今天要處理" : "AI提醒：已排程"}</em></div><div className="card-actions"><button onClick={() => setEditing(item)}><Pencil />編輯</button></div></article>)}
    {editing && <HousingSheet item={editing} onClose={() => setEditing(null)} onSave={(item) => { onChange(cases.some((row) => row.id === item.id) ? cases.map((row) => row.id === item.id ? item : row) : [item, ...cases]); setEditing(null); }} />}
  </ModuleFrame>;
}

function InboxModule({ items, onChange, onCreateTask }: { items: InboxItem[]; onChange: (items: InboxItem[]) => void; onCreateTask: (item: InboxItem) => void }) {
  const [draft, setDraft] = useState({ source: "ChatGPT", title: "", content: "" });
  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onChange([{ id: crypto.randomUUID(), source: draft.source, title: draft.title.trim(), content: draft.content.trim(), createdAt: new Date().toISOString() }, ...items]);
    setDraft({ source: "ChatGPT", title: "", content: "" });
  }
  return <ModuleFrame title="AI Inbox" caption="ChatGPT / Gemini / Claude / Codex 的重要輸出，先收進來，再轉成待辦。">
    <form className="inline-form" onSubmit={addItem}><select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })}>{["ChatGPT", "Gemini", "Claude", "Codex"].map((name) => <option key={name}>{name}</option>)}</select><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="重點標題" /><input value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="內容摘要" /><button type="submit">加入 Inbox</button></form>
    {items.map((item) => <article className="data-card" key={item.id}><div><strong>{item.title}</strong><span>{item.content}</span><small>來源：{item.source}</small></div><div className="card-actions"><button disabled={Boolean(item.convertedTaskId)} onClick={() => onCreateTask(item)}><CirclePlus />{item.convertedTaskId ? "已建立" : "建立待辦"}</button></div></article>)}
  </ModuleFrame>;
}

function ModuleFrame({ title, caption, children, onAdd }: { title: string; caption: string; children: ReactNode; onAdd?: () => void }) {
  return <section className="module-workspace"><div className="module-title"><div><p>作戰模組</p><h1>{title}</h1><span>{caption}</span></div>{onAdd && <button onClick={onAdd}><CirclePlus />新增</button>}</div><div className="data-list">{children}</div></section>;
}

function BuyerSheet({ buyer, onClose, onSave }: { buyer: Buyer; onClose: () => void; onSave: (buyer: Buyer) => void }) {
  const [draft, setDraft] = useState(buyer);
  return <SimpleSheet title="買方資料" onClose={onClose} onSubmit={() => draft.name.trim() && onSave(draft)}><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="客戶名稱" /><input value={draft.need} onChange={(e) => setDraft({ ...draft, need: e.target.value })} placeholder="需求" /><input type="date" value={draft.lastContactDate} onChange={(e) => setDraft({ ...draft, lastContactDate: e.target.value })} /><input type="date" value={draft.nextFollowUpDate} onChange={(e) => setDraft({ ...draft, nextFollowUpDate: e.target.value })} /><input value={draft.chatUrl} onChange={(e) => setDraft({ ...draft, chatUrl: e.target.value })} placeholder="聊天紀錄連結，可留空" /><input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="備註" /></SimpleSheet>;
}

function SellerSheet({ seller, onClose, onSave }: { seller: Seller; onClose: () => void; onSave: (seller: Seller) => void }) {
  const [draft, setDraft] = useState(seller);
  return <SimpleSheet title="屋主資料" onClose={onClose} onSubmit={() => draft.name.trim() && onSave(draft)}><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="屋主名稱" /><input value={draft.listingStatus} onChange={(e) => setDraft({ ...draft, listingStatus: e.target.value })} placeholder="委售狀態" /><input value={draft.need} onChange={(e) => setDraft({ ...draft, need: e.target.value })} placeholder="屋主需求" /><input type="date" value={draft.nextContactDate} onChange={(e) => setDraft({ ...draft, nextContactDate: e.target.value })} /><input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="備註" /></SimpleSheet>;
}

function HousingSheet({ item, onClose, onSave }: { item: HousingCase; onClose: () => void; onSave: (item: HousingCase) => void }) {
  const [draft, setDraft] = useState(item);
  return <SimpleSheet title="社宅事件" onClose={onClose} onSubmit={() => draft.item.trim() && onSave(draft)}><input value={draft.tenant} onChange={(e) => setDraft({ ...draft, tenant: e.target.value })} placeholder="租客" /><input value={draft.landlord} onChange={(e) => setDraft({ ...draft, landlord: e.target.value })} placeholder="房東" /><input value={draft.item} onChange={(e) => setDraft({ ...draft, item: e.target.value })} placeholder="公證 / 撥款 / 點交 / 報修" /><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /><input value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} placeholder="狀態" /><input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="備註" /></SimpleSheet>;
}

function SimpleSheet({ title, children, onClose, onSubmit }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void }) {
  return <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="bottom-sheet" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><div className="sheet-handle" /><header><div><p>資料編輯</p><h2>{title}</h2></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header><div className="simple-fields">{children}</div><button className="sheet-submit" type="submit">儲存</button></form></div>;
}

function BottomNav({ active, onOpen }: { active: ModuleKey; onOpen: (module: ModuleKey) => void }) {
  const items: Array<{ key: ModuleKey; label: string; icon: typeof Home }> = [
    { key: "dashboard", label: "首頁", icon: Home },
    { key: "buyer", label: "買方", icon: UsersRound },
    { key: "seller", label: "屋主", icon: UserRound },
    { key: "housing", label: "社宅", icon: Building2 },
    { key: "inbox", label: "Inbox", icon: Bot },
  ];
  return <nav className="bottom-nav" aria-label="主要導覽">{items.map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "active" : ""} onClick={() => onOpen(key)}><Icon /><span>{label}</span></button>)}</nav>;
}
