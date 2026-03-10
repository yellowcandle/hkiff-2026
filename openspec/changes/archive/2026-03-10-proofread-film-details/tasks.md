## 1. Scraper Script

- [x] 1.1 Create `scripts/scrape-film-details.mjs` — fetches each film's detail page from `hkiff.org.hk/film/getdetail?fid=<fid>`, parses HTML to extract metadata
- [x] 1.2 Add rate limiting (500ms delay) and retry logic (retry once on 429/503)
- [x] 1.3 Run the scraper and output `data/films-enriched.json`
- [x] 1.4 Review scraper output — 0 errors, 175/175 runtime extracted; synopsis/sections/country not extractable (JS-rendered); cleaned invalid synopses

## 2. Data Update

- [x] 2.1 Rename `data/films.json` → `data/films-raw.json` and `data/films-enriched.json` → `data/films.json`
- [x] 2.2 Keep manual section mapping (scraper couldn't extract sections from JS-rendered site); enriched data adds runtime
- [x] 2.3 Update `src/lib/data.ts` — use enriched fields (runtime) while keeping bilingual titles from screenings and manual section mapping

## 3. Type & Component Updates

- [x] 3.1 Types already support optional fields from previous change
- [x] 3.2 Film Detail page shows full metadata: director, country, year, runtime, language, synopsis, section label, bilingual title
- [x] 3.3 All 5 pages render correctly with brochure-enriched data

## 4. Validation

- [x] 4.1 Home page: featured films show country+year on hover (Singapore·2026, Hong Kong·2026, Taiwan·2025, etc.)
- [x] 4.2 Film Detail: Cyclone shows 超風, Hong Kong, 2026, 119min, CHI, Gala Presentation, synopsis, screening 19:30–21:29
- [x] 4.3 Section counts authoritative from brochure: Gala(22), Focus(16), Firebird(46), Pan-Chinese(14), Masters(16), World(24), Docs(10), Kaleidoscope(27)
- [x] 4.4 173/175 films have Chinese titles, 151 have country, 148 have English synopsis, 150 have Chinese synopsis
