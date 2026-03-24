## 1. Data Model

- [x] 1.1 Add optional `duration?: number` field to `Screening` type in `src/lib/types.ts`
- [x] 1.2 Add `duration` to event-type screenings in `data/screenings.json` (master-class: 90, seminar: 90, face-to-face: 60, pre-talk: 30)
- [x] 1.3 Look up and add runtime data for Million, Lectura, No It's Not in `data/films.json` — SKIPPED: no IMDB/detail URLs available; 90min fallback applies

## 2. Shared Duration Utility

- [x] 2.1 Create `getScreeningDuration(screening, film)` helper in `src/lib/data.ts` that implements the fallback chain: `screening.duration → film.runtime → 90`

## 3. ICS Export Fix

- [x] 3.1 Update `buildVEvent` in `src/lib/icsCalendar.ts` to accept screening duration (via the shared helper) instead of reading `film.runtime` directly
- [x] 3.2 Update `generateIcsForPlan` and `generateIcsForScreening` call sites to pass duration

## 4. UI Consistency

- [x] 4.1 Update `ScheduleGrid.tsx` to use `getScreeningDuration()` for block height; keep `hasRuntime` visual indicator as `film?.runtime != null || screening.duration != null` (preserve dashed border + "?min" for unknown durations)
- [x] 4.2 Update `PlanPageClient.tsx` end-time calculation to use `getScreeningDuration()`
- [x] 4.3 Update `PlanContext.tsx` conflict detection to use `getScreeningDuration()`

## 5. Testing & Verification

- [x] 5.1 Set up Vitest and write unit tests for `getScreeningDuration()` (3 branches: screening.duration, film.runtime fallback, 90min default)
- [x] 5.2 Build the project (`npm run build`) and verify no type errors
- [x] 5.3 Manually verify ICS output for a plan containing both regular films and event-type screenings
