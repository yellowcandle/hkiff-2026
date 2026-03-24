"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getFilm, getScreening, getScreeningDuration } from "@/lib/data";
import {
  loadStorage,
  saveStorage,
  planIds,
  ticketQuantitiesMap,
  TimestampedItem,
} from "@/lib/storage";

interface PlanContextValue {
  plan: string[];
  addScreening: (id: string) => void;
  removeScreening: (id: string) => void;
  isSelected: (id: string) => boolean;
  getConflictsFor: (id: string) => string[];
  hasDuplicateFilm: (id: string) => boolean;
  getQuantity: (id: string) => number;
  setQuantity: (id: string, qty: number) => void;
  storageError: boolean;
  applyMergedState: (
    plan: Record<string, TimestampedItem>,
    removed: Record<string, TimestampedItem>
  ) => void;
  onPlanChange: (callback: () => void) => () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

function screeningsOverlap(idA: string, idB: string): boolean {
  if (idA === idB) return false;
  const sA = getScreening(idA);
  const sB = getScreening(idB);
  if (!sA || !sB || sA.date !== sB.date) return false;
  const filmA = getFilm(sA.filmId);
  const filmB = getFilm(sB.filmId);
  if (!filmA || !filmB) return false;
  const startA = timeToMinutes(sA.time);
  const endA = startA + getScreeningDuration(sA, filmA);
  const startB = timeToMinutes(sB.time);
  const endB = startB + getScreeningDuration(sB, filmB);
  return startA < endB && startB < endA;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<string[]>([]);
  const [ticketQuantities, setTicketQuantities] = useState<
    Record<string, number>
  >({});
  const [storageError, setStorageError] = useState(false);
  const initialized = useRef(false);
  const skipSyncRef = useRef(false);
  const changeListenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    const data = loadStorage();
    setPlan(planIds(data));
    setTicketQuantities(ticketQuantitiesMap(data));
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const data = loadStorage();

    // Build v3 plan map from current state
    const planMap: Record<string, TimestampedItem> = {};
    for (const id of plan) {
      // Preserve existing timestamps if present, otherwise create new
      if (data.plan[id]) {
        planMap[id] = {
          ...data.plan[id],
          qty: ticketQuantities[id] && ticketQuantities[id] > 1
            ? ticketQuantities[id]
            : undefined,
        };
      } else {
        planMap[id] = {
          at: Date.now(),
          qty: ticketQuantities[id] && ticketQuantities[id] > 1
            ? ticketQuantities[id]
            : undefined,
        };
      }
    }

    const ok = saveStorage({ ...data, plan: planMap });
    if (!ok) {
      setStorageError(true);
      setTimeout(() => setStorageError(false), 3000);
    }

    if (!skipSyncRef.current) {
      changeListenersRef.current.forEach((cb) => cb());
    }
    skipSyncRef.current = false;
  }, [plan, ticketQuantities]);

  const addScreening = useCallback((id: string) => {
    setPlan((prev) => {
      if (prev.includes(id)) return prev;
      // Write the timestamped entry immediately
      const data = loadStorage();
      data.plan[id] = { at: Date.now() };
      delete data.removed[id];
      saveStorage(data);
      return [...prev, id];
    });
  }, []);

  const removeScreening = useCallback((id: string) => {
    // Move to removed in storage
    const data = loadStorage();
    if (data.plan[id]) {
      data.removed[id] = { at: Date.now() };
      delete data.plan[id];
      saveStorage(data);
    }
    setPlan((prev) => prev.filter((s) => s !== id));
    setTicketQuantities((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: string) => plan.includes(id),
    [plan]
  );

  const getConflictsFor = useCallback(
    (id: string): string[] => {
      return plan.filter((planId) => screeningsOverlap(id, planId));
    },
    [plan]
  );

  const getQuantity = useCallback(
    (id: string): number => ticketQuantities[id] ?? 1,
    [ticketQuantities]
  );

  const setQuantity = useCallback((id: string, qty: number) => {
    const clamped = Math.max(1, Math.min(10, qty));
    setTicketQuantities((prev) => ({ ...prev, [id]: clamped }));
  }, []);

  const hasDuplicateFilm = useCallback(
    (id: string): boolean => {
      const screening = getScreening(id);
      if (!screening) return false;
      return plan.some((planId) => {
        if (planId === id) return false;
        const planScreening = getScreening(planId);
        return planScreening?.filmId === screening.filmId;
      });
    },
    [plan]
  );

  const applyMergedState = useCallback(
    (
      mergedPlan: Record<string, TimestampedItem>,
      mergedRemoved: Record<string, TimestampedItem>
    ) => {
      skipSyncRef.current = true;
      const data = loadStorage();
      data.plan = mergedPlan;
      data.removed = mergedRemoved;
      saveStorage(data);
      setPlan(Object.keys(mergedPlan));
      const quantities: Record<string, number> = {};
      for (const [id, item] of Object.entries(mergedPlan)) {
        if (item.qty && item.qty > 1) quantities[id] = item.qty;
      }
      setTicketQuantities(quantities);
    },
    []
  );

  const onPlanChange = useCallback((callback: () => void) => {
    changeListenersRef.current.add(callback);
    return () => {
      changeListenersRef.current.delete(callback);
    };
  }, []);

  return (
    <PlanContext.Provider
      value={{
        plan,
        addScreening,
        removeScreening,
        isSelected,
        getConflictsFor,
        hasDuplicateFilm,
        getQuantity,
        setQuantity,
        storageError,
        applyMergedState,
        onPlanChange,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
