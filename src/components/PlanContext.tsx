"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getFilm, getScreening } from "@/lib/data";
import { loadStorage, saveStorage } from "@/lib/storage";

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
  const endA = startA + (filmA.runtime ?? 0);
  const startB = timeToMinutes(sB.time);
  const endB = startB + (filmB.runtime ?? 0);
  return startA < endB && startB < endA;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<string[]>([]);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [storageError, setStorageError] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const data = loadStorage();
    setPlan(data.plan);
    setTicketQuantities(data.ticketQuantities || {});
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const data = loadStorage();
    const ok = saveStorage({ ...data, plan, ticketQuantities });
    if (!ok) {
      setStorageError(true);
      setTimeout(() => setStorageError(false), 3000);
    }
  }, [plan, ticketQuantities]);

  const addScreening = useCallback((id: string) => {
    setPlan((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeScreening = useCallback((id: string) => {
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
