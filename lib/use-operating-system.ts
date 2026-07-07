"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildAiPriorityItems,
  normalizeOperatingSystemState,
  seedOperatingSystem,
} from "./operating-system";
import type { OperatingSystemState } from "./types";

const OPERATING_SYSTEM_KEY = "mgAiosOperatingSystemState";

function loadOperatingState() {
  if (typeof window === "undefined") return seedOperatingSystem;
  try {
    const saved = window.localStorage.getItem(OPERATING_SYSTEM_KEY);
    return saved ? normalizeOperatingSystemState(JSON.parse(saved)) : seedOperatingSystem;
  } catch {
    return seedOperatingSystem;
  }
}

function saveOperatingState(state: OperatingSystemState) {
  try {
    window.localStorage.setItem(OPERATING_SYSTEM_KEY, JSON.stringify(state));
  } catch {
    // Keep the app usable even when localStorage is unavailable.
  }
}

export function useOperatingSystem() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<OperatingSystemState>(seedOperatingSystem);

  useEffect(() => {
    setState(loadOperatingState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveOperatingState(state);
  }, [ready, state]);

  const aiPriorityItems = useMemo(() => buildAiPriorityItems(state), [state]);
  const todayTopFive = useMemo(() => aiPriorityItems.slice(0, 5), [aiPriorityItems]);
  const todayTasks = useMemo(() => state.journeys.filter((journey) => journey.status !== "已完成"), [state.journeys]);
  const todayRepairs = useMemo(() => state.repairs.filter((repair) => repair.status !== "已完成"), [state.repairs]);
  const todayRentals = useMemo(() => state.properties.filter((property) => property.status === "出租中" || property.status === "已出租"), [state.properties]);
  const todayProbability = useMemo(() => {
    if (!state.journeys.length) return 0;
    return Math.round(state.journeys.reduce((sum, journey) => sum + journey.probability, 0) / state.journeys.length);
  }, [state.journeys]);

  return {
    ready,
    state,
    setState,
    aiPriorityItems,
    todayTopFive,
    todayTasks,
    todayRepairs,
    todayRentals,
    todayProbability,
  };
}
