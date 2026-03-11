# Tasks

## 1. Install modern-screenshot

- [x] Add `modern-screenshot` as a dependency
- [x] Verify it works with Next.js static export (client-side only)

## 2. Create ShareCardRenderer component

- [x] New file: `src/components/ShareCardRenderer.tsx`
- [x] Renders a hidden 1080×1920 div with the share card layout
- [x] Accepts: plan screenings, films, venues, locale, ticketQuantities
- [x] Implements the 5-tier dynamic text sizing based on screening count
- [x] Uses monospace/tabular-nums for time column with fixed width
- [x] Sorts guest-attendance screenings first within each day
- [x] Shows ×N ticket quantity in red when > 1
- [x] Shows venue name for each screening
- [x] All text locale-aware (dates, titles, venues, badges, stats, CTA)
- [x] Header: HKIFF 50 logo + plan label
- [x] Footer: summary stats + CTA with hkiff.herballemon.dev

## 3. Create useShareImage hook

- [x] New file: `src/lib/useShareImage.ts`
- [x] Renders ShareCardRenderer off-screen, captures via modern-screenshot
- [x] Returns `{ generateImage, isGenerating }`
- [x] `generateImage()` creates PNG blob and triggers browser download
- [x] Clean up DOM after capture

## 4. Add "Share as Image" button to PlanPageClient

- [x] Add new button next to existing "Share / Export" button
- [x] Wire up to useShareImage hook
- [x] Show loading state while generating
- [x] i18n: add `shareImage` key to plan namespace

## 5. Add i18n keys

- [x] `messages/en.json`: add `plan.shareImage`, `plan.generating`, share card strings
- [x] `messages/zh.json`: same keys in Chinese

## 6. Test

- [ ] Verify image generation works with 1–4 screenings (comfortable tier)
- [ ] Verify with 8–10 screenings (compact tier)
- [ ] Verify with 15+ screenings (dense tier)
- [ ] Verify EN and ZH locale output
- [ ] Verify ×N ticket quantities render correctly
- [ ] Verify guest attendance badges appear
- [ ] Verify downloaded PNG is 1080×1920
