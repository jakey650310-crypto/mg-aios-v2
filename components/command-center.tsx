"use client";

import {
  AlertTriangle,
  Check,
  CirclePlus,
  ClipboardList,
  Clock3,
  Copy,
  History,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Mic,
  MoreVertical,
  Pencil,
  Save,
  Trash2,
  Upload,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { seedInbox, seedJourneys } from "@/lib/seed";
import type { AiInboxItem, AiJourneyDraft, JourneyCard, JourneyKind } from "@/lib/types";

const JOURNEYS_KEY = "mgAiosDealJourneys";
const INBOX_KEY = "mgAiosDealInbox";
const CEO_NAME = "蔡名廣";

type JourneyPatch = Partial<JourneyCard>;
type InputType = "text" | "line" | "photo";
type SpeechRecognitionResultLike = { transcript?: string };
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

const journeyOptions: JourneyKind[] = ["買方旅程", "屋主旅程", "出租旅程", "案件旅程"];

function nowIso() {
  return new Date().toISOString();
}

function todayValue() {
  return new Date().toLocaleDateString("sv-SE");
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
    // Keep MG-AIOS usable even when localStorage is unavailable.
  }
}

function normalizeJourney(item: JourneyCard): JourneyCard {
  return {
    ...item,
    priorityScore: Number(item.priorityScore) || 70,
    estimatedDealValue: item.estimatedDealValue || "待確認成交價值",
    estimatedCloseDate: item.estimatedCloseDate || "",
    aiSuggestion: item.aiSuggestion || "",
    notes: item.notes || "",
    phone: item.phone || "",
    roleTag: item.roleTag || item.journey.replace("旅程", ""),
    potentialTag: item.potentialTag || (item.priorityScore >= 80 ? "高潛力" : "持續追蹤"),
    relationshipLevel: Number(item.relationshipLevel) || Math.max(1, Math.min(5, Math.round((Number(item.priorityScore) || 70) / 20))),
    listingProbability: Number(item.listingProbability) || Math.max(1, Math.min(99, Number(item.priorityScore) || 70)),
    referralProbability: Number(item.referralProbability) || 50,
    dealValueLevel: item.dealValueLevel || "$$$",
    aiNextSteps: item.aiNextSteps || `🟢 ${todayValue()}\n${item.nextStep}`,
    latestFollowUp: item.latestFollowUp || item.notes || "尚未建立追蹤紀錄",
    customerProfile: item.customerProfile || "工作\n家庭\n決策者\n個性\n興趣\nLINE\n生日\n孩子\n寵物\n車輛",
    propertyInfo: item.propertyInfo || "社區\n樓層\n坪數\n車位\n屋齡\n交屋日\n購買價格\n貸款銀行",
    lineRecords: item.lineRecords || "全部依日期排序\n可搜尋\nAI 自動摘要",
    fileRecords: item.fileRecords || "契約\n名片\n照片\n格局圖\n逐字稿\n錄音",
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso(),
    history: item.history || [],
  };
}

function sortByDealValue(items: JourneyCard[]) {
  return [...items].sort((a, b) => {
    const eventBoost = Number(Boolean(b.eventKind)) - Number(Boolean(a.eventKind));
    return eventBoost || b.priorityScore - a.priorityScore;
  });
}

function createJourneyFromDraft(draft: AiJourneyDraft): JourneyCard {
  const createdAt = nowIso();
  return {
    id: crypto.randomUUID(),
    person: draft.person,
    journey: draft.journey,
    stage: draft.stage,
    nextStep: draft.nextAction,
    reason: draft.reason,
    risk: draft.risk,
    estimatedDealValue: draft.estimatedDealValue,
    priorityScore: draft.priority,
    estimatedCloseDate: "",
    aiSuggestion: draft.summary,
    notes: "",
    eventKind: draft.eventKind || undefined,
    waitingKind: draft.waitingKind || undefined,
    status: draft.waitingKind ? "waiting" : "active",
    createdAt,
    updatedAt: createdAt,
    history: [],
  };
}

function recordChange(before: JourneyCard, after: JourneyCard, changedBy = CEO_NAME) {
  return {
    ...after,
    updatedAt: nowIso(),
    history: [
      {
        id: crypto.randomUUID(),
        changedAt: nowIso(),
        changedBy,
        before,
        after,
      },
      ...(before.history || []),
    ],
  };
}

function draftFromJourney(journey: JourneyCard): AiJourneyDraft {
  return {
    person: journey.person,
    journey: journey.journey,
    stage: journey.stage,
    priority: journey.priorityScore,
    nextAction: journey.nextStep,
    summary: journey.aiSuggestion || journey.notes || journey.reason,
    reason: journey.reason,
    risk: journey.risk,
    estimatedDealValue: journey.estimatedDealValue,
    eventKind: journey.eventKind || "",
    waitingKind: journey.waitingKind || "",
    confidence: journey.priorityScore,
  };
}

export function CommandCenter() {
  const [ready, setReady] = useState(false);
  const [journeys, setJourneys] = useState<JourneyCard[]>(seedJourneys.map(normalizeJourney));
  const [inbox, setInbox] = useState<AiInboxItem[]>(seedInbox);
  const [showInbox, setShowInbox] = useState(false);
  const [editingJourney, setEditingJourney] = useState<JourneyCard | null>(null);
  const [historyJourney, setHistoryJourney] = useState<JourneyCard | null>(null);
  const [menuJourneyId, setMenuJourneyId] = useState<string | null>(null);

  useEffect(() => {
    setJourneys(loadStorage(JOURNEYS_KEY, seedJourneys).map(normalizeJourney));
    setInbox(loadStorage(INBOX_KEY, seedInbox));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) saveStorage(JOURNEYS_KEY, journeys); }, [journeys, ready]);
  useEffect(() => { if (ready) saveStorage(INBOX_KEY, inbox); }, [inbox, ready]);

  const activeJourneys = useMemo(() => journeys.filter((item) => item.status !== "done"), [journeys]);
  const topFive = useMemo(() => sortByDealValue(activeJourneys).slice(0, 5), [activeJourneys]);
  const highPriority = useMemo(() => sortByDealValue(activeJourneys.filter((item) => item.eventKind)), [activeJourneys]);
  const waiting = useMemo(() => sortByDealValue(activeJourneys.filter((item) => item.waitingKind)), [activeJourneys]);
  const completed = useMemo(() => journeys.filter((item) => item.status === "done").sort((a, b) => String(b.completedAt || "").localeCompare(String(a.completedAt || ""))), [journeys]);

  function saveJourney(next: JourneyCard) {
    setJourneys((current) => current.map((item) => item.id === next.id ? recordChange(item, next) : item));
    setEditingJourney(null);
  }

  function deleteJourney(id: string) {
    setJourneys((current) => current.filter((item) => item.id !== id));
    setMenuJourneyId(null);
  }

  function copyJourney(id: string) {
    const source = journeys.find((item) => item.id === id);
    if (!source) return;
    const copiedAt = nowIso();
    const copyItem: JourneyCard = {
      ...source,
      id: crypto.randomUUID(),
      person: `${source.person} 複製`,
      status: "active",
      completedAt: undefined,
      createdAt: copiedAt,
      updatedAt: copiedAt,
      history: [],
    };
    setJourneys((current) => [copyItem, ...current]);
    setMenuJourneyId(null);
  }

  function completeJourney(id: string) {
    setJourneys((current) => current.map((item) => {
      if (item.id !== id) return item;
      return recordChange(item, { ...item, status: "done", completedAt: nowIso() });
    }));
  }

  function acceptDraft(draft: AiJourneyDraft, source: AiInboxItem["source"]) {
    const inboxItem: AiInboxItem = {
      id: crypto.randomUUID(),
      source,
      summary: draft.summary,
      createdAt: nowIso(),
      synced: true,
    };
    setInbox((current) => [inboxItem, ...current]);
    setJourneys((current) => [createJourneyFromDraft(draft), ...current]);
    setShowInbox(false);
  }

  if (!ready) {
    return <div className="loading-screen"><LoaderCircle className="animate-spin" /><span>載入 AI Decision Dashboard</span></div>;
  }

  return (
    <main className="app-shell decision-shell">
      <header className="topbar">
        <div className="brand-mark">M</div>
        <div className="brand-copy">
          <strong>MG-AIOS</strong>
          <span>Journey CRM</span>
        </div>
        <Link className="topbar-link" href="/backlog"><ClipboardList />摩擦待辦</Link>
        <button className="icon-button" onClick={() => setShowInbox(true)} aria-label="新增 Journey"><Inbox /></button>
      </header>

      <section className="decision-hero">
        <p>AI 先做，人確認。</p>
        <h1>今天要先做什麼？</h1>
        <span>每張 Journey 都可新增、查看、修改、刪除與追蹤歷程。</span>
        <button className="primary-command" onClick={() => setShowInbox(true)}><CirclePlus />新增</button>
      </section>

      <section className="decision-section">
        <SectionTitle icon={TrendingUp} title="今日最重要 TOP 5" count={topFive.length} hint="依成交價值與成交率排序" />
        <div className="journey-list">
          {topFive.map((journey, index) => (
            <JourneyDecisionCard
              key={journey.id}
              journey={journey}
              rank={index + 1}
              menuOpen={menuJourneyId === journey.id}
              onOpen={() => setEditingJourney(journey)}
              onMenu={() => setMenuJourneyId(menuJourneyId === journey.id ? null : journey.id)}
              onEdit={() => { setEditingJourney(journey); setMenuJourneyId(null); }}
              onDelete={() => deleteJourney(journey.id)}
              onCopy={() => copyJourney(journey.id)}
              onHistory={() => { setHistoryJourney(journey); setMenuJourneyId(null); }}
              onComplete={completeJourney}
            />
          ))}
        </div>
      </section>

      <section className="decision-section">
        <SectionTitle icon={AlertTriangle} title="高優先事件" count={highPriority.length} hint="收斡旋、見面談、交屋、簽約、等待回覆永遠優先" />
        <CompactJourneyList items={highPriority} emptyText="目前沒有高優先事件" onOpen={setEditingJourney} />
      </section>

      <section className="decision-section">
        <SectionTitle icon={Clock3} title="等待中的案件" count={waiting.length} hint="等待屋主、買方、貸款、代書、租客" />
        <CompactJourneyList items={waiting} emptyText="目前沒有等待中的案件" onOpen={setEditingJourney} />
      </section>

      <section className="decision-section">
        <SectionTitle icon={Check} title="今天完成" count={completed.length} hint="完成後從主要清單消失，只留紀錄" />
        <CompactJourneyList items={completed.slice(0, 5)} emptyText="今天尚未完成任何 Journey" onOpen={setEditingJourney} />
      </section>

      <section className="decision-section inbox-summary">
        <SectionTitle icon={Inbox} title="AI Inbox" count={inbox.filter((item) => item.synced).length} hint="ChatGPT 已完成的新分析" />
        <button className="inbox-entry" onClick={() => setShowInbox(true)}>
          <Inbox />
          <span><strong>等待 AI 整理</strong><small>貼文字、LINE 截圖或照片，MG-AIOS 自動產生 Journey 草稿。</small></span>
        </button>
      </section>

      {showInbox && <InboxSheet onClose={() => setShowInbox(false)} onAccept={acceptDraft} />}
      {editingJourney && <JourneyEditPage journey={editingJourney} onClose={() => setEditingJourney(null)} onSave={saveJourney} />}
      {historyJourney && <HistoryPage journey={historyJourney} onClose={() => setHistoryJourney(null)} />}
    </main>
  );
}

function SectionTitle({ icon: Icon, title, count, hint }: { icon: typeof Sparkles; title: string; count: number; hint: string }) {
  return (
    <div className="section-heading decision-heading">
      <span className="decision-heading-icon"><Icon /></span>
      <div><p>{hint}</p><h2>{title}<b>{count}</b></h2></div>
    </div>
  );
}

function JourneyDecisionCard({
  journey,
  rank,
  menuOpen,
  onOpen,
  onMenu,
  onEdit,
  onDelete,
  onCopy,
  onHistory,
  onComplete,
}: {
  journey: JourneyCard;
  rank: number;
  menuOpen: boolean;
  onOpen: () => void;
  onMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onHistory: () => void;
  onComplete: (id: string) => void;
}) {
  return (
    <article className="journey-card">
      <button className="journey-card-tap" onClick={onOpen} aria-label={`編輯 ${journey.person}`} />
      <div className="journey-rank">{rank}</div>
      <div className="journey-main">
        <div className="journey-topline">
          <strong>{journey.person}</strong>
          <span>{journey.estimatedDealValue}</span>
        </div>
        <button className="journey-menu-button" onClick={onMenu} aria-label="Journey 功能選單"><MoreVertical /></button>
        {menuOpen && (
          <div className="journey-menu">
            <button onClick={onEdit}><Pencil />編輯</button>
            <button onClick={onDelete}><Trash2 />刪除</button>
            <button onClick={onCopy}><Copy />複製</button>
            <button onClick={onHistory}><History />歷程紀錄</button>
          </div>
        )}
        <dl>
          <div><dt>Journey</dt><dd>{journey.journey}｜{journey.stage}</dd></div>
          <div><dt>下一步</dt><dd>{journey.nextStep}</dd></div>
          <div><dt>原因</dt><dd>{journey.reason}</dd></div>
          <div><dt>風險</dt><dd>{journey.risk}</dd></div>
        </dl>
        <div className="journey-footer">
          <span>成交率 {journey.priorityScore}%</span>
          {journey.eventKind && <em>{journey.eventKind}</em>}
          {journey.status !== "done" && <button onClick={(event) => { event.stopPropagation(); onComplete(journey.id); }}><Check />完成</button>}
        </div>
      </div>
    </article>
  );
}

function CompactJourneyList({ items, emptyText, onOpen }: { items: JourneyCard[]; emptyText: string; onOpen: (journey: JourneyCard) => void }) {
  if (!items.length) {
    return <div className="empty-state"><Check /><span>{emptyText}</span></div>;
  }
  return (
    <div className="compact-list">
      {items.map((item) => (
        <button className="compact-card" key={item.id} onClick={() => onOpen(item)}>
          <strong>{item.person}</strong>
          <span>{item.eventKind || item.waitingKind || item.stage}</span>
          <small>{item.nextStep}</small>
        </button>
      ))}
    </div>
  );
}

function JourneyEditPage({ journey, onClose, onSave }: { journey: JourneyCard; onClose: () => void; onSave: (journey: JourneyCard) => void }) {
  const [draft, setDraft] = useState<JourneyCard>(normalizeJourney(journey));
  const [showAiUpdate, setShowAiUpdate] = useState(false);

  function update<K extends keyof JourneyCard>(key: K, value: JourneyCard[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyAiDraft(aiDraft: AiJourneyDraft) {
    setDraft((current) => ({
      ...current,
      person: aiDraft.person,
      journey: aiDraft.journey,
      stage: aiDraft.stage,
      nextStep: aiDraft.nextAction,
      priorityScore: aiDraft.priority,
      estimatedDealValue: aiDraft.estimatedDealValue,
      reason: aiDraft.reason,
      risk: aiDraft.risk,
      aiSuggestion: aiDraft.summary,
      eventKind: aiDraft.eventKind || undefined,
      waitingKind: aiDraft.waitingKind || undefined,
    }));
    setShowAiUpdate(false);
  }

  return (
    <section className="fullscreen-editor">
      <header className="editor-header">
        <button className="icon-button" onClick={onClose} aria-label="取消"><X /></button>
        <div>
          <p>Edit Journey</p>
          <h1>{draft.person || "新增 Journey"}</h1>
        </div>
        <button className="editor-save-mini" onClick={() => onSave(draft)}><Save />儲存</button>
      </header>

      <div className="editor-body">
        <section className="client-hero-card">
          <div>
            <h2>👤 {draft.person}</h2>
            <p>{draft.stage}</p>
            {draft.phone && <a href={`tel:${draft.phone}`}>📞 {draft.phone}</a>}
          </div>
          <div className="client-tags">
            <span>🏷️ {draft.roleTag}</span>
            <span>🟢 {draft.status === "done" ? "已完成" : draft.stage}</span>
            <span>🔥 {draft.potentialTag}</span>
          </div>
        </section>

        <CrmSection title="📊 客戶儀表板">
          <div className="client-metrics">
            <Metric label="🤝 關係指數" value={"★".repeat(draft.relationshipLevel || 1)} />
            <Metric label="🏡 委託機率" value={`${draft.listingProbability || draft.priorityScore}%`} />
            <Metric label="🤝 轉介紹機率" value={`${draft.referralProbability || 50}%`} />
            <Metric label="📈 成交價值" value={draft.dealValueLevel || draft.estimatedDealValue} />
          </div>
        </CrmSection>

        <CrmSection title="🛣 客戶旅程">
          <JourneyPath current={draft.stage} journey={draft.journey} />
        </CrmSection>

        <CrmSection title="📅 AI 下一步">
          <EditorTextarea label="下一步計畫" value={draft.aiNextSteps || ""} onChange={(value) => update("aiNextSteps", value)} />
          <button className="complete-action" onClick={() => update("status", "done")}>完成</button>
        </CrmSection>

        <CrmSection title="📝 最新追蹤">
          <EditorTextarea label="最新追蹤" value={draft.latestFollowUp || ""} onChange={(value) => update("latestFollowUp", value)} />
        </CrmSection>

        <CrmSection title="🤖 AI 建議">
          <EditorTextarea label="AI 建議" value={draft.aiSuggestion || ""} onChange={(value) => update("aiSuggestion", value)} />
        </CrmSection>

        <button className="ai-update-button" onClick={() => setShowAiUpdate(true)}><Sparkles />AI 更新 Journey</button>
        <CrmSection title="👨‍👩‍👧 客戶資料">
          <EditorTextarea label="客戶資料" value={draft.customerProfile || ""} onChange={(value) => update("customerProfile", value)} />
        </CrmSection>

        <CrmSection title="🏡 房屋資訊">
          <EditorTextarea label="房屋資訊" value={draft.propertyInfo || ""} onChange={(value) => update("propertyInfo", value)} />
        </CrmSection>

        <CrmSection title="💬 LINE紀錄">
          <EditorTextarea label="LINE紀錄" value={draft.lineRecords || ""} onChange={(value) => update("lineRecords", value)} />
        </CrmSection>

        <CrmSection title="📂 檔案">
          <EditorTextarea label="檔案" value={draft.fileRecords || ""} onChange={(value) => update("fileRecords", value)} />
        </CrmSection>

        <CrmSection title="基本資料">
          <EditorInput label="客戶姓名" value={draft.person} onChange={(value) => update("person", value)} />
          <EditorInput label="電話" value={draft.phone || ""} onChange={(value) => update("phone", value)} />
          <EditorInput label="標籤" value={draft.roleTag || ""} onChange={(value) => update("roleTag", value)} />
          <EditorInput label="潛力標籤" value={draft.potentialTag || ""} onChange={(value) => update("potentialTag", value)} />
        <label className="editor-field">
          <span>Journey 類型</span>
          <select value={draft.journey} onChange={(event) => update("journey", event.target.value as JourneyKind)}>
            {journeyOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <EditorInput label="目前階段" value={draft.stage} onChange={(value) => update("stage", value)} />
        <EditorTextarea label="下一步" value={draft.nextStep} onChange={(value) => update("nextStep", value)} />
        <EditorInput label="成交機率(%)" type="number" value={String(draft.priorityScore)} onChange={(value) => update("priorityScore", Math.max(1, Math.min(99, Number(value) || 1)))} />
          <EditorInput label="關係指數(1-5)" type="number" value={String(draft.relationshipLevel || 1)} onChange={(value) => update("relationshipLevel", Math.max(1, Math.min(5, Number(value) || 1)))} />
          <EditorInput label="委託機率(%)" type="number" value={String(draft.listingProbability || draft.priorityScore)} onChange={(value) => update("listingProbability", Math.max(1, Math.min(99, Number(value) || 1)))} />
          <EditorInput label="轉介紹機率(%)" type="number" value={String(draft.referralProbability || 50)} onChange={(value) => update("referralProbability", Math.max(1, Math.min(99, Number(value) || 1)))} />
        <EditorInput label="成交價值" value={draft.estimatedDealValue} onChange={(value) => update("estimatedDealValue", value)} />
          <EditorInput label="成交價值等級" value={draft.dealValueLevel || ""} onChange={(value) => update("dealValueLevel", value)} />
        <EditorInput label="預計成交日期" type="date" value={draft.estimatedCloseDate || ""} onChange={(value) => update("estimatedCloseDate", value)} />
        <EditorTextarea label="原因" value={draft.reason} onChange={(value) => update("reason", value)} />
        <EditorTextarea label="風險" value={draft.risk} onChange={(value) => update("risk", value)} />
        <EditorTextarea label="備註" value={draft.notes || ""} onChange={(value) => update("notes", value)} />
        </CrmSection>
      </div>

      <footer className="editor-actions">
        <button onClick={() => onSave(draft)}><Save />儲存</button>
        <button onClick={onClose}><X />取消</button>
      </footer>

      {showAiUpdate && <AiUpdateSheet journey={draft} onClose={() => setShowAiUpdate(false)} onApply={applyAiDraft} />}
    </section>
  );
}

function CrmSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="crm-section">
      <h3>{title}</h3>
      {children}
    </section>
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

function JourneyPath({ current, journey }: { current: string; journey: JourneyKind }) {
  const baseSteps = journey === "屋主旅程"
    ? ["建立關係", "開發中", "建立LINE", "持續聯絡", "委售機會", "專任委託", "成交", "售後關懷"]
    : ["建立關係", "了解需求", "建立LINE", "持續聯絡", "看屋", "出價", "議價", "簽約", "交屋", "售後關懷"];
  const currentIndex = Math.max(0, baseSteps.findIndex((step) => current.includes(step)));
  return (
    <div className="journey-path">
      {baseSteps.map((step, index) => (
        <span key={step} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}>
          {index < currentIndex ? "●" : index === currentIndex ? "●" : "○"} {step}
        </span>
      ))}
    </div>
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

function HistoryPage({ journey, onClose }: { journey: JourneyCard; onClose: () => void }) {
  return (
    <section className="fullscreen-editor">
      <header className="editor-header">
        <button className="icon-button" onClick={onClose} aria-label="返回"><X /></button>
        <div>
          <p>歷程紀錄</p>
          <h1>{journey.person}</h1>
        </div>
      </header>
      <div className="editor-body">
        {(journey.history || []).length === 0 ? (
          <div className="empty-state"><History /><span>目前沒有修改紀錄</span></div>
        ) : (
          <div className="history-list">
            {(journey.history || []).map((entry) => (
              <article className="history-card" key={entry.id}>
                <strong>{new Date(entry.changedAt).toLocaleString("zh-TW")}</strong>
                <span>修改人：{entry.changedBy}</span>
                <dl>
                  <div><dt>修改前</dt><dd>{entry.before.person}｜{entry.before.stage}｜{entry.before.nextStep}</dd></div>
                  <div><dt>修改後</dt><dd>{entry.after.person}｜{entry.after.stage}｜{entry.after.nextStep}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function InboxSheet({ onClose, onAccept }: { onClose: () => void; onAccept: (draft: AiJourneyDraft, source: AiInboxItem["source"]) => void }) {
  return <AiInputSheet title="新增 Journey" submitText="開始 AI 整理" onClose={onClose} onAccept={(draft) => onAccept(draft, "ChatGPT")} />;
}

function AiUpdateSheet({ journey, onClose, onApply }: { journey: JourneyCard; onClose: () => void; onApply: (draft: AiJourneyDraft) => void }) {
  return (
    <AiInputSheet
      title="AI 更新 Journey"
      submitText="AI 分析更新"
      initialText={`目前 Journey：${journey.person}｜${journey.journey}｜${journey.stage}\n目前下一步：${journey.nextStep}\n目前成交率：${journey.priorityScore}%`}
      onClose={onClose}
      onAccept={onApply}
    />
  );
}

function AiInputSheet({
  title,
  submitText,
  initialText = "",
  onClose,
  onAccept,
}: {
  title: string;
  submitText: string;
  initialText?: string;
  onClose: () => void;
  onAccept: (draft: AiJourneyDraft) => void;
}) {
  const [inputType, setInputType] = useState<InputType>("text");
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<AiJourneyDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() && !file) return;
    setLoading(true);
    setError("");

    const payload = new FormData();
    payload.set("inputType", inputType);
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
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function startVoiceInput() {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("此瀏覽器暫不支援語音輸入，請先用鍵盤貼上內容。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("語音輸入失敗，請再試一次。");
    };
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0]?.transcript || "").join("");
      setText((current) => `${current}${current ? "\n" : ""}${spoken}`);
    };
    recognition.start();
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet inbox-compose" onSubmit={submit}>
        <div className="sheet-handle" />
        <header>
          <div><p>AI Inbox</p><h2>{title}</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X /></button>
        </header>
        {!draft ? (
          <>
            <div className="input-type-grid">
              <button type="button" className={inputType === "text" ? "selected" : ""} onClick={() => setInputType("text")}><MessageCircle />貼文字</button>
              <button type="button" className={inputType === "line" ? "selected" : ""} onClick={() => setInputType("line")}><Upload />LINE 截圖</button>
              <button type="button" className={inputType === "photo" ? "selected" : ""} onClick={() => setInputType("photo")}><Upload />上傳照片</button>
            </div>

            <label>
              <span>聊天內容 / 補充內容</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="貼上 LINE 對話、客戶需求、帶看心得，或補充照片內容..." />
            </label>

            <button className="voice-button" type="button" onClick={startVoiceInput}><Mic />{listening ? "聆聽中..." : "語音輸入"}</button>

            {inputType !== "text" && (
              <label>
                <span>{inputType === "line" ? "LINE 截圖" : "照片"}</span>
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
            )}

            {error && <p className="form-error">{error}</p>}
            <p>MG-AIOS 會呼叫 ChatGPT API，自動整理 Journey、下一步、成交率、原因、風險與今日優先順序。</p>
            <button className="sheet-submit" type="submit" disabled={loading || (!text.trim() && !file)}>
              {loading ? "AI 整理中..." : submitText}
            </button>
          </>
        ) : (
          <div className="ai-preview">
            <div className="ai-preview-head">
              <span>AI 已整理，請確認</span>
              <strong>信心值 {draft.confidence}%</strong>
            </div>
            <label><span>Person</span><input value={draft.person} onChange={(event) => updateDraft("person", event.target.value)} /></label>
            <label><span>Journey</span><select value={draft.journey} onChange={(event) => updateDraft("journey", event.target.value as AiJourneyDraft["journey"])}>{journeyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Stage</span><input value={draft.stage} onChange={(event) => updateDraft("stage", event.target.value)} /></label>
            <label><span>成交率</span><input type="number" min="1" max="99" value={draft.priority} onChange={(event) => updateDraft("priority", Number(event.target.value))} /></label>
            <label><span>Next Action</span><textarea value={draft.nextAction} onChange={(event) => updateDraft("nextAction", event.target.value)} /></label>
            <label><span>Summary</span><textarea value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} /></label>
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
