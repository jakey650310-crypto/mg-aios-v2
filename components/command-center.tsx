"use client";

import {
  AlertTriangle,
  Check,
  CirclePlus,
  ClipboardList,
  Clock3,
  CalendarDays,
  Home,
  Inbox,
  LoaderCircle,
  Megaphone,
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
  CaseModel,
  CalendarEventModel,
  CalendarEventType,
  MarketingContentModel,
  MarketingPlatform,
  OperatingJourneyModel,
  OperatingJourneyType,
  OperatingSystemState,
  PropertyModel,
  RepairModel,
} from "@/lib/types";
import { useOperatingSystem } from "@/lib/use-operating-system";

type OperatingModuleKey = "dashboard" | "property" | "contact" | "journey" | "repair" | "calendar" | "marketing" | "closing" | "documents" | "ai";
type InputMode = "text" | "line" | "photo";

const moduleLabels: Record<OperatingModuleKey, { title: string; subtitle: string }> = {
  dashboard: { title: "首頁", subtitle: "AI 今日工作中心" },
  property: { title: "物件中心", subtitle: "一間房子就是一個中心" },
  contact: { title: "聯絡人", subtitle: "一位人只有一份資料" },
  journey: { title: "案件旅程", subtitle: "下一步、原因、風險" },
  repair: { title: "修繕管理", subtitle: "報修、估價、施工、保固" },
  calendar: { title: "日曆中心", subtitle: "所有時間都從這裡管理" },
  marketing: { title: "行銷中心", subtitle: "自動整理 Prompt，交給 ChatGPT 完成" },
  closing: { title: "成交中心", subtitle: "成交紀錄、公司請款、佣金" },
  documents: { title: "文件中心", subtitle: "文件綁定物件與案件" },
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
    if (item.type === "Calendar") {
      setActiveModule("calendar");
      return;
    }
    if (item.type === "Closing") {
      setActiveModule("closing");
      return;
    }
    if (item.type === "Marketing") {
      setActiveModule("marketing");
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
        <SectionTitle icon={TrendingUp} title="今天先做五件事" count={topFive.length} hint="依成交價值、成交機率、時效性、逾期天數排序" />
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
        <SectionTitle icon={Sparkles} title="流程導航" count={6} hint="物件 → 案件 → 日曆 → 行銷 → 成交 → 文件" />
        <div className="workflow-nav">
          <button onClick={() => setActiveModule("property")}><Home />物件</button>
          <button onClick={() => setActiveModule("journey")}><Clock3 />案件</button>
          <button onClick={() => setActiveModule("calendar")}><CalendarDays />日曆</button>
          <button onClick={() => setActiveModule("marketing")}><Megaphone />Prompt</button>
          <button onClick={() => setActiveModule("closing")}><Check />成交</button>
          <button onClick={() => setActiveModule("documents")}><ClipboardList />文件</button>
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
          onSetState={operatingSystem.setState}
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
  onSetState,
  onClose,
  onOpenJourney,
  onOpenModule,
}: {
  moduleKey: OperatingModuleKey;
  state: OperatingSystemState;
  priorityItems: AiPriorityItem[];
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
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
        {moduleKey === "property" && <PropertyList state={state} onSetState={onSetState} onOpenModule={onOpenModule} />}
        {moduleKey === "contact" && <ContactList contacts={state.contacts} journeys={state.journeys} properties={state.properties} />}
        {moduleKey === "journey" && <JourneyList journeys={state.journeys} state={state} onOpenJourney={onOpenJourney} />}
        {moduleKey === "repair" && <RepairList repairs={state.repairs} properties={state.properties} />}
        {moduleKey === "calendar" && <CalendarCenter state={state} onSetState={onSetState} />}
        {moduleKey === "marketing" && <MarketingCenter state={state} onSetState={onSetState} />}
        {moduleKey === "closing" && <ClosingCenter state={state} onSetState={onSetState} onOpenModule={onOpenModule} />}
        {moduleKey === "documents" && <DocumentsCenter state={state} onSetState={onSetState} />}
        {moduleKey === "ai" && <AiCenterList state={state} />}
      </div>
    </section>
  );
}

function PropertyList({
  state,
  onSetState,
  onOpenModule,
}: {
  state: OperatingSystemState;
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
  onOpenModule: (moduleKey: OperatingModuleKey) => void;
}) {
  function createProperty() {
    const id = crypto.randomUUID();
    onSetState((current) => ({
      ...current,
      properties: [
        {
          id,
          community: "新物件",
          address: "請補地址",
          propertyType: "住宅",
          totalPrice: "待確認",
          area: "待確認",
          status: "出售中",
          ownerIds: [],
          buyerIds: [],
          tenantIds: [],
          journeyIds: [],
          repairIds: [],
          fileIds: [],
          financialIds: [],
          caseIds: [],
          aiAnalysis: "新建立物件，下一步是建立案件。",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...current.properties,
      ],
    }));
  }

  function createCase(property: PropertyModel) {
    const caseId = crypto.randomUUID();
    const journeyId = crypto.randomUUID();
    onSetState((current) => ({
      ...current,
      cases: [
        {
          id: caseId,
          propertyId: property.id,
          type: "Sale",
          title: `${property.community}買賣案`,
          status: "Active",
          timeline: ["建立物件", "建立案件"],
          journeyIds: [journeyId],
          eventIds: [],
          fileIds: [],
          financialIds: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...current.cases,
      ],
      journeys: [
        {
          id: journeyId,
          type: "Owner",
          propertyId: property.id,
          contactIds: property.ownerIds,
          currentStage: "建立案件",
          nextStep: "補齊物件資料並產生行銷素材",
          probability: 60,
          aiSuggestion: "先完成物件資料，再進入行銷中心建立 ChatGPT Prompt。",
          reminderDate: new Date().toLocaleDateString("sv-SE"),
          completedRecords: [],
          history: [],
          dealValue: Number(property.totalPrice.replace(/\D/g, "")) || 100,
          urgency: 4,
          overdueDays: 0,
          status: "待處理",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...current.journeys,
      ],
      properties: current.properties.map((item) =>
        item.id === property.id
          ? {
              ...item,
              journeyIds: [journeyId, ...item.journeyIds],
              caseIds: [caseId, ...(item.caseIds || [])],
              updatedAt: nowIso(),
            }
          : item,
      ),
    }));
    onOpenModule("journey");
  }

  return (
    <div className="data-list">
      <button className="sheet-submit compact-submit" type="button" onClick={createProperty}>建立物件</button>
      {state.properties.map((property) => (
        <article className="data-card" key={property.id}>
          <div>
            <strong>{property.community}</strong>
            <span>{property.address}</span>
            <small>{property.propertyType}｜{property.totalPrice}｜{property.area}</small>
          </div>
          <em>{property.status}</em>
          <small>
            聯絡人 {state.contacts.filter((contact) => [...property.ownerIds, ...property.buyerIds, ...property.tenantIds].includes(contact.id)).length} 位｜
            案件 {state.cases.filter((item) => item.propertyId === property.id).length} 件｜
            旅程 {state.journeys.filter((journey) => journey.propertyId === property.id).length} 條｜
            修繕 {state.repairs.filter((repair) => repair.propertyId === property.id).length} 件
          </small>
          <span>{property.aiAnalysis}</span>
          <div className="marketing-actions">
            <button type="button" onClick={() => createCase(property)}>建立案件</button>
            <button type="button" onClick={() => onOpenModule("marketing")}>進入行銷</button>
          </div>
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

const calendarEventTypes: CalendarEventType[] = [
  "看屋",
  "第二次看屋",
  "屋主拜訪",
  "簽委託",
  "斡旋",
  "簽約",
  "成交",
  "過戶",
  "點交",
  "交屋",
  "公證",
  "收租",
  "修繕",
  "驗屋",
  "保固",
  "自訂",
];

function CalendarCenter({
  state,
  onSetState,
}: {
  state: OperatingSystemState;
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
}) {
  const today = new Date().toLocaleDateString("sv-SE");
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("sv-SE");
  const sortedEvents = [...state.calendarEvents].sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));

  function createEvent(property: PropertyModel) {
    const relatedCase = state.cases.find((item) => item.propertyId === property.id);
    const eventId = crypto.randomUUID();
    const event: CalendarEventModel = {
      id: eventId,
      title: `${property.community}看屋`,
      propertyId: property.id,
      caseId: relatedCase?.id || "",
      contactIds: [...property.ownerIds, ...property.buyerIds, ...property.tenantIds],
      eventType: "看屋",
      startDate: today,
      endDate: today,
      startTime: "10:00",
      endTime: "11:00",
      location: property.address,
      description: "從日曆中心建立，請確認行程內容。",
      status: "Scheduled",
      googleCalendarEventId: "",
      syncStatus: "NotSynced",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    onSetState((current) => ({
      ...current,
      calendarEvents: [event, ...current.calendarEvents],
      cases: current.cases.map((item) =>
        item.id === relatedCase?.id ? { ...item, eventIds: [eventId, ...item.eventIds], updatedAt: nowIso() } : item,
      ),
    }));
  }

  function updateEvent(id: string, patch: Partial<CalendarEventModel>) {
    onSetState((current) => ({
      ...current,
      calendarEvents: current.calendarEvents.map((event) =>
        event.id === id
          ? {
              ...event,
              ...patch,
              syncStatus: event.googleCalendarEventId ? "SyncFailed" : event.syncStatus,
              updatedAt: nowIso(),
            }
          : event,
      ),
    }));
  }

  function deleteEvent(id: string) {
    onSetState((current) => ({
      ...current,
      calendarEvents: current.calendarEvents.filter((event) => event.id !== id),
      cases: current.cases.map((item) => ({
        ...item,
        eventIds: item.eventIds.filter((eventId) => eventId !== id),
      })),
    }));
  }

  function createGoogleEvent(id: string) {
    updateEvent(id, {
      googleCalendarEventId: `google-${id}`,
      syncStatus: "Synced",
    });
  }

  function syncEvent(id: string) {
    updateEvent(id, { syncStatus: "Synced" });
  }

  return (
    <div className="data-list">
      <section className="today-summary-grid">
        <Metric label="今天行程" value={`${state.calendarEvents.filter((event) => event.startDate === today).length} 件`} />
        <Metric label="明天行程" value={`${state.calendarEvents.filter((event) => event.startDate === tomorrow).length} 件`} />
        <Metric label="全部行程" value={`${state.calendarEvents.length} 件`} />
      </section>

      {state.properties.map((property) => (
        <button className="sheet-submit compact-submit" type="button" key={property.id} onClick={() => createEvent(property)}>
          新增行程｜{property.community}
        </button>
      ))}

      {sortedEvents.map((event) => {
        const property = findProperty(state, event.propertyId);
        const caseItem = state.cases.find((item) => item.id === event.caseId);
        const contacts = state.contacts.filter((contact) => event.contactIds.includes(contact.id));
        return (
          <article className="data-card calendar-event-card" key={event.id}>
            <div>
              <strong>{event.title}</strong>
              <span>{event.startDate} {event.startTime} - {event.endTime}</span>
              <small>{property?.community || "未關聯物件"}｜{caseItem?.title || "未關聯案件"}｜{contacts.map((contact) => contact.name).join("、") || "未指定聯絡人"}</small>
            </div>
            <em>{event.googleCalendarEventId ? "已加入 Google 行事曆" : "尚未同步"}</em>

            <label className="editor-field">
              <span>標題</span>
              <input value={event.title} onChange={(input) => updateEvent(event.id, { title: input.target.value })} />
            </label>
            <label className="editor-field">
              <span>行程類型</span>
              <select value={event.eventType} onChange={(input) => updateEvent(event.id, { eventType: input.target.value as CalendarEventType })}>
                {calendarEventTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <div className="calendar-grid">
              <EditorInput label="開始日期" type="date" value={event.startDate} onChange={(value) => updateEvent(event.id, { startDate: value })} />
              <EditorInput label="結束日期" type="date" value={event.endDate} onChange={(value) => updateEvent(event.id, { endDate: value })} />
              <EditorInput label="開始時間" type="time" value={event.startTime} onChange={(value) => updateEvent(event.id, { startTime: value })} />
              <EditorInput label="結束時間" type="time" value={event.endTime} onChange={(value) => updateEvent(event.id, { endTime: value })} />
            </div>
            <EditorInput label="地點" value={event.location} onChange={(value) => updateEvent(event.id, { location: value })} />
            <EditorTextarea label="說明" value={event.description} onChange={(value) => updateEvent(event.id, { description: value })} />

            <div className="marketing-actions">
              <button type="button" onClick={() => createGoogleEvent(event.id)}>加入 Google 行事曆</button>
              <button type="button" onClick={() => syncEvent(event.id)}>{event.syncStatus === "Synced" ? "同步成功" : "雙向同步"}</button>
              <button type="button" onClick={() => deleteEvent(event.id)}>刪除行程</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const marketingPlatforms: Array<{ platform: MarketingPlatform; label: string }> = [
  { platform: "591", label: "591 刊登文" },
  { platform: "Facebook", label: "Facebook 貼文" },
  { platform: "LINE", label: "LINE 訊息" },
  { platform: "Instagram", label: "Instagram 文案" },
  { platform: "Threads", label: "Threads 貼文" },
  { platform: "YouTubeShorts", label: "YouTube Shorts 腳本" },
  { platform: "TikTok", label: "TikTok 腳本" },
  { platform: "SalesPresentation", label: "售屋簡報" },
];

const publishStatusLabels = {
  Draft: "草稿",
  Published: "已發布",
  NeedUpdate: "需要更新",
  Archived: "已封存",
} satisfies Record<MarketingContentModel["publishStatus"], string>;

function createMarketingContent(property: PropertyModel, platform: MarketingPlatform): MarketingContentModel {
  const generatedAt = nowIso();
  const label = marketingPlatforms.find((item) => item.platform === platform)?.label || platform;
  return {
    id: `${property.id}-${platform}`,
    propertyId: property.id,
    platform,
    title: `${property.community}｜${label}`,
    prompt: buildChatGptPrompt(property, platform),
    content: "",
    version: 1,
    publishStatus: "Draft",
    propertyPriceSnapshot: property.totalPrice,
    generatedAt,
    updatedAt: generatedAt,
  };
}

function buildChatGptPrompt(property: PropertyModel, platform: MarketingPlatform) {
  const base = {
    name: property.community || "精選物件",
    address: property.address || "地址待確認",
    type: property.propertyType || "住宅",
    price: property.totalPrice || "價格待確認",
    area: property.area || "坪數待確認",
    analysis: property.aiAnalysis || "生活機能與物件條件待補充。",
  };
  const common = `你是住商不動產南崁光明加盟店的房仲文案助手。請根據以下物件資料撰寫內容，不要臆測未提供資料。\n\n物件資料：\n社區：${base.name}\n地址：${base.address}\n類型：${base.type}\n總價：${base.price}\n坪數：${base.area}\nAI 分析：${base.analysis}\n\n寫作風格：自然、親切、務實、像 LINE 對話，不浮誇、不製造不實資訊。`;

  switch (platform) {
    case "591":
      return `${common}\n\n平台：591\n請產生：\n1. 30 字內標題\n2. 500-700 字刊登文\n3. 五大亮點\n4. 適合客群\n5. 預約賞屋 CTA`;
    case "Facebook":
      return `${common}\n\n平台：Facebook\n請產生分段美編貼文，包含售價資訊、房屋資訊、五大特色、生活機能、適合客群、預約賞屋。`;
    case "LINE":
      return `${common}\n\n平台：LINE\n請產生可直接傳給買方的短訊息，簡短、自然、不給壓力。`;
    case "Instagram":
      return `${common}\n\n平台：Instagram\n請產生圖片貼文 caption，含自然 hashtag，不要堆疊關鍵字。`;
    case "Threads":
      return `${common}\n\n平台：Threads\n請產生口語短貼文，重點明確，像真實房仲分享。`;
    case "YouTubeShorts":
      return `${common}\n\n平台：YouTube Shorts\n請產生 40-60 秒短影音腳本，包含前三秒鉤子、畫面建議、口播、結尾 CTA。`;
    case "TikTok":
      return `${common}\n\n平台：TikTok\n請產生節奏快的短影音腳本，包含前三秒鉤子、字幕、口播與 CTA。`;
    case "SalesPresentation":
      return `${common}\n\n輸出：售屋簡報草稿\n請產生簡報大綱、每頁標題、每頁重點、適合放的圖片類型與銷售說法。`;
  }
}

function MarketingCenter({
  state,
  onSetState,
}: {
  state: OperatingSystemState;
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
}) {
  function generateAll(property: PropertyModel) {
    onSetState((current) => {
      const nextContents: MarketingContentModel[] = marketingPlatforms.map(({ platform }) => {
        const existing = current.marketingContents.find((item) => item.propertyId === property.id && item.platform === platform);
        const next = createMarketingContent(property, platform);
        return existing
          ? {
              ...existing,
              title: next.title,
              prompt: next.prompt,
              propertyPriceSnapshot: property.totalPrice,
              publishStatus: existing.publishStatus === "Archived" ? "Archived" : "Draft",
              updatedAt: nowIso(),
            }
          : next;
      });

      return {
        ...current,
        marketingContents: [
          ...current.marketingContents.filter((item) => item.propertyId !== property.id),
          ...nextContents,
        ],
      };
    });
  }

  function updateAll(property: PropertyModel) {
    onSetState((current) => ({
      ...current,
      marketingContents: current.marketingContents.map((item) =>
        item.propertyId === property.id
          ? {
              ...item,
              prompt: buildChatGptPrompt(property, item.platform),
              propertyPriceSnapshot: property.totalPrice,
              publishStatus: item.publishStatus === "Published" ? "NeedUpdate" : item.publishStatus,
              updatedAt: nowIso(),
            }
          : item,
      ),
    }));
  }

  function changeStatus(contentId: string, publishStatus: MarketingContentModel["publishStatus"]) {
    onSetState((current) => ({
      ...current,
      marketingContents: current.marketingContents.map((item) =>
        item.id === contentId ? { ...item, publishStatus, updatedAt: nowIso() } : item,
      ),
    }));
  }

  function saveFinalVersion(contentId: string, content: string) {
    onSetState((current) => ({
      ...current,
      marketingContents: current.marketingContents.map((item) =>
        item.id === contentId
          ? {
              ...item,
              content,
              version: (item.version || 1) + 1,
              publishStatus: "Draft",
              updatedAt: nowIso(),
            }
          : item,
      ),
    }));
  }

  async function openInChatGpt(prompt: string) {
    await navigator.clipboard?.writeText(prompt);
    window.open("https://chat.openai.com/", "_blank", "noopener,noreferrer");
  }

  function updatePropertyPrice(propertyId: string, totalPrice: string) {
    onSetState((current) => ({
      ...current,
      properties: current.properties.map((property) =>
        property.id === propertyId ? { ...property, totalPrice, updatedAt: nowIso() } : property,
      ),
      marketingContents: current.marketingContents.map((item) =>
        item.propertyId === propertyId && item.publishStatus === "Published"
          ? { ...item, publishStatus: "NeedUpdate", updatedAt: nowIso() }
          : item,
      ),
    }));
  }

  return (
    <div className="data-list">
      {state.properties.map((property) => {
        const contents = state.marketingContents.filter((item) => item.propertyId === property.id);
        const hasPriceChanged = contents.some((item) => item.propertyPriceSnapshot !== property.totalPrice);
        return (
          <article className="data-card marketing-property-card" key={property.id}>
            <div>
              <strong>{property.community}</strong>
              <span>{property.address}</span>
              <small>目前價格：{property.totalPrice}｜坪數：{property.area}</small>
            </div>

            <label className="editor-field">
              <span>更新物件價格（寫回物件中心）</span>
              <input value={property.totalPrice} onChange={(event) => updatePropertyPrice(property.id, event.target.value)} />
            </label>

            {hasPriceChanged && (
              <div className="update-warning">
                <AlertTriangle />
                <span>價格已變更，要更新所有已發布內容嗎？</span>
                <button type="button" onClick={() => updateAll(property)}>一鍵更新</button>
              </div>
            )}

            <button className="sheet-submit compact-submit" type="button" onClick={() => generateAll(property)}>
              一鍵建立全部 ChatGPT Prompt
            </button>

            <div className="marketing-content-grid">
              {marketingPlatforms.map(({ platform, label }) => {
                const content = contents.find((item) => item.platform === platform);
                return (
                  <article className="marketing-content-card" key={platform}>
                    <div>
                      <strong>{label}</strong>
                      <em>{content ? publishStatusLabels[content.publishStatus] : "尚未生成"}</em>
                    </div>
                    <p>{content?.prompt || "按「一鍵建立全部 ChatGPT Prompt」後，系統會從物件資料自動整理 Prompt，不重複輸入資料。"}</p>
                    {content && (
                      <div className="marketing-version-box">
                        <button className="chatgpt-launch-button" type="button" onClick={() => openInChatGpt(content.prompt)}>
                          在 ChatGPT 開啟
                        </button>
                        <label className="editor-field">
                          <span>貼回 ChatGPT 最終版本｜第 {content.version || 1} 版</span>
                          <textarea value={content.content} onChange={(event) => saveFinalVersion(content.id, event.target.value)} placeholder="在 ChatGPT 完成後，把最終文案貼回這裡保存版本。" />
                        </label>
                        <div className="marketing-actions">
                          <button type="button" onClick={() => changeStatus(content.id, "Published")}>標記已發布</button>
                          <button type="button" onClick={() => changeStatus(content.id, "NeedUpdate")}>需要更新</button>
                          <button type="button" onClick={() => changeStatus(content.id, "Archived")}>封存</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ClosingCenter({
  state,
  onSetState,
  onOpenModule,
}: {
  state: OperatingSystemState;
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
  onOpenModule: (moduleKey: OperatingModuleKey) => void;
}) {
  function createClosing(property: PropertyModel, caseItem?: CaseModel) {
    const caseId = caseItem?.id || crypto.randomUUID();
    const closingId = crypto.randomUUID();
    const commissionAmount = Math.round((Number(property.totalPrice.replace(/\D/g, "")) || 0) * 0.04);
    onSetState((current) => {
      const existingCase = current.cases.find((item) => item.id === caseId);
      return {
        ...current,
        cases: existingCase
          ? current.cases.map((item) =>
              item.id === caseId
                ? { ...item, status: "Closing", timeline: [...item.timeline, "成交", "公司請款"], updatedAt: nowIso() }
                : item,
            )
          : [
              {
                id: caseId,
                propertyId: property.id,
                type: "Sale",
                title: `${property.community}成交案`,
                status: "Closing",
                timeline: ["建立物件", "建立案件", "行銷", "成交", "公司請款"],
                journeyIds: property.journeyIds,
                eventIds: [],
                fileIds: property.fileIds,
                financialIds: property.financialIds,
                createdAt: nowIso(),
                updatedAt: nowIso(),
              },
              ...current.cases,
            ],
        closingRecords: [
          {
            id: closingId,
            propertyId: property.id,
            caseId,
            title: `${property.community}成交紀錄單`,
            dealPrice: property.totalPrice,
            commission: commissionAmount ? `${commissionAmount}萬` : "待確認",
            tasks: [
              { id: crypto.randomUUID(), title: "成交紀錄單", status: "Pending" },
              { id: crypto.randomUUID(), title: "公司請款", status: "Pending" },
              { id: crypto.randomUUID(), title: "佣金", status: "Pending" },
              { id: crypto.randomUUID(), title: "履保", status: "Pending" },
              { id: crypto.randomUUID(), title: "過戶", status: "Pending" },
              { id: crypto.randomUUID(), title: "點交", status: "Pending" },
              { id: crypto.randomUUID(), title: "售後", status: "Pending" },
            ],
            createdAt: nowIso(),
            updatedAt: nowIso(),
          },
          ...current.closingRecords,
        ],
        financials: [
          {
            id: crypto.randomUUID(),
            propertyId: property.id,
            title: `${property.community}公司請款`,
            amount: commissionAmount,
            dueDate: new Date().toLocaleDateString("sv-SE"),
            status: "待收",
            note: "成交中心自動建立",
          },
          ...current.financials,
        ],
        properties: current.properties.map((item) =>
          item.id === property.id ? { ...item, status: "已成交", updatedAt: nowIso() } : item,
        ),
      };
    });
  }

  function toggleTask(recordId: string, taskId: string) {
    onSetState((current) => ({
      ...current,
      closingRecords: current.closingRecords.map((record) =>
        record.id === recordId
          ? {
              ...record,
              tasks: record.tasks.map((task) =>
                task.id === taskId ? { ...task, status: task.status === "Done" ? "Pending" : "Done" } : task,
              ),
              updatedAt: nowIso(),
            }
          : record,
      ),
    }));
  }

  return (
    <div className="data-list">
      <div className="workflow-nav">
        <button onClick={() => onOpenModule("property")}><Home />物件</button>
        <button onClick={() => onOpenModule("journey")}><Clock3 />案件</button>
        <button onClick={() => onOpenModule("marketing")}><Megaphone />Prompt</button>
        <button onClick={() => onOpenModule("documents")}><ClipboardList />文件</button>
      </div>

      {state.properties.map((property) => {
        const propertyCases = state.cases.filter((item) => item.propertyId === property.id);
        const records = state.closingRecords.filter((record) => record.propertyId === property.id);
        return (
          <article className="data-card" key={property.id}>
            <div>
              <strong>{property.community}</strong>
              <span>{property.address}</span>
              <small>{property.totalPrice}｜案件 {propertyCases.length} 件｜成交紀錄 {records.length} 筆</small>
            </div>
            <button className="sheet-submit compact-submit" type="button" onClick={() => createClosing(property, propertyCases[0])}>
              成交並建立公司請款
            </button>

            {records.map((record) => (
              <div className="closing-record" key={record.id}>
                <strong>{record.title}</strong>
                <span>成交價：{record.dealPrice}｜佣金：{record.commission}</span>
                <div className="closing-task-grid">
                  {record.tasks.map((task) => (
                    <button className={task.status === "Done" ? "done" : ""} type="button" key={task.id} onClick={() => toggleTask(record.id, task.id)}>
                      {task.status === "Done" ? "已完成" : "待處理"}｜{task.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </article>
        );
      })}
    </div>
  );
}

function DocumentsCenter({
  state,
  onSetState,
}: {
  state: OperatingSystemState;
  onSetState: (updater: (current: OperatingSystemState) => OperatingSystemState) => void;
}) {
  function createClosingDocument(property: PropertyModel) {
    const fileId = crypto.randomUUID();
    onSetState((current) => ({
      ...current,
      files: [
        {
          id: fileId,
          propertyId: property.id,
          category: "其他",
          name: `${property.community}成交文件包`,
          url: "",
          aiSummary: "包含成交紀錄單、公司請款、佣金、履保、過戶、點交、售後待辦。",
          createdAt: nowIso(),
        },
        ...current.files,
      ],
      properties: current.properties.map((item) =>
        item.id === property.id ? { ...item, fileIds: [fileId, ...item.fileIds], updatedAt: nowIso() } : item,
      ),
    }));
  }

  return (
    <div className="data-list">
      {state.properties.map((property) => {
        const files = state.files.filter((file) => file.propertyId === property.id);
        return (
          <article className="data-card" key={property.id}>
            <div>
              <strong>{property.community}</strong>
              <span>{property.address}</span>
              <small>文件 {files.length} 份</small>
            </div>
            <button className="sheet-submit compact-submit" type="button" onClick={() => createClosingDocument(property)}>
              建立成交文件包
            </button>
            {files.map((file) => (
              <div className="closing-record" key={file.id}>
                <strong>{file.name}</strong>
                <span>{file.category}</span>
                <small>{file.aiSummary}</small>
              </div>
            ))}
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
