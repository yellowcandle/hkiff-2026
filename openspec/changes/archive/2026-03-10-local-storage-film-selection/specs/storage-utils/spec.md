## ADDED Requirements

### Requirement: Centralised storage access
All localStorage reads and writes for user data (plan, favourites) SHALL go through `src/lib/storage.ts`. No other module SHALL call `localStorage` directly for user data.

#### Scenario: PlanContext uses storage utility
- **WHEN** PlanContext initialises or updates the plan
- **THEN** it calls functions from `src/lib/storage.ts` instead of `localStorage` directly

### Requirement: Versioned storage envelope
The storage module SHALL store all user data under a single localStorage key (`hkiff50-data`) as a JSON object with a `version` field.

#### Scenario: Data is stored with version
- **WHEN** the storage module writes data
- **THEN** the stored JSON includes `{ version: 1, plan: [...], favourites: [...] }`

### Requirement: Migration from legacy key
On first load, the storage module SHALL check for the legacy `hkiff50-plan` key and migrate its data into the new versioned envelope.

#### Scenario: Legacy data migration
- **WHEN** user loads the app and `hkiff50-plan` exists but `hkiff50-data` does not
- **THEN** the plan array from `hkiff50-plan` is migrated into `hkiff50-data` with `version: 1` and `favourites: []`, and `hkiff50-plan` is removed

#### Scenario: Both keys exist
- **WHEN** both `hkiff50-plan` and `hkiff50-data` exist
- **THEN** `hkiff50-data` takes precedence and `hkiff50-plan` is removed

### Requirement: Storage-full error handling
The storage module SHALL catch `QuotaExceededError` on write and return a failure indicator so the UI can inform the user.

#### Scenario: Storage quota exceeded
- **WHEN** a write to localStorage throws `QuotaExceededError`
- **THEN** the storage module returns `false` and does not corrupt existing data

#### Scenario: UI feedback on storage failure
- **WHEN** a storage write fails due to quota
- **THEN** the consuming component displays a transient error message to the user

### Requirement: Malformed data handling
The storage module SHALL handle corrupt or malformed JSON gracefully by falling back to empty defaults.

#### Scenario: Corrupt JSON in storage
- **WHEN** the stored value under `hkiff50-data` is not valid JSON
- **THEN** the storage module returns default empty state (`{ plan: [], favourites: [] }`) and does not throw
