## ADDED Requirements

### Requirement: Parse brochure calendar text into structured screening data
The parser script SHALL read the brochure calendar section (HKIFF50-BF.txt lines 7809-9977) and extract all screening entries into a structured JSON array.

#### Scenario: Extract all 318 screening entries
- **WHEN** the parser runs against the brochure calendar text
- **THEN** it SHALL produce at least 318 screening entry objects

#### Scenario: Each entry contains required fields
- **WHEN** a screening entry is parsed
- **THEN** it SHALL contain: screeningCode, date (ISO 8601), time (HH:MM 24h), venueId, filmTitle.en, filmTitle.zh, duration (minutes)

### Requirement: Derive date and venue from screening code
The parser SHALL decode the screening code format `DDVVNN` to extract the festival day and venue code.

#### Scenario: Screening code 03KG01 decoded
- **WHEN** screening code is `03KG01`
- **THEN** date SHALL be `2026-04-03` (day 03 = April 3) and venueId SHALL be `KG`

#### Scenario: Screening code 12AC05 decoded
- **WHEN** screening code is `12AC05`
- **THEN** date SHALL be `2026-04-12` (day 12 = April 12) and venueId SHALL be `AC`

### Requirement: Parse time from 12-hour format to 24-hour
The parser SHALL convert brochure times (e.g., "9:15 pm", "12:30 pm") to 24-hour HH:MM format.

#### Scenario: PM time conversion
- **WHEN** brochure shows "9:15 pm"
- **THEN** time SHALL be `21:15`

#### Scenario: 12 PM handling
- **WHEN** brochure shows "12:30 pm"
- **THEN** time SHALL be `12:30`

### Requirement: Extract bilingual film titles
The parser SHALL extract both English and Chinese film titles from each calendar entry.

#### Scenario: Standard bilingual entry
- **WHEN** entry contains "Xiao Wu" and "小武"
- **THEN** filmTitle.en SHALL be "Xiao Wu" and filmTitle.zh SHALL be "小武"

### Requirement: Detect event metadata from inline labels
The parser SHALL identify non-film events by their text labels in the calendar.

#### Scenario: Master Class detected
- **WHEN** entry text contains "Master Class" or "大師班"
- **THEN** the entry SHALL be flagged with event type `master-class`

#### Scenario: Face to Face detected
- **WHEN** entry text contains "Face to Face" or "名家講座"
- **THEN** the entry SHALL be flagged with event type `face-to-face`

#### Scenario: Seminar detected
- **WHEN** entry text contains "Seminar" or "座談會"
- **THEN** the entry SHALL be flagged with event type `seminar`

### Requirement: Generate filmId from English title
The parser SHALL generate a slug-based filmId from the English title using the same algorithm as `toSlug()` in `src/lib/data.ts` (NFD normalization, diacritics stripping, lowercase, non-alphanumeric to hyphens).

#### Scenario: Title with diacritics
- **WHEN** English title is "Anikó Bóbó"
- **THEN** filmId SHALL be `aniko-bobo`

#### Scenario: Title with apostrophe
- **WHEN** English title is "Adam's Sake"
- **THEN** filmId SHALL be `adams-sake`
