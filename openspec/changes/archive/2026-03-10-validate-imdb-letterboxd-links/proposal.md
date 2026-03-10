## Why

The existing IMDb and Letterboxd links in `films.json` were from an initial scrape that matched by title alone. Title-only matching causes wrong links for ambiguous titles (e.g., "Cyclone" → 1987 Italian film instead of 2026 Philip Yung film, "Year One" → 2009 Jack Black comedy instead of 1974 Rossellini). With enriched brochure data now providing accurate year, director, and Chinese titles, we can validate and fix all 175 film links.

## What Changes

- **Validate all IMDb IDs** using IMDb suggestions API with `title + year` queries, cross-checking director name
- **Validate all Letterboxd URLs** by probing slug variations (`/film/title/`, `/film/title-year/`)
- **Fix mismatched entries** where the current ID points to the wrong film
- **Fill gaps** for the 7 films missing IMDb IDs and 13 missing Letterboxd URLs
- **Output a validation report** showing what was fixed

## Capabilities

### New Capabilities
- `link-validator`: Script to validate and fix IMDb/Letterboxd links for all films using title+year+director matching

### Modified Capabilities
(none)

## Impact

- **`data/films.json`** — `imdbId` and `letterboxdUrl` fields corrected for mismatched entries
- **Film Detail page** — IMDb and Letterboxd links now point to correct films
