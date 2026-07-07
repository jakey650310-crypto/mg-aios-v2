"use client";

import { ArrowLeft, CheckCircle2, CirclePlus, ClipboardList, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedProductBacklog } from "@/lib/seed";
import type { BacklogStatus, ImpactLevel, ProductBacklogItem } from "@/lib/types";

const BACKLOG_KEY = "mgAiosProductBacklog";

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
    // Keep the backlog usable even when localStorage is unavailable.
  }
}

const statusOrder: Record<BacklogStatus, number> = {
  "開發中": 0,
  "待做": 1,
  "完成": 2,
};

const impactOrder: Record<ImpactLevel, number> = {
  "高": 0,
  "中": 1,
  "低": 2,
};

export function ProductBacklog() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ProductBacklogItem[]>(seedProductBacklog);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setItems(loadStorage(BACKLOG_KEY, seedProductBacklog));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveStorage(BACKLOG_KEY, items);
  }, [items, ready]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return statusOrder[a.status] - statusOrder[b.status]
        || impactOrder[a.impact] - impactOrder[b.impact]
        || b.discoveredDate.localeCompare(a.discoveredDate);
    });
  }, [items]);

  function addItem(item: Omit<ProductBacklogItem, "id">) {
    setItems((current) => [{ ...item, id: crypto.randomUUID() }, ...current]);
    setShowForm(false);
  }

  function updateStatus(id: string, status: BacklogStatus) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  if (!ready) {
    return <div className="loading-screen"><LoaderCircle className="animate-spin" /><span>載入 Product Backlog</span></div>;
  }

  return (
    <main className="app-shell backlog-shell">
      <header className="topbar">
        <Link className="icon-button" href="/" aria-label="回首頁"><ArrowLeft /></Link>
        <div className="brand-copy">
          <strong>Product Backlog</strong>
          <span>摩擦驅動開發</span>
        </div>
        <button className="icon-button" onClick={() => setShowForm(true)} aria-label="新增摩擦點"><CirclePlus /></button>
      </header>

      <section className="backlog-hero">
        <p>Friction Driven Development</p>
        <h1>先消除摩擦，再新增功能。</h1>
        <span>任何新功能都必須先回答：它是否能消除一個已經存在的摩擦？如果不能，就先不要開發。</span>
        <button className="primary-command" onClick={() => setShowForm(true)}><CirclePlus />記錄摩擦點</button>
      </section>

      <section className="decision-section">
        <div className="section-heading decision-heading">
          <span className="decision-heading-icon"><ClipboardList /></span>
          <div>
            <p>下一個 Daily Build 優先處理高影響摩擦</p>
            <h2>產品待辦<b>{items.length}</b></h2>
          </div>
        </div>

        <div className="backlog-list">
          {sortedItems.map((item) => (
            <BacklogCard key={item.id} item={item} onStatusChange={updateStatus} />
          ))}
        </div>
      </section>

      {showForm && <BacklogForm onClose={() => setShowForm(false)} onSubmit={addItem} />}
    </main>
  );
}

function BacklogCard({ item, onStatusChange }: { item: ProductBacklogItem; onStatusChange: (id: string, status: BacklogStatus) => void }) {
  return (
    <article className={`backlog-card impact-${item.impact}`}>
      <div className="backlog-card-head">
        <strong>{item.friction}</strong>
        <span>{item.impact}影響</span>
      </div>
      <dl>
        <div><dt>發現日期</dt><dd>{item.discoveredDate}</dd></div>
        <div><dt>解決方案</dt><dd>{item.solution}</dd></div>
        <div><dt>狀態</dt><dd>{item.status}</dd></div>
      </dl>
      <div className="backlog-actions">
        {(["待做", "開發中", "完成"] as BacklogStatus[]).map((status) => (
          <button key={status} className={item.status === status ? "active" : ""} onClick={() => onStatusChange(item.id, status)}>
            {status === "完成" && <CheckCircle2 />}
            {status}
          </button>
        ))}
      </div>
    </article>
  );
}

function BacklogForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (item: Omit<ProductBacklogItem, "id">) => void }) {
  const [friction, setFriction] = useState("");
  const [discoveredDate, setDiscoveredDate] = useState(todayValue());
  const [impact, setImpact] = useState<ImpactLevel>("高");
  const [solution, setSolution] = useState("");
  const [status, setStatus] = useState<BacklogStatus>("待做");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!friction.trim() || !solution.trim()) return;
    onSubmit({
      friction: friction.trim(),
      discoveredDate,
      impact,
      solution: solution.trim(),
      status,
    });
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="bottom-sheet backlog-form" onSubmit={submit}>
        <div className="sheet-handle" />
        <header>
          <div><p>Product Backlog</p><h2>新增摩擦點</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X /></button>
        </header>

        <label>
          <span>摩擦點</span>
          <textarea value={friction} onChange={(event) => setFriction(event.target.value)} placeholder="使用時發現什麼麻煩？例如：早上打開首頁，看不出今天最該先聯絡誰。" />
        </label>

        <div className="backlog-form-grid">
          <label>
            <span>發現日期</span>
            <input type="date" value={discoveredDate} onChange={(event) => setDiscoveredDate(event.target.value)} />
          </label>
          <label>
            <span>影響成交程度</span>
            <select value={impact} onChange={(event) => setImpact(event.target.value as ImpactLevel)}>
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
          </label>
        </div>

        <label>
          <span>解決方案</span>
          <textarea value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="下一個 Daily Build 要怎麼降低這個摩擦？" />
        </label>

        <label>
          <span>狀態</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as BacklogStatus)}>
            <option>待做</option>
            <option>開發中</option>
            <option>完成</option>
          </select>
        </label>

        <button className="sheet-submit" type="submit" disabled={!friction.trim() || !solution.trim()}>加入產品待辦</button>
      </form>
    </div>
  );
}
