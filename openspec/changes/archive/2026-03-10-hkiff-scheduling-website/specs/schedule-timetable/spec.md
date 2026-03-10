## ADDED Requirements

### Requirement: Display timetable grid
The system SHALL display a grid at `/[locale]/schedule` with festival dates as columns and venues as rows, with screenings placed in the appropriate cell.

#### Scenario: Grid renders with screenings
- **WHEN** a user navigates to `/en/schedule`
- **THEN** a grid is shown with all festival dates across the top and venues down the side, with each screening appearing in its date × venue cell

### Requirement: Filter timetable by date
The system SHALL allow users to filter the timetable to show only a single date.

#### Scenario: Date filter applied
- **WHEN** a user selects a specific date
- **THEN** only screenings on that date are displayed

### Requirement: Screening cell links to film detail
The system SHALL make each screening cell in the timetable a link to the film detail page.

#### Scenario: Click screening cell
- **WHEN** a user clicks a screening in the timetable grid
- **THEN** they are navigated to the corresponding film detail page
