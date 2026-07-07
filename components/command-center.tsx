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
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedInbox, seedJourneys } from "@/lib/seed";
import type { AiInboxItem, JourneyCard } from "@/lib/types";

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

function createJourneyFromSummary(summary: string): JourneyCard {
  const person = summary.match(/([A-Za-z\u4e00-\u9fa5]{2,12})/)?.[1] || "新機會";
  const probability = Number(summary.match(/(\d{2,3})\s*%/)?.[1] || 70);
  const value = summary.match(/(\d{3,5})\s*萬/)?.[0] || "待確認成交價值";
  const hasOwner = /屋主|委託|底價/.test(summary);
  const hasLoan = /貸款|銀行/.test(summary);
  const hasAppointment = /看屋|見面|拜訪/.test(summary);
  const waitingKind = hasOwner ? "等待屋主" : hasLoan ? "等待貸款" : /回覆|等待/.test(summary) ? "等待買方" : undefined;

  return {
    id: crypto.randomUUID(),
    person,
    journey: hasOwner ? "屋主旅程" : "買方旅程",
    stage: hasAppointment ? "見面談" : waitingKind ? waitingKind : "AI 摘要更新",
    nextStep: summary.match(/下一步[:：]\s*([^。|\n]+)/)?.[1] || "依 AI 摘要安排下一步",
    reason: `AI 摘要顯示此 Journey 有 ${probability}% 成交機會，值得今天優先推進。`,
    risk: waitingKind ? "等待太久會讓成交進度卡住。" : "如果今天沒有行動，熱度可能下降。",
    estimatedDealValue: value,
    priorityScore: Math.min(99, probability + (hasAppointment ? 10 : 0) + (waitingKind ? 5 : 0)),
    eventKind: hasAppointment ? "見面談" : waitingKind === "等待屋主" ? "屋主等待回覆" : waitingKind ? "買方等待回覆" : undefined,
    waitingKind,
    status: waitingKind ? "waiting" : "active",
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

  function syncSummary(summary: string, source: AiInboxItem["source"]) {
    const inboxItem: AiInboxItem = {
      id: crypto.randomUUID(),
      source,
      summary,
      createdAt: new Date().toISOString(),
      synced: true,
    };
    setInbox((current) => [inboxItem, ...current]);
    setJourneys((current) => [createJourneyFromSummary(summary), ...current]);
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
        <p>房仲每天不是缺資料，而是缺注意力。</p>
        <h1>今天要先做什麼？</h1>
        <span>依成交價值排序，先推進最接近成交的 Journey。</span>
        <button className="primary-command" onClick={() => setShowInbox(true)}><CirclePlus />貼上 AI 摘要</button>
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
          <span><strong>等待同步</strong><small>貼上 ChatGPT 摘要，MG-AIOS 自動產生 Journey。</small></span>
        </button>
      </section>

      {showInbox && <InboxSheet onClose={() => setShowInbox(false)} onSubmit={syncSummary} />}
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

function InboxSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (summary: string, source: AiInboxItem["source"]) => void }) {
  const [source, setSource] = useState<AiInboxItem["source"]>("ChatGPT");
  const [summary, setSummary] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!summary.trim()) return;
    onSubmit(summary.trim(), source);
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet inbox-compose" onSubmit={submit}>
        <div className="sheet-handle" />
        <header>
          <div><p>AI Inbox</p><h2>同步 AI 摘要</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X /></button>
        </header>
        <label><span>來源</span><select value={source} onChange={(event) => setSource(event.target.value as AiInboxItem["source"])}>{["ChatGPT", "Gemini", "Claude", "Codex", "其他"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>AI 摘要</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="貼上 ChatGPT 已整理好的摘要，例如：Claire 成交率82%，下一步：確認7/14看屋，預估1500萬..." /></label>
        <p>目前先用本機規則解析，不串 API。MG-AIOS 不要求重新填 CRM 欄位。</p>
        <button className="sheet-submit" type="submit" disabled={!summary.trim()}>同步到首頁</button>
      </form>
    </div>
  );
}
