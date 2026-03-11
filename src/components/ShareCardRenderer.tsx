"use client";

import type { Film, Screening, Venue } from "@/lib/types";

function formatDateShort(dateStr: string, locale: "en" | "zh"): string {
  const date = new Date(dateStr + "T00:00:00");
  if (locale === "zh") {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`;
  }
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
}

interface ScreeningItem {
  screening: Screening;
  film: Film;
  venue: Venue | undefined;
}

interface Props {
  screenings: Screening[];
  films: Film[];
  venues: Venue[];
  selectedIds: string[]; // top 5 screening IDs
  ticketQuantities: Record<string, number>;
  locale: "en" | "zh";
  totalScreenings: number;
  totalDays: number;
  totalTickets: number;
}

export default function ShareCardRenderer({
  screenings,
  films,
  venues,
  selectedIds,
  ticketQuantities,
  locale,
  totalScreenings,
  totalDays,
  totalTickets,
}: Props) {
  const screeningMap = new Map(screenings.map((s) => [s.id, s]));
  const filmMap = new Map(films.map((f) => [f.id, f]));
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  const items: ScreeningItem[] = selectedIds
    .map((id) => {
      const screening = screeningMap.get(id);
      if (!screening) return null;
      const film = filmMap.get(screening.filmId);
      if (!film) return null;
      return { screening, film, venue: venueMap.get(screening.venueId) };
    })
    .filter((x): x is ScreeningItem => x !== null);

  // Sort by date then time
  items.sort((a, b) => {
    const dc = a.screening.date.localeCompare(b.screening.date);
    if (dc !== 0) return dc;
    return a.screening.time.localeCompare(b.screening.time);
  });

  const row1 = items.slice(0, 3);
  const row2 = items.slice(3, 5);

  const statsText =
    locale === "zh"
      ? `${totalScreenings} 場放映 · ${totalDays} 天 · ${totalTickets} 張票`
      : `${totalScreenings} screenings · ${totalDays} days · ${totalTickets} tickets`;

  return (
    <div
      id="share-card"
      style={{
        width: 1080,
        height: 1920,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        padding: "72px 72px",
        fontFamily: "'DM Sans', sans-serif",
        position: "absolute",
        left: "-9999px",
        top: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ color: "#FFFFFF", fontSize: 48, fontWeight: 700, letterSpacing: 2 }}>
            HKIFF
          </span>
          <span style={{ color: "#DC2626", fontSize: 48, fontWeight: 700 }}>50</span>
        </div>
        <span style={{ color: "#666666", fontSize: 28, fontWeight: 500 }}>
          {locale === "zh" ? "我的排片計劃" : "MY PLAN"}
        </span>
      </div>

      {/* Red divider */}
      <div style={{ width: "100%", height: 2, background: "#DC2626", marginTop: 20, marginBottom: 28 }} />

      {/* "MY TOP 5" label */}
      <div style={{ color: "#555555", fontSize: 24, fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>
        {locale === "zh" ? "精選 5 部" : "MY TOP 5"}
      </div>

      {/* Poster grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {/* Row 1: up to 3 posters */}
        <div style={{ display: "flex", gap: 16 }}>
          {row1.map(({ film }) => (
            <div key={film.id} style={{ width: 290, height: 410, borderRadius: 12, overflow: "hidden", background: "#1A1A1A" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={film.posterUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </div>
        {/* Row 2: up to 2 posters */}
        {row2.length > 0 && (
          <div style={{ display: "flex", gap: 16 }}>
            {row2.map(({ film }) => (
              <div key={film.id} style={{ width: 290, height: 410, borderRadius: 12, overflow: "hidden", background: "#1A1A1A" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={film.posterUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  crossOrigin="anonymous"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Numbered film list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 36 }}>
        {items.map(({ screening, film }, i) => (
          <div
            key={screening.id}
            style={{ display: "flex", gap: 16, alignItems: "baseline", width: "100%" }}
          >
            <span
              style={{
                color: "#DC2626",
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                width: 56,
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 700 }}>
              {film.title[locale]}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                color: "#777777",
                fontSize: 22,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                flexShrink: 0,
              }}
            >
              {formatDateShort(screening.date, locale)} {screening.time}
            </span>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 200, height: 2, background: "#333333" }} />
        <span style={{ color: "#666666", fontSize: 24, textAlign: "center" }}>{statsText}</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ color: "#999999", fontSize: 28 }}>
            {locale === "zh" ? "建立你的排片計劃" : "Build your plan at"}
          </span>
          <span style={{ color: "#DC2626", fontSize: 34, fontWeight: 700 }}>
            hkiff.herballemon.dev
          </span>
        </div>
      </div>
    </div>
  );
}
