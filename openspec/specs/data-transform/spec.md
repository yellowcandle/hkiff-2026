## MODIFIED Requirements

### Requirement: Film data transformation
The transformation layer uses enriched film data instead of deriving fields at runtime.

#### Scenario: Loading enriched films
- **WHEN** `getFilms()` is called
- **THEN** it loads from `data/films-enriched.json` which already contains `title: {en, zh}`, `section`, `country`, `year`, `runtime`, `synopsis`, `language`, `subtitles`

#### Scenario: Minimal transformation needed
- **WHEN** enriched data is loaded
- **THEN** the only transformation is slug generation for `id` and poster URL resolution — bilingual title derivation and section mapping are no longer needed
