"use client";

import {
  AlertTriangle,
  Check,
  CirclePlus,
  ClipboardList,
  Clock3,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Upload,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedInbox, seedJourneys } from "@/lib/seed";
import type { AiInboxItem, AiJourneyDraft, JourneyCard } from "@/lib/types";

const JOURNEYS_KEY = "mgAiosDealJourneys";
const INBOX_KEY = "mgAiosDealInbox";

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
    // Keep the dashboard usable even when localStorage is unavailable.
  }
}

function sortByDealValue(items: JourneyCard[]) {
  return [...items].sort((a, b) => {
    const eventBoost = Number(Boolean(b.eventKind)) - Number(Boolean(a.eventKind));
    return eventBoost || b.priorityScore - a.priorityScore;
  });
}

function createJourneyFromDraft(draft: AiJourneyDraft): JourneyCard {
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
    eventKind: draft.eventKind || undefined,
    waitingKind: draft.waitingKind || undefined,
    status: draft.waitingKind ? "waiting" : "active",
  };
}

export function CommandCenter() {
  const [ready, setReady] = useState(false);
  const [journeys, setJourneys] = useState<JourneyCard[]>(seedJourneys);
  const [inbox, setInbox] = useState<AiInboxItem[]>(seedInbox);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    setJourneys(loadStorage(JOURNEYS_KEY, seedJourneys));
    setInbox(loadStorage(INBOX_KEY, seedInbox));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) saveStorage(JOURNEYS_KEY, journeys); }, [journeys, ready]);
  useEffect(() => { if (ready) saveStorage(INBOX_KEY, inbox); }, [inbox, ready]);

  const topFive = useMemo(() => sortByDealValue(journeys.filter((item) => item.status !== "done")).slice(0, 5), [journeys]);
  const highPriority = useMemo(() => sortByDealValue(journeys.filter((item) => item.eventKind && item.status !== "done")), [journeys]);
  const waiting = useMemo(() => sortByDealValue(journeys.filter((item) => item.waitingKind && item.status !== "done")), [journeys]);
  const completed = useMemo(() => journeys.filter((item) => item.status === "done").sort((a, b) => String(b.completedAt || "").localeCompare(String(a.completedAt || ""))), [journeys]);

  function completeJourney(id: string) {
    setJourneys((current) => current.map((item) => item.id === id ? { ...item, status: "done", completedAt: new Date().toISOString() } : item));
  }

  function acceptDraft(draft: AiJourneyDraft, source: AiInboxItem["source"]) {
    const inboxItem: AiInboxItem = {
      id: crypto.randomUUID(),
      source,
      summary: draft.summary,
      createdAt: new Date().toISOString(),
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
          <span>AI Decision Dashboard</span>
        </div>
        <Link className="topbar-link" href="/backlog"><ClipboardList />摩擦待辦</Link>
        <button className="icon-button" onClick={() => setShowInbox(true)} aria-label="同步 AI 摘要"><Inbox /></button>
      </header>

      <section className="decision-hero">
        <p>AI 先做，人確認。</p>
        <h1>今天要先做什麼？</h1>
        <span>依成交價值排序，先推進最接近成交的 Journey。</span>
        <button className="primary-command" onClick={() => setShowInbox(true)}><CirclePlus />新增</button>
      </section>

      <section className="decision-section">
        <SectionTitle icon={TrendingUp} title="今日最重要 TOP 5" count={topFive.length} hint="依成交價值排序" />
        <div className="journey-list">
          {topFive.map((journey, index) => <JourneyDecisionCard key={journey.id} journey={journey} rank={index + 1} onComplete={completeJourney} />)}
        </div>
      </section>

      <section className="decision-section">
        <SectionTitle icon={AlertTriangle} title="高優先事件" count={highPriority.length} hint="收斡旋、見面談、交屋、簽約、等待回覆永遠優先" />
        <CompactJourneyList items={highPriority} emptyText="目前沒有高優先事件" />
      </section>

      <section className="decision-section">
        <SectionTitle icon={Clock3} title="等待中的案件" count={waiting.length} hint="等待屋主、買方、貸款、代書、租客" />
        <CompactJourneyList items={waiting} emptyText="目前沒有等待中的案件" />
      </section>

      <section className="decision-section">
        <SectionTitle icon={Check} title="今天完成" count={completed.length} hint="完成後從主要清單消失，只留紀錄" />
        <CompactJourneyList items={completed.slice(0, 5)} emptyText="今天尚未完成任何 Journey" />
      </section>

      <section className="decision-section inbox-summary">
        <SectionTitle icon={Inbox} title="AI Inbox" count={inbox.filter((item) => item.synced).length} hint="ChatGPT 已完成的新分析" />
        <button className="inbox-entry" onClick={() => setShowInbox(true)}>
          <Inbox />
          <span><strong>等待 AI 整理</strong><small>貼文字、LINE 截圖或照片，MG-AIOS 自動產生 Journey 草稿。</small></span>
        </button>
      </section>

      {showInbox && <InboxSheet onClose={() => setShowInbox(false)} onAccept={acceptDraft} />}
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

function JourneyDecisionCard({ journey, rank, onComplete }: { journey: JourneyCard; rank: number; onComplete: (id: string) => void }) {
  return (
    <article className="journey-card">
      <div className="journey-rank">{rank}</div>
      <div className="journey-main">
        <div className="journey-topline">
          <strong>{journey.person}</strong>
          <span>{journey.estimatedDealValue}</span>
        </div>
        <dl>
          <div><dt>Journey</dt><dd>{journey.journey}｜{journey.stage}</dd></div>
          <div><dt>下一步</dt><dd>{journey.nextStep}</dd></div>
          <div><dt>原因</dt><dd>{journey.reason}</dd></div>
          <div><dt>風險</dt><dd>{journey.risk}</dd></div>
        </dl>
        <div className="journey-footer">
          <span>成交價值分數 {journey.priorityScore}</span>
          {journey.eventKind && <em>{journey.eventKind}</em>}
          {journey.status !== "done" && <button onClick={() => onComplete(journey.id)}><Check />完成</button>}
        </div>
      </div>
    </article>
  );
}

function CompactJourneyList({ items, emptyText }: { items: JourneyCard[]; emptyText: string }) {
  if (!items.length) {
    return <div className="empty-state"><Check /><span>{emptyText}</span></div>;
  }
  return (
    <div className="compact-list">
      {items.map((item) => (
        <article className="compact-card" key={item.id}>
          <strong>{item.person}</strong>
          <span>{item.eventKind || item.waitingKind || item.stage}</span>
          <small>{item.nextStep}</small>
        </article>
      ))}
    </div>
  );
}

function InboxSheet({ onClose, onAccept }: { onClose: () => void; onAccept: (draft: AiJourneyDraft, source: AiInboxItem["source"]) => void }) {
  const [inputType, setInputType] = useState<"text" | "line" | "photo">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<AiJourneyDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function accept() {
    if (!draft) return;
    onAccept(draft, "ChatGPT");
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet inbox-compose" onSubmit={submit}>
        <div className="sheet-handle" />
        <header>
          <div><p>AI Inbox v2</p><h2>新增 Journey</h2></div>
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
              <span>文字內容</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="貼上 LINE 對話、客戶需求、帶看心得，或補充照片內容..." />
            </label>

            {inputType !== "text" && (
              <label>
                <span>{inputType === "line" ? "LINE 截圖" : "照片"}</span>
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
            )}

            {error && <p className="form-error">{error}</p>}
            <p>MG-AIOS 會呼叫 ChatGPT API，自動整理 Person、Journey、Stage、Priority、Next Action 與 Summary。</p>
            <button className="sheet-submit" type="submit" disabled={loading || (!text.trim() && !file)}>
              {loading ? "AI 整理中..." : "開始 AI 整理"}
            </button>
          </>
        ) : (
          <div className="ai-preview">
            <div className="ai-preview-head">
              <span>AI 已整理，請確認</span>
              <strong>信心值 {draft.confidence}%</strong>
            </div>
            <label><span>Person</span><input value={draft.person} onChange={(event) => updateDraft("person", event.target.value)} /></label>
            <label><span>Journey</span><select value={draft.journey} onChange={(event) => updateDraft("journey", event.target.value as AiJourneyDraft["journey"])}>{["屋主旅程", "案件旅程", "買方旅程", "出租旅程"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Stage</span><input value={draft.stage} onChange={(event) => updateDraft("stage", event.target.value)} /></label>
            <label><span>Priority</span><input type="number" min="1" max="99" value={draft.priority} onChange={(event) => updateDraft("priority", Number(event.target.value))} /></label>
            <label><span>Next Action</span><textarea value={draft.nextAction} onChange={(event) => updateDraft("nextAction", event.target.value)} /></label>
            <label><span>Summary</span><textarea value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} /></label>
            <div className="preview-actions">
              <button type="button" onClick={accept}>接受</button>
              <button type="button" onClick={() => setDraft(null)}>修改</button>
              <button type="button" onClick={onClose}>取消</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
