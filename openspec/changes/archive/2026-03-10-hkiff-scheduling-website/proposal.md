## Why

HKIFF 2026 (the 50th edition) needs a bilingual (EN/Traditional Chinese) public website for browsing the film programme and viewing the screening schedule. Currently no web presence exists for the festival's film catalogue and timetable. With the 49th edition brochure PDF available as a structural reference, this is the right moment to build a data-driven site that can be updated each year by swapping JSON data files.

## What Changes

- New Next.js 14 (App Router) + TypeScript + Tailwind CSS website project
- Bilingual routing: `/en/` and `/zh/` locale prefixes via `next-intl`
- JSON-based data layer (`data/films.json`, `data/screenings.json`, `data/venues.json`, `data/sections.json`) seeded with HKIFF 49 data extracted from the brochure PDF
- Four public pages: Home, Film Catalogue, Film Detail, Schedule/Timetable
- Deployed to Cloudflare Pages via `@cloudflare/next-on-pages`

## Capabilities

### New Capabilities

- `film-catalogue`: Browse and search all festival films, filter by section/country
- `film-detail`: View full film details — synopsis, director, metadata, screening list
- `schedule-timetable`: Grid view of all screenings by date and venue
- `home-page`: Hero landing page with featured films and schedule highlights
- `data-layer`: JSON data schemas and loading helpers for films, screenings, venues, sections
- `i18n`: Bilingual EN/ZH routing and UI string translation

### Modified Capabilities

<!-- None — this is a greenfield project -->

## Impact

- New repository content: entire Next.js app scaffold under `src/`, `data/`, `messages/`, `public/`
- New dependencies: `next`, `next-intl`, `@cloudflare/next-on-pages`, `tailwindcss`
- Cloudflare Pages deployment config: `wrangler.toml`, edge runtime
- No existing code is modified; no breaking changes
