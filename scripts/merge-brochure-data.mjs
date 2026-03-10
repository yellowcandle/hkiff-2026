/**
 * merge-brochure-data.mjs
 *
 * Merges brochure film metadata into the existing films.json.
 * Matches films by English title (case-insensitive).
 * Enriches existing entries with: titleZh, country, year, language,
 * synopsis (English), synopsisZh (Chinese), and authoritative section.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const filmsPath = join(rootDir, 'data', 'films.json');
const brochurePath = join(rootDir, 'data', 'brochure-films.json');

// Read both files
const films = JSON.parse(readFileSync(filmsPath, 'utf-8'));
const brochureFilms = JSON.parse(readFileSync(brochurePath, 'utf-8'));

// Build a lookup map from brochure films by normalized English title
const brochureMap = new Map();

for (const bf of brochureFilms) {
  if (!bf.titleEn) continue;

  // Normalize the title for matching
  const key = normalizeTitle(bf.titleEn);
  brochureMap.set(key, bf);

  // Also add without parenthetical subtitle
  // e.g. "Certified Copy (Copie conforme)" -> "certified copy"
  const withoutParen = bf.titleEn.replace(/\s*\([^)]+\)\s*$/, '').trim();
  if (withoutParen !== bf.titleEn) {
    const altKey = normalizeTitle(withoutParen);
    if (!brochureMap.has(altKey)) {
      brochureMap.set(altKey, bf);
    }
  }

  // Also try with "a.k.a." removed
  // e.g. "Xiao Wu a.k.a. The Pickpocket" -> "xiao wu" and "the pickpocket"
  if (bf.titleEn.includes('a.k.a.')) {
    const parts = bf.titleEn.split(/\s*a\.k\.a\.\s*/);
    for (const part of parts) {
      const partKey = normalizeTitle(part.trim());
      if (!brochureMap.has(partKey)) {
        brochureMap.set(partKey, bf);
      }
    }
  }
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Merge
let matched = 0;
let unmatched = 0;
const unmatchedFilms = [];

for (const film of films) {
  if (!film.title) continue;

  const key = normalizeTitle(film.title);
  let brochureFilm = brochureMap.get(key);

  // Try alternate matching if not found
  if (!brochureFilm) {
    // Try without articles at the start
    const withoutArticle = key.replace(/^(the|a|an)\s+/, '');
    brochureFilm = brochureMap.get(withoutArticle);
  }

  if (!brochureFilm) {
    // Try partial match - check if any brochure title contains or is contained by the film title
    for (const [bKey, bf] of brochureMap) {
      if (bKey === key || bKey.includes(key) || key.includes(bKey)) {
        brochureFilm = bf;
        break;
      }
    }
  }

  if (brochureFilm) {
    matched++;

    // Enrich the existing film entry
    if (brochureFilm.titleZh) {
      // Clean up titleZh - remove any leading page numbers
      let cleanZh = brochureFilm.titleZh.replace(/^\d+\s+/, '').trim();
      film.titleZh = cleanZh;
    }

    if (brochureFilm.country) {
      film.country = brochureFilm.country;
    }

    if (brochureFilm.year) {
      film.year = brochureFilm.year;
    }

    if (brochureFilm.language) {
      film.language = brochureFilm.language;
    }

    if (brochureFilm.synopsisEn) {
      film.synopsis = brochureFilm.synopsisEn;
    }

    if (brochureFilm.synopsisZh) {
      film.synopsisZh = brochureFilm.synopsisZh;
    }

    // Update section with brochure's authoritative section
    if (brochureFilm.section) {
      film.section = brochureFilm.section;
      film.sections = [brochureFilm.section];
    }
  } else {
    unmatched++;
    unmatchedFilms.push(film.title);
  }
}

// Write the merged result back
writeFileSync(filmsPath, JSON.stringify(films, null, 2), 'utf-8');

console.log(`Merge complete.`);
console.log(`  Matched: ${matched}`);
console.log(`  Unmatched: ${unmatched}`);
console.log(`  Total films in films.json: ${films.length}`);

if (unmatchedFilms.length > 0 && unmatchedFilms.length <= 30) {
  console.log(`\nUnmatched films from films.json:`);
  for (const title of unmatchedFilms) {
    console.log(`  - ${title}`);
  }
} else if (unmatchedFilms.length > 30) {
  console.log(`\nFirst 30 unmatched films from films.json:`);
  for (const title of unmatchedFilms.slice(0, 30)) {
    console.log(`  - ${title}`);
  }
}

// Show a few merged examples
console.log(`\nSample merged entries:`);
const mergedExamples = films.filter(f => f.titleZh && f.synopsis).slice(0, 3);
for (const f of mergedExamples) {
  console.log(`  ${f.title} (${f.titleZh}) - ${f.section}`);
  console.log(`    country: ${f.country}, year: ${f.year}, lang: ${f.language}`);
  console.log(`    synopsis: ${(f.synopsis || '').substring(0, 80)}...`);
}
