## ADDED Requirements

### Requirement: Display all festival films in a grid
The system SHALL display all films as cards in a responsive grid layout on the `/[locale]/films` route.

#### Scenario: Film grid loads
- **WHEN** a user navigates to `/en/films`
- **THEN** all films are displayed as cards showing poster, title, director, country, and section

### Requirement: Search films by title
The system SHALL allow users to search films by title (in either language) via a text input.

#### Scenario: Search returns matching films
- **WHEN** a user types a search query into the search bar
- **THEN** only films whose English or Chinese title contains the query (case-insensitive) are shown

#### Scenario: Search with no results
- **WHEN** a user types a query that matches no films
- **THEN** a "no results" message is displayed and the grid is empty

### Requirement: Filter films by section
The system SHALL allow users to filter films by festival section via a sidebar or dropdown.

#### Scenario: Section filter applied
- **WHEN** a user selects a section (e.g., "Gala Presentation")
- **THEN** only films belonging to that section are displayed

#### Scenario: Clear filter
- **WHEN** a user selects "All Sections"
- **THEN** all films are displayed regardless of section
