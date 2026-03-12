import type { Film, Screening, Venue } from "@/lib/types";

export interface CalendarScreening {
  screening: Screening;
  film: Film;
  venue: Venue | undefined;
}

const CRLF = "\r\n";

/** Escape text values per RFC 5545 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Fold lines longer than 75 octets per RFC 5545 */
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  const parts: string[] = [line.slice(0, maxLen)];
  let i = maxLen;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + maxLen - 1));
    i += maxLen - 1;
  }
  return parts.join(CRLF);
}

/** Format date+time as iCal local datetime: YYYYMMDDTHHMMSS */
function formatDateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM
  return date.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
}

/** Current UTC timestamp in iCal format */
function nowUtc(): string {
  const d = new Date();
  return (
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

function buildVTimezone(): string[] {
  return [
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Hong_Kong",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0800",
    "TZOFFSETTO:+0800",
    "TZNAME:HKT",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}

function buildVEvent(
  screening: Screening,
  film: Film,
  venue: Venue | undefined,
  locale: "en" | "zh",
  stamp: string
): string[] {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${screening.id}@hkiff.herballemon.dev`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Hong_Kong:${formatDateTime(screening.date, screening.time)}`,
    `DURATION:PT${film.runtime ?? 120}M`,
    foldLine(`SUMMARY:${escapeText(film.title[locale])}`),
  ];

  if (venue) {
    const location = `${venue.name[locale]}, ${venue.address[locale]}`;
    lines.push(foldLine(`LOCATION:${escapeText(location)}`));
  }

  const directorLabel = locale === "zh" ? "導演" : "Dir.";
  const descParts = [
    `[${screening.screeningCode}]`,
    `${directorLabel}: ${film.director[locale]}`,
  ];
  if (screening.ticketUrl) {
    descParts.push(screening.ticketUrl);
  }
  lines.push(
    foldLine(`DESCRIPTION:${escapeText(descParts.join("\\n"))}`)
  );

  if (screening.ticketUrl) {
    lines.push(foldLine(`URL:${screening.ticketUrl}`));
  }

  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  return lines;
}

function buildVCalendar(
  events: string[][],
  locale: "en" | "zh"
): string {
  const calName = locale === "zh" ? "我的 HKIFF 50 計劃" : "My HKIFF 50 Plan";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HKIFF50//Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calName)}`),
    ...buildVTimezone(),
  ];
  for (const event of events) {
    lines.push(...event);
  }
  lines.push("END:VCALENDAR");
  return lines.map((l) => foldLine(l)).join(CRLF) + CRLF;
}

/** Generate .ics content for the entire plan */
export function generateIcsForPlan(
  items: CalendarScreening[],
  locale: "en" | "zh"
): string {
  const stamp = nowUtc();
  const events = items.map(({ screening, film, venue }) =>
    buildVEvent(screening, film, venue, locale, stamp)
  );
  return buildVCalendar(events, locale);
}

/** Generate .ics content for a single screening */
export function generateIcsForScreening(
  screening: Screening,
  film: Film,
  venue: Venue | undefined,
  locale: "en" | "zh"
): string {
  const stamp = nowUtc();
  const event = buildVEvent(screening, film, venue, locale, stamp);
  return buildVCalendar([event], locale);
}

/** Trigger a .ics file download / calendar import in the browser */
export function downloadIcsFile(content: string, filename: string): void {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // On mobile, navigate to data URI so the OS opens its calendar app
    window.location.href =
      "data:text/calendar;charset=utf-8," + encodeURIComponent(content);
  } else {
    // On desktop, download the .ics file
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
