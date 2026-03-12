"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlan } from "@/components/PlanContext";
import { buildExportText } from "@/components/PlanExport";
import { generateIcsForPlan, generateIcsForScreening, downloadIcsFile } from "@/lib/icsCalendar";
import ShareCardRenderer from "@/components/ShareCardRenderer";
import { useShareImage } from "@/lib/useShareImage";
import type { Film, Screening, Venue } from "@/lib/types";

interface Props {
  screenings: Screening[];
  films: Film[];
  venues: Venue[];
  locale: "en" | "zh";
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateHeading(dateStr: string, locale: "en" | "zh"): string {
  const date = new Date(dateStr + "T00:00:00");
  if (locale === "zh") {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return `${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
  }
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function PlanPageClient({ screenings, films, venues, locale }: Props) {
  const t = useTranslations("plan");
  const { plan, removeScreening, getConflictsFor, getQuantity, setQuantity } = usePlan();
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const { generateImage, isGenerating } = useShareImage();
  const [showPicker, setShowPicker] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  const screeningMap = new Map(screenings.map((s) => [s.id, s]));
  const filmMap = new Map(films.map((f) => [f.id, f]));
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  // Resolve plan items, skipping stale IDs (task 6.6)
  const planItems = plan
    .map((id) => {
      const screening = screeningMap.get(id);
      if (!screening) return null;
      const film = filmMap.get(screening.filmId);
      if (!film) return null;
      return { id, screening, film, venue: venueMap.get(screening.venueId) };
    })
    .filter(
      (x): x is { id: string; screening: Screening; film: Film; venue: Venue | undefined } =>
        x !== null
    );

  // Group by date
  const byDate = new Map<string, typeof planItems>();
  for (const item of planItems) {
    const d = item.screening.date;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(item);
  }
  for (const dayItems of byDate.values()) {
    dayItems.sort(
      (a, b) =>
        timeToMinutes(a.screening.time) - timeToMinutes(b.screening.time)
    );
  }
  const sortedDates = [...byDate.keys()].sort();

  // Detect duplicate films (same film added more than once)
  const filmCountInPlan = new Map<string, number>();
  for (const item of planItems) {
    filmCountInPlan.set(item.film.id, (filmCountInPlan.get(item.film.id) ?? 0) + 1);
  }
  const duplicateFilmIds = new Set(
    [...filmCountInPlan.entries()].filter(([, count]) => count > 1).map(([id]) => id)
  );

  // Share/export handler
  async function handleShare() {
    setShareError(false);
    try {
      const quantities: Record<string, number> = {};
      for (const id of plan) {
        quantities[id] = getQuantity(id);
      }
      const text = buildExportText(plan, screenings, films, venues, locale, quantities);
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled share (DOMException: AbortError) — not an error
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareError(true);
      setTimeout(() => setShareError(false), 3000);
    }
  }

  // Empty state
  if (planItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 mb-6">{t("empty")}</p>
        <Link
          href="/films"
          className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {t("browseFilms")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Share/Export buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-6">
        <button
          onClick={() => {
            // Auto-select first 5 if nothing picked yet
            if (pickedIds.length === 0) {
              setPickedIds(planItems.slice(0, 5).map((i) => i.id));
            }
            setShowPicker(true);
          }}
          disabled={isGenerating || planItems.length === 0}
          className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          {isGenerating ? t("generating") : t("shareImage")}
        </button>
        <button
          onClick={() => {
            const items = planItems.map(({ screening, film, venue }) => ({
              screening, film, venue,
            }));
            const ics = generateIcsForPlan(items, locale);
            downloadIcsFile(ics, "hkiff50-plan.ics");
          }}
          disabled={planItems.length === 0}
          className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40"
        >
          {t("addToCalendar")}
        </button>
        <button
          onClick={handleShare}
          disabled={planItems.length === 0}
          className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40"
        >
          {shareError ? "Failed to copy" : copied ? t("copied") : t("share")}
        </button>
      </div>

      {/* Top 5 Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">{t("pickTop5Title")}</h3>
              <p className="text-sm text-neutral-500 mt-1">
                {t("pickTop5Desc", { count: pickedIds.length })}
              </p>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {planItems.map((item) => {
                const isSelected = pickedIds.includes(item.id);
                const maxPicks = Math.min(5, planItems.length);
                const canSelect = pickedIds.length < maxPicks || isSelected;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isSelected) {
                        setPickedIds((prev) => prev.filter((id) => id !== item.id));
                      } else if (canSelect) {
                        setPickedIds((prev) => [...prev, item.id]);
                      }
                    }}
                    disabled={!canSelect && !isSelected}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-red-50 border border-red-200"
                        : canSelect
                        ? "hover:bg-neutral-50 border border-transparent"
                        : "opacity-40 border border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.film.posterUrl}
                      alt=""
                      className="w-10 h-14 rounded object-cover bg-neutral-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {item.film.title[locale]}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.screening.date} · {item.screening.time}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-red-600 border-red-600 text-white"
                          : "border-neutral-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-xs font-bold">
                          {pickedIds.indexOf(item.id) + 1}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  setShowPicker(false);
                  generateImage();
                }}
                disabled={pickedIds.length === 0 || isGenerating}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {isGenerating ? t("generating") : t("generateImage")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date sections */}
      <div className="space-y-8">
        {sortedDates.map((date) => {
          const dayItems = byDate.get(date)!;
          const conflictCount = dayItems.filter((item) =>
            getConflictsFor(item.id).length > 0
          ).length;

          return (
            <section key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-semibold text-lg">
                  {formatDateHeading(date, locale)}
                </h2>
                {conflictCount > 0 && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    ⚠ {conflictCount} {t("conflict")}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {dayItems.map((item) => {
                  const { id, screening, film, venue } = item;
                  const startMin = timeToMinutes(screening.time);
                  const endTime = minutesToTime(startMin + (film.runtime ?? 0));
                  const conflictIds = getConflictsFor(id);
                  const hasConflict = conflictIds.length > 0;

                  return (
                    <div
                      key={id}
                      className={`flex items-start justify-between rounded-lg px-4 py-3 border ${
                        hasConflict
                          ? "border-amber-300 bg-amber-50"
                          : "border-neutral-200 bg-neutral-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-neutral-700">
                            {screening.time}–{endTime}
                          </span>
                          {hasConflict && (
                            <span className="text-xs text-amber-700">⚠</span>
                          )}
                          <span className="text-xs text-neutral-400 font-mono">
                            [{screening.screeningCode}]
                          </span>
                        </div>
                        <p className="font-semibold text-sm mt-0.5 truncate">
                          {film.title[locale]}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {venue?.name[locale] ?? screening.venueId}
                        </p>

                        {/* Duplicate film warning */}
                        {duplicateFilmIds.has(film.id) && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠ {t("duplicateFilm")}
                          </p>
                        )}

                        {/* Conflict details */}
                        {conflictIds.map((cId) => {
                          const cScreening = screeningMap.get(cId);
                          const cFilm = cScreening
                            ? filmMap.get(cScreening.filmId)
                            : undefined;
                          return cFilm ? (
                            <p
                              key={cId}
                              className="text-xs text-amber-700 mt-1"
                            >
                              {t("conflictWith", { title: cFilm.title[locale] })}
                            </p>
                          ) : null;
                        })}
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        {/* Ticket quantity */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setQuantity(id, getQuantity(id) - 1)}
                            disabled={getQuantity(id) <= 1}
                            className="w-6 h-6 rounded text-xs font-bold border border-neutral-300 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            aria-label={t("decreaseTickets")}
                          >
                            −
                          </button>
                          <span className="text-sm font-medium tabular-nums w-5 text-center">
                            {getQuantity(id)}
                          </span>
                          <button
                            onClick={() => setQuantity(id, getQuantity(id) + 1)}
                            disabled={getQuantity(id) >= 10}
                            className="w-6 h-6 rounded text-xs font-bold border border-neutral-300 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            aria-label={t("increaseTickets")}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            const ics = generateIcsForScreening(screening, film, venue, locale);
                            downloadIcsFile(ics, `hkiff50-${screening.screeningCode}.ics`);
                          }}
                          aria-label={t("addToCalendarSingle")}
                          title={t("addToCalendarSingle")}
                          className="text-neutral-400 hover:text-blue-600 transition-colors leading-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4H17a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.25V2.75A.75.75 0 0 1 5.75 2zM4 7.5v8.5h12V7.5H4z" clipRule="evenodd" />
                          </svg>
                        </button>

                        <button
                          onClick={() => removeScreening(id)}
                          aria-label={t("removeScreening")}
                          className="text-neutral-400 hover:text-red-600 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Hidden share card for image generation */}
      <ShareCardRenderer
        screenings={screenings}
        films={films}
        venues={venues}
        selectedIds={pickedIds}
        ticketQuantities={Object.fromEntries(
          plan.map((id) => [id, getQuantity(id)])
        )}
        locale={locale}
      />
    </div>
  );
}
