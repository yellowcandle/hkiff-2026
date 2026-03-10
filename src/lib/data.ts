import type { Film, Screening, Venue, Section } from "./types";

import rawFilmsData from "../../data/films.json";
import screeningsData from "../../data/screenings.json";
import venuesData from "../../data/venues.json";
import sectionsData from "../../data/sections.json";

// --- Slug utility ---

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Bilingual title lookup from screenings (fallback for films without brochure zh title) ---

type ScreeningRaw = {
  id: string;
  filmId: string;
  filmTitle?: { en: string; zh: string };
  date: string;
  time: string;
  venueId: string;
  screeningCode: string;
  ticketUrl: string;
};

const bilingualTitleMap: Record<string, { en: string; zh: string }> = {};
for (const s of screeningsData as ScreeningRaw[]) {
  if (s.filmTitle && !bilingualTitleMap[s.filmId]) {
    bilingualTitleMap[s.filmId] = s.filmTitle;
  }
}

// --- Enriched film type from brochure-merged films.json ---

type EnrichedFilm = {
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
};

function transformFilm(raw: EnrichedFilm): Film {
  const slug = toSlug(raw.title);
  const bilingual = bilingualTitleMap[slug];

  // Chinese title: brochure > screenings > English fallback
  const titleZh = raw.titleZh || bilingual?.zh || raw.title;
  const titleEn = bilingual?.en || raw.title;

  return {
    id: slug,
    title: { en: titleEn, zh: titleZh },
    director: { en: raw.director, zh: raw.directorZh || raw.director },
    section: raw.section || "world-cinema",
    posterUrl: raw.localImg || raw.imgSrc,
    country: raw.country || undefined,
    year: raw.year || undefined,
    runtime: raw.runtime || undefined,
    language: raw.language || undefined,
    subtitles: raw.subtitles
      ? (typeof raw.subtitles === "string" ? raw.subtitles.split(/,\s*/) : undefined)
      : undefined,
    synopsis: raw.synopsis || raw.synopsisZh
      ? {
          en: raw.synopsis || "",
          zh: raw.synopsisZh || raw.synopsis || "",
        }
      : undefined,
    imdbId: raw.imdbId || undefined,
    letterboxdSlug: raw.letterboxdUrl
      ? raw.letterboxdUrl.replace("https://letterboxd.com/film/", "").replace(/\/$/, "")
      : undefined,
  };
}

// --- Cached transformed data ---

let _films: Film[] | null = null;

function loadFilms(): Film[] {
  if (!_films) {
    _films = (rawFilmsData as EnrichedFilm[]).map(transformFilm);
  }
  return _films;
}

// --- Public API ---

export function getFilms(): Film[] {
  return loadFilms();
}

export function getFilm(id: string): Film | undefined {
  return loadFilms().find((f) => f.id === id);
}

export function getSections(): Section[] {
  return sectionsData as Section[];
}

export function getSection(id: string): Section | undefined {
  return (sectionsData as Section[]).find((s) => s.id === id);
}

export function getVenues(): Venue[] {
  return venuesData as Venue[];
}

export function getVenue(id: string): Venue | undefined {
  return (venuesData as Venue[]).find((v) => v.id === id);
}

export function getScreenings(): Screening[] {
  return screeningsData as Screening[];
}

export function getScreening(id: string): Screening | undefined {
  return (screeningsData as Screening[]).find((s) => s.id === id);
}

export function getScreeningsForFilm(filmId: string): Screening[] {
  return (screeningsData as Screening[]).filter((s) => s.filmId === filmId);
}

export function getScreeningsByDate(date: string): Screening[] {
  return (screeningsData as Screening[]).filter((s) => s.date === date);
}

export function getAllScreeningDates(): string[] {
  const dates = new Set(
    (screeningsData as Screening[]).map((s) => s.date)
  );
  return Array.from(dates).sort();
}
