## Context

The app has 175 films in `data/films.json` with minimal data (fid, title, director, image URLs). The HKIFF website has detail pages at `hkiff.org.hk/film/getdetail?fid=<fid>` with complete metadata. Each page contains: section(s), country, year, runtime, language, subtitles, synopsis, Chinese title, and cast.

Currently the data layer derives bilingual titles from screenings and uses a manual section mapping. This is ~60% accurate. Scraping would make it ~100% accurate.

## Goals / Non-Goals

**Goals:**
- Scrape all 175 film detail pages to extract complete metadata
- Output enriched `films.json` with all fields populated
- Generate accurate `film-sections.json` from scraped section data
- Simplify the data transformation layer

**Non-Goals:**
- Building a recurring scraping pipeline (this is a one-time enrichment)
- Scraping screening/ticketing data (already have that in `screenings.json`)
- Scraping non-film pages (events, venues)

## Decisions

### 1. One-time Node.js script in `scripts/`

**Decision**: Create `scripts/scrape-film-details.mjs` that fetches all 175 detail pages and outputs enriched JSON.

**Rationale**: One-time operation, no need for a framework. Node.js with built-in `fetch` is sufficient. The script can be re-run if the website updates.

### 2. Rate-limited sequential fetching

**Decision**: Fetch pages sequentially with a 500ms delay between requests to be respectful to the HKIFF server.

**Rationale**: 175 pages × 500ms = ~90 seconds total. Parallel fetching risks getting blocked. The script is run rarely.

### 3. Enrich existing films.json in-place

**Decision**: The scraper outputs a new `data/films-enriched.json` that replaces `films.json`. Keep the original as `films-raw.json` for reference.

**Rationale**: Clean separation — original scrape data preserved, enriched data used by the app.

### 4. Handle multi-section films

**Decision**: Each film gets a primary `section` field (first section listed on the page) and a `sections` array for all sections.

**Rationale**: Some films appear in multiple sections (e.g., "We Are All Strangers" is in both "Gala Presentation" and "Masters & Auteurs"). The primary section is used for filtering, the array for display.

## Risks / Trade-offs

- **[Website structure may change]** → Script is disposable; can be adjusted quickly
- **[Some pages may have inconsistent formatting]** → Add error handling per page, log failures for manual review
- **[Rate limiting / blocking]** → 500ms delay should be safe; add retry logic for 429/503 responses
- **[Chinese content encoding]** → Use UTF-8 throughout; Node.js handles this natively
