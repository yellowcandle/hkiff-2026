## ADDED Requirements

### Requirement: Display full film details
The system SHALL display a dedicated page at `/[locale]/films/[id]` for each film, showing poster, bilingual title, director, country, year, runtime, language, subtitles, section, and synopsis.

#### Scenario: Film detail page renders
- **WHEN** a user navigates to `/en/films/film-001`
- **THEN** all available metadata for the film is displayed in English

#### Scenario: Film detail in Chinese
- **WHEN** a user navigates to `/zh/films/film-001`
- **THEN** title and synopsis are displayed in Traditional Chinese

### Requirement: List all screenings for the film
The system SHALL display a list of all screenings for the film, each showing date, time, venue name, and a link to purchase tickets.

#### Scenario: Screenings listed
- **WHEN** a film has one or more screenings
- **THEN** each screening is shown with date, time, venue, and ticket link

#### Scenario: No screenings
- **WHEN** a film has no screenings in the data
- **THEN** a message "No screenings scheduled" is displayed
