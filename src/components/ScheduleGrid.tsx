"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlan } from "@/components/PlanContext";
import type { Screening, Venue, Film } from "@/lib/types";

type Props = {
  screenings: Screening[];
  venues: Venue[];
  films: Film[];
  date: string;
};

export default function ScheduleGrid({ screenings, venues, films, date }: Props) {
  const locale = useLocale() as "en" | "zh";
  const { plan } = usePlan();

  const filtered = date
    ? screenings.filter((s) => s.date === date)
    : screenings;

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-neutral-100">
            <th className="text-left px-4 py-3 font-semibold border border-neutral-200 w-48">
              {locale === "en" ? "Venue" : "場地"}
            </th>
            <th className="text-left px-4 py-3 font-semibold border border-neutral-200">
              {locale === "en" ? "Screenings" : "放映場次"}
            </th>
          </tr>
        </thead>
        <tbody>
          {activeVenues.map((venue, vi) => (
            <tr key={venue.id} className={`align-top ${vi % 2 === 1 ? "bg-neutral-50/50" : ""}`}>
              <td className="px-4 py-3 border border-neutral-200 font-medium bg-neutral-50">
                <span className="text-[11px] font-mono font-bold text-neutral-400 block">{venue.code}</span>
                {venue.name[locale]}
              </td>
              <td className="px-4 py-3 border border-neutral-200">
                <div className="flex flex-wrap gap-2">
                  {byVenue[venue.id]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((s) => {
                      const film = films.find((f) => f.id === s.filmId);
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
                    })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
