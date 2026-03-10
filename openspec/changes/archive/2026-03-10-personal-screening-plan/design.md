## Context

The site is a fully static Next.js export deployed to Cloudflare Pages. There is no server, no database, and no authentication. The data layer is read-only JSON files. All interactive features must be client-side.

Current state: film detail pages link directly to hkiff.org.hk for ticketing. Users have no way to track which screenings they intend to attend or resolve scheduling conflicts.

## Goals / Non-Goals

**Goals:**
- Let users select specific screening frames and persist selections locally
- Detect and surface time conflicts (overlapping screenings on same day)
- Export a plain-text schedule with screening codes for manual entry into HKIFF's ticketing system
- Remain fully static — no backend, no account, no external API

**Non-Goals:**
- Cross-device sync (out of scope — localStorage is device-local by design)
- Travel time between venues (deferred to future)
- Social media image export (deferred to future)
- Direct ticketing integration (HKIFF ticketing system is external)
- Screening change notifications (developer updates `screenings.json` manually when HKIFF changes frames)

## Decisions

### D1: State in localStorage as `string[]` of screening IDs

**Choice:** Store plan as a flat array of screening IDs in `localStorage` under key `hkiff50-plan`.

**Rationale:** Screening IDs are the stable identity. All other data (title, time, venue, runtime) is derived from JSON at render time. A flat array is trivially serialisable, diffable, and requires no schema migration.

**Alternative considered:** Store full screening objects. Rejected — data duplication, stale-data risk if `screenings.json` is updated.

### D2: React Context as the sharing mechanism

**Choice:** `PlanContext` (React Context + Provider) wraps the locale layout. All components read/write through `usePlan()` hook.

**Rationale:** Avoids prop-drilling across unrelated branches (Header badge, FilmCard badge, Film Detail toggles, Plan page). Context is appropriate for app-wide UI state.

**Alternative considered:** Zustand or other state library. Rejected — no new dependency warranted for a single flat array.

**SSR safety:** `PlanContext` initialises from localStorage inside `useEffect` to avoid hydration mismatch on static export.

### D3: Conflict detection via minute arithmetic

**Choice:** Convert `HH:MM` time strings to minutes-since-midnight integers. End time = start + `film.runtime`. Conflict if `startA < endB && startB < endA` on the same date.

**Rationale:** Simple, no date library needed. Runtime is always in minutes in `films.json`.

**Midnight crossing:** A screening starting at 22:30 with runtime 120 min ends at 1470 min (24:30). Comparison still works as long as both times are on the same calendar date, which they always are for HKIFF late-night screenings (end time may cross midnight but the screening *date* is the start date).

### D4: Warn-and-allow for both conflict types

Two warning cases:
1. **Time conflict** — new frame overlaps an existing frame in the plan
2. **Same-film duplicate** — new frame is for a film already in the plan

Both show a warning banner but allow the addition. Users intentionally schedule backup options.

**UI approach:** Inline warning text on the Film Detail screening row, not a modal (modals are disruptive; inline is scannable).

### D5: Plain-text export via `navigator.share` / clipboard

**Choice:** Single "Share / Export" button. On mobile (where `navigator.share` is available), triggers native share sheet. On desktop, copies to clipboard and shows brief "Copied!" confirmation.

**Text format:**
```
My HKIFF 50 Plan
──────────────────────────────────

Thu 10 Apr
  18:45–20:20  The Brightest Sun       KC  [10KG01]
  21:50–23:40  Pavane for an Infant    KC  [10KG02]

Fri 11 Apr  ⚠ conflict
  21:15–22:50  The Brightest Sun       PE  [11PE07]  ← overlaps ↓
  21:30–23:00  Dreams (Sex Love)       KG  [11KG03]  ← overlaps ↑

──────────────────────────────────
Booking codes: 10KG01 · 10KG02 · 11PE07 · 11KG03
```

**Rationale:** Screening codes are what HKIFF's system accepts. Listing them at the bottom in a single line makes copy-paste easy for users entering codes manually.

### D6: Film Detail replaces "Buy Tickets" with frame toggle

The `ScreeningsList` component in `films/[id]/page.tsx` currently renders a "Buy Tickets" `<a>` tag per screening. This is replaced with an "Add to Plan" / "✓ Selected" button. Conflict and duplicate warnings appear as inline text beneath the button.

### D7: `generateStaticParams` not needed for `/plan`

The plan page reads only from localStorage — no per-film static params. It still needs `generateStaticParams` for locale (`['en', 'zh']`) as required by the `[locale]` segment.

## Risks / Trade-offs

- **localStorage cleared** → plan lost. No recovery. Accepted — festival context, low stakes.
- **`screenings.json` updated mid-festival** → stored IDs still match if IDs are stable (they are: `s-brightest-sun-01` etc.). If a screening is removed, `getScreening(id)` returns undefined; plan page should handle gracefully (skip missing, show note).
- **`navigator.share` not available on all desktop browsers** → clipboard fallback covers this.
- **Runtime data accuracy** → `films.json` runtime values were manually extracted from the PDF; inaccuracies are possible. Conflict detection is approximate. Low risk — heuristic aid, not a contract.

## Migration Plan

No migration needed — no existing user data, no backend changes. Feature is purely additive. Rollout is a static redeploy to Cloudflare Pages.
