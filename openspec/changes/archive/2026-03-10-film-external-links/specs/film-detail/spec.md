## MODIFIED Requirements

### Requirement: Film detail page renders external links row
The film detail page SHALL render an external links row between the metadata grid and the synopsis section when at least one of `film.imdbId` or `film.letterboxdSlug` is present.

#### Scenario: Both links present
- **WHEN** both `film.imdbId` and `film.letterboxdSlug` are defined
- **THEN** both an IMDb link and a Letterboxd link appear in the external links row

#### Scenario: Only IMDb present
- **WHEN** `film.imdbId` is defined and `film.letterboxdSlug` is undefined
- **THEN** only the IMDb link appears

#### Scenario: Only Letterboxd present
- **WHEN** `film.letterboxdSlug` is defined and `film.imdbId` is undefined
- **THEN** only the Letterboxd link appears

#### Scenario: Neither present
- **WHEN** both fields are undefined
- **THEN** the external links row is not rendered
