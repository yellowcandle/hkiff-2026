## ADDED Requirements

### Requirement: Display hero section
The system SHALL display a hero section on the home page at `/[locale]` with the festival name, edition number, and dates.

#### Scenario: Hero renders
- **WHEN** a user visits the home page
- **THEN** the festival name, 50th edition branding, and festival date range are prominently displayed

### Requirement: Feature selected films
The system SHALL display a curated set of featured films (e.g., Gala Presentation) on the home page.

#### Scenario: Featured films shown
- **WHEN** a user visits the home page
- **THEN** a selection of films is displayed with poster, title, and director

### Requirement: Quick navigation to catalogue and schedule
The system SHALL provide clear navigation links to the film catalogue and schedule pages from the home page.

#### Scenario: Navigation links present
- **WHEN** a user visits the home page
- **THEN** links to `/films` and `/schedule` are visible and functional
