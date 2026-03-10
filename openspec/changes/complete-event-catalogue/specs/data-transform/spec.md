## MODIFIED Requirements

### Requirement: Film data transformation
The transformation layer uses enriched film data instead of deriving fields at runtime. The Screening type now includes an optional event metadata field.

#### Scenario: Loading enriched films
- **WHEN** `getFilms()` is called
- **THEN** it loads from `data/films.json` which already contains `title: {en, zh}`, `section`, `country`, `year`, `runtime`, `synopsis`, `language`, `subtitles`

#### Scenario: Minimal transformation needed
- **WHEN** enriched data is loaded
- **THEN** the only transformation is slug generation for `id` and poster URL resolution — bilingual title derivation and section mapping are no longer needed

#### Scenario: Screening data includes event metadata
- **WHEN** `getScreenings()` is called
- **THEN** screenings with event metadata SHALL include the `event` field as defined in the JSON data

#### Scenario: Screenings without events unchanged
- **WHEN** a screening in the dataset has no `event` field
- **THEN** it SHALL be returned as-is with no additional transformation
