## Context

Film detail pages currently show metadata (director, country, year, runtime, language, subtitles) and screenings. There are no links to external film databases. The data layer is static JSON files maintained manually by the developer.

## Goals / Non-Goals

**Goals:**
- Add `imdbId` and `letterboxdSlug` as optional nullable fields to the `Film` type and `films.json`
- Render IMDb and Letterboxd links on film detail pages when the fields are present
- Support graceful omission — no visual gap or placeholder when fields are absent

**Non-Goals:**
- Automated ID lookup or enrichment scripts (manual data entry only)
- Letterboxd API integration (no public API exists)
- TMDB integration of any kind
- Showing links on film catalogue cards (detail page only)
- Fetching ratings or review counts from either platform

## Decisions

### D1: Store ID/slug, construct URL at render time

**Choice:** `imdbId: "tt21823606"` and `letterboxdSlug: "souleymanes-story"` — not full URLs.

**Rationale:** Shorter data, explicit identifiers, URL construction is a one-liner. If either platform changes URL structure (unlikely), fix is in one render location not in every JSON entry.

IMDb URL: `https://www.imdb.com/title/{imdbId}/`
Letterboxd URL: `https://letterboxd.com/film/{letterboxdSlug}/`

### D2: Optional fields, `undefined` not `null`

**Choice:** TypeScript type uses `imdbId?: string` (optional), not `imdbId: string | null`.

**Rationale:** Matches JSON omission pattern — entries without the field simply don't have the key, consistent with how `films.json` entries will be authored (add the field when known, omit when not). No need to explicitly write `null` for every unresolved film.

### D3: Plain `<a>` links, no third-party logos

**Choice:** Styled text links ("IMDb ↗" / "Letterboxd ↗"), not brand icon buttons.

**Rationale:** No SVG assets to maintain, no logo licensing concerns, consistent with the site's existing link style. Film-savvy users recognise the names without icons.

### D4: Links placed below metadata grid, above synopsis

**Choice:** External links row positioned after the `<dl>` metadata grid and before the synopsis.

**Rationale:** Metadata and external references are related (both describe the film). Placing links before the synopsis keeps them discoverable without interrupting the narrative flow of reading the synopsis then seeing screenings.

## Risks / Trade-offs

- **Data staleness**: IMDb IDs are permanent; Letterboxd slugs are stable but could change if Letterboxd renames a film entry. Low risk — festival-scale catalogue, monitored manually.
- **Partial population**: The site ships with IDs populated only for the current 15 films initially; the remaining 100–200 entries when added will need IDs filled in at the same time. Missing IDs mean no links shown — not a visible error.
- **2025 films**: Very recent festival films may not yet be listed on Letterboxd or may have few reviews on IMDb. Fields simply left empty in that case.
