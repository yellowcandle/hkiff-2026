## ADDED Requirements

### Requirement: Screening type supports optional duration
The `Screening` type SHALL include an optional `duration` field (in minutes) that represents the total duration of the screening slot.

#### Scenario: Screening with explicit duration
- **WHEN** a screening has `duration: 60` set in the data
- **THEN** all duration consumers (ICS export, timeline, conflict detection, plan display) SHALL use 60 minutes as the screening duration

#### Scenario: Screening without duration but with film runtime
- **WHEN** a screening has no `duration` field AND the associated film has `runtime: 158`
- **THEN** all duration consumers SHALL use 158 minutes as the screening duration

#### Scenario: Screening without duration and film without runtime
- **WHEN** a screening has no `duration` field AND the associated film has no `runtime`
- **THEN** all duration consumers SHALL use 90 minutes as the default duration

### Requirement: ICS export uses screening-aware duration
The ICS calendar export SHALL generate `DURATION` values using the fallback chain: `screening.duration → film.runtime → 90 minutes`.

#### Scenario: ICS event for screening with explicit duration
- **WHEN** generating an ICS event for a master class screening with `duration: 90`
- **THEN** the VEVENT SHALL contain `DURATION:PT90M`

#### Scenario: ICS event for regular film screening
- **WHEN** generating an ICS event for a film screening where the film has `runtime: 120` and the screening has no `duration`
- **THEN** the VEVENT SHALL contain `DURATION:PT120M`

#### Scenario: ICS event for screening with unknown duration
- **WHEN** generating an ICS event for a screening where neither `screening.duration` nor `film.runtime` is available
- **THEN** the VEVENT SHALL contain `DURATION:PT90M`

### Requirement: Shared duration utility function
The system SHALL provide a single utility function `getScreeningDuration(screening, film)` that encapsulates the duration fallback chain and is used by all duration consumers.

#### Scenario: Utility returns screening duration when available
- **WHEN** called with a screening that has `duration: 75` and a film with `runtime: 100`
- **THEN** the function SHALL return `75`

#### Scenario: Utility returns film runtime as fallback
- **WHEN** called with a screening that has no `duration` and a film with `runtime: 100`
- **THEN** the function SHALL return `100`

#### Scenario: Utility returns default when both missing
- **WHEN** called with a screening that has no `duration` and a film with no `runtime`
- **THEN** the function SHALL return `90`

### Requirement: Event-type screenings have explicit durations in data
All event-type screenings (master classes, seminars, face-to-face, pre-talks) in `screenings.json` SHALL have explicit `duration` values set.

#### Scenario: Master class screening duration
- **WHEN** a screening has `event.type: "master-class"`
- **THEN** the screening SHALL have `duration: 90` in the data

#### Scenario: Seminar screening duration
- **WHEN** a screening has `event.type: "seminar"`
- **THEN** the screening SHALL have `duration: 90` in the data

#### Scenario: Face-to-face screening duration
- **WHEN** a screening has `event.type: "face-to-face"`
- **THEN** the screening SHALL have `duration: 60` in the data

#### Scenario: Pre-talk screening duration
- **WHEN** a screening has `event.type: "pre-talk"`
- **THEN** the screening SHALL have `duration: 30` in the data

### Requirement: Consistent duration across all UI consumers
The timeline view (ScheduleGrid), plan page end-time display (PlanPageClient), and conflict detection (PlanContext) SHALL all use the shared `getScreeningDuration()` utility for duration calculations.

#### Scenario: Timeline block height reflects screening duration
- **WHEN** rendering a master class screening with `duration: 90` in the timeline view
- **THEN** the block height SHALL be calculated using 90 minutes (not a fallback value)

#### Scenario: Conflict detection uses screening duration
- **WHEN** checking for time conflicts between two screenings
- **THEN** the end time of each screening SHALL be computed using `getScreeningDuration()` for both screenings
