## Why

Festival-goers need to plan which screenings they'll attend across 10+ days, but the site currently only links to external ticketing with no way to track selections. A personal plan lets users build their schedule, detect conflicts, and extract screening codes for the ticketing system — all without an account or backend.

## What Changes

- **New `/plan` page** — personal schedule view grouped by date, with conflict indicators
- **Frame selection on Film Detail** — each screening row gets "Add to Plan" / "Selected ✓" toggle; replaces "Buy Tickets" link
- **Conflict warnings** — overlapping screenings flagged on both Film Detail and the Plan page (warn-and-allow: both frames are kept)
- **Same-film duplicate warning** — adding a second frame of the same film shows a warning but proceeds
- **Plan badge in Header** — navigation shows count of selected frames
- **Plan indicator on Film Catalogue** — FilmCard shows a "✓" badge if any frame is in plan
- **Share / Export** — plain-text export of schedule with screening codes; `navigator.share()` on mobile, clipboard fallback on desktop; conflicts flagged in export
- **Runtime-derived end times** — `screening.time + film.runtime` used for conflict detection and display
- **localStorage persistence** — plan stored as array of screening IDs; no account required; device-local

## Capabilities

### New Capabilities
- `plan-state`: localStorage-backed React context managing selected screening IDs, add/remove/conflict detection
- `plan-page`: `/[locale]/plan` page showing schedule grouped by date with conflict indicators and share/export
- `plan-export`: plain-text export function with screening codes, end times, and conflict markers

### Modified Capabilities
- `film-detail`: screening rows replace "Buy Tickets" with frame selection toggle + conflict indicators
- `film-catalogue`: FilmCard gains plan-membership badge
- `i18n`: new translation keys for plan UI strings in both locales

## Impact

- **New files**: `src/components/PlanContext.tsx`, `src/components/PlanExport.tsx`, `src/app/[locale]/plan/page.tsx`, `src/components/PlanPageClient.tsx`
- **Modified files**: `src/app/[locale]/films/[id]/page.tsx`, `src/components/FilmCard.tsx`, `src/components/Header.tsx`, `messages/en.json`, `messages/zh.json`
- **No new dependencies** — uses `navigator.share` (Web API) and localStorage; no backend changes
- **Static export compatibility preserved** — all new components are `"use client"`, localStorage access wrapped in `useEffect`
