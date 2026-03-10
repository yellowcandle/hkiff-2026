## Why

The app's `data/films.json` contains only basic scraped data (title, director, image URL) for 175 films. Critical fields are missing: section assignments, country, year, runtime, language, subtitles, and synopsis. The previous change built a transformation layer with a manual section mapping and bilingual title derivation from screenings, but ~60% of the data is still incomplete or estimated. The HKIFF website (`hkiff.org.hk/film/getdetail?fid=<id>`) has authoritative detail pages with all this information. Scraping these pages would make the app's data complete and accurate.

## What Changes

- **Scrape all 175 film detail pages** from `hkiff.org.hk` to extract: section, country, year, runtime, language, subtitles, synopsis (en/zh), and Chinese title.
- **Enrich `data/films.json`** with the scraped fields, replacing the minimal raw data with a complete record per film.
- **Update `data/film-sections.json`** with authoritative section assignments from the website, replacing the current manual/heuristic mapping.
- **Update the data transformation layer** in `src/lib/data.ts` to use the enriched data directly instead of deriving it at runtime.

## Capabilities

### New Capabilities
- `film-scraper`: Script to fetch and parse all 175 HKIFF film detail pages, extracting structured metadata and outputting enriched JSON.

### Modified Capabilities
- `data-transform`: Update transformation to use enriched film data (section, country, year, runtime, synopsis now available directly in films.json instead of being derived/defaulted).

## Impact

- **`data/films.json`** — Will grow from ~9 fields to ~15+ fields per film with authoritative data
- **`data/film-sections.json`** — Will be replaced with accurate scraped section assignments
- **`src/lib/data.ts`** — Transformation simplifies since enriched data matches Film type more closely
- **`src/lib/types.ts`** — Optional fields (country, year, runtime, synopsis) can potentially become required again
- **All pages** — Film Detail page will show synopsis, runtime, language; Films page section counts become accurate
- **New dependency**: scraping script (Node.js, can be a one-time run script in `scripts/`)
