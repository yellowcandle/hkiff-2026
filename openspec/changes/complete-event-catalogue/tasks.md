## 1. Extend Data Model

- [x] 1.1 Add `ScreeningEvent` type and optional `event` field to Screening in `src/lib/types.ts`
- [x] 1.2 Verify `src/lib/data.ts` passes through event field from JSON without transformation

## 2. Brochure Calendar Parser

- [x] 2.1 Create `scripts/parse-brochure-calendar.ts` that reads HKIFF50-BF.txt calendar section (lines 7809-9977)
- [x] 2.2 Implement screening code decoder: `DDVVNN` → date (2026-04-DD), venueId (VV)
- [x] 2.3 Implement 12h→24h time parser (e.g., "9:15 pm" → "21:15")
- [x] 2.4 Extract bilingual film titles (English + Chinese) from each calendar entry
- [x] 2.5 Extract duration in minutes from parenthetical format (e.g., "(158min)" → 158)
- [x] 2.6 Detect event metadata from inline labels (Master Class, Face to Face, Seminar, Post-talk, Pre-talk)
- [x] 2.7 Generate filmId using toSlug() algorithm (NFD normalize, strip diacritics, lowercase, hyphenate)
- [x] 2.8 Output parsed data as JSON array, validate count ≥ 318

## 3. Website Calendar Scraper

- [ ] 3.1 Create `scripts/scrape-hkiff-calendar.ts` that hits HKIFF AJAX endpoint for all 12 days
- [ ] 3.2 Extract ticket URLs and screening codes from API responses
- [ ] 3.3 Add rate limiting (500ms between requests) and retry logic (3 retries with backoff)
- [ ] 3.4 Output website data as JSON keyed by screening code

## 4. Data Merge & Validation

- [ ] 4.1 Create merge script that combines brochure + website data by screening code
- [ ] 4.2 Brochure provides: date, time, venue, titles, duration, event metadata; website provides: ticketUrl
- [ ] 4.3 Identify films in new screenings missing from films.json, create stub entries
- [ ] 4.4 Validate merged output: all 318 codes present, no duplicate codes, dates within Apr 1-12
- [ ] 4.5 Write final `data/screenings.json` with complete 318-entry dataset
- [ ] 4.6 Write updated `data/films.json` with any new film stubs

## 5. Integration Verification

- [ ] 5.1 Run `npm run build` to verify static export works with new data
- [ ] 5.2 Spot-check schedule page shows screenings for all 12 days
- [ ] 5.3 Verify no broken film links (all filmIds in screenings match films.json entries)
