#!/usr/bin/env node
/**
 * Validate and fix IMDb IDs and Letterboxd URLs for all films.
 * Uses IMDb suggestions API (JSON) and Letterboxd direct URL probing.
 * Usage: node scripts/validate-film-links.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");

// Enable proxy support if HTTPS_PROXY is set (Node fetch doesn't use it by default)
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxyUrl) {
  try {
    const require = createRequire(import.meta.url);
    const { ProxyAgent, setGlobalDispatcher } = require("undici");
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  } catch {
    // undici not available, proxy won't work
  }
}
const IMDB_DELAY = 350;
const LB_DELAY = 500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toSlug(title) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize title for comparison
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// --- IMDb suggestions API ---

async function queryImdb(title, year) {
  const query = encodeURIComponent(`${title} ${year || ""}`.trim());
  const firstChar = query.charAt(0).toLowerCase();
  const url = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${query}.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HKIFF-Validator/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.d || []).filter(
      (d) => d.qid === "movie" || d.qid === "tvMovie" || d.qid === "short" || d.qid === "tvSpecial"
    );
  } catch {
    return [];
  }
}

function findBestImdbMatch(results, title, year, director) {
  if (!results.length) return null;

  const normTitle = normalize(title);
  const normDirector = director ? normalize(director.split(",")[0].trim()) : "";

  // Score each result
  const scored = results.map((r) => {
    let score = 0;
    const normR = normalize(r.l || "");

    // Title match
    if (normR === normTitle) score += 10;
    else if (normR.includes(normTitle) || normTitle.includes(normR)) score += 5;

    // Year match
    if (r.y && year) {
      if (r.y === year) score += 8;
      else if (Math.abs(r.y - year) <= 1) score += 4;
    }

    // Director match (if available in the 's' field - stars/description)
    if (r.s && normDirector) {
      const normS = normalize(r.s);
      if (normS.includes(normDirector)) score += 6;
    }

    return { ...r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].score >= 10 ? scored[0] : scored[0].score >= 8 ? scored[0] : null;
}

// --- Letterboxd validation ---

const LB_HEADERS = {
  "User-Agent": "HKIFF-Validator/1.0",
  Accept: "text/html",
};

async function validateFilmPage(url, year, director) {
  try {
    const res = await fetch(url, { headers: LB_HEADERS, redirect: "follow" });
    if (!res.ok) return false;
    const html = await res.text();

    // Extract director from meta tag for precise matching
    const metaDir = html.match(/twitter:data1[^>]*content="([^"]+)"/);
    const pageDirector = metaDir ? metaDir[1] : "";

    // Extract year from Letterboxd page
    const yearMatch = html.match(/\/films\/year\/(\d{4})\//);
    const pageYear = yearMatch ? parseInt(yearMatch[1]) : null;

    // Director check: match full first-director name (not just last name)
    if (director) {
      const expected = normalize(director.split(",")[0].trim());
      if (pageDirector) {
        if (!normalize(pageDirector).includes(expected)) return false;
      } else {
        // Fallback: check last name in full HTML
        const directorLast = director.split(",")[0].trim().split(" ").pop();
        if (!html.includes(directorLast)) return false;
      }
    }

    // Year check: allow ±1 year tolerance
    if (year && pageYear && Math.abs(pageYear - year) > 1) return false;

    return true;
  } catch {
    return false;
  }
}

async function validateLetterboxd(slug, year, director) {
  if (!slug) return null;
  const variations = [
    `https://letterboxd.com/film/${slug}/`,
    year ? `https://letterboxd.com/film/${slug}-${year}/` : null,
    year ? `https://letterboxd.com/film/${slug}-${year}-1/` : null,
  ].filter(Boolean);

  for (const url of variations) {
    if (await validateFilmPage(url, year, director)) return url;
    await sleep(LB_DELAY);
  }

  return null;
}

async function searchLetterboxd(query, year, director) {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://letterboxd.com/search/films/${encoded}/`;
  try {
    const res = await fetch(searchUrl, { headers: LB_HEADERS, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    // Extract candidate film slugs from search results
    const slugMatches = [...html.matchAll(/href="\/film\/([^"]+)\/"/g)];
    const candidates = [...new Set(slugMatches.map((m) => m[1]))].slice(0, 5);

    for (const slug of candidates) {
      const url = `https://letterboxd.com/film/${slug}/`;
      if (await validateFilmPage(url, year, director)) return url;
      await sleep(LB_DELAY);
    }
  } catch {
    // ignore search errors
  }
  return null;
}

// --- Main ---

async function main() {
  const films = JSON.parse(readFileSync(resolve(DATA_DIR, "films.json"), "utf-8"));
  console.log(`\nValidating ${films.length} films...\n`);

  const report = {
    imdb: { confirmed: [], fixed: [], unresolved: [], added: [] },
    letterboxd: { confirmed: [], fixed: [], unresolved: [], added: [] },
  };

  let updatedCount = 0;

  for (let i = 0; i < films.length; i++) {
    const film = films[i];
    const slug = toSlug(film.title);
    process.stdout.write(`[${i + 1}/${films.length}] ${film.title}`);

    // --- IMDb validation ---
    const results = await queryImdb(film.title, film.year);
    let match = findBestImdbMatch(results, film.title, film.year, film.director);

    // Fallback: try Chinese title
    if (!match && film.titleZh && film.titleZh !== film.title) {
      await sleep(IMDB_DELAY);
      const zhResults = await queryImdb(film.titleZh, film.year);
      match = findBestImdbMatch(zhResults, film.titleZh, film.year, film.director);
    }

    if (match) {
      if (film.imdbId === match.id) {
        report.imdb.confirmed.push({ title: film.title, id: match.id });
        process.stdout.write(` imdb:OK`);
      } else if (film.imdbId) {
        report.imdb.fixed.push({
          title: film.title,
          oldId: film.imdbId,
          newId: match.id,
          matchTitle: match.l,
          matchYear: match.y,
        });
        film.imdbId = match.id;
        film.imdbUrl = `https://www.imdb.com/title/${match.id}/`;
        updatedCount++;
        process.stdout.write(` imdb:FIXED(${match.id})`);
      } else {
        report.imdb.added.push({ title: film.title, id: match.id });
        film.imdbId = match.id;
        film.imdbUrl = `https://www.imdb.com/title/${match.id}/`;
        updatedCount++;
        process.stdout.write(` imdb:ADDED(${match.id})`);
      }
    } else {
      report.imdb.unresolved.push({ title: film.title, year: film.year, currentId: film.imdbId });
      process.stdout.write(` imdb:UNRESOLVED`);
    }

    await sleep(IMDB_DELAY);

    // --- Letterboxd validation ---
    const currentLbSlug = film.letterboxdUrl
      ? film.letterboxdUrl.replace("https://letterboxd.com/film/", "").replace(/\/$/, "")
      : null;

    // Skip compilations/programmes that won't have Letterboxd pages
    const isCompilation =
      !film.director ||
      /\b(programme|collection|shorts|works|projects)\b/i.test(film.title);

    let validLbUrl = null;
    if (isCompilation) {
      report.letterboxd.unresolved.push({
        title: film.title,
        currentUrl: film.letterboxdUrl,
        reason: "compilation",
      });
      process.stdout.write(` lb:SKIP(compilation)`);
    } else {
      // Try slugs from English title and original title
      const slugsToTry = [slug];
      if (film.titleZh && film.titleZh !== film.title) {
        const zhSlug = toSlug(film.titleZh);
        if (zhSlug) slugsToTry.push(zhSlug);
      }

      for (const s of slugsToTry) {
        validLbUrl = await validateLetterboxd(s, film.year, film.director);
        if (validLbUrl) break;
      }

      // Fallback: search Letterboxd with English title
      if (!validLbUrl) {
        validLbUrl = await searchLetterboxd(film.title, film.year, film.director);
      }

      // Fallback: search Letterboxd with original title
      if (!validLbUrl && film.titleZh && film.titleZh !== film.title) {
        await sleep(LB_DELAY);
        validLbUrl = await searchLetterboxd(film.titleZh, film.year, film.director);
      }

      if (validLbUrl) {
        const newSlug = validLbUrl
          .replace("https://letterboxd.com/film/", "")
          .replace(/\/$/, "");
        if (currentLbSlug === newSlug) {
          report.letterboxd.confirmed.push({ title: film.title, url: validLbUrl });
          process.stdout.write(` lb:OK`);
        } else if (film.letterboxdUrl) {
          report.letterboxd.fixed.push({
            title: film.title,
            oldUrl: film.letterboxdUrl,
            newUrl: validLbUrl,
          });
          film.letterboxdUrl = validLbUrl;
          updatedCount++;
          process.stdout.write(` lb:FIXED`);
        } else {
          report.letterboxd.added.push({ title: film.title, url: validLbUrl });
          film.letterboxdUrl = validLbUrl;
          updatedCount++;
          process.stdout.write(` lb:ADDED`);
        }
      } else {
        report.letterboxd.unresolved.push({ title: film.title, currentUrl: film.letterboxdUrl });
        process.stdout.write(` lb:UNRESOLVED`);
      }
    }

    console.log();
    await sleep(LB_DELAY);
  }

  // Write updated films
  writeFileSync(resolve(DATA_DIR, "films.json"), JSON.stringify(films, null, 2), "utf-8");
  console.log(`\nUpdated films.json (${updatedCount} changes)`);

  // Write report
  writeFileSync(
    resolve(DATA_DIR, "link-validation-report.json"),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  // Summary
  console.log(`\nIMDb:`);
  console.log(`  Confirmed: ${report.imdb.confirmed.length}`);
  console.log(`  Fixed: ${report.imdb.fixed.length}`);
  console.log(`  Added: ${report.imdb.added.length}`);
  console.log(`  Unresolved: ${report.imdb.unresolved.length}`);
  console.log(`\nLetterboxd:`);
  console.log(`  Confirmed: ${report.letterboxd.confirmed.length}`);
  console.log(`  Fixed: ${report.letterboxd.fixed.length}`);
  console.log(`  Added: ${report.letterboxd.added.length}`);
  console.log(`  Unresolved: ${report.letterboxd.unresolved.length}`);

  if (report.imdb.fixed.length > 0) {
    console.log(`\nIMDb fixes:`);
    report.imdb.fixed.forEach((f) =>
      console.log(`  ${f.title}: ${f.oldId} → ${f.newId} (${f.matchTitle} ${f.matchYear})`)
    );
  }

  if (report.imdb.unresolved.length > 0) {
    console.log(`\nIMDb unresolved:`);
    report.imdb.unresolved.forEach((f) =>
      console.log(`  ${f.title} (${f.year || "?"}) [current: ${f.currentId || "none"}]`)
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
