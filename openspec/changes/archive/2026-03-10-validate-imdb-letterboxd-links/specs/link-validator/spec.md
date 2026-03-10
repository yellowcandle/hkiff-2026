## ADDED Requirements

### Requirement: IMDb ID validation
Each film's IMDb ID is validated against the IMDb suggestions API using title + year.

#### Scenario: Correct IMDb ID
- **WHEN** the IMDb suggestions API for "Three Colours: Blue 1993" returns tt0108394
- **THEN** the existing imdbId tt0108394 is confirmed as correct

#### Scenario: Wrong IMDb ID
- **WHEN** the IMDb suggestions API for "Cyclone 2026" returns tt37020774 but the existing imdbId is tt0092812
- **THEN** the imdbId is updated to tt37020774 and the change is logged

#### Scenario: No IMDb match found
- **WHEN** the IMDb suggestions API returns no matching entry for a film
- **THEN** the film is flagged for manual review and the existing ID is kept

### Requirement: Letterboxd URL validation
Each film's Letterboxd URL is validated by probing slug variations.

#### Scenario: Direct slug match
- **WHEN** fetching `/film/cyclone-2026/` returns a page with director "Philip Yung"
- **THEN** the letterboxdUrl is set to `https://letterboxd.com/film/cyclone-2026/`

#### Scenario: No Letterboxd page found
- **WHEN** no slug variation resolves to the correct film
- **THEN** the film is flagged for manual review

### Requirement: Validation report
The script outputs a report of all changes and issues.

#### Scenario: Report format
- **WHEN** validation completes
- **THEN** a JSON report at `data/link-validation-report.json` lists: confirmed (correct), fixed (updated), unresolved (needs manual review)
