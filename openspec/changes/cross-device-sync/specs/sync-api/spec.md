## ADDED Requirements

### Requirement: Sync API endpoint reads plan data by token
The system SHALL expose `GET /api/sync/[token]` that reads plan data from KV by the provided token and returns it as JSON.

#### Scenario: Successful read
- **WHEN** a GET request is made to `/api/sync/ABCD` and KV contains data for key `ABCD`
- **THEN** the system returns HTTP 200 with the stored plan data as JSON

#### Scenario: Token not found
- **WHEN** a GET request is made to `/api/sync/ABCD` and KV contains no data for key `ABCD`
- **THEN** the system returns HTTP 404 with `{"error": "not_found"}`

### Requirement: Sync API endpoint writes plan data with server-side merge
The system SHALL expose `PUT /api/sync/[token]` that merges the incoming plan data with existing KV data using timestamp-based merge, writes the result to KV, and returns the merged data.

#### Scenario: First write (no existing data)
- **WHEN** a PUT request is made to `/api/sync/ABCD` with plan data and no data exists in KV for `ABCD`
- **THEN** the system stores the incoming data in KV with a 30-day TTL and returns HTTP 200 with the stored data

#### Scenario: Merge with existing data
- **WHEN** a PUT request is made to `/api/sync/ABCD` with plan data and KV already contains data for `ABCD`
- **THEN** the system merges incoming and existing data using per-item timestamp comparison (latest timestamp wins for each item), stores the merged result in KV, and returns HTTP 200 with the merged data

#### Scenario: Merge correctly resolves additions and removals
- **WHEN** device A marks screening `s-foo-01` as removed at T=200 and device B has it as added at T=150
- **THEN** the merge result marks `s-foo-01` as removed (T=200 wins over T=150)

### Requirement: Sync API validates token format
The system SHALL reject requests with invalid token formats.

#### Scenario: Invalid token format
- **WHEN** a request is made to `/api/sync/!!invalid!!`
- **THEN** the system returns HTTP 400 with `{"error": "invalid_token"}`

#### Scenario: Valid token format
- **WHEN** a request is made with a token consisting of 4 alphanumeric characters (from the allowed alphabet)
- **THEN** the system processes the request normally

### Requirement: Sync API sets KV TTL
The system SHALL store KV entries with a 30-day expiration TTL, refreshed on every write.

#### Scenario: TTL refresh on write
- **WHEN** a PUT request writes data for token `ABCD`
- **THEN** the KV entry's TTL is set to 30 days from the current time

### Requirement: Sync API returns CORS headers
The system SHALL include appropriate CORS headers to allow requests from the same origin.

#### Scenario: CORS preflight
- **WHEN** an OPTIONS request is made to `/api/sync/ABCD`
- **THEN** the system returns HTTP 204 with `Access-Control-Allow-Methods: GET, PUT, OPTIONS`
