## ADDED Requirements

### Requirement: Screening type supports event metadata
The Screening type SHALL include an optional `event` field for non-film programme items.

#### Scenario: Film screening without event
- **WHEN** a screening is a regular film showing
- **THEN** the `event` field SHALL be absent or undefined

#### Scenario: Master Class screening
- **WHEN** a screening is a Master Class
- **THEN** `event.type` SHALL be `"master-class"` and `event.speaker` MAY contain the speaker name

### Requirement: Event type enumeration
The event type field SHALL accept only the following values: `master-class`, `face-to-face`, `seminar`, `post-talk`, `pre-talk`.

#### Scenario: Valid event types
- **WHEN** an event type is set
- **THEN** it SHALL be one of: `master-class`, `face-to-face`, `seminar`, `post-talk`, `pre-talk`

### Requirement: Event fields are optional
The `speaker` and `language` fields within the event object SHALL be optional.

#### Scenario: Event with speaker
- **WHEN** a Master Class has a known speaker (e.g., "賈樟柯")
- **THEN** `event.speaker` SHALL contain the speaker name

#### Scenario: Event without speaker
- **WHEN** a Seminar has no identified speaker in the source data
- **THEN** `event.speaker` SHALL be absent or undefined

### Requirement: Backward compatibility
Existing code that reads screenings SHALL continue to work without modification for regular film screenings.

#### Scenario: Existing screening data unchanged
- **WHEN** a screening has no event metadata
- **THEN** all existing fields (id, filmId, date, time, venueId, screeningCode, ticketUrl) SHALL remain unchanged in format and meaning
