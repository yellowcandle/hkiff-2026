## 1. Plan State (Context + localStorage)

- [x] 1.1 Create `src/components/PlanContext.tsx` — React Context with `plan: string[]`, `addScreening`, `removeScreening`, `isSelected`, `getConflicts`, `hasDuplicateFilm`; initialise from localStorage in `useEffect`; export `usePlan()` hook
- [x] 1.2 Add `PlanProvider` to `src/app/[locale]/layout.tsx` wrapping the `<main>` content (below `NextIntlClientProvider`)
- [x] 1.3 Implement conflict detection in `PlanContext`: parse `HH:MM` to minutes-since-midnight, compute end = start + runtime, flag overlapping pairs on the same date
- [x] 1.4 Implement same-film duplicate detection in `PlanContext`: return `true` if a different screening with the same `filmId` is already in the plan

## 2. i18n Strings

- [x] 2.1 Add `plan.*` keys and `nav.plan` to `messages/en.json`
- [x] 2.2 Add `plan.*` keys and `nav.plan` to `messages/zh.json` (Traditional Chinese)

## 3. Film Detail — Frame Selection

- [x] 3.1 Convert `ScreeningsList` in `src/app/[locale]/films/[id]/page.tsx` to a `"use client"` component (or extract to `src/components/ScreeningsList.tsx`) so it can use `usePlan()`
- [x] 3.2 Replace "Buy Tickets" `<a>` with "Add to Plan" / "✓ Selected" toggle button on each screening row
- [x] 3.3 Show inline conflict warning beneath a screening row when it overlaps an existing plan entry (display conflicting film title)
- [x] 3.4 Show inline same-film duplicate warning beneath a screening row when another frame of the same film is already in the plan

## 4. Film Catalogue — Plan Badge

- [x] 4.1 In `src/components/FilmCard.tsx`, call `usePlan()` to check if any screening for the film's ID is in the plan; render a small "✓ In Plan" badge when true

## 5. Header — Plan Count Badge

- [x] 5.1 Add "My Plan" nav link to `src/components/Header.tsx` pointing to `/plan`, with a count badge showing `plan.length` (hidden when 0)
- [x] 5.2 Add `nav.plan` translation key usage to the header link

## 6. Plan Page

- [x] 6.1 Create `src/app/[locale]/plan/page.tsx` — server wrapper with `generateStaticParams` for both locales, passes translations and calls `setRequestLocale`
- [x] 6.2 Create `src/components/PlanPageClient.tsx` — `"use client"` component that reads from `usePlan()`, groups screenings by date, renders date sections
- [x] 6.3 Implement empty state: show translated message and link to `/films` when plan is empty
- [x] 6.4 Render each screening row with: start time, computed end time, film title (locale-aware), venue code, screening code in brackets, remove button
- [x] 6.5 Mark conflicting rows with a conflict indicator; show conflict count in date section header when conflicts exist
- [x] 6.6 Handle stale IDs: skip screenings whose ID is not found in current `screenings.json` data

## 7. Share / Export

- [x] 7.1 Create `src/components/PlanExport.tsx` — function `buildExportText(plan, screenings, films, venues, locale)` that generates the plain-text schedule
- [x] 7.2 Format export: date sections, `HH:MM–HH:MM  Title  VenueCode  [ScreeningCode]` rows, conflict annotations, booking codes footer
- [x] 7.3 Implement Share/Export button in `PlanPageClient`: use `navigator.share()` if available, else copy to clipboard; show "Copied!" confirmation for 2 seconds
- [x] 7.4 Disable Share/Export button when plan is empty
