## ADDED Requirements

### Requirement: Film detail scraping
A script scrapes all 175 HKIFF film detail pages and extracts structured metadata.

#### Scenario: Scraping a film detail page
- **WHEN** the script fetches `hkiff.org.hk/film/getdetail?fid=<fid>`
- **THEN** it extracts: English title, Chinese title, director, country, year, runtime, language, subtitles, synopsis (en), section(s), and cast

#### Scenario: Rate-limited fetching
- **WHEN** the script processes multiple films
- **THEN** it waits at least 500ms between requests

#### Scenario: Error handling
- **WHEN** a page fails to load or parse
- **THEN** the error is logged and the script continues with the next film

#### Scenario: Output format
- **WHEN** all films are scraped
- **THEN** the script outputs `data/films-enriched.json` with each film containing all extracted fields plus the original `fid`, `imgSrc`, `localImg`, `imdbId`, `letterboxdUrl`

### Requirement: Section mapping generation
The script generates an accurate section mapping from scraped data.

#### Scenario: Generating film-sections.json
- **WHEN** films are scraped with section data
- **THEN** `data/film-sections.json` is regenerated with slug → primary section ID mappings derived from the website
