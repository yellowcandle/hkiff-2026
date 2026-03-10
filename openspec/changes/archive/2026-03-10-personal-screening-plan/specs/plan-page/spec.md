## ADDED Requirements

### Requirement: Plan page exists at /plan
The system SHALL render a plan page at `/[locale]/plan` for each supported locale.

#### Scenario: Plan page accessible
- **WHEN** user navigates to `/en/plan` or `/zh/plan`
- **THEN** the plan page renders without error

### Requirement: Plan page empty state
The system SHALL display a prompt to browse films when the plan is empty.

#### Scenario: Empty plan
- **WHEN** no screenings are in the plan
- **THEN** the page shows an empty-state message and a link to `/[locale]/films`

### Requirement: Screenings grouped by date
The system SHALL display plan screenings grouped by calendar date, sorted chronologically within each day.

#### Scenario: Multiple dates
- **WHEN** the plan contains screenings on multiple dates
- **THEN** each date appears as a section header with its screenings listed in time order

### Requirement: End time displayed
The system SHALL display the computed end time for each screening (`start + runtime`).

#### Scenario: End time shown
- **WHEN** a screening with a known film runtime is in the plan
- **THEN** the screening row shows both start time and end time

### Requirement: Conflict indicator on plan page
The system SHALL visually indicate date sections that contain conflicting screenings and mark individual conflicting rows.

#### Scenario: Conflict in a day section
- **WHEN** two screenings in the same day section overlap in time
- **THEN** the date section header shows a conflict indicator and both rows are marked

### Requirement: Remove screening from plan page
The system SHALL allow removing a screening directly from the plan page.

#### Scenario: Remove button
- **WHEN** user clicks the remove control on a screening row
- **THEN** the screening is removed from the plan and the page updates immediately

### Requirement: Missing screening handled gracefully
The system SHALL handle the case where a stored screening ID no longer exists in `screenings.json`.

#### Scenario: Stale screening ID
- **WHEN** the plan contains an ID not found in the current data
- **THEN** that entry is silently skipped (not shown, not causing an error)
