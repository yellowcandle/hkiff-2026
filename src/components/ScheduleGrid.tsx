"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlan } from "@/components/PlanContext";
import type { Screening, Venue, Film } from "@/lib/types";
import { getScreeningDuration } from "@/lib/data";

type Props = {
  screenings: Screening[];
  venues: Venue[];
  films: Film[];
  date: string;
};

// --- Timeline helpers & constants ---
const PX_PER_MIN = 2;
const MIN_BLOCK_HEIGHT = 36;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function ScheduleGrid({ screenings, venues, films, date }: Props) {
  const locale = useLocale() as "en" | "zh";
  const { plan } = usePlan();

  const filtered = date
    ? screenings.filter((s) => s.date === date)
    : screenings;

  // O(1) film lookups
  const filmMap = new Map(films.map((f) => [f.id, f]));

  // Group by venue
  const byVenue = venues.reduce<Record<string, Screening[]>>((acc, v) => {
    acc[v.id] = filtered.filter((s) => s.venueId === v.id);
    return acc;
  }, {});

  const activeVenues = venues.filter((v) => byVenue[v.id]?.length > 0);

  if (filtered.length === 0) {
    return (
      <p className="text-neutral-500 text-center py-16">
        {locale === "en" ? "No screenings on this date." : "該日期沒有放映場次。"}
      </p>
    );
  }

  // --- Day boundary computation for timeline ---
  let dayStartMin = Infinity;
  let dayEndMin = -Infinity;
  for (const s of filtered) {
    const start = timeToMinutes(s.time);
    const film = filmMap.get(s.filmId);
    const runtime = getScreeningDuration(s, film);
    const end = start + runtime;
    if (start < dayStartMin) dayStartMin = start;
    if (end > dayEndMin) dayEndMin = end;
  }
  // Round to 30-min boundaries
  dayStartMin = Math.floor(dayStartMin / 30) * 30;
  dayEndMin = Math.ceil(dayEndMin / 30) * 30;

  // Generate time markers every 30 minutes
  const timeMarkers: { minutes: number; label: string; isHour: boolean }[] = [];
  for (let m = dayStartMin; m <= dayEndMin; m += 30) {
    timeMarkers.push({ minutes: m, label: minutesToTime(m), isHour: m % 60 === 0 });
  }

  const timelineHeight = (dayEndMin - dayStartMin) * PX_PER_MIN;

  const renderScreeningPill = (s: Screening) => {
    const film = filmMap.get(s.filmId);
    const isPlanned = plan.includes(s.id);
    return (
      <Link
        key={s.id}
        href={`/films/${s.filmId}`}
        className={`block border rounded-lg px-3 py-2 transition-colors ${
          isPlanned
            ? "bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
            : "bg-red-50 border-red-200 hover:bg-red-100"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <p className={`font-mono font-medium text-xs ${isPlanned ? "text-emerald-700" : "text-red-700"}`}>
            {s.time}
          </p>
          {isPlanned && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
              {locale === "en" ? "Plan" : "已選"}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-700 mt-0.5 max-w-[160px] line-clamp-2">
          {film?.title[locale] ?? s.filmId}
        </p>
        {s.guestAttend && (
          <p className="text-[10px] text-purple-600 mt-0.5">🎬 {locale === "en" ? "Guest" : "出席"}</p>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden space-y-4">
        {activeVenues.map((venue) => (
          <div key={venue.id} className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
              <span className="text-[11px] font-mono font-bold text-neutral-400 block">{venue.code}</span>
              <span className="font-medium text-sm">{venue.name[locale]}</span>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {byVenue[venue.id]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(renderScreeningPill)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: timeline grid */}
      <div className="hidden md:block overflow-x-auto border border-neutral-200 rounded-lg">
        <div className="max-h-[80vh] overflow-y-auto">
          <div
            className="flex"
            style={{ minWidth: activeVenues.length * 160 + 64 }}
          >
            {/* Time axis column */}
            <div className="w-16 flex-shrink-0 bg-neutral-50 border-r border-neutral-200 sticky left-0 z-10">
              {/* Header spacer */}
              <div className="h-10 border-b border-neutral-200" />
              {/* Time labels */}
              <div className="relative" style={{ height: timelineHeight }}>
                {timeMarkers.map((marker) => (
                  <div
                    key={marker.minutes}
                    className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-neutral-500"
                    style={{ top: (marker.minutes - dayStartMin) * PX_PER_MIN }}
                  >
                    {marker.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Venue columns */}
            {activeVenues.map((venue) => (
              <div
                key={venue.id}
                className="flex-1 border-r border-neutral-200 last:border-r-0"
                style={{ minWidth: 140, maxWidth: 200 }}
              >
                {/* Venue header — sticky */}
                <div className="h-10 sticky top-0 z-20 bg-neutral-100 border-b border-neutral-200 px-2 flex flex-col justify-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 leading-none">{venue.code}</span>
                  <span className="text-xs font-medium text-neutral-700 truncate leading-tight">{venue.name[locale]}</span>
                </div>

                {/* Screening blocks */}
                <div className="relative" style={{ height: timelineHeight }}>
                  {/* Grid lines */}
                  {timeMarkers.map((marker) => (
                    <div
                      key={marker.minutes}
                      className={`absolute left-0 right-0 ${marker.isHour ? "border-t border-neutral-200" : "border-t border-dashed border-neutral-100"}`}
                      style={{ top: (marker.minutes - dayStartMin) * PX_PER_MIN }}
                    />
                  ))}

                  {/* Screening blocks */}
                  {byVenue[venue.id]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((s) => {
                      const film = filmMap.get(s.filmId);
                      const runtime = getScreeningDuration(s, film);
                      const hasRuntime = film?.runtime != null || s.duration != null;
                      const isPlanned = plan.includes(s.id);
                      const startMin = timeToMinutes(s.time);
                      const top = (startMin - dayStartMin) * PX_PER_MIN;
                      const height = Math.max(runtime * PX_PER_MIN, MIN_BLOCK_HEIGHT);

                      return (
                        <Link
                          key={s.id}
                          href={`/films/${s.filmId}`}
                          className={`absolute left-1 right-1 rounded overflow-hidden px-1.5 py-1 transition-colors text-left ${
                            isPlanned
                              ? "bg-emerald-50 hover:bg-emerald-100"
                              : "bg-red-50 hover:bg-red-100"
                          } ${hasRuntime
                              ? isPlanned ? "border border-emerald-300" : "border border-red-200"
                              : isPlanned ? "border border-dashed border-emerald-400" : "border border-dashed border-red-300"
                          }`}
                          style={{ top, height }}
                        >
                          <p className={`font-mono text-[10px] font-medium leading-none ${isPlanned ? "text-emerald-700" : "text-red-700"}`}>
                            {s.time}
                            <span className="text-neutral-400 ml-1">
                              {hasRuntime ? `${runtime}m` : "?min"}
                            </span>
                          </p>
                          <p className="text-[11px] text-neutral-800 mt-0.5 line-clamp-2 leading-tight">
                            {film?.title[locale] ?? s.filmId}
                          </p>
                          {isPlanned && (
                            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200 px-1 py-0.5 rounded inline-block mt-0.5">
                              {locale === "en" ? "Plan" : "已選"}
                            </span>
                          )}
                          {s.guestAttend && (
                            <span className="text-[9px] text-purple-600 block mt-0.5">🎬</span>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
