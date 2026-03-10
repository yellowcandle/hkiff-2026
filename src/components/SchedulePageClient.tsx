"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Screening, Venue, Film } from "@/lib/types";
import ScheduleGrid from "./ScheduleGrid";

type Props = {
  screenings: Screening[];
  venues: Venue[];
  films: Film[];
  dates: string[];
};

function formatDateButton(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00");
  if (locale === "zh") {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`;
  }
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function SchedulePageClient({ screenings, venues, films, dates }: Props) {
  const t = useTranslations("schedule");
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedDate === date
                ? "bg-black text-white border-black"
                : "border-neutral-300 hover:border-black"
            }`}
          >
            {formatDateButton(date, locale)}
          </button>
        ))}
      </div>

      <ScheduleGrid
        screenings={screenings}
        venues={venues}
        films={films}
        date={selectedDate}
      />
    </div>
  );
}
