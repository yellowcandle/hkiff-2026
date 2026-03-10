## Why

Our screenings dataset covers only 127 of 318 screening codes from the HKIFF 50 brochure calendar — 39% coverage. The remaining 191 screenings are invisible to users, meaning they cannot plan for over half the festival's programme. Additionally, we capture zero metadata about non-film events (Master Classes, Face to Face sessions, Seminars, talks) that are integral to the festival experience.

## What Changes

- Parse the complete brochure calendar (HKIFF50-BF.txt lines 7809-9977) to extract all 318 screening entries with times, venues, bilingual film titles, durations, and screening codes
- Scrape the HKIFF website AJAX API for all 12 festival days to obtain ticket URLs
- Merge both data sources by screening code, producing a complete screenings dataset
- Extend the Screening type with optional event metadata (type, speaker, language) for Master Class, Face to Face, Seminar, Post-talk, and Pre-talk events
- Add any films referenced by new screenings that are missing from films.json
- Replace the current 127-entry screenings.json with the complete 318-entry dataset

## Capabilities

### New Capabilities
- `brochure-calendar-parser`: Parse the brochure text calendar section into structured screening data (times, venues, codes, bilingual titles, durations, event metadata)
- `website-calendar-scraper`: Scrape the HKIFF website AJAX calendar endpoint to obtain ticket URLs and supplement screening data
- `screening-events`: Extend screening data model with event metadata for non-film programme items (Master Class, Face to Face, Seminar, Post-talk, Pre-talk)

### Modified Capabilities
- `data-transform`: Screening type gains optional `event` field; data merge logic needed for two-source pipeline

## Impact

- `data/screenings.json` — complete replacement (127 → 318 entries)
- `data/films.json` — additions for any films missing from current dataset
- `src/lib/types.ts` — Screening type extended with event metadata
- `src/lib/data.ts` — minor updates if needed for new fields
- New scripts: `scripts/parse-brochure-calendar.ts`, `scripts/scrape-hkiff-calendar.ts`
- Schedule page and plan features will automatically show more screenings
- No breaking changes to existing UI components
