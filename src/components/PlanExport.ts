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

export function buildExportText(
  planIds: string[],
  allScreenings: Screening[],
  allFilms: Film[],
  allVenues: Venue[],
  locale: "en" | "zh",
  ticketQuantities?: Record<string, number>
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
  for (const dayItems of byDate.values()) {
    dayItems.sort(
      (a, b) =>
        timeToMinutes(a.screening.time) - timeToMinutes(b.screening.time)
    );
  }

  const header =
    locale === "zh" ? "我的 HKIFF 50 計劃" : "My HKIFF 50 Plan";

  const lines: string[] = [header, ""];

  const sortedDates = [...byDate.keys()].sort();
  for (const date of sortedDates) {
    const dayItems = byDate.get(date)!;
    lines.push(formatDateShort(date, locale));

    for (const { screening, film } of dayItems) {
      const title = film.title[locale];
      const qty = ticketQuantities?.[screening.id] ?? 1;
      const qtyStr = qty > 1 ? ` ×${qty}` : "";
      lines.push(`${screening.time} ${title} [${screening.screeningCode}]${qtyStr}`);
    }
    lines.push("");
  }

  const allCodes = items.map((i) => i.screening.screeningCode).join(" ");
  const bookingLabel = locale === "zh" ? "訂票編號" : "Codes";
  lines.push(`${bookingLabel}: ${allCodes}`);
  lines.push("");
  const cta = locale === "zh"
    ? "在 hkiff.herballemon.dev 建立你的排片計劃"
    : "Build your plan at hkiff.herballemon.dev";
  lines.push(cta);

  return lines.join("\n");
}
