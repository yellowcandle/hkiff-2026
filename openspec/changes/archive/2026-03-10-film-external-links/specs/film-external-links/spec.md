## ADDED Requirements

### Requirement: IMDb link displayed when ID is present
The film detail page SHALL display a link to the film's IMDb page when `film.imdbId` is defined. The link SHALL open in a new tab. The URL SHALL be constructed as `https://www.imdb.com/title/{imdbId}/`.

#### Scenario: IMDb link shown
- **WHEN** `film.imdbId` is a non-empty string
- **THEN** an "IMDb ↗" link is rendered pointing to `https://www.imdb.com/title/{imdbId}/`

#### Scenario: IMDb link absent
- **WHEN** `film.imdbId` is undefined
- **THEN** no IMDb link or placeholder is rendered

### Requirement: Letterboxd link displayed when slug is present
The film detail page SHALL display a link to the film's Letterboxd page when `film.letterboxdSlug` is defined. The link SHALL open in a new tab. The URL SHALL be constructed as `https://letterboxd.com/film/{letterboxdSlug}/`.

#### Scenario: Letterboxd link shown
- **WHEN** `film.letterboxdSlug` is a non-empty string
- **THEN** a "Letterboxd ↗" link is rendered pointing to `https://letterboxd.com/film/{letterboxdSlug}/`

#### Scenario: Letterboxd link absent
- **WHEN** `film.letterboxdSlug` is undefined
- **THEN** no Letterboxd link or placeholder is rendered

### Requirement: External links row hidden when both absent
The system SHALL render no external links row when both `imdbId` and `letterboxdSlug` are undefined.

#### Scenario: No links row
- **WHEN** both `film.imdbId` and `film.letterboxdSlug` are undefined
- **THEN** the external links section is not rendered and leaves no visual gap
