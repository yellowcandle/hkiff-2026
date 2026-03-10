#!/usr/bin/env npx tsx
/**
 * Merge brochure and website screening data into final data/screenings.json.
 * Also updates data/films.json with stub entries for any new films.
 *
 * Usage: npx tsx scripts/merge-screening-data.ts
 *
 * Inputs:
 *   - data/screenings-brochure.json  (required)
 *   - data/screenings-website.json   (optional – graceful fallback)
 *   - data/films.json                (required)
 *
 * Outputs:
 *   - data/screenings.json           (merged screenings)
 *   - data/films.json                (updated with new film stubs if any)
 */

import * as fs from "fs";
import * as path from "path";

// --- Paths ---

const ROOT = path.resolve(__dirname, "..");
const BROCHURE_PATH = path.join(ROOT, "data/screenings-brochure.json");
const WEBSITE_PATH = path.join(ROOT, "data/screenings-website.json");
const FILMS_PATH = path.join(ROOT, "data/films.json");
const SCREENINGS_OUT = path.join(ROOT, "data/screenings.json");

// --- Types ---

interface BrochureScreening {
  screeningCode: string;
  date: string;
  time: string;
  venueId: string;
  filmTitle: { en: string; zh: string };
  filmId: string;
  duration?: number;
  pageRef?: string;
  guestAttend?: boolean;
  event?: {
    type: string;
    speaker?: string;
    language?: string;
  };
}

interface WebsiteScreening {
  ticketUrl?: string;
}

interface OutputScreening {
  id: string;
  filmId: string;
  filmTitle: { en: string; zh: string };
  date: string;
  time: string;
  venueId: string;
  screeningCode: string;
  ticketUrl: string;
  guestAttend?: boolean;
  event?: {
    type: string;
    speaker?: string;
    language?: string;
  };
}

interface RawFilm {
  fid: string;
  title: string;
  titleZh?: string | null;
  director: string;
  directorZh?: string | null;
  country?: string | null;
  year?: number | null;
  runtime?: number | null;
  language?: string | null;
  subtitles?: string | null;
  synopsis?: string | null;
  synopsisZh?: string | null;
  cast?: string | null;
  section: string;
  sections?: string[];
  imgSrc: string;
  localImg: string;
  detailUrl: string;
  imdbId?: string | null;
  imdbUrl?: string | null;
  letterboxdUrl?: string | null;
}

// --- Slug utility (mirrors src/lib/data.ts) ---

function toSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019\u0060\u00B4]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Validation ---

const FESTIVAL_START = "2026-04-01";
const FESTIVAL_END = "2026-04-12";

function isValidDate(date: string): boolean {
  return date >= FESTIVAL_START && date <= FESTIVAL_END;
}

// --- Main ---

function main() {
  console.log("=== Merge Screening Data ===\n");

  // 1. Load brochure data (required)
  if (!fs.existsSync(BROCHURE_PATH)) {
    console.error(`ERROR: Brochure data not found at ${BROCHURE_PATH}`);
    process.exit(1);
  }
  const brochure: BrochureScreening[] = JSON.parse(
    fs.readFileSync(BROCHURE_PATH, "utf-8")
  );
  console.log(`Loaded ${brochure.length} screenings from brochure`);

  // 2. Load website data (optional)
  let website: Record<string, WebsiteScreening> = {};
  if (fs.existsSync(WEBSITE_PATH)) {
    website = JSON.parse(fs.readFileSync(WEBSITE_PATH, "utf-8"));
    console.log(
      `Loaded ${Object.keys(website).length} screenings from website`
    );
  } else {
    console.log("Website data not found – proceeding without ticket URLs");
  }

  // 3. Load films (required)
  if (!fs.existsSync(FILMS_PATH)) {
    console.error(`ERROR: Films data not found at ${FILMS_PATH}`);
    process.exit(1);
  }
  const films: RawFilm[] = JSON.parse(fs.readFileSync(FILMS_PATH, "utf-8"));
  console.log(`Loaded ${films.length} films\n`);

  // Build a set of existing film slugs for quick lookup
  const existingFilmSlugs = new Set(films.map((f) => toSlug(f.title)));

  // 4. Validate brochure data
  const errors: string[] = [];
  const seenCodes = new Set<string>();

  for (const s of brochure) {
    // Duplicate screening codes
    if (seenCodes.has(s.screeningCode)) {
      errors.push(`Duplicate screening code: ${s.screeningCode}`);
    }
    seenCodes.add(s.screeningCode);

    // Date within festival range
    if (!isValidDate(s.date)) {
      errors.push(
        `Screening ${s.screeningCode} has date ${s.date} outside festival range (${FESTIVAL_START} – ${FESTIVAL_END})`
      );
    }

    // Required fields
    if (!s.screeningCode || !s.date || !s.time || !s.venueId || !s.filmId) {
      errors.push(
        `Screening ${s.screeningCode || "?"} is missing required fields`
      );
    }
  }

  if (errors.length > 0) {
    console.error("Validation errors:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\n${errors.length} error(s) found. Aborting.`);
    process.exit(1);
  }
  console.log(`Validation passed: ${brochure.length} screenings, 0 errors`);

  // 5. Merge and build output screenings
  // Track per-filmId sequence counters for generating IDs
  const filmIdCounter: Record<string, number> = {};
  const newFilmIds = new Set<string>();

  // Sort by date then time for stable ordering
  const sorted = [...brochure].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.time.localeCompare(b.time);
  });

  const screenings: OutputScreening[] = sorted.map((s) => {
    // Increment sequence for this filmId
    filmIdCounter[s.filmId] = (filmIdCounter[s.filmId] || 0) + 1;
    const seq = String(filmIdCounter[s.filmId]).padStart(2, "0");

    // Get ticket URL from website data
    const webData = website[s.screeningCode];
    const ticketUrl = webData?.ticketUrl || "";

    // Track films not in films.json
    if (!existingFilmSlugs.has(s.filmId)) {
      newFilmIds.add(s.filmId);
    }

    // Build output
    const out: OutputScreening = {
      id: `s-${s.filmId}-${seq}`,
      filmId: s.filmId,
      filmTitle: s.filmTitle,
      date: s.date,
      time: s.time,
      venueId: s.venueId.toLowerCase(),
      screeningCode: s.screeningCode,
      ticketUrl,
    };

    if (s.guestAttend) {
      out.guestAttend = true;
    }

    if (s.event) {
      out.event = s.event;
    }

    return out;
  });

  console.log(`\nGenerated ${screenings.length} merged screenings`);

  // 6. Report ticket URL coverage
  const withTicket = screenings.filter((s) => s.ticketUrl).length;
  console.log(
    `Ticket URLs: ${withTicket}/${screenings.length} (${Math.round((withTicket / screenings.length) * 100)}%)`
  );

  // 7. Create stub entries for new films
  // Map brochure filmId -> first brochure entry for title/duration info
  const brochureByFilmId: Record<string, BrochureScreening> = {};
  for (const s of brochure) {
    if (!brochureByFilmId[s.filmId]) {
      brochureByFilmId[s.filmId] = s;
    }
  }

  const newStubs: RawFilm[] = [];
  for (const filmId of newFilmIds) {
    const src = brochureByFilmId[filmId];
    if (!src) continue;

    const stub: RawFilm = {
      fid: "",
      title: src.filmTitle.en,
      titleZh: src.filmTitle.zh,
      director: "",
      directorZh: null,
      country: null,
      year: null,
      runtime: src.duration || null,
      language: null,
      subtitles: null,
      synopsis: null,
      synopsisZh: null,
      cast: null,
      section: "unknown",
      sections: ["unknown"],
      imgSrc: "",
      localImg: "",
      detailUrl: "",
      imdbId: null,
      imdbUrl: null,
      letterboxdUrl: null,
    };
    newStubs.push(stub);
    console.log(`  New film stub: "${src.filmTitle.en}" (${filmId})`);
  }

  // 8. Write outputs
  fs.writeFileSync(SCREENINGS_OUT, JSON.stringify(screenings, null, 2) + "\n");
  console.log(`\nWrote ${screenings.length} screenings to ${SCREENINGS_OUT}`);

  if (newStubs.length > 0) {
    const updatedFilms = [...films, ...newStubs];
    fs.writeFileSync(FILMS_PATH, JSON.stringify(updatedFilms, null, 2) + "\n");
    console.log(
      `Added ${newStubs.length} film stubs to ${FILMS_PATH} (total: ${updatedFilms.length})`
    );
  } else {
    console.log("No new film stubs needed");
  }

  // 9. Summary
  const dates = new Set(screenings.map((s) => s.date));
  const venues = new Set(screenings.map((s) => s.venueId));
  const uniqueFilms = new Set(screenings.map((s) => s.filmId));
  const withEvents = screenings.filter((s) => s.event).length;
  const withGuest = screenings.filter((s) => s.guestAttend).length;

  console.log("\n=== Summary ===");
  console.log(`  Screenings:  ${screenings.length}`);
  console.log(`  Unique films: ${uniqueFilms.size}`);
  console.log(`  Dates:       ${[...dates].sort().join(", ")}`);
  console.log(`  Venues:      ${[...venues].sort().join(", ")}`);
  console.log(`  With events: ${withEvents}`);
  console.log(`  Guest attend: ${withGuest}`);
  console.log(`  Ticket URLs: ${withTicket}`);
  console.log("\nDone.");
}

main();
