"use client";

import { useTranslations } from "next-intl";
import { usePlan } from "@/components/PlanContext";
import { getFilm, getScreening, getVenue } from "@/lib/data";
import type { Screening } from "@/lib/types";

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface Props {
  screenings: Screening[];
  locale: "en" | "zh";
  filmId: string;
}

export default function ScreeningsList({ screenings, locale, filmId }: Props) {
  const t = useTranslations("plan");
  const { isSelected, addScreening, removeScreening, getConflictsFor, hasDuplicateFilm } =
    usePlan();

  if (screenings.length === 0) {
    return (
      <p className="text-neutral-500 text-sm">
        {locale === "en" ? "No screenings scheduled." : "暫無放映場次。"}
      </p>
    );
  }

  const film = getFilm(filmId);

  return (
    <div className="space-y-3">
      {screenings.map((s) => {
        const venue = getVenue(s.venueId);
        const selected = isSelected(s.id);
        const conflictIds = getConflictsFor(s.id);
        const duplicate = !selected && hasDuplicateFilm(s.id);

        const startMin = timeToMinutes(s.time);
        const endTime = film ? minutesToTime(startMin + (film.runtime ?? 0)) : null;

        return (
          <div key={s.id} className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {s.date} · {s.time}{endTime ? `–${endTime}` : ""}
                </p>
                <p className="text-neutral-500 text-xs">
                  {venue?.name[locale] ?? s.venueId} · [{s.screeningCode}]
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.ticketUrl && (
                  <a
                    href={s.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {locale === "en" ? "Tickets ↗" : "購票 ↗"}
                  </a>
                )}
                <button
                  onClick={() =>
                    selected ? removeScreening(s.id) : addScreening(s.id)
                  }
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    selected
                      ? "bg-neutral-200 text-neutral-700 hover:bg-red-100 hover:text-red-700"
                      : "bg-neutral-800 text-white hover:bg-black"
                  }`}
                >
                  {selected ? t("selected") : t("addToPlan")}
                </button>
              </div>
            </div>

            {/* Conflict warnings (shown when this screening conflicts with plan entries) */}
            {conflictIds.length > 0 && (
              <div className="mt-2 space-y-1">
                {conflictIds.map((conflictId) => {
                  const conflictScreening = getScreening(conflictId);
                  const conflictFilm = conflictScreening
                    ? getFilm(conflictScreening.filmId)
                    : undefined;
                  const conflictTitle = conflictFilm?.title[locale] ?? conflictId;
                  return (
                    <p key={conflictId} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      ⚠ {t("conflictWith", { title: conflictTitle })}
                    </p>
                  );
                })}
              </div>
            )}

            {/* Same-film duplicate warning */}
            {duplicate && (
              <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                ℹ {t("duplicateFilm")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
