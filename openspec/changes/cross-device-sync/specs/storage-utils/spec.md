## MODIFIED Requirements

### Requirement: Versioned storage envelope
The storage module SHALL store all user data under a single localStorage key (`hkiff50-data`) as a JSON object with a `version` field. Version 3 adds per-item timestamps for sync support and an optional sync token.

#### Scenario: Data is stored with version
- **WHEN** the storage module writes data
- **THEN** the stored JSON includes `{ version: 3, plan: { [screeningId]: { at: number, qty: number } }, favourites: { [filmId]: { at: number } }, removed: { [id]: { at: number } }, syncToken: string | null }`

#### Scenario: Migration from v2 to v3
- **WHEN** user loads the app and `hkiff50-data` contains version 2 data
- **THEN** the storage module migrates each plan entry to `{ at: Date.now(), qty: ticketQuantities[id] || 1 }`, each favourite to `{ at: Date.now() }`, sets `removed: {}`, sets `syncToken: null`, and updates version to 3

## ADDED Requirements

### Requirement: Merge function for sync data
The storage module SHALL export a `mergeState(local, remote)` function that produces a merged state using per-item timestamp comparison.

#### Scenario: Item exists on both sides with different timestamps
- **WHEN** local has `s-foo-01: { state: "added", at: 100 }` and remote has `s-foo-01: { state: "removed", at: 200 }`
- **THEN** the merged result uses the remote version (timestamp 200 > 100)

#### Scenario: Item exists only on one side
- **WHEN** local has `s-foo-01` but remote does not
- **THEN** the merged result includes `s-foo-01` from local

#### Scenario: Ticket quantities merge
- **WHEN** local has `s-foo-01: { at: 300, qty: 2 }` and remote has `s-foo-01: { at: 100, qty: 4 }`
- **THEN** the merged result uses local's quantity (timestamp 300 > 100)

### Requirement: Sync token persistence
The storage module SHALL store and retrieve the sync token as part of the v3 storage envelope.

#### Scenario: Save sync token
- **WHEN** a sync token is generated or received
- **THEN** it is stored in the v3 envelope under `syncToken`

#### Scenario: Read sync token
- **WHEN** the app loads and v3 data exists with a syncToken
- **THEN** the sync token is available for the sync client to use

### Requirement: Prepare sync payload
The storage module SHALL export a function to convert local v3 state into the format expected by the sync API (plan items with state/timestamp, favourites with state/timestamp).

#### Scenario: Convert local state to sync format
- **WHEN** the sync client needs to push state
- **THEN** the storage module produces a JSON object with plan items (added entries from `plan` map, removed entries from `removed` map) and favourites in the same format
