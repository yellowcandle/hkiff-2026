import type { Film, Screening, Venue } from "@/lib/types";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDate(dateStr: string, locale: "en" | "zh"): string {
  const date = new Date(dateStr + "T00:00:00");
  if (locale === "zh") {
    return `${date.getMonth() + 1}月${date.getDate()}日（${["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}）`;
  }
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

interface ExportScreening {
  screening: Screening;
  film: Film;
  venue: Venue | undefined;
}

function hasOverlap(a: ExportScreening, b: ExportScreening): boolean {
  if (a.screening.date !== b.screening.date) return false;
  const startA = timeToMinutes(a.screening.time);
  const endA = startA + (a.film.runtime ?? 0);
  const startB = timeToMinutes(b.screening.time);
  const endB = startB + (b.film.runtime ?? 0);
  return startA < endB && startB < endA;
}

export function buildExportText(
  planIds: string[],
  allScreenings: Screening[],
  allFilms: Film[],
  allVenues: Venue[],
  locale: "en" | "zh"
): string {
  const screeningMap = new Map(allScreenings.map((s) => [s.id, s]));
  const filmMap = new Map(allFilms.map((f) => [f.id, f]));
  const venueMap = new Map(allVenues.map((v) => [v.id, v]));

  const items: ExportScreening[] = planIds
    .map((id) => {
      const screening = screeningMap.get(id);
      if (!screening) return null;
      const film = filmMap.get(screening.filmId);
      if (!film) return null;
      return { screening, film, venue: venueMap.get(screening.venueId) };
    })
    .filter((x): x is ExportScreening => x !== null);

  if (items.length === 0) return "";

  // Group by date
  const byDate = new Map<string, ExportScreening[]>();
  for (const item of items) {
    const d = item.screening.date;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(item);
  }
  // Sort each day by start time
  for (const dayItems of byDate.values()) {
    dayItems.sort(
      (a, b) =>
        timeToMinutes(a.screening.time) - timeToMinutes(b.screening.time)
    );
  }

  // Find all conflicting pairs
  const conflictIds = new Set<string>();
  const allItems = [...items];
  for (let i = 0; i < allItems.length; i++) {
    for (let j = i + 1; j < allItems.length; j++) {
      if (hasOverlap(allItems[i], allItems[j])) {
        conflictIds.add(allItems[i].screening.id);
        conflictIds.add(allItems[j].screening.id);
      }
    }
  }

  const header =
    locale === "zh" ? "我的 HKIFF 50 計劃" : "My HKIFF 50 Plan";
  const bookingLabel =
    locale === "zh" ? "訂票編號" : "Booking codes";
  const divider = "─".repeat(20);

  const lines: string[] = [header, divider, ""];

  const sortedDates = [...byDate.keys()].sort();
  for (const date of sortedDates) {
    const dayItems = byDate.get(date)!;
    const hasConflict = dayItems.some((i) =>
      conflictIds.has(i.screening.id)
    );
    const conflictMark =
      locale === "zh" ? "  ⚠ 時段衝突" : "  ⚠ conflict";
    lines.push(
      `=== ${formatDate(date, locale)}${hasConflict ? conflictMark : ""} ===`
    );

    for (let i = 0; i < dayItems.length; i++) {
      const { screening, film, venue } = dayItems[i];
      const startMin = timeToMinutes(screening.time);
      const endTime = minutesToTime(startMin + (film.runtime ?? 0));
      const title = film.title[locale];
      const venueCode = venue?.code ?? screening.venueId.toUpperCase();
      const isConflict = conflictIds.has(screening.id);

      let row = `  ${screening.time}–${endTime}  ${title.padEnd(28)}${venueCode.padEnd(4)}[${screening.screeningCode}]`;

      if (isConflict) {
        // Find the other conflicting item(s) to annotate
        const others = dayItems.filter(
          (other, j) => j !== i && hasOverlap(dayItems[i], other)
        );
        if (others.length > 0) {
          const direction =
            timeToMinutes(others[0].screening.time) >
            timeToMinutes(screening.time)
              ? "↓"
              : "↑";
          row += `  ← overlaps ${direction}`;
        }
      }

      lines.push(row);
    }
    lines.push("");
  }

  lines.push(divider);
  const allCodes = items
    .map((i) => i.screening.screeningCode)
    .join(" · ");
  lines.push(`${bookingLabel}: ${allCodes}`);

  return lines.join("\n");
}
