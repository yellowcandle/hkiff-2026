"use client";

import type { Film, Screening, Venue } from "@/lib/types";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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

// Dynamic sizing tiers based on screening count
function getSizeTier(count: number) {
  if (count <= 4) return { title: 48, time: 48, venue: 32, dateHead: 40, dayGap: 64, rowGap: 24 };
  if (count <= 7) return { title: 42, time: 42, venue: 28, dateHead: 36, dayGap: 48, rowGap: 20 };
  if (count <= 10) return { title: 36, time: 36, venue: 24, dateHead: 34, dayGap: 32, rowGap: 12 };
  if (count <= 14) return { title: 30, time: 30, venue: 20, dateHead: 28, dayGap: 24, rowGap: 10 };
  return { title: 26, time: 26, venue: 18, dateHead: 24, dayGap: 18, rowGap: 8 };
}

interface Props {
  screenings: Screening[];
  films: Film[];
  venues: Venue[];
  planIds: string[];
  ticketQuantities: Record<string, number>;
  locale: "en" | "zh";
}

export default function ShareCardRenderer({
  screenings,
  films,
  venues,
  planIds,
  ticketQuantities,
  locale,
}: Props) {
  const screeningMap = new Map(screenings.map((s) => [s.id, s]));
  const filmMap = new Map(films.map((f) => [f.id, f]));
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  // Resolve plan items
  const items: ScreeningItem[] = planIds
    .map((id) => {
      const screening = screeningMap.get(id);
      if (!screening) return null;
      const film = filmMap.get(screening.filmId);
      if (!film) return null;
      return { screening, film, venue: venueMap.get(screening.venueId) };
    })
    .filter((x): x is ScreeningItem => x !== null);

  // Group by date
  const byDate = new Map<string, ScreeningItem[]>();
  for (const item of items) {
    const d = item.screening.date;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(item);
  }

  // Sort: guest attendance first within each day, then by time
  for (const dayItems of byDate.values()) {
    dayItems.sort((a, b) => {
      const aGuest = a.screening.guestAttend ? 0 : 1;
      const bGuest = b.screening.guestAttend ? 0 : 1;
      if (aGuest !== bGuest) return aGuest - bGuest;
      return timeToMinutes(a.screening.time) - timeToMinutes(b.screening.time);
    });
  }

  const sortedDates = [...byDate.keys()].sort();
  const tier = getSizeTier(items.length);

  // Stats
  const totalScreenings = items.length;
  const totalDays = sortedDates.length;
  const totalTickets = items.reduce(
    (sum, item) => sum + (ticketQuantities[item.screening.id] ?? 1),
    0
  );
  const guestCount = items.filter((i) => i.screening.guestAttend).length;

  const statsText =
    locale === "zh"
      ? `${totalScreenings} 場放映 · ${totalDays} 天 · ${totalTickets} 張票${guestCount > 0 ? ` · ${guestCount} 場嘉賓出席` : ""}`
      : `${totalScreenings} screenings · ${totalDays} days · ${totalTickets} tickets${guestCount > 0 ? ` · ${guestCount} with filmmakers` : ""}`;

  const timeWidth = tier.time * 3.5;

  return (
    <div
      id="share-card"
      style={{
        width: 1080,
        height: 1920,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        padding: "100px 72px",
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
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            HKIFF
          </span>
          <span
            style={{
              color: "#DC2626",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            50
          </span>
        </div>
        <span
          style={{
            color: "#666666",
            fontSize: 32,
            fontWeight: 500,
          }}
        >
          {locale === "zh" ? "我的排片計劃" : "MY PLAN"}
        </span>
      </div>

      {/* Red divider */}
      <div
        style={{
          width: "100%",
          height: 2,
          background: "#DC2626",
          marginTop: 32,
          marginBottom: 48,
        }}
      />

      {/* Screenings list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: tier.dayGap,
          flex: "0 0 auto",
        }}
      >
        {sortedDates.map((date) => {
          const dayItems = byDate.get(date)!;
          return (
            <div
              key={date}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: tier.rowGap,
              }}
            >
              {/* Date heading */}
              <div
                style={{
                  color: "#DC2626",
                  fontSize: tier.dateHead,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {formatDateShort(date, locale)}
              </div>

              {/* Screening rows */}
              {dayItems.map(({ screening, film, venue }) => {
                const qty = ticketQuantities[screening.id] ?? 1;
                return (
                  <div
                    key={screening.id}
                    style={{
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Time (monospace, fixed width) */}
                    <span
                      style={{
                        color: "#999999",
                        fontSize: tier.time,
                        fontWeight: 500,
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        fontVariantNumeric: "tabular-nums",
                        width: timeWidth,
                        flexShrink: 0,
                      }}
                    >
                      {screening.time}
                    </span>

                    {/* Film info */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {/* Title + quantity */}
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#FFFFFF",
                            fontSize: tier.title,
                            fontWeight: 700,
                          }}
                        >
                          {film.title[locale]}
                        </span>
                        {qty > 1 && (
                          <span
                            style={{
                              color: "#DC2626",
                              fontSize: tier.title * 0.83,
                              fontWeight: 700,
                            }}
                          >
                            ×{qty}
                          </span>
                        )}
                      </div>

                      {/* Venue */}
                      {venue && (
                        <span
                          style={{
                            color: "#777777",
                            fontSize: tier.venue,
                            fontWeight: 400,
                          }}
                        >
                          {venue.name[locale]}
                        </span>
                      )}

                      {/* Guest attendance badge */}
                      {screening.guestAttend && (
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            marginTop: 4,
                          }}
                        >
                          <span style={{ fontSize: tier.venue * 0.9 }}>
                            🎬
                          </span>
                          <span
                            style={{
                              color: "#A855F7",
                              fontSize: tier.venue * 0.94,
                              fontWeight: 600,
                            }}
                          >
                            {locale === "zh"
                              ? "製作人／影評人將出席"
                              : "Filmmaker will attend"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 260,
            height: 2,
            background: "#333333",
          }}
        />
        <span
          style={{
            color: "#666666",
            fontSize: 28,
            textAlign: "center",
          }}
        >
          {statsText}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 16,
          }}
        >
          <span
            style={{
              color: "#999999",
              fontSize: 32,
            }}
          >
            {locale === "zh" ? "建立你的排片計劃" : "Build your plan at"}
          </span>
          <span
            style={{
              color: "#DC2626",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            hkiff.herballemon.dev
          </span>
        </div>
      </div>
    </div>
  );
}
