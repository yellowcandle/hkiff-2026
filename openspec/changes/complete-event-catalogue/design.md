## Context

The HKIFF 50 app currently has 127 screening entries in `data/screenings.json`, sourced from the HKIFF website scraper. The brochure calendar (HKIFF50-BF.txt lines 7809-9977) contains all 318 screening codes — meaning we're missing 60% of the programme. The brochure also contains event metadata (Master Class, Face to Face, Seminar) that the website doesn't expose in structured form.

Two data sources are available:
1. **Brochure text** (HKIFF50-BF.txt): Complete calendar with all 318 codes, times, venues, bilingual titles, durations, and inline event labels
2. **HKIFF website AJAX API** (`/film/ajaxGetCalenderList/date/{date}/venue_id/{id}`): Ticket URLs, film detail page URLs

Current Screening type in `src/lib/types.ts` has no event metadata field.

## Goals / Non-Goals

**Goals:**
- Complete 318-entry screenings dataset with all brochure calendar entries
- Structured event metadata for Master Class, Face to Face, Seminar, Post-talk, Pre-talk
- Ticket URLs from HKIFF website where available
- Any missing films added to films.json
- Backward-compatible — existing UI continues working, just sees more data

**Non-Goals:**
- UI changes for displaying event metadata (future change)
- Real-time sync with HKIFF website (one-time data build)
- Ticket availability/pricing data
- Community screening registration links

## Decisions

### 1. Brochure-first parsing with website supplement

**Decision**: Parse brochure text as primary source, supplement with website data for ticket URLs.

**Rationale**: The brochure is the authoritative source with 100% coverage (318 codes). The website may not have all films listed yet and its AJAX API requires per-day/per-venue requests. The brochure text is structured enough for regex-based parsing.

**Alternative considered**: Website-first with brochure supplement — rejected because website only had ~127 entries when we last checked.

### 2. Screening code as merge key

**Decision**: Use the screening code (e.g., `03KG01`) as the primary key for merging brochure and website data.

**Rationale**: Screening codes are consistent between brochure and website. Format is `DDVVNN` (day + venue + sequence), which is unambiguous.

### 3. Script-based pipeline, not runtime transformation

**Decision**: Build two scripts (`parse-brochure-calendar.ts` and `scrape-hkiff-calendar.ts`) that produce a merged `screenings.json` at build time. No runtime data fetching.

**Rationale**: Consistent with existing static data approach (films.json, venues.json already pre-built). Keeps the Next.js static export clean.

### 4. Event metadata as optional nested object

**Decision**: Add `event?: { type, speaker?, language? }` to the Screening type rather than separate event entries.

**Rationale**: Events (Master Class, Seminar) are scheduled in the same timeline slots as films. They share the same code format and venue system. Keeping them as screenings with an event annotation avoids duplicating the schedule model.

**Alternative considered**: Separate `events.json` — rejected because events appear in the same schedule view and share the same data shape.

### 5. Film ID derivation for new screenings

**Decision**: Generate filmId from English title using the existing `toSlug()` function for consistency with current data.

**Rationale**: Must match the slug-based ID system already in films.json. New films will need stub entries in films.json with at minimum: title (en/zh), director, section.

## Risks / Trade-offs

- **[Brochure text parsing fragility]** → The calendar text has a semi-structured format but may have edge cases (special characters, line wrapping). Mitigation: validate parsed output against known screening codes and cross-check counts per day.

- **[Website API may change or be unavailable]** → The AJAX endpoint could return different data or be rate-limited. Mitigation: script includes retry logic and graceful fallback (screenings without ticket URLs still valid).

- **[Missing films]** → Some brochure screenings may reference films not in our films.json. Mitigation: parser script outputs a list of unmatched film titles for manual review; stub entries created with title-only data.

- **[Event metadata completeness]** → Speaker names and languages for events may not be fully parseable from brochure text. Mitigation: event type is always derivable from text labels; speaker/language are best-effort optional fields.

- **[ticketUrl may be empty for new entries]** → Website may not list all 318 screenings. Mitigation: ticketUrl becomes optional (empty string acceptable), UI already handles missing ticket links gracefully.
