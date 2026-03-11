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
}

export default function ShareCardRenderer({
  screenings,
  films,
  venues,
  selectedIds,
  ticketQuantities,
  locale,
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

  // Adaptive poster layout based on count
  const count = items.length;
  let posterRows: ScreeningItem[][];
  let posterWidth: number;
  let posterHeight: number;

  if (count === 1) {
    posterRows = [items];
    posterWidth = 600;
    posterHeight = 850;
  } else if (count === 2) {
    posterRows = [items];
    posterWidth = 452;
    posterHeight = 640;
  } else if (count === 3) {
    posterRows = [items];
    posterWidth = 290;
    posterHeight = 520;
  } else if (count === 4) {
    posterRows = [items.slice(0, 2), items.slice(2, 4)];
    posterWidth = 452;
    posterHeight = 640;
  } else {
    // 5 picks — 3+2 grid with taller posters
    posterRows = [items.slice(0, 3), items.slice(3, 5)];
    posterWidth = 290;
    posterHeight = 520;
  }

  // Dynamic subtitle
  const subtitleText =
    locale === "zh"
      ? `HKIFF 50 精選${count === 1 ? "" : ` ${count} 部`}`
      : count === 1
      ? "HKIFF 50 TOP PICK"
      : `HKIFF 50 TOP ${count} PICKS`;

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

      {/* Dynamic subtitle label */}
      <div style={{ color: "#555555", fontSize: 24, fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>
        {subtitleText}
      </div>

      {/* Poster grid with overlaid titles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {posterRows.map((row, rowIdx) => {
          const prevRowsCount = posterRows.slice(0, rowIdx).reduce((s, r) => s + r.length, 0);
          return row.length > 0 ? (
            <div key={rowIdx} style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {row.map(({ film, screening }, colIdx) => {
                const idx = prevRowsCount + colIdx;
                return (
                  <div
                    key={screening.id}
                    style={{
                      width: posterWidth,
                      height: posterHeight,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#1A1A1A",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={film.posterUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      crossOrigin="anonymous"
                    />
                    {/* Gradient scrim */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "60%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
                      }}
                    />
                    {/* Number badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "#DC2626",
                        color: "#FFFFFF",
                        fontSize: 20,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    {/* Title + date overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "16px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: count <= 2 ? 30 : 26,
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {film.title[locale]}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: 18,
                          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        }}
                      >
                        {formatDateShort(screening.date, locale)} {screening.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null;
        })}
      </div>

      {/* Schedule strip */}
      <div
        style={{
          background: "#111111",
          borderRadius: 12,
          padding: "24px 28px",
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
        }}
      >
        {items.map(({ film, screening }, idx) => (
          <div key={screening.id} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <span
              style={{
                color: "#666666",
                fontSize: 20,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                minWidth: 280,
              }}
            >
              {formatDateShort(screening.date, locale)} {screening.time}
            </span>
            <span style={{ color: "#CCCCCC", fontSize: 20, fontWeight: 600 }}>
              {film.title[locale]}
            </span>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 200, height: 2, background: "#333333" }} />
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
