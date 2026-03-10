#!/usr/bin/env npx tsx
/**
 * Parse the HKIFF 50 brochure calendar text into structured screening data.
 *
 * Input: HKIFF50-BF.txt (calendar section lines ~7809-9977)
 * Output: data/screenings-brochure.json
 */

import * as fs from "fs";
import * as path from "path";

// --- Types ---

type EventType = "master-class" | "face-to-face" | "seminar" | "post-talk" | "pre-talk";

interface ParsedScreening {
  screeningCode: string;
  date: string;
  time: string;
  venueId: string;
  filmTitle: { en: string; zh: string };
  duration?: number;
  pageRef?: string;
  filmId: string;
  event?: { type: EventType; speaker?: string };
  guestAttend?: boolean;
}

// --- Constants ---

const VENUE_CODES = ["KG", "EK", "IS", "GL", "PE", "MC", "TS", "AC", "CT"];
const FESTIVAL_START_DATE = new Date(2026, 3, 1); // April 1, 2026

// Screening code pattern: DDVVNN where DD=day, VV=venue, NN=sequence
const SCREENING_CODE_RE = /^(\d{2})([A-Z]{2})(\d{2})$/;

// Time pattern: "9:15 pm" or "12:30 pm" (with optional space before am/pm)
const TIME_RE = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;

// Entry start: time with optional duration and page ref
// e.g. "9:15 pm (145min) p.83" or "3:45 pm p.66" or "8:00 pm"
const ENTRY_START_RE = /^(\d{1,2}:\d{2}\s*(?:am|pm))\s*(?:\((\d+)min\))?\s*(p\.\d[\d,]*)?$/i;

// Duration on separate line (for Pre-talk entries)
const DURATION_LINE_RE = /^\((\d+)min\)\s*(p\.\d[\d,]*)?$/;

// Lines to skip
const SKIP_PATTERNS = [
  /^\d{1,2}:\d{2}(?:am|pm)\s+\d{1,2}:\d{2}(?:am|pm)/, // time scale lines like "12:00pm 1:00pm"
  /^場地\s*VENUE/,
  /^節目表\s*PROGR/,
  /^HKIFF50_BF/,
  /^\d+\/\d+\/\d+\s+[上下]午/, // timestamps like "2/3/2026 下午9:56"
  /^\d{3}$/, // page numbers like "163"
  /^12:00pm\s/,
  /^2:00pm\s/,
];

// Venue header patterns
const VENUE_HEADERS: Record<string, RegExp[]> = {
  KG: [/^KG\s/, /^HONG KONG$/, /^CULTURAL CENTRE$/, /^GRAND THEATRE$/],
  EK: [/^EK\s/, /^EAST KOWLOON$/, /^CULTURAL CENTRE$/, /^THE HALL$/],
  IS: [/^IS\s/, /^EMPEROR CINEMAS$/, /^ISQUARE$/],
  GL: [/^GL\s*GALA/],
  PE: [/^PE\s*PREMIERE/],
  MC: [/^MC\s*M\+/, /^M\+\s*CINEMA$/],
  TS: [/^TS\s/, /^EMPEROR CINEMAS$/, /^TIMES SQUARE$/],
  AC: [/^AC\s/, /^古天樂電影院$/, /^LOUIS KOO CINEMA/, /^HONG KONG ARTS CENTRE$/],
  CT: [/^CT\s/, /^HONG KONG CITY HALL$/, /^THEATRE$/],
};

// Event type detection
const EVENT_PATTERNS: [RegExp, EventType][] = [
  [/^Master Class$/i, "master-class"],
  [/^Face to Face$/i, "face-to-face"],
  [/^Seminar\b/i, "seminar"],
  [/^Pre-talk$/i, "pre-talk"],
  [/^Post-talk$/i, "post-talk"],
];

// --- Utility functions ---

function toSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019\u0060\u00B4]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parse12hTo24h(timeStr: string): string {
  const m = timeStr.match(TIME_RE);
  if (!m) throw new Error(`Cannot parse time: ${timeStr}`);
  let hours = parseInt(m[1], 10);
  const minutes = m[2];
  const period = m[3].toLowerCase();
  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

function dayToDate(day: number): string {
  const month = 4;
  const dayOfMonth = day; // Day 1 = April 1, Day 12 = April 12
  return `2026-04-${dayOfMonth.toString().padStart(2, "0")}`;
}

function decodeScreeningCode(code: string): { day: number; venueId: string; seq: number } | null {
  const m = code.match(SCREENING_CODE_RE);
  if (!m) return null;
  return { day: parseInt(m[1], 10), venueId: m[2], seq: parseInt(m[3], 10) };
}

function isVenueHeader(line: string): string | null {
  for (const [code, patterns] of Object.entries(VENUE_HEADERS)) {
    if (patterns[0].test(line)) return code;
  }
  return null;
}

function shouldSkip(line: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(line));
}

function isScreeningCode(line: string): boolean {
  // Code can be at end of a line too: "洛奇恐怖晚會 05CT03"
  return SCREENING_CODE_RE.test(line.trim());
}

function extractTrailingCode(line: string): { text: string; code: string } | null {
  const m = line.match(/^(.+?)\s+(\d{2}[A-Z]{2}\d{2})$/);
  if (m) return { text: m[1], code: m[2] };
  return null;
}

function isDayHeader(line: string): number | null {
  // "1/4星期三 WEDNESDAY" or just "4/4" on its own
  const m = line.match(/^(\d{1,2})\/4(?:星期|$)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function hasStarSymbol(line: string): boolean {
  return line.includes("★");
}

function cleanTitle(title: string): string {
  return title.replace(/\s*★\s*/, "").replace(/\s*●\s*/, "").replace(/\s*▲\s*/, "").trim();
}

function hasGuestAttend(line: string): boolean {
  return line.includes("●") || line.includes("⬤");
}

// --- Main parser ---

function parseCalendar(text: string): ParsedScreening[] {
  const allLines = text.split("\n");

  // Find calendar section boundaries
  const calendarStart = allLines.findIndex(l => l.includes("節目表 PROGR AMME DIARY") && l.includes("1/4"));
  if (calendarStart === -1) throw new Error("Cannot find calendar start");

  // Find the end - after all screening codes (last one should be 12xxxx)
  let calendarEnd = allLines.length;
  for (let i = allLines.length - 1; i >= calendarStart; i--) {
    const line = allLines[i].trim();
    if (SCREENING_CODE_RE.test(line) || extractTrailingCode(line)) {
      calendarEnd = i + 5; // some buffer after last code
      break;
    }
  }

  const lines = allLines.slice(calendarStart, calendarEnd);
  const screenings: ParsedScreening[] = [];
  const eventCounters: Record<string, number> = {}; // for synthetic codes

  let currentDay = 1;
  let currentVenue = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) { i++; continue; }

    // Check for day header
    const dayNum = isDayHeader(line);
    if (dayNum !== null) {
      currentDay = dayNum;
      i++;
      continue;
    }

    // Check for venue header
    const venue = isVenueHeader(line);
    if (venue) {
      currentVenue = venue;
      i++;
      continue;
    }

    // Skip noise lines
    if (shouldSkip(line)) { i++; continue; }

    // Skip day-of-week lines like "星期六 SATURDAY"
    if (/^星期[一二三四五六日]\s+\w+DAY$/i.test(line)) { i++; continue; }
    if (/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$/i.test(line)) { i++; continue; }

    // Check for entry start (time line)
    const entryMatch = line.match(ENTRY_START_RE);
    if (entryMatch) {
      const timeStr = entryMatch[1];
      let duration = entryMatch[2] ? parseInt(entryMatch[2], 10) : undefined;
      let pageRef = entryMatch[3] || undefined;

      const time24 = parse12hTo24h(timeStr);
      const date = dayToDate(currentDay);

      // Read subsequent lines to build the entry
      i++;
      let titleLines: string[] = [];
      let zhTitle = "";
      let screeningCode = "";
      let eventType: EventType | undefined;
      let eventSpeaker: string | undefined;
      let guestAttend = false;
      let isEvent = false;

      // Check if next line is an event type
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (!nextLine) { i++; continue; }

        // Check for event type
        let foundEvent = false;
        for (const [pattern, type] of EVENT_PATTERNS) {
          if (pattern.test(nextLine)) {
            eventType = type;
            isEvent = true;
            foundEvent = true;
            i++;
            break;
          }
        }
        if (foundEvent) {
          // Read Chinese event description (e.g., "陳凱歌大師班" or "賈樟柯" then "名家講座")
          while (i < lines.length) {
            const eline = lines[i].trim();
            if (!eline) { i++; continue; }
            // If it's a screening code, this event has a code
            if (isScreeningCode(eline)) {
              screeningCode = eline;
              i++;
              break;
            }
            // Check for trailing code
            const trailing = extractTrailingCode(eline);
            if (trailing) {
              zhTitle = trailing.text;
              screeningCode = trailing.code;
              i++;
              break;
            }
            // If it's a new time entry, we're done with this event
            if (ENTRY_START_RE.test(eline)) break;
            // If it's a venue header or day header, we're done
            if (isVenueHeader(eline) || isDayHeader(eline)) break;
            // Chinese label lines for the event
            if (/大師班|名家講座|座談會|映前|映後|分享會/.test(eline)) {
              if (!eventSpeaker && !zhTitle) {
                // This might be a speaker name followed by event label
                zhTitle = eline;
              } else {
                zhTitle = zhTitle ? zhTitle + eline : eline;
              }
              i++;
              continue;
            }
            // Could be a speaker name
            if (!eventSpeaker && /[\u4e00-\u9fff]/.test(eline) && eline.length < 20) {
              eventSpeaker = eline;
              i++;
              continue;
            }
            // Check if it's a duration line (for pre-talk: duration comes after event label)
            const durMatch = eline.match(DURATION_LINE_RE);
            if (durMatch) {
              duration = parseInt(durMatch[1], 10);
              pageRef = durMatch[2] || pageRef;
              isEvent = false; // This is actually a screening with a pre-talk
              i++;
              continue;
            }
            // Otherwise treat as title
            titleLines.push(eline);
            i++;
          }

          // For pure events (no screening code), generate a synthetic code
          if (!screeningCode && isEvent) {
            const dayStr = currentDay.toString().padStart(2, "0");
            const key = `${dayStr}${currentVenue}`;
            eventCounters[key] = (eventCounters[key] || 0) + 1;
            screeningCode = `${key}E${eventCounters[key]}`;
          }
          break;
        }

        // Not an event - this is a film title line
        // Check for Seminar on (multi-word)
        if (/^Seminar\s+on\b/i.test(nextLine)) {
          eventType = "seminar";
          isEvent = true;
          // "Seminar on" may continue: "Seminar on New Voices" / "of Asia"
          titleLines.push(nextLine);
          i++;
          // Read continuation
          while (i < lines.length) {
            const contLine = lines[i].trim();
            if (!contLine) { i++; continue; }
            // Check if continuation of seminar title (lowercase start like "of Asia")
            if (/^[a-z]/.test(contLine) || /^Film\b/.test(contLine) || /^Chinese\b/.test(contLine)) {
              titleLines.push(contLine);
              i++;
              continue;
            }
            // Chinese title for the seminar
            if (/[\u4e00-\u9fff]/.test(contLine) && !ENTRY_START_RE.test(contLine)) {
              zhTitle = contLine;
              i++;
              // Check for trailing code
              const trailing = extractTrailingCode(contLine);
              if (trailing) {
                zhTitle = trailing.text;
                screeningCode = trailing.code;
              }
              continue;
            }
            break;
          }
          // Events without codes are interstitial
          if (!screeningCode) continue;
          break;
        }

        // Regular film title
        if (hasGuestAttend(nextLine)) guestAttend = true;

        // Check if this line is a screening code
        if (isScreeningCode(nextLine)) {
          screeningCode = nextLine;
          i++;
          break;
        }

        // Check for trailing code on this line
        const trailing = extractTrailingCode(nextLine);
        if (trailing) {
          // This is a Chinese title with code appended
          if (titleLines.length === 0) {
            // Actually this IS the English title with code? Unlikely, check for CJK
            if (/[\u4e00-\u9fff]/.test(trailing.text)) {
              zhTitle = trailing.text;
            } else {
              titleLines.push(trailing.text);
            }
          } else {
            zhTitle = trailing.text;
          }
          screeningCode = trailing.code;
          i++;
          break;
        }

        // Check if this is a new time entry (we've overshot)
        if (ENTRY_START_RE.test(nextLine)) break;
        // Check if this is a venue or day header
        if (isVenueHeader(nextLine) || isDayHeader(nextLine)) break;

        // Check if this looks like a Chinese title (CJK characters)
        if (titleLines.length > 0 && /[\u4e00-\u9fff\u3000-\u303f]/.test(nextLine) && !/^\d/.test(nextLine)) {
          zhTitle = nextLine;
          i++;

          // Next should be the screening code
          while (i < lines.length) {
            const codeLine = lines[i].trim();
            if (!codeLine) { i++; continue; }
            if (isScreeningCode(codeLine)) {
              screeningCode = codeLine;
              i++;
              break;
            }
            // Trailing code on Chinese title continuation
            const trailingCode = extractTrailingCode(codeLine);
            if (trailingCode) {
              zhTitle = zhTitle + trailingCode.text;
              screeningCode = trailingCode.code;
              i++;
              break;
            }
            // If it's another line of Chinese text, append
            if (/[\u4e00-\u9fff]/.test(codeLine) && !ENTRY_START_RE.test(codeLine)
                && !isVenueHeader(codeLine) && !isDayHeader(codeLine)) {
              // Check if it has a trailing code
              const tc = extractTrailingCode(codeLine);
              if (tc) {
                zhTitle = zhTitle + tc.text;
                screeningCode = tc.code;
                i++;
                break;
              }
              zhTitle = zhTitle + codeLine;
              i++;
              continue;
            }
            break;
          }
          break;
        }

        // English title line
        titleLines.push(nextLine);
        i++;
      }

      // Build the screening entry
      if (!screeningCode) continue; // Skip entries without codes

      const decoded = decodeScreeningCode(screeningCode);
      // For synthetic event codes (e.g., "03KGE1"), use currentDay and currentVenue
      const entryDay = decoded ? decoded.day : currentDay;
      const entryVenue = decoded ? decoded.venueId : currentVenue;

      const enTitle = cleanTitle(titleLines.join(" "));
      const zhTitleClean = cleanTitle(zhTitle);

      if (!enTitle && !zhTitleClean && !eventType) continue;

      // For events, use the event type as title if no film title
      const effectiveEnTitle = enTitle || (eventType ? eventType.replace(/-/g, " ") : "") || zhTitleClean;
      const effectiveZhTitle = zhTitleClean || enTitle;

      const entry: ParsedScreening = {
        screeningCode,
        date: dayToDate(entryDay),
        time: time24,
        venueId: entryVenue,
        filmTitle: { en: effectiveEnTitle, zh: effectiveZhTitle || effectiveEnTitle },
        filmId: toSlug(effectiveEnTitle),
        ...(duration && { duration }),
        ...(pageRef && { pageRef }),
        ...(guestAttend && { guestAttend: true }),
        ...(eventType && { event: { type: eventType, ...(eventSpeaker && { speaker: eventSpeaker }) } }),
      };

      screenings.push(entry);
      continue;
    }

    // Not an entry start — skip
    i++;
  }

  return screenings;
}

// --- Main ---

const brochurePath = path.join(__dirname, "..", "HKIFF50-BF.txt");
const outputPath = path.join(__dirname, "..", "data", "screenings-brochure.json");

console.log("Reading brochure text...");
const text = fs.readFileSync(brochurePath, "utf-8");

console.log("Parsing calendar...");
const screenings = parseCalendar(text);

console.log(`Parsed ${screenings.length} screening entries`);

// Validate
const codes = screenings.map(s => s.screeningCode);
const uniqueCodes = new Set(codes);
const duplicates = codes.filter((c, i) => codes.indexOf(c) !== i);

if (duplicates.length > 0) {
  console.warn(`WARNING: ${duplicates.length} duplicate codes:`, [...new Set(duplicates)]);
}

// Count by day
const byDay: Record<string, number> = {};
for (const s of screenings) {
  byDay[s.date] = (byDay[s.date] || 0) + 1;
}
console.log("Screenings by day:");
for (const [date, count] of Object.entries(byDay).sort()) {
  console.log(`  ${date}: ${count}`);
}

// Count events
const events = screenings.filter(s => s.event);
console.log(`\nEvents with metadata: ${events.length}`);
for (const e of events) {
  console.log(`  ${e.screeningCode}: ${e.event!.type} ${e.event!.speaker || ""}`);
}

// Write output
fs.writeFileSync(outputPath, JSON.stringify(screenings, null, 2));
console.log(`\nWritten to ${outputPath}`);
