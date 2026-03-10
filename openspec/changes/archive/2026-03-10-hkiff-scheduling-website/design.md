## Context

HKIFF 49 brochure PDF (`HKIFF49-BF.pdf`) is available as a structural reference — it is text-extractable and contains ~168 films across 8 sections, with a programme diary and film index. Data must be manually entered or extracted into JSON files since the festival has no public API. The 50th edition (2026) data will be supplied when ready; the site must be easy to update annually.

**Pinned versions (March 2026):**
| Package | Version | Notes |
|---|---|---|
| `next` | 15.5.2 | Pinned — `@cloudflare/next-on-pages` ceiling is `<=15.5.2`; Next.js 16 incompatible |
| `react` / `react-dom` | 19.x | Stable React 19 |
| `tailwindcss` | 4.x | v4 rewrite — CSS-based config, no `tailwind.config.js` |
| `@tailwindcss/postcss` | 4.x | Required PostCSS plugin for Tailwind v4 with Next.js |
| `next-intl` | 4.x | Stable v4 API |
| `@cloudflare/next-on-pages` | 1.13.x | Supports Next.js 14.3–15.5.2 |
| `typescript` | 5.9.x | |

## Goals / Non-Goals

**Goals:**
- Bilingual (EN/Traditional Chinese) static site with locale-prefix routing
- Film catalogue with search and section/country filters
- Film detail pages with synopsis, credits, and screening list
- Timetable grid view by date × venue
- Data stored in version-controlled JSON files (easy annual swap)
- Deployed to Cloudflare Pages (edge-compatible, free tier)

**Non-Goals:**
- Online ticketing integration (link out to HKIFF's own ticketing system)
- User accounts, favourites, or personalisation
- CMS or admin UI — data is managed via JSON files in the repo
- Server-side dynamic data (no database; all static at build time)
- HKIFF 50 data entry (seeded with HKIFF 49 as placeholder)

## Decisions

### 1. Next.js 15.5.2 App Router + TypeScript
Next.js provides static generation (`generateStaticParams`) for all locale × film combinations, keeping the site fully static and edge-compatible. TypeScript enforces data shape correctness throughout. Pinned to 15.5.2 (the maximum version supported by `@cloudflare/next-on-pages@1.13`).
- **Alternative considered**: Next.js 16 — not yet supported by `@cloudflare/next-on-pages`.
- **Alternative considered**: Astro — simpler static output but worse ecosystem for i18n and component reuse.

### 2. `next-intl` v4 for i18n
Locale-prefix routing (`/en/`, `/zh/`) with static generation for both locales. UI strings in `messages/en.json` and `messages/zh.json`; film/venue/section data carries bilingual fields inline in JSON. `next-intl` v4 uses a simplified routing API with `defineRouting` in `src/i18n/routing.ts`.
- **Alternative considered**: `next-i18next` — requires server-side rendering; not ideal for pure static output.

### 3. Tailwind CSS v4 for styling
Tailwind v4 uses a CSS-first configuration: import `tailwindcss` in the global CSS file via `@import "tailwindcss"`, customise with the `@theme` directive. No `tailwind.config.js` needed. The `@tailwindcss/postcss` package is the PostCSS plugin for Next.js integration.
- **Configuration approach**: `src/app/globals.css` contains `@import "tailwindcss"` and any `@theme {}` overrides.
- **Alternative considered**: Tailwind v3 — still maintained (`v3-lts` tag) but v4 is the active branch.

### 4. Cloudflare Pages via `@cloudflare/next-on-pages`
Edge runtime deployment gives global CDN with zero cold starts. `wrangler.toml` configures the project; build output goes through `@cloudflare/next-on-pages` transformer.
- **Constraint**: All pages must use the edge runtime or be fully statically generated. No Node.js runtime APIs.
- **Alternative considered**: Vercel — simpler DX but vendor lock-in; Cloudflare Pages fits free/low-cost requirement.

### 5. JSON files as data layer
All film, screening, venue, and section data lives in `data/*.json` files checked into the repo. A thin `src/lib/data.ts` module provides typed loader functions. No database, no API calls at runtime.
- **Alternative considered**: MDX per film — harder to query/filter programmatically.

### Repository Structure
```
hkiff-2026/
├── data/
│   ├── films.json
│   ├── screenings.json
│   ├── venues.json
│   └── sections.json
├── messages/
│   ├── en.json
│   └── zh.json
├── public/images/films/
├── src/
│   ├── app/[locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── films/page.tsx
│   │   ├── films/[id]/page.tsx
│   │   └── schedule/page.tsx
│   ├── components/
│   │   ├── FilmCard.tsx
│   │   ├── FilmFilter.tsx
│   │   ├── ScheduleGrid.tsx
│   │   ├── SearchBar.tsx
│   │   └── LocaleSwitch.tsx
│   ├── i18n/
│   │   ├── routing.ts       # next-intl v4 defineRouting
│   │   └── navigation.ts    # typed Link, redirect, useRouter
│   └── lib/
│       ├── data.ts
│       └── types.ts
├── src/middleware.ts
├── src/app/globals.css      # @import "tailwindcss" + @theme
├── next.config.ts           # .ts config (Next.js 15+)
├── wrangler.toml
└── package.json
```

## Risks / Trade-offs

- **`@cloudflare/next-on-pages` version ceiling**: Locked to Next.js ≤15.5.2 until the package adds Next.js 16 support. → Track upstream; upgrade when support lands.
- **Tailwind v4 CSS-config learning curve**: `@theme` syntax differs from v3 `extend`. → Keep theme overrides minimal; use default Tailwind palette where possible.
- **next-intl v4 API changes**: v4 introduced `defineRouting` and new navigation helpers. → Follow v4 docs; avoid v3 patterns (e.g., old `createSharedPathnamesNavigation`).
- **Image-heavy PDF**: Initial seed data will be a representative subset (~1–3 films per section). → Data entry is incremental; build passes with any valid JSON.
- **Annual data update burden**: Manual JSON editing is error-prone. → TypeScript types catch shape errors at build time.
- **Large number of static pages**: ~168 films × 2 locales = ~336 static pages. → Acceptable at this scale; no mitigation needed.
