## ADDED Requirements

### Requirement: Scrape HKIFF website calendar for all festival days
The scraper script SHALL fetch screening data from the HKIFF website AJAX endpoint for all 12 festival days (April 1-12, 2026).

#### Scenario: Fetch all days
- **WHEN** the scraper runs
- **THEN** it SHALL request `/film/ajaxGetCalenderList/date/{date}` for each date from 2026-04-01 to 2026-04-12

#### Scenario: Extract ticket URL per screening
- **WHEN** a screening entry is returned from the API
- **THEN** it SHALL extract the ticket URL (URBTIX link) for that screening

### Requirement: Match website data to screening codes
The scraper SHALL match website entries to brochure screening codes for merging.

#### Scenario: Screening code match
- **WHEN** a website entry has a screening code matching a brochure entry
- **THEN** the ticket URL from the website SHALL be associated with that screening code

#### Scenario: No match found
- **WHEN** a website entry has no matching brochure screening code
- **THEN** it SHALL be logged as unmatched but not discarded

### Requirement: Handle API errors gracefully
The scraper SHALL handle network errors and rate limiting without crashing.

#### Scenario: API returns error
- **WHEN** the AJAX endpoint returns an error or timeout
- **THEN** the scraper SHALL retry up to 3 times with exponential backoff and log the failure

#### Scenario: Rate limiting
- **WHEN** making sequential requests
- **THEN** the scraper SHALL wait at least 500ms between requests to avoid overwhelming the server
