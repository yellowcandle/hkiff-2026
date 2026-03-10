## ADDED Requirements

### Requirement: Film data transformation
The system transforms raw scraped film data into the typed `Film` model at load time.

#### Scenario: Loading films from raw data
- **WHEN** `getFilms()` is called
- **THEN** each raw film object `{fid, title, director, imgSrc, localImg, ...}` is transformed into a `Film` object with `{id (slug), title: {en, zh}, director, section, posterUrl}`

#### Scenario: Slug generation
- **WHEN** a raw film has title `"We Are All Strangers"`
- **THEN** its `id` is generated as `"we-are-all-strangers"` (lowercase, spaces to hyphens, special characters removed)

#### Scenario: Bilingual title derivation
- **WHEN** a film's slug matches a screening's `filmId`
- **THEN** the film's `title.zh` is populated from the screening's `filmTitle.zh`

#### Scenario: Bilingual title fallback
- **WHEN** a film has no matching screening
- **THEN** `title.zh` falls back to the English title

### Requirement: Film-screening linkage
Films and screenings are linked by slug-based IDs.

#### Scenario: Film detail shows screenings
- **WHEN** a user views a film detail page for film with slug `"we-are-all-strangers"`
- **THEN** all screenings with `filmId: "we-are-all-strangers"` are displayed

#### Scenario: Films page shows all films
- **WHEN** a user views the Films catalogue page
- **THEN** all 175 films are displayed with poster images and metadata

### Requirement: Section assignment
Each film is assigned to one of the 8 festival sections.

#### Scenario: Film with explicit section mapping
- **WHEN** a film's slug exists in `data/film-sections.json`
- **THEN** its `section` field is set to the mapped section ID

#### Scenario: Film without explicit section mapping
- **WHEN** a film's slug is NOT in `data/film-sections.json`
- **THEN** its `section` defaults to `"world-cinema"`

#### Scenario: Section filtering
- **WHEN** a user selects a section filter on the Films page
- **THEN** only films assigned to that section are displayed

### Requirement: Poster image resolution
Film cards display poster images from available sources.

#### Scenario: Local image available
- **WHEN** a film has a `localImg` path
- **THEN** `posterUrl` is set to that local path

#### Scenario: Local image unavailable
- **WHEN** a film has no `localImg` or the file doesn't exist
- **THEN** `posterUrl` falls back to the remote `imgSrc` URL

### Requirement: Optional metadata fields
The Film type accommodates incomplete data gracefully.

#### Scenario: Missing country/year/runtime
- **WHEN** raw data has no `country`, `year`, or `runtime` field
- **THEN** these fields are `undefined` in the Film object and components display fallback text or omit them
