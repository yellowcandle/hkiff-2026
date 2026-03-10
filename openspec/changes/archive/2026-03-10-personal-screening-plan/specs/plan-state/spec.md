## ADDED Requirements

### Requirement: Plan persists in localStorage
The system SHALL store the user's plan as a JSON array of screening IDs under the localStorage key `hkiff50-plan`. The plan SHALL be restored on page load.

#### Scenario: Plan survives page reload
- **WHEN** user adds a screening and reloads the page
- **THEN** the screening remains in the plan

#### Scenario: Empty plan on first visit
- **WHEN** no `hkiff50-plan` key exists in localStorage
- **THEN** the plan initialises as an empty array

### Requirement: Add screening to plan
The system SHALL allow adding a screening ID to the plan.

#### Scenario: Add new screening
- **WHEN** user adds a screening not currently in the plan
- **THEN** the screening ID is appended to the plan array

#### Scenario: Add already-selected screening
- **WHEN** user adds a screening already in the plan
- **THEN** no duplicate is created; the plan is unchanged

### Requirement: Remove screening from plan
The system SHALL allow removing a screening ID from the plan.

#### Scenario: Remove existing screening
- **WHEN** user removes a screening that is in the plan
- **THEN** the screening ID is removed from the plan array

### Requirement: Conflict detection
The system SHALL detect time conflicts between screenings in the plan. A conflict exists when two screenings share the same date and their time ranges overlap. A screening's end time is computed as `startTime + film.runtime` (in minutes).

#### Scenario: No conflict — different dates
- **WHEN** two screenings are on different dates
- **THEN** no conflict is reported between them

#### Scenario: No conflict — same date, non-overlapping times
- **WHEN** screening A ends before screening B starts on the same date
- **THEN** no conflict is reported

#### Scenario: Conflict — same date, overlapping times
- **WHEN** two screenings on the same date have overlapping time ranges
- **THEN** both screenings are flagged as conflicting with each other

### Requirement: Same-film duplicate detection
The system SHALL detect when the user adds a second frame for a film already in the plan.

#### Scenario: Second frame for same film
- **WHEN** user adds a screening whose filmId matches a screening already in the plan
- **THEN** the system flags this as a same-film duplicate (addition proceeds)
