## 1. Data Layer Fixes

- [x] 1.1 Update `src/lib/types.ts` — make `country`, `year`, `runtime`, `synopsis`, `language`, `subtitles` optional on the `Film` type
- [x] 1.2 Create `data/film-sections.json` — manual mapping of film slugs to section IDs (at minimum map galas, focus films, and well-known titles; default remainder to `world-cinema`)
- [x] 1.3 Add slug generation utility in `src/lib/data.ts` — function `toSlug(title: string): string` that lowercases, replaces spaces/special chars with hyphens
- [x] 1.4 Add `transformFilm()` in `src/lib/data.ts` — maps raw film `{fid, title, director, imgSrc, localImg}` → `Film` type using slug, bilingual title from screenings, section from mapping, posterUrl from localImg/imgSrc
- [x] 1.5 Update `getFilms()` to use `transformFilm()` instead of raw cast
- [x] 1.6 Update `getFilm(id)` to match by slug-based ID

## 2. Component Fixes

- [x] 2.1 Update `FilmCard.tsx` — handle optional `country`/`year` fields gracefully (show what's available, skip what's missing)
- [x] 2.2 Update Home page `page.tsx` — verify featured films render after data fix; adjust section filter if `gala-presentation` has 0 films
- [x] 2.3 Update Films catalogue page — verify filter chips work with real section data
- [x] 2.4 Update Film Detail page — verify poster, metadata, and screenings render correctly with transformed data
- [x] 2.5 Update Schedule page — verify date grid populates with real screening dates and film titles

## 3. Validation & Testing

- [x] 3.1 Start dev server and verify Home page shows featured films with posters
- [x] 3.2 Verify Films page shows all 175 films with working section filter chips
- [x] 3.3 Verify Film Detail page shows poster, director, and linked screenings
- [x] 3.4 Verify Schedule page shows screenings organized by date
- [x] 3.5 Verify My Plan page allows adding/removing screenings
- [x] 3.6 Test locale switching (en → zh) shows Chinese titles where available
