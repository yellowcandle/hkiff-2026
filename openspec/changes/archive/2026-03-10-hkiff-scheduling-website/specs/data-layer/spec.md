## ADDED Requirements

### Requirement: JSON data schemas
The system SHALL define and validate data via TypeScript types in `src/lib/types.ts` for Film, Screening, Venue, and Section entities.

#### Scenario: Type errors caught at build
- **WHEN** a JSON data file contains a field with the wrong type
- **THEN** the TypeScript compiler reports an error at build time

### Requirement: Data loader functions
The system SHALL provide typed loader functions in `src/lib/data.ts` that read from `data/*.json` at build time.

#### Scenario: Films loaded
- **WHEN** `getFilms()` is called
- **THEN** it returns a typed array of Film objects from `data/films.json`

#### Scenario: Screenings for a film
- **WHEN** `getScreeningsForFilm(filmId)` is called
- **THEN** it returns only screenings whose `filmId` matches

### Requirement: HKIFF 49 seed data
The system SHALL include seed data in `data/*.json` reflecting the HKIFF 49 (2025) programme as a usable template for the 50th edition.

#### Scenario: Seed data present
- **WHEN** the project is checked out fresh
- **THEN** `data/films.json` contains at least one film per section from HKIFF 49
