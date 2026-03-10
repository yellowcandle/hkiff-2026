#!/usr/bin/env node
/**
 * Scrape HKIFF film detail pages to enrich films.json with complete metadata.
 * Usage: node scripts/scrape-film-details.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");

const DELAY_MS = 600;
const MAX_RETRIES = 2;

// --- Section ID mapping from website labels ---
const SECTION_LABEL_MAP = {
  "gala presentation": "gala-presentation",
  "opening film": "gala-presentation",
  "closing film": "gala-presentation",
  "focus": "focus",
  "firebird awards": "firebird-awards",
  "young cinema competition": "firebird-awards",
  "young cinema competition (chinese language)": "firebird-awards",
  "young cinema competition (world)": "firebird-awards",
  "documentary competition": "firebird-awards",
  "short film competition": "firebird-awards",
  "new voices of asia": "firebird-awards",
  "pan-chinese cinema": "pan-chinese-cinema",
  "masters & auteurs": "masters-auteurs",
  "masters and auteurs": "masters-auteurs",
  "the masters": "masters-auteurs",
  "auteurs": "masters-auteurs",
  "world cinema": "world-cinema",
  "global vision": "world-cinema",
  "global vision — asia": "world-cinema",
  "global vision — europe": "world-cinema",
  "global vision — america": "world-cinema",
  "global vision — africa": "world-cinema",
  "documentaries": "documentaries",
  "reality bites": "documentaries",
  "filmmakers and filmmaking": "documentaries",
  "kaleidoscope": "kaleidoscope",
  "fantastic beats": "kaleidoscope",
  "animation unlimited": "kaleidoscope",
  "midnight heat": "kaleidoscope",
  "poetry in motion": "kaleidoscope",
  "restored classics": "kaleidoscope",
  "chinese-language restored classics": "pan-chinese-cinema",
  "jia zhangke, filmmaker in focus": "focus",
  "juliette binoche: the choreographer of emotion": "focus",
  "revisiting chinese cinema: the beginning of a new journey": "focus",
  "anthony chen's 'growing up' trilogy": "masters-auteurs",
  "mary stephen: inner thoughts in moving image": "masters-auteurs",
};

function mapSectionLabel(label) {
  const lower = label.toLowerCase().trim();
  if (SECTION_LABEL_MAP[lower]) return SECTION_LABEL_MAP[lower];
  for (const [key, val] of Object.entries(SECTION_LABEL_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "HKIFF-Data-Enrichment/1.0",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en,zh-HK;q=0.9,zh;q=0.8",
        },
      });
      if (res.status === 429 || res.status === 503) {
        console.warn(`  Warning: ${res.status} on attempt ${i + 1}, retrying...`);
        await sleep(2000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`  Warning: attempt ${i + 1} failed: ${err.message}, retrying...`);
      await sleep(1000 * (i + 1));
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- HTML parsing (regex-based, no deps) ---

function extractMeta(html) {
  const result = {
    titleZh: null,
    sections: [],
    country: null,
    year: null,
    runtime: null,
    language: null,
    subtitles: null,
    synopsis: null,
    cast: null,
  };

  // Chinese title
  const zhMatch = html.match(/class="[^"]*film[_-]?title[^"]*"[^>]*>([^<]*[\u4e00-\u9fff][^<]*)/i);
  if (zhMatch) result.titleZh = zhMatch[1].trim();
  if (!result.titleZh) {
    const altMatch = html.match(/class="[^"]*chi(?:nese)?[_-]?(?:title|name)[^"]*"[^>]*>([^<]+)/i);
    if (altMatch) result.titleZh = altMatch[1].trim();
  }

  // Sections/categories
  const sectionRegex = /class="[^"]*(?:category|section|tag|label|badge)[^"]*"[^>]*>([^<]+)/gi;
  let secMatch;
  while ((secMatch = sectionRegex.exec(html)) !== null) {
    const label = secMatch[1].trim();
    if (label.length > 2 && label.length < 80) {
      result.sections.push(label);
    }
  }

  const breadcrumbSec = html.match(/class="[^"]*breadcrumb[^"]*"[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi);
  if (breadcrumbSec) {
    for (const b of breadcrumbSec) {
      const inner = b.match(/>([^<]+)<\/a>/);
      if (inner) result.sections.push(inner[1].trim());
    }
  }

  // Country/Region
  const countryPatterns = [
    /(?:Country|Region|國家|地區)[^<]*?<[^>]*>([^<]+)/i,
    /(?:Country|Region)\s*(?:\/\s*Region)?[:\s]*<[^>]*>([^<]+)/i,
    /class="[^"]*country[^"]*"[^>]*>([^<]+)/i,
  ];
  for (const pat of countryPatterns) {
    const m = html.match(pat);
    if (m) { result.country = m[1].trim(); break; }
  }

  // Year
  const yearMatch = html.match(/(?:Year|年份)[^<]*?<[^>]*>\s*(\d{4})/i);
  if (yearMatch) result.year = parseInt(yearMatch[1]);

  // Runtime
  const runtimePatterns = [
    /(\d+)\s*(?:min(?:utes?)?|分鐘)/i,
    /(?:Runtime|Duration|片長)[^<]*?<[^>]*>\s*(\d+)/i,
  ];
  for (const pat of runtimePatterns) {
    const m = html.match(pat);
    if (m) { result.runtime = parseInt(m[1]); break; }
  }

  // Language
  const langMatch = html.match(/(?:Language|語言)[^<]*?<[^>]*>([^<]+)/i);
  if (langMatch) result.language = langMatch[1].trim();

  // Subtitles
  const subMatch = html.match(/(?:Subtitle|字幕)[^<]*?<[^>]*>([^<]+)/i);
  if (subMatch) result.subtitles = subMatch[1].trim();

  // Synopsis
  const synopsisPatterns = [
    /class="[^"]*(?:synopsis|description|content|film[_-]?desc)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|section)/i,
    /(?:Synopsis|劇情簡介|Description)[^<]*<\/[^>]+>\s*<[^>]+>([\s\S]*?)<\/(?:div|p)/i,
  ];
  for (const pat of synopsisPatterns) {
    const m = html.match(pat);
    if (m) {
      const text = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text.length > 30) {
        result.synopsis = text;
        break;
      }
    }
  }

  // Cast
  const castMatch = html.match(/(?:Cast|演員)[^<]*?<[^>]*>([\s\S]*?)<\/(?:div|p|span)/i);
  if (castMatch) {
    result.cast = castMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }

  return result;
}

// --- Main ---

async function main() {
  const rawFilms = JSON.parse(readFileSync(resolve(DATA_DIR, "films.json"), "utf-8"));
  console.log(`\nScraping ${rawFilms.length} HKIFF film detail pages...\n`);

  const enriched = [];
  const errors = [];
  const sectionMapping = {};

  for (let i = 0; i < rawFilms.length; i++) {
    const film = rawFilms[i];
    const url = `https://www.hkiff.org.hk/film/getdetail?fid=${film.fid}`;
    const slug = toSlug(film.title);

    process.stdout.write(`[${i + 1}/${rawFilms.length}] ${film.title}... `);

    try {
      const html = await fetchWithRetry(url);
      const meta = extractMeta(html);

      const sectionIds = meta.sections
        .map(mapSectionLabel)
        .filter(Boolean)
        .filter((v, idx, a) => a.indexOf(v) === idx);

      const primarySection = sectionIds[0] || "world-cinema";
      sectionMapping[slug] = primarySection;

      enriched.push({
        fid: film.fid,
        title: film.title,
        titleZh: meta.titleZh || null,
        director: film.director,
        country: meta.country || null,
        year: meta.year || null,
        runtime: meta.runtime || null,
        language: meta.language || null,
        subtitles: meta.subtitles || null,
        synopsis: meta.synopsis || null,
        cast: meta.cast || null,
        section: primarySection,
        sections: sectionIds.length > 0 ? sectionIds : [primarySection],
        imgSrc: film.imgSrc,
        localImg: film.localImg,
        detailUrl: film.detailUrl,
        imdbId: film.imdbId || null,
        imdbUrl: film.imdbUrl || null,
        letterboxdUrl: film.letterboxdUrl || null,
      });

      const fields = [
        meta.titleZh ? "zh" : null,
        meta.country ? "country" : null,
        meta.year ? "year" : null,
        meta.runtime ? "runtime" : null,
        meta.synopsis ? "synopsis" : null,
        sectionIds.length > 0 ? `sec:${primarySection}` : null,
      ].filter(Boolean);

      console.log(`OK [${fields.join(", ") || "basic only"}]`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errors.push({ fid: film.fid, title: film.title, error: err.message });

      enriched.push({
        fid: film.fid,
        title: film.title,
        titleZh: null,
        director: film.director,
        country: null,
        year: null,
        runtime: null,
        language: null,
        subtitles: null,
        synopsis: null,
        cast: null,
        section: "world-cinema",
        sections: ["world-cinema"],
        imgSrc: film.imgSrc,
        localImg: film.localImg,
        detailUrl: film.detailUrl,
        imdbId: film.imdbId || null,
        imdbUrl: film.imdbUrl || null,
        letterboxdUrl: film.letterboxdUrl || null,
      });
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(
    resolve(DATA_DIR, "films-enriched.json"),
    JSON.stringify(enriched, null, 2),
    "utf-8"
  );
  console.log(`\nWrote data/films-enriched.json (${enriched.length} films)`);

  writeFileSync(
    resolve(DATA_DIR, "film-sections-scraped.json"),
    JSON.stringify(sectionMapping, null, 2),
    "utf-8"
  );
  console.log(`Wrote data/film-sections-scraped.json (${Object.keys(sectionMapping).length} mappings)`);

  const withZh = enriched.filter((f) => f.titleZh).length;
  const withCountry = enriched.filter((f) => f.country).length;
  const withRuntime = enriched.filter((f) => f.runtime).length;
  const withSynopsis = enriched.filter((f) => f.synopsis).length;

  console.log(`\nSummary:`);
  console.log(`  Chinese titles: ${withZh}/${enriched.length}`);
  console.log(`  Country: ${withCountry}/${enriched.length}`);
  console.log(`  Runtime: ${withRuntime}/${enriched.length}`);
  console.log(`  Synopsis: ${withSynopsis}/${enriched.length}`);
  console.log(`  Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\nFailed films:`);
    for (const e of errors) {
      console.log(`  - ${e.title} (fid=${e.fid}): ${e.error}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
