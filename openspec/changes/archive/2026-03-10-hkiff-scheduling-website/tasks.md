## 1. Project Scaffold

- [x] 1.1 Run `create-next-app@15.5.2` with TypeScript, pinning Next.js to 15.5.2 (Cloudflare Pages ceiling)
- [x] 1.2 Replace Tailwind v3 (bundled by create-next-app) with Tailwind v4: install `tailwindcss@^4` and `@tailwindcss/postcss@^4`, update `postcss.config.mjs`, replace `globals.css` with `@import "tailwindcss"`
- [x] 1.3 Install `next-intl@^4` and configure middleware for locale-prefix routing using `defineRouting`
- [x] 1.4 Install `@cloudflare/next-on-pages@^1.13` and add `wrangler.toml`
- [x] 1.5 Configure `next.config.ts` for edge runtime and `next-intl` plugin

## 2. Data Layer

- [x] 2.1 Define TypeScript types in `src/lib/types.ts` (Film, Screening, Venue, Section)
- [x] 2.2 Create `src/lib/data.ts` with typed loader functions (`getFilms`, `getFilm`, `getSections`, `getVenues`, `getScreeningsForFilm`)
- [x] 2.3 Extract HKIFF 49 sections from PDF and populate `data/sections.json`
- [x] 2.4 Extract HKIFF 49 venues from PDF and populate `data/venues.json`
- [x] 2.5 Extract HKIFF 49 films (one per section minimum) from PDF and populate `data/films.json`
- [x] 2.6 Populate `data/screenings.json` with representative screening entries from HKIFF 49 programme diary

## 3. i18n Setup

- [x] 3.1 Create `src/i18n/routing.ts` with `defineRouting` (locales: `['en', 'zh']`, defaultLocale: `'en'`)
- [x] 3.2 Create `src/i18n/navigation.ts` exporting typed `Link`, `redirect`, `useRouter`, `usePathname`
- [x] 3.3 Configure `src/middleware.ts` using `createNavigation` from `next-intl/server`
- [x] 3.4 Create `messages/en.json` with all UI strings (navigation, labels, messages)
- [x] 3.5 Create `messages/zh.json` with Traditional Chinese translations
- [x] 3.6 Set up `src/app/[locale]/layout.tsx` with `NextIntlClientProvider` and locale params

## 4. Layout & Navigation

- [x] 4.1 Build site header with logo, navigation links, and `LocaleSwitch` component
- [x] 4.2 Build site footer
- [x] 4.3 Implement `LocaleSwitch` component that preserves current path when toggling EN/ZH

## 5. Home Page

- [x] 5.1 Implement hero section with festival name, 50th edition branding, and dates
- [x] 5.2 Implement featured films section (Gala Presentation films)
- [x] 5.3 Add navigation CTAs linking to `/films` and `/schedule`

## 6. Film Catalogue Page

- [x] 6.1 Build `FilmCard` component (poster, title, director, country, section badge)
- [x] 6.2 Build `SearchBar` component with client-side filtering
- [x] 6.3 Build `FilmFilter` component for section and country filtering
- [x] 6.4 Implement `/[locale]/films/page.tsx` with grid layout, search, and filters
- [x] 6.5 Add `generateStaticParams` for both locales

## 7. Film Detail Page

- [x] 7.1 Implement `/[locale]/films/[id]/page.tsx` with all film metadata fields
- [x] 7.2 Display bilingual title and synopsis based on current locale
- [x] 7.3 Render screening list with date, time, venue, and ticket link
- [x] 7.4 Add `generateStaticParams` for all film IDs × locales

## 8. Schedule / Timetable Page

- [x] 8.1 Build `ScheduleGrid` component with date columns and venue rows
- [x] 8.2 Implement date filter selector
- [x] 8.3 Make each screening cell a link to the corresponding film detail page
- [x] 8.4 Implement `/[locale]/schedule/page.tsx` using the grid component

## 9. Cloudflare Deployment

- [x] 9.1 Verify `next.config.ts` sets `output: "export"` for static export (compatible with Cloudflare Pages)
- [x] 9.2 Add `wrangler.toml` with Cloudflare Pages config
- [x] 9.3 Run `npx @cloudflare/next-on-pages` and verify build succeeds (also pinned vercel to 47.0.4 to satisfy peer dep)
- [ ] 9.4 Deploy to Cloudflare Pages and confirm preview URL works for both locales
