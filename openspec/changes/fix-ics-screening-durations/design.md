## Context

The HKIFF 2026 scheduler exports user plans as `.ics` calendar files. Currently, event duration is sourced solely from `film.runtime` (line 80 of `icsCalendar.ts`), with a hardcoded 120-minute fallback when runtime is missing.

This is incorrect for two reasons:
1. **13 films lack runtime data** — 10 of these are special events (master classes, seminars, face-to-face sessions) that are typically 60–90 minutes, not 120.
2. **No screening-level duration** — The `Screening` type carries no `duration` field, so there's no way to express that a specific screening slot differs from the film's base runtime (e.g., a screening with a 15-minute post-talk).

The same duration logic is duplicated across 4 files (`icsCalendar.ts`, `ScheduleGrid.tsx`, `PlanPageClient.tsx`, `PlanContext.tsx`), each with its own fallback (120, 0, or `DEFAULT_RUNTIME`).

## Goals / Non-Goals

**Goals:**
- ICS calendar events reflect actual screening durations
- Single source of truth for duration fallback logic
- Event-type screenings (master classes, seminars) get reasonable default durations
- Consistent duration calculation across ICS export, timeline view, plan page, and conflict detection

**Non-Goals:**
- Scraping or importing exact event durations from external sources (use manual estimates)
- Adding user-editable duration fields in the UI
- Changing the `Film.runtime` data pipeline

## Decisions

### 1. Add optional `duration` to Screening type
**Decision:** Add `duration?: number` (in minutes) to the `Screening` type.

**Rationale:** Screenings are the scheduling unit — they're what appear on the calendar. A screening's duration can differ from its film's runtime (post-talks, intro events). Putting duration on the screening is the natural place.

**Alternative considered:** Compute duration from `film.runtime + event_duration`. Rejected because event durations aren't available in the data and this adds complexity for minimal benefit.

### 2. Duration fallback chain: `screening.duration → film.runtime → 90`
**Decision:** Prefer screening-level duration, fall back to film runtime, then default to 90 minutes.

**Rationale:** 90 minutes is closer to the median film runtime (most festival films are 85–120 min) and a better guess for events than the current 120-minute hardcoded fallback. The chain ensures existing screenings with film runtime data continue working without changes.

**Alternative considered:** Default to 120 minutes (status quo). Rejected because it over-estimates for events and shorter films. Also considered 0 (current fallback in some components) — rejected because it produces zero-length calendar events.

### 3. Extract a shared `getScreeningDuration()` helper
**Decision:** Create a utility function in `src/lib/data.ts` or a new `src/lib/duration.ts` that encapsulates the fallback chain.

**Rationale:** The duration logic is currently duplicated in 4 files with inconsistent fallbacks. A single helper eliminates the inconsistency and makes the fallback chain easy to change.

### 4. Populate duration for event-type screenings in data
**Decision:** Add `duration` values to the 11 event-type screenings in `screenings.json` using estimates: master classes 90min, seminars 90min, face-to-face 60min, pre-talk 30min.

**Rationale:** These are reasonable estimates based on typical HKIFF event durations. Having explicit values is better than relying on a generic fallback.

## Risks / Trade-offs

- **Estimated event durations may be inaccurate** → Acceptable for calendar planning purposes; users can adjust in their calendar app. Duration values in data can be corrected later without code changes.
- **Migration of existing localStorage data** → No migration needed; `duration` is only in `screenings.json` (static data), not in user plan state.
- **Changing default from 120 to 90 for unknown-runtime films** → Affects 3 regular films (`million`, `lectura`, `no-its-not`). 90 min is a closer estimate for festival films than 120 min.
