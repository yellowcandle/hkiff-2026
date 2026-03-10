## Why

The HKIFF 2026 (50th edition) frontend exists with pages for Home, Films, Film Detail, Schedule, and My Plan — but the data layer is broken. Raw scraped film data (`films.json`) uses `{fid, title}` while the app's `Film` type expects `{id, title: {en, zh}, section, country, year, ...}`. Screenings reference films by slug (`"we-are-all-strangers"`) not by `fid` (`"2944"`). The result: every page renders 0 films. The UI design was also recently upgraded with editorial typography (Instrument Serif + DM Sans) and cinematic styling, but can't be validated until the data actually flows through.

## What Changes

- **Fix data transformation layer** — Bridge raw `films.json` format to the `Film` type by generating slugs, deriving bilingual titles from screenings, and mapping image URLs.
- **Fix film↔screening linkage** — Match films to screenings via slug-based IDs so film detail pages show their screenings and the schedule page populates.
- **Add section assignments** — Map the 175 films to the 8 festival sections so filtering and the "Browse by Section" feature works.
- **Validate and fix all 5 pages** — Ensure Home (featured films), Films (catalogue + filters), Film Detail (poster + screenings), Schedule (date grid), and My Plan all render correctly with real data.
- **Fix poster images** — Wire up `localImg`/`imgSrc` from the raw data as `posterUrl` so film cards show actual posters.

## Capabilities

### New Capabilities
- `data-transform`: Data transformation layer that bridges raw HKIFF scrape data to the app's typed data model (`Film`, `Screening` linkage, section mapping, bilingual title derivation).

### Modified Capabilities
(none — no existing specs to modify)

## Impact

- **`src/lib/data.ts`** — Core data loading functions need transformation logic
- **`src/lib/types.ts`** — May need adjustments to make fields optional for incomplete data
- **`data/films.json`** — Needs enrichment with section assignments and slug-based IDs
- **All page components** — Will be validated against real data; minor fixes expected for edge cases (missing posters, long titles, etc.)
- **No dependency changes** — Pure data/component fixes within existing Next.js + Tailwind stack
