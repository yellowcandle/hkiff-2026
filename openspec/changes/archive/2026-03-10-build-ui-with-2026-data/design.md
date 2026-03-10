## Context

The HKIFF 2026 app has a complete UI layer (Home, Films, Film Detail, Schedule, My Plan) built with Next.js 15 + Tailwind + next-intl. However, the data layer is broken:

- `data/films.json` contains 175 films in raw scrape format: `{fid, title (string), director, imgSrc, localImg, ...}`
- `src/lib/types.ts` defines `Film` as `{id, title: {en, zh}, section, country, year, runtime, synopsis, posterUrl, ...}`
- `data/screenings.json` has 140 screenings that reference films by slug (e.g., `"we-are-all-strangers"`) and carry bilingual `filmTitle: {en, zh}`
- Films have NO section assignment, no bilingual title, no year/country/runtime

The cast `filmsData as Film[]` silently produces objects missing every expected field, causing 0 films to render.

## Goals / Non-Goals

**Goals:**
- Make all 5 pages render with real HKIFF 2026 data
- Bridge raw film data to the `Film` type via a transformation layer
- Link films to screenings via slug-based IDs
- Show film posters using available image URLs
- Make section filtering functional with reasonable assignments

**Non-Goals:**
- Enriching every film with perfect country/year/runtime metadata (use defaults)
- Creating a build-time data pipeline or ETL system
- Changing the visual design (already upgraded separately)
- Adding new pages or features

## Decisions

### 1. Transform in `data.ts`, not pre-process JSON

**Decision**: Add a `transformFilm()` function in `src/lib/data.ts` that maps raw film objects to the `Film` type at load time.

**Rationale**: Keeps the source data untouched (easy to re-scrape), no build step needed, and the transformation is simple enough to be inline. Alternative was a build script to pre-process films.json — rejected because it adds tooling complexity for a small transform.

### 2. Generate slugs from film titles to match screenings

**Decision**: Generate slugs from film titles using the same algorithm the screenings data uses (lowercase, replace spaces/special chars with hyphens).

**Rationale**: Screenings already use slug-based `filmId` values. Matching by title-derived slug avoids a manual mapping table. Edge cases (duplicate titles) are unlikely given the festival context.

### 3. Derive bilingual titles from screenings data

**Decision**: Build a lookup map from `screenings.filmId → screenings.filmTitle` and use it to populate `Film.title.zh`. Fall back to the English title if no screening match exists.

**Rationale**: Screenings carry `filmTitle: {en, zh}` for all 115 films with screenings. The remaining ~60 films without screenings will have English-only titles, which is acceptable.

### 4. Make Film type fields optional where data is incomplete

**Decision**: Make `country`, `year`, `runtime`, `synopsis`, `language`, `subtitles` optional in the `Film` type. Required fields: `id`, `title`, `director`, `posterUrl`, `section`.

**Rationale**: Raw data doesn't have these fields. Making them optional avoids dummy values while keeping TypeScript happy. Components already handle missing data gracefully with fallbacks.

### 5. Assign sections via title/director heuristic + default bucket

**Decision**: Create a static mapping in `data/film-sections.json` that maps `filmId (slug) → sectionId`. Films without an explicit mapping go into `"world-cinema"` as a default.

**Rationale**: The HKIFF brochure PDF contains section assignments but extracting them programmatically is complex. A manual JSON mapping is straightforward to create and maintain. The `world-cinema` default is the largest catch-all section.

## Risks / Trade-offs

- **[~60 films have English-only titles]** → Acceptable for MVP; Chinese titles can be added incrementally
- **[Section assignments may be imprecise]** → Manual mapping from brochure; errors are cosmetic not functional
- **[Poster images may 404 if localImg files don't exist]** → Fall back to remote `imgSrc` URL, then to placeholder
- **[Slug generation may not match all screening filmIds]** → Validate with a check script; manually fix mismatches
