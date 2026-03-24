## Why

The ICS calendar export currently uses `film.runtime` as the event duration, falling back to a hardcoded 120 minutes when runtime is missing. This produces incorrect calendar blocks in two ways:

1. **Events/special screenings have no runtime** — 10 out of 13 films missing runtime data are master classes, seminars, and face-to-face sessions. These get a blanket 2-hour block regardless of their actual scheduled duration.
2. **No screening-level duration override** — The `Screening` type has no `duration` field. Even if a screening includes a post-talk or pre-talk event, the calendar block only reflects the film runtime, not the full screening slot.

## What Changes

- Add a `duration` field to the `Screening` type so screenings can carry their own duration (e.g., from brochure data or manual override), independent of film runtime.
- Update the ICS generator (`icsCalendar.ts`) to prefer `screening.duration` over `film.runtime`, with a sensible fallback chain: `screening.duration → film.runtime → 90 min default`.
- Populate `duration` in `screenings.json` for event-type screenings (master classes, seminars, face-to-face) that currently lack runtime data.
- Update other duration consumers (ScheduleGrid timeline, PlanPageClient end-time display, PlanContext conflict detection) to use the same fallback chain for consistency.

## Capabilities

### New Capabilities
- `screening-duration`: Adds per-screening duration support to the data model and propagates it through the ICS export, timeline view, and conflict detection.

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **Data**: `screenings.json` gains optional `duration` field on event-type screenings
- **Types**: `Screening` type in `src/lib/types.ts` gains optional `duration?: number`
- **ICS export**: `src/lib/icsCalendar.ts` uses new fallback chain
- **UI components**: `ScheduleGrid.tsx`, `PlanPageClient.tsx`, `PlanContext.tsx` updated for consistency
- **No breaking changes** — `duration` is optional; all existing screenings without it continue working via the fallback chain
