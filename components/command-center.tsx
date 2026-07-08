"use client";

import {
  AlertTriangle,
  Check,
  CirclePlus,
  ClipboardList,
  Clock3,
  Home,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, type ReactNode, useMemo, useState } from "react";
import type {
  AiJourneyDraft,
  AiPriorityItem,
  ContactModel,
  OperatingJourneyModel,
  OperatingJourneyType,
  OperatingSystemState,
  PropertyModel,
  RepairModel,
} from "@/lib/types";
import { useOperatingSystem } from "@/lib/use-operating-system";

type OperatingModuleKey = "dashboard" | "property" | "contact" | "journey" | "repair" | "ai";
type InputMode = "text" | "line" | "photo";

const moduleLabels: Record<OperatingModuleKey, { title: string; subtitle: string }> = {
  dashboard: { title: "首頁", subtitle: "AI 今日工作中心" },
  property: { title: "物件中心", subtitle: "一間房子就是一個中心" },
  contact: { title: "聯絡人", subtitle: "一位人只有一份資料" },
  journey: { title: "案件旅程", subtitle: "下一步、原因、風險" },
  repair: { title: "修繕管理", subtitle: "報修、估價、施工、保固" },
  ai: { title: "AI 助理", subtitle: "整理、排序、提醒、產生內容" },
};

function nowIso() {
  return new Date().toISOString();
}

function formatDate(value: string) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-TW");
}

function contactNames(state: OperatingSystemState, ids: string[]) {
  const names = ids
    .map((id) => state.contacts.find((contact) => contact.id === id)?.name)
    .filter(Boolean);
  return names.length ? names.join("、") : "未指定聯絡人";
}

function findProperty(state: OperatingSystemState, id: string) {
  return state.properties.find((property) => property.id === id);
}

function mapDraftType(draft: AiJourneyDraft): OperatingJourneyType {
  if (draft.journey.includes("屋主")) return "Owner";
  if (draft.journey.includes("出租")) return "Tenant";
  if (draft.journey.includes("案件")) return "Repair";
  return "Buyer";
}

export function CommandCenter() {
  const operatingSystem = useOperatingSystem();
  const [activeModule, setActiveModule] = useState<OperatingModuleKey | null>(null);
  const [activeJourney, setActiveJourney] = useState<OperatingJourneyModel | null>(null);
  const [showInbox, setShowInbox] = useState(false);

  const topFive = operatingSystem.todayTopFive;
  const state = operatingSystem.state;

  function openPriorityItem(item: AiPriorityItem) {
    if (item.type === "Journey") {
      const journey = state.journeys.find((entry) => entry.id === item.id);
      if (journey) {
        setActiveJourney(journey);
        return;
      }
    }
    if (item.type === "Repair") {
      setActiveModule("repair");
      return;
    }
    setActiveModule("dashboard");
  }

  function saveJourney(next: OperatingJourneyModel) {
    operatingSystem.setState((current) => ({
      ...current,
      journeys: current.journeys.map((journey) =>
        journey.id === next.id
          ? {
              ...next,
              updatedAt: nowIso(),
            }
          : journey,
      ),
    }));
    setActiveJourney(null);
  }

  function deleteJourney(id: string) {
    operatingSystem.setState((current) => ({
      ...current,
      journeys: current.journeys.filter((journey) => journey.id !== id),
      properties: current.properties.map((property) => ({
        ...property,
        journeyIds: property.journeyIds.filter((journeyId) => journeyId !== id),
      })),
    }));
    setActiveJourney(null);
  }

  function acceptDraft(draft: AiJourneyDraft) {
    const id = crypto.randomUUID();
    const firstProperty = state.properties[0];
    const firstContact = state.contacts.find((contact) => contact.name === draft.person) || state.contacts[0];
    const journey: OperatingJourneyModel = {
      id,
      type: mapDraftType(draft),
      propertyId: firstProperty?.id || "",
      contactIds: firstContact ? [firstContact.id] : [],
      currentStage: draft.stage || "待確認",
      nextStep: draft.nextAction || "確認下一步",
      probability: Math.max(1, Math.min(99, draft.priority || 50)),
      aiSuggestion: draft.summary || draft.reason || "AI 已建立草稿，請確認內容。",
      reminderDate: new Date().toLocaleDateString("sv-SE"),
      completedRecords: [],
      history: [],
      dealValue: Number(String(draft.estimatedDealValue).replace(/\D/g, "")) || 100,
      urgency: draft.eventKind ? 5 : 3,
      overdueDays: 0,
      status: draft.waitingKind ? "等待回覆" : "待處理",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    operatingSystem.setState((current) => ({
      ...current,
      journeys: [journey, ...current.journeys],
      properties: current.properties.map((property, index) =>
        index === 0 ? { ...property, journeyIds: [journey.id, ...property.journeyIds] } : property,
      ),
    }));
    setShowInbox(false);
  }

  if (!operatingSystem.ready) {
    return (
      <div className="loading-screen">
        <LoaderCircle className="animate-spin" />
        <span>載入今日工作中心</span>
      </div>
    );
  }

  return (
    <main className="app-shell decision-shell">
      <header className="topbar">
        <div className="brand-mark">M</div>
        <div className="brand-copy">
          <strong>MG-AIOS</strong>
          <span>AI 房仲營運系統</span>
        </div>
        <Link className="topbar-link" href="/backlog">
          <ClipboardList />
          產品待辦
        </Link>
        <button className="icon-button" onClick={() => setShowInbox(true)} aria-label="新增 AI 摘要">
          <Inbox />
        </button>
      </header>

      <section className="decision-hero">
        <p>AI 今日工作中心</p>
        <h1>今天先做最有成交價值的事</h1>
        <span>首頁只回答：今天哪些工作最值得先做。AI 負責排序，人負責判斷與成交。</span>
        <button className="primary-command" onClick={() => setShowInbox(true)}>
          <CirclePlus />
          新增 AI 摘要
        </button>
      </section>

      <section className="decision-section">
        <SectionTitle icon={Sparkles} title="AI 房仲營運系統" count={6} hint="物件為核心，六大模組共用同一份資料" />
        <div className="module-overview-grid">
          <ModuleOverviewCard icon={TrendingUp} title="首頁" value={`${topFive.length} 件`} caption="AI 今日最重要 TOP5" onClick={() => setActiveModule("dashboard")} />
          <ModuleOverviewCard icon={Home} title="物件中心" value={`${state.properties.length} 間`} caption="物件與關聯資料" onClick={() => setActiveModule("property")} />
          <ModuleOverviewCard icon={MessageCircle} title="聯絡人" value={`${state.contacts.length} 位`} caption="一人多角色" onClick={() => setActiveModule("contact")} />
          <ModuleOverviewCard icon={Clock3} title="案件旅程" value={`${state.journeys.length} 條`} caption="買方、屋主、租客、修繕" onClick={() => setActiveModule("journey")} />
          <ModuleOverviewCard icon={Wrench} title="修繕管理" value={`${state.repairs.length} 件`} caption="報修到保固" onClick={() => setActiveModule("repair")} />
          <ModuleOverviewCard icon={Inbox} title="AI 助理" value={`${state.aiCenter.length} 則`} caption="摘要、排序、提醒、風險" onClick={() => setActiveModule("ai")} />
        </div>
      </section>

      <section className="decision-section">
        <SectionTitle icon={TrendingUp} title="今日 TOP5" count={topFive.length} hint="依成交價值、成交機率、時效性、逾期天數排序" />
        <div className="ai-priority-list">
          {topFive.map((item, index) => (
            <button className="ai-priority-card" key={`${item.type}-${item.id}`} onClick={() => openPriorityItem(item)}>
              <b>{index + 1}</b>
              <div>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
                <small>{item.nextStep}</small>
              </div>
              <em>{item.score}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="decision-section">
        <SectionTitle icon={AlertTriangle} title="今日提醒" count={operatingSystem.todayTasks.length + operatingSystem.todayRepairs.length} hint="待辦、風險、租賃、修繕集中看" />
        <div className="today-summary-grid">
          <Metric label="今日待辦" value={`${operatingSystem.todayTasks.length} 件`} />
          <Metric label="今日提醒" value={`${operatingSystem.aiPriorityItems.length} 件`} />
          <Metric label="平均成交機率" value={`${operatingSystem.todayProbability}%`} />
          <Metric label="租賃事項" value={`${operatingSystem.todayRentals.length} 件`} />
          <Metric label="修繕事項" value={`${operatingSystem.todayRepairs.length} 件`} />
        </div>
      </section>

      <section className="decision-section">
        <SectionTitle icon={Inbox} title="AI 收件匣" count={state.journeys.length} hint="AI 先整理，人再確認" />
        <button className="inbox-entry" onClick={() => setShowInbox(true)}>
          <Inbox />
          <span>
            <strong>貼上文字或上傳截圖</strong>
            <small>MG-AIOS 會自動整理成案件旅程草稿。</small>
          </span>
        </button>
      </section>

      {activeModule && (
        <OperatingModulePage
          moduleKey={activeModule}
          state={state}
          priorityItems={operatingSystem.aiPriorityItems}
          onClose={() => setActiveModule(null)}
          onOpenJourney={setActiveJourney}
          onOpenModule={setActiveModule}
        />
      )}
      {activeJourney && (
        <OperatingJourneyDetailPage
          journey={activeJourney}
          state={state}
          onClose={() => setActiveJourney(null)}
          onSave={saveJourney}
          onDelete={deleteJourney}
        />
      )}
      {showInbox && <AiInboxSheet onClose={() => setShowInbox(false)} onAccept={acceptDraft} />}
    </main>
  );
}

function SectionTitle({ icon: Icon, title, count, hint }: { icon: typeof Sparkles; title: string; count: number; hint: string }) {
  return (
    <div className="section-heading decision-heading">
      <span className="decision-heading-icon">
        <Icon />
      </span>
      <div>
        <p>{hint}</p>
        <h2>
          {title}
          <b>{count}</b>
        </h2>
      </div>
    </div>
  );
}

function ModuleOverviewCard({
  icon: Icon,
  title,
  value,
  caption,
  onClick,
}: {
  icon: typeof Sparkles;
  title: string;
  value: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button className="module-overview-card" onClick={onClick}>
      <span>
        <Icon />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{caption}</small>
      </div>
      <b>{value}</b>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OperatingModulePage({
  moduleKey,
  state,
  priorityItems,
  onClose,
  onOpenJourney,
  onOpenModule,
}: {
  moduleKey: OperatingModuleKey;
  state: OperatingSystemState;
  priorityItems: AiPriorityItem[];
  onClose: () => void;
  onOpenJourney: (journey: OperatingJourneyModel) => void;
  onOpenModule: (moduleKey: OperatingModuleKey) => void;
}) {
  const label = moduleLabels[moduleKey];

  return (
    <section className="fullscreen-editor module-list-page">
      <header className="editor-header">
        <button className="icon-button" onClick={onClose} aria-label="返回">
          <X />
        </button>
        <div>
          <p>{label.subtitle}</p>
          <h1>{label.title}</h1>
        </div>
      </header>
      <div className="editor-body">
        {moduleKey === "dashboard" && (
          <div className="data-list">
            {priorityItems.map((item, index) => (
              <button
                className="data-card tappable-card"
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === "Journey") {
                    const journey = state.journeys.find((entry) => entry.id === item.id);
                    if (journey) onOpenJourney(journey);
                    return;
                  }
                  if (item.type === "Repair") onOpenModule("repair");
                }}
              >
                <div>
                  <strong>{index + 1}. {item.title}</strong>
                  <span>{item.subtitle}</span>
                  <small>{item.nextStep}</small>
                </div>
                <em>分數 {item.score}</em>
              </button>
            ))}
          </div>
        )}
        {moduleKey === "property" && <PropertyList properties={state.properties} contacts={state.contacts} journeys={state.journeys} repairs={state.repairs} />}
        {moduleKey === "contact" && <ContactList contacts={state.contacts} journeys={state.journeys} properties={state.properties} />}
        {moduleKey === "journey" && <JourneyList journeys={state.journeys} state={state} onOpenJourney={onOpenJourney} />}
        {moduleKey === "repair" && <RepairList repairs={state.repairs} properties={state.properties} />}
        {moduleKey === "ai" && <AiCenterList state={state} />}
      </div>
    </section>
  );
}

function PropertyList({
  properties,
  contacts,
  journeys,
  repairs,
}: {
  properties: PropertyModel[];
  contacts: ContactModel[];
  journeys: OperatingJourneyModel[];
  repairs: RepairModel[];
}) {
  return (
    <div className="data-list">
      {properties.map((property) => (
        <article className="data-card" key={property.id}>
          <div>
            <strong>{property.community}</strong>
            <span>{property.address}</span>
            <small>{property.propertyType}｜{property.totalPrice}｜{property.area}</small>
          </div>
          <em>{property.status}</em>
          <small>
            聯絡人 {contacts.filter((contact) => [...property.ownerIds, ...property.buyerIds, ...property.tenantIds].includes(contact.id)).length} 位｜
            案件旅程 {journeys.filter((journey) => journey.propertyId === property.id).length} 條｜
            修繕 {repairs.filter((repair) => repair.propertyId === property.id).length} 件
          </small>
          <span>{property.aiAnalysis}</span>
        </article>
      ))}
    </div>
  );
}

function ContactList({
  contacts,
  journeys,
  properties,
}: {
  contacts: ContactModel[];
  journeys: OperatingJourneyModel[];
  properties: PropertyModel[];
}) {
  return (
    <div className="data-list">
      {contacts.map((contact) => (
        <article className="data-card" key={contact.id}>
          <div>
            <strong>{contact.name}</strong>
            <span>{contact.roles.join(" / ")}</span>
            <small>{contact.phone || contact.line || "尚未建立聯絡方式"}</small>
          </div>
          <em>{contact.tags.join("、") || "未標籤"}</em>
          <small>
            案件旅程 {journeys.filter((journey) => journey.contactIds.includes(contact.id)).length} 條｜
            關聯物件 {properties.filter((property) => [...property.ownerIds, ...property.buyerIds, ...property.tenantIds].includes(contact.id)).length} 間
          </small>
          <span>{contact.aiSummary}</span>
        </article>
      ))}
    </div>
  );
}

function JourneyList({
  journeys,
  state,
  onOpenJourney,
}: {
  journeys: OperatingJourneyModel[];
  state: OperatingSystemState;
  onOpenJourney: (journey: OperatingJourneyModel) => void;
}) {
  return (
    <div className="data-list">
      {journeys.map((journey) => {
        const property = findProperty(state, journey.propertyId);
        return (
          <button className="data-card tappable-card" key={journey.id} onClick={() => onOpenJourney(journey)}>
            <div>
              <strong>{contactNames(state, journey.contactIds)}</strong>
              <span>{journey.type}｜{journey.currentStage}</span>
              <small>{property?.community || "尚未關聯物件"}</small>
            </div>
            <em>{journey.probability}%</em>
            <span>{journey.nextStep}</span>
          </button>
        );
      })}
    </div>
  );
}

function RepairList({ repairs, properties }: { repairs: RepairModel[]; properties: PropertyModel[] }) {
  return (
    <div className="data-list">
      {repairs.map((repair) => {
        const property = properties.find((item) => item.id === repair.propertyId);
        return (
          <article className="data-card" key={repair.id}>
            <div>
              <strong>{repair.issue}</strong>
              <span>{property?.community || "尚未關聯物件"}</span>
              <small>{repair.quote || "尚未報價"}｜{repair.contractor || "尚未指定師傅"}</small>
            </div>
            <em>{repair.status}</em>
            <span>{repair.aiReminder}</span>
          </article>
        );
      })}
    </div>
  );
}

function AiCenterList({ state }: { state: OperatingSystemState }) {
  return (
    <div className="data-list">
      {state.aiCenter.map((item) => (
        <article className="data-card" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.output}</span>
            <small>{item.confirmed ? "已確認" : "等待確認"}</small>
          </div>
          <em>{item.task}</em>
        </article>
      ))}
    </div>
  );
}

function OperatingJourneyDetailPage({
  journey,
  state,
  onClose,
  onSave,
  onDelete,
}: {
  journey: OperatingJourneyModel;
  state: OperatingSystemState;
  onClose: () => void;
  onSave: (journey: OperatingJourneyModel) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(journey);
  const [editing, setEditing] = useState(false);
  const property = findProperty(state, draft.propertyId);
  const contacts = state.contacts.filter((contact) => draft.contactIds.includes(contact.id));
  const name = contactNames(state, draft.contactIds);

  function update<K extends keyof OperatingJourneyModel>(key: K, value: OperatingJourneyModel[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="fullscreen-editor journey-detail-page">
      <header className="editor-header">
        <button className="icon-button" onClick={onClose} aria-label="返回">
          <X />
        </button>
        <div>
          <p>案件旅程詳情</p>
          <h1>{name}</h1>
        </div>
      </header>

      <div className="editor-body">
        <section className="client-hero-card">
          <div>
            <h2>{name}</h2>
            <p>{draft.type}｜{draft.currentStage}</p>
          </div>
          <div className="client-tags">
            <span>成交機率 {draft.probability}%</span>
            <span>成交價值 {draft.dealValue}</span>
            <span>{draft.status}</span>
          </div>
        </section>

        {editing ? (
          <section className="crm-section">
            <h3>編輯內容</h3>
            <EditorInput label="目前階段" value={draft.currentStage} onChange={(value) => update("currentStage", value)} />
            <EditorTextarea label="下一步" value={draft.nextStep} onChange={(value) => update("nextStep", value)} />
            <EditorInput label="成交機率" type="number" value={String(draft.probability)} onChange={(value) => update("probability", Math.max(1, Math.min(99, Number(value) || 1)))} />
            <EditorInput label="成交價值" type="number" value={String(draft.dealValue)} onChange={(value) => update("dealValue", Number(value) || 0)} />
            <EditorInput label="提醒日期" type="date" value={draft.reminderDate} onChange={(value) => update("reminderDate", value)} />
            <EditorTextarea label="AI 建議" value={draft.aiSuggestion} onChange={(value) => update("aiSuggestion", value)} />
          </section>
        ) : (
          <>
            <DetailBlock title="下一步" value={draft.nextStep} />
            <DetailBlock title="原因" value={draft.aiSuggestion || "尚未建立原因"} />
            <DetailBlock title="風險" value={draft.overdueDays > 0 ? `已逾期 ${draft.overdueDays} 天，可能降低成交機會。` : "目前沒有逾期風險。"} />
            <DetailBlock title="成交價值" value={String(draft.dealValue)} />
            <DetailBlock title="成交機率" value={`${draft.probability}%`} />
            <DetailBlock title="關聯物件" value={property ? `${property.community}｜${property.address}｜${property.totalPrice}` : "尚未關聯物件"} />
            <DetailBlock title="關聯客戶" value={contacts.map((contact) => `${contact.name}（${contact.roles.join("/") || "未標籤"}）`).join("\n") || "尚未關聯客戶"} />
          </>
        )}

        <section className="crm-section">
          <h3>歷程紀錄</h3>
          {draft.history.length ? (
            <div className="history-list">
              {draft.history.map((entry) => (
                <article className="history-card" key={entry.id}>
                  <strong>{formatDate(entry.changedAt)}</strong>
                  <span>{entry.changedBy}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Clock3 />
              <span>尚無歷程紀錄</span>
            </div>
          )}
        </section>
      </div>

      <footer className="editor-actions">
        {editing ? (
          <button type="button" onClick={() => onSave(draft)}>
            <Save />
            儲存
          </button>
        ) : (
          <button type="button" onClick={() => setEditing(true)}>
            <Pencil />
            編輯
          </button>
        )}
        <button type="button" onClick={() => onDelete(draft.id)}>
          <Trash2 />
          刪除
        </button>
      </footer>
    </section>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="crm-section">
      <h3>{title}</h3>
      <p className="detail-text">{value}</p>
    </section>
  );
}

function EditorInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function EditorTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AiInboxSheet({ onClose, onAccept }: { onClose: () => void; onAccept: (draft: AiJourneyDraft) => void }) {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<AiJourneyDraft | null>(null);

  const canSubmit = useMemo(() => Boolean(text.trim() || file), [text, file]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const payload = new FormData();
    payload.set("inputType", inputMode);
    payload.set("text", text.trim());
    if (file) payload.set("file", file);

    try {
      const response = await fetch("/api/ai-inbox", { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 整理失敗");
      setDraft(data.draft as AiJourneyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 整理失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft<K extends keyof AiJourneyDraft>(key: K, value: AiJourneyDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet inbox-compose" onSubmit={submit}>
        <div className="sheet-handle" />
        <header>
          <div>
            <p>AI 收件匣</p>
            <h2>新增 AI 摘要</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="關閉">
            <X />
          </button>
        </header>

        {!draft ? (
          <>
            <div className="input-type-grid">
              <button type="button" className={inputMode === "text" ? "selected" : ""} onClick={() => setInputMode("text")}>
                <MessageCircle />
                貼文字
              </button>
              <button type="button" className={inputMode === "line" ? "selected" : ""} onClick={() => setInputMode("line")}>
                <Upload />
                LINE 截圖
              </button>
              <button type="button" className={inputMode === "photo" ? "selected" : ""} onClick={() => setInputMode("photo")}>
                <Upload />
                上傳照片
              </button>
            </div>

            <label>
              <span>文字內容</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="貼上客戶對話、ChatGPT 摘要、帶看心得或待辦內容。" />
            </label>

            {inputMode !== "text" && (
              <label>
                <span>{inputMode === "line" ? "LINE 截圖" : "照片"}</span>
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
            )}

            {error && <p className="form-error">{error}</p>}
            <p>AI 會整理出人物、案件旅程、目前階段、優先順序、下一步與摘要。確認後才會建立。</p>
            <button className="sheet-submit" type="submit" disabled={!canSubmit || loading}>
              {loading ? "AI 整理中..." : "開始 AI 整理"}
            </button>
          </>
        ) : (
          <div className="ai-preview">
            <div className="ai-preview-head">
              <span>AI 已整理，請確認</span>
              <strong>信心值 {draft.confidence}%</strong>
            </div>
            <label><span>姓名</span><input value={draft.person} onChange={(event) => updateDraft("person", event.target.value)} /></label>
            <label><span>案件旅程</span><input value={draft.journey} onChange={(event) => updateDraft("journey", event.target.value as AiJourneyDraft["journey"])} /></label>
            <label><span>目前階段</span><input value={draft.stage} onChange={(event) => updateDraft("stage", event.target.value)} /></label>
            <label><span>優先順序</span><input type="number" min="1" max="99" value={draft.priority} onChange={(event) => updateDraft("priority", Number(event.target.value))} /></label>
            <label><span>下一步</span><textarea value={draft.nextAction} onChange={(event) => updateDraft("nextAction", event.target.value)} /></label>
            <label><span>摘要</span><textarea value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} /></label>
            <div className="preview-actions">
              <button type="button" onClick={() => onAccept(draft)}>接受</button>
              <button type="button" onClick={() => setDraft(null)}>修改</button>
              <button type="button" onClick={onClose}>取消</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
