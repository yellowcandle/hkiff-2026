#!/usr/bin/env npx tsx
/**
 * Scrape HKIFF website for screening data including ticket URLs.
 *
 * Strategy: For each unique film detail URL (fid) in screenings.json,
 * fetch the film detail page and extract screening codes + ticket URLs.
 *
 * Also attempts to discover additional fids from the website film list.
 *
 * Output: data/screenings-website.json
 */

import * as fs from "fs";
import * as path from "path";

// --- Types ---

interface WebsiteScreening {
  screeningCode: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  time: string; // HH:MM 24h
  venue: string; // Full venue name
  venueCode: string; // Two-letter code (lowercase)
  ticketUrl: string;
  guestAttend: boolean;
  filmDetailUrl: string;
  fid: string;
}

interface ExistingScreening {
  id: string;
  filmId: string;
  filmTitle?: { en: string; zh: string };
  date: string;
  time: string;
  venueId: string;
  screeningCode: string;
  ticketUrl: string;
  guestAttend?: boolean;
}

// --- Constants ---

const BASE_URL = "https://www.hkiff.org.hk";
const LANG_URL = `${BASE_URL}/default/ajaxChangeLanguage/lang/en`;
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;

const SCREENINGS_PATH = path.join(__dirname, "..", "data", "screenings.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "screenings-website.json");

// --- HTTP helpers ---

let cookieStore: Record<string, string> = {};

function cookieHeader(): string {
  return Object.entries(cookieStore)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function parseCookies(response: Response): void {
  const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]*)/);
    if (match) {
      cookieStore[match[1]] = match[2];
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Cookie: cookieHeader(),
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      parseCookies(response);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `  Attempt ${attempt}/${retries} failed for ${url}: ${message}`,
      );
      if (attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.error(`  Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        throw new Error(
          `Failed after ${retries} attempts: ${url} - ${message}`,
        );
      }
    }
  }
  throw new Error("Unreachable");
}

// --- HTML parsing helpers ---

/**
 * Parse screening entries from a film detail page HTML.
 *
 * Expected HTML structure per screening:
 *
 *   <p class="date">01/04 (WED)</p>
 *   <div class="flex-row custom-flex-width">
 *     <div class="custom-flex-left">
 *       <p>Hong Kong Cultural Centre Grand Theatre (KG)</p>
 *       <p><span>01KG01</span> <span>7:30 PM</span></p>
 *     </div>
 *     <div class="custom-flex-right">
 *       <a href="https://www.uutix.com/hkiff50pb" target="_blank">Buy Ticket</a>
 *     </div>
 *   </div>
 *   <p><img .../> Filmmaker/Film critic will attend the screening</p>
 */
function parseFilmDetailPage(
  html: string,
  fid: string,
): WebsiteScreening[] {
  const screenings: WebsiteScreening[] = [];
  const filmDetailUrl = `${BASE_URL}/film/getdetail?fid=${fid}`;

  // Find all date entries and their positions
  const datePattern =
    /<p\s+class="date">\s*(\d{2})\/(\d{2})\s*\((\w+)\)\s*<\/p>/g;
  const datePositions: {
    pos: number;
    day: string;
    month: string;
    dow: string;
  }[] = [];

  let dateMatch: RegExpExecArray | null;
  while ((dateMatch = datePattern.exec(html)) !== null) {
    datePositions.push({
      pos: dateMatch.index,
      day: dateMatch[1],
      month: dateMatch[2],
      dow: dateMatch[3],
    });
  }

  for (let i = 0; i < datePositions.length; i++) {
    const { pos, day, month, dow } = datePositions[i];
    const nextPos =
      i + 1 < datePositions.length ? datePositions[i + 1].pos : pos + 2000;
    const block = html.slice(pos, Math.min(nextPos, html.length));

    // Extract venue name and code: <p>Venue Name (XX)</p>
    const venueMatch = block.match(
      /<p>([^<]+?)\s*\(([A-Z]{2})\)<\/p>/,
    );
    if (!venueMatch) continue;
    const venueName = venueMatch[1].trim();
    const venueCode = venueMatch[2];

    // Extract screening code and time: <span>01KG01</span> <span>7:30 PM</span>
    const codeTimeMatch = block.match(
      /<span>(\d{2}[A-Z]{2}\d{2})<\/span>\s*<span>(\d{1,2}:\d{2}\s*[AP]M)<\/span>/,
    );
    if (!codeTimeMatch) continue;
    const screeningCode = codeTimeMatch[1];
    const time12h = codeTimeMatch[2];

    // Extract ticket URL from Buy Ticket link
    const ticketMatch = block.match(
      /<a\s+href="([^"]+)"[^>]*>\s*Buy Ticket\s*<\/a>/,
    );
    const ticketUrl = ticketMatch ? ticketMatch[1] : "";

    // Check for guest attend
    const guestAttend = block.includes(
      "Filmmaker/Film critic will attend",
    );

    // Convert date to ISO format
    const dateStr = `2026-${month}-${day}`;

    // Convert 12h time to 24h
    const time24h = convert12hTo24h(time12h);

    screenings.push({
      screeningCode,
      date: dateStr,
      dayOfWeek: dow,
      time: time24h,
      venue: venueName,
      venueCode: venueCode.toLowerCase(),
      ticketUrl,
      guestAttend,
      filmDetailUrl,
      fid,
    });
  }

  return screenings;
}

function convert12hTo24h(time12h: string): string {
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12h;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// --- Film list discovery ---

/**
 * Discover film fids by iterating through the paginated film list AJAX endpoint.
 */
async function discoverFilmFids(): Promise<string[]> {
  const fids: string[] = [];
  let showMore = 0;

  console.log("Discovering film fids from website film list...");

  while (true) {
    const url =
      `${BASE_URL}/film/ajaxGetFilmList/show_more/${showMore}/venue_id//category_id//key_word//main_category_id/`;
    console.log(`  Fetching film list (offset ${showMore})...`);

    try {
      const html = await fetchWithRetry(url);
      await sleep(RATE_LIMIT_MS);

      // Extract fids from film detail links
      const fidPattern = /(?:getdetail\?fid=|film\/detail\/)(\d+)/g;
      let fidMatch: RegExpExecArray | null;
      let foundCount = 0;
      while ((fidMatch = fidPattern.exec(html)) !== null) {
        if (!fids.includes(fidMatch[1])) {
          fids.push(fidMatch[1]);
          foundCount++;
        }
      }

      console.log(
        `  Found ${foundCount} new fids (total: ${fids.length})`,
      );

      // Stop if no new fids found or response is very short (no content)
      if (foundCount === 0 || html.length < 100) break;
      showMore += 8;
    } catch (err) {
      console.error(
        `  Film list discovery failed at offset ${showMore}, continuing with what we have.`,
      );
      break;
    }
  }

  return fids;
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== HKIFF Website Calendar Scraper ===\n");

  // Step 1: Set language cookie
  console.log("Setting language to English...");
  try {
    const langResponse = await fetch(LANG_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      redirect: "follow",
    });
    parseCookies(langResponse);
    console.log("  Language cookie set.\n");
  } catch {
    console.warn("  Warning: Could not set language cookie, continuing...\n");
  }

  // Step 2: Collect fids from existing screenings.json
  let existingFids: string[] = [];
  if (fs.existsSync(SCREENINGS_PATH)) {
    const existingScreenings: ExistingScreening[] = JSON.parse(
      fs.readFileSync(SCREENINGS_PATH, "utf-8"),
    );
    existingFids = [
      ...new Set(
        existingScreenings
          .map((s) => {
            const m = s.ticketUrl?.match(/fid=(\d+)/);
            return m ? m[1] : null;
          })
          .filter((x): x is string => x !== null),
      ),
    ];
    console.log(
      `Found ${existingFids.length} unique fids from existing screenings.json`,
    );
  }

  // Step 3: Try to discover additional fids from website
  let discoveredFids: string[] = [];
  try {
    discoveredFids = await discoverFilmFids();
    console.log(`Discovered ${discoveredFids.length} fids from website\n`);
  } catch {
    console.warn("Film list discovery failed, using existing fids only.\n");
  }

  // Merge fid lists, deduplicating
  const allFids = [...new Set([...existingFids, ...discoveredFids])];
  console.log(`Total unique fids to scrape: ${allFids.length}\n`);

  if (allFids.length === 0) {
    console.error("No fids found. Ensure data/screenings.json exists.");
    process.exit(1);
  }

  // Step 4: Fetch each film detail page and extract screenings
  const allScreenings: WebsiteScreening[] = [];
  const failedFids: string[] = [];

  for (let i = 0; i < allFids.length; i++) {
    const fid = allFids[i];
    const url = `${BASE_URL}/film/getdetail?fid=${fid}`;
    console.log(
      `[${i + 1}/${allFids.length}] Fetching fid=${fid}...`,
    );

    try {
      const html = await fetchWithRetry(url);
      const screenings = parseFilmDetailPage(html, fid);
      console.log(`  Found ${screenings.length} screening(s)`);

      for (const s of screenings) {
        console.log(
          `    ${s.screeningCode} | ${s.date} ${s.time} | ${s.venueCode} | ticket: ${s.ticketUrl ? "yes" : "no"}`,
        );
      }

      allScreenings.push(...screenings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      failedFids.push(fid);
    }

    // Rate limit between requests
    if (i < allFids.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Step 5: Build output keyed by screening code
  const output: Record<
    string,
    {
      screeningCode: string;
      date: string;
      time: string;
      venueCode: string;
      venue: string;
      ticketUrl: string;
      filmDetailUrl: string;
      fid: string;
      guestAttend: boolean;
    }
  > = {};

  for (const s of allScreenings) {
    if (output[s.screeningCode]) {
      console.warn(
        `WARNING: Duplicate screening code ${s.screeningCode} ` +
          `(fid=${s.fid} vs fid=${output[s.screeningCode].fid})`,
      );
    }
    output[s.screeningCode] = {
      screeningCode: s.screeningCode,
      date: s.date,
      time: s.time,
      venueCode: s.venueCode,
      venue: s.venue,
      ticketUrl: s.ticketUrl,
      filmDetailUrl: s.filmDetailUrl,
      fid: s.fid,
      guestAttend: s.guestAttend,
    };
  }

  // Step 6: Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Step 7: Summary
  console.log(`\n=== Results ===`);
  console.log(`Total screenings scraped: ${allScreenings.length}`);
  console.log(`Unique screening codes: ${Object.keys(output).length}`);
  console.log(`Failed fids: ${failedFids.length}`);
  if (failedFids.length > 0) {
    console.log(`  Failed: ${failedFids.join(", ")}`);
  }

  // Step 8: Cross-reference with existing screenings.json
  if (fs.existsSync(SCREENINGS_PATH)) {
    const existing: ExistingScreening[] = JSON.parse(
      fs.readFileSync(SCREENINGS_PATH, "utf-8"),
    );
    const existingCodes = new Set(existing.map((s) => s.screeningCode));
    const scrapedCodes = new Set(Object.keys(output));

    const matched = [...existingCodes].filter((c) => scrapedCodes.has(c));
    const inExistingOnly = [...existingCodes].filter(
      (c) => !scrapedCodes.has(c),
    );
    const inWebsiteOnly = [...scrapedCodes].filter(
      (c) => !existingCodes.has(c),
    );

    console.log(`\n=== Cross-reference with screenings.json ===`);
    console.log(`Matched: ${matched.length}`);
    console.log(
      `In screenings.json but not on website: ${inExistingOnly.length}`,
    );
    if (inExistingOnly.length > 0) {
      console.log(`  ${inExistingOnly.join(", ")}`);
    }
    console.log(
      `On website but not in screenings.json: ${inWebsiteOnly.length}`,
    );
    if (inWebsiteOnly.length > 0) {
      console.log(`  ${inWebsiteOnly.join(", ")}`);
    }
  }

  console.log(`\nOutput written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
