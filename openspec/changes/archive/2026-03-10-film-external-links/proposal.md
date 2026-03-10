## Why

Film-savvy users want to read reviews, check ratings, and log viewings on platforms they already use. Adding IMDb and Letterboxd links on film detail pages connects the HKIFF catalogue to the wider film community without requiring any backend infrastructure.

## What Changes

- **`data/films.json` schema extended** — two optional nullable fields added per film: `imdbId` (e.g. `"tt21823606"`) and `letterboxdSlug` (e.g. `"souleymanes-story"`); existing entries without these fields are unaffected
- **Film detail page updated** — a small external links row appears beneath the metadata grid when either field is present; links open in a new tab
- **TypeScript types updated** — `Film` type in `src/lib/types.ts` gains the two optional fields
- Films not yet listed on either platform simply show no link (graceful omission, no UI gap)

## Capabilities

### New Capabilities
- `film-external-links`: display of IMDb and Letterboxd links on the film detail page when IDs are present in the data

### Modified Capabilities
- `film-detail`: film detail page gains an external links row (requirement change: new UI element conditionally rendered)
- `data-layer`: `Film` type and `films.json` schema gain two optional fields

## Impact

- **Modified files**: `src/lib/types.ts`, `src/app/[locale]/films/[id]/page.tsx`, `data/films.json` (schema only — populating IDs is a separate data task)
- **No new dependencies** — plain `<a>` links, no SDK or API client needed
- **Data population**: IMDb IDs found at imdb.com, Letterboxd slugs read directly from letterboxd.com film URLs; both entered manually into `films.json`
- **Scale**: designed for 100–200 film entries; both fields optional so partial population ships cleanly
