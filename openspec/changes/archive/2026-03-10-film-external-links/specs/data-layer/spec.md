## MODIFIED Requirements

### Requirement: Film type includes optional external ID fields
The `Film` TypeScript type SHALL include `imdbId?: string` and `letterboxdSlug?: string` as optional fields. Omitting these fields from a `films.json` entry SHALL be valid.

#### Scenario: Film with both IDs
- **WHEN** a `films.json` entry includes `"imdbId": "tt1234567"` and `"letterboxdSlug": "some-film"`
- **THEN** the `Film` object exposes both fields as strings

#### Scenario: Film with no IDs
- **WHEN** a `films.json` entry omits both fields
- **THEN** the `Film` object has `imdbId` and `letterboxdSlug` as `undefined` with no type error
