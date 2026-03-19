## ADDED Requirements

### Requirement: Token generation on first sync
The system SHALL generate a 4-character alphanumeric token from a reduced alphabet (excluding ambiguous characters 0/O, 1/I/L) when the user first activates sync.

#### Scenario: First sync activation
- **WHEN** the user opens the sync modal and no sync token exists in localStorage
- **THEN** the system generates a new 4-character token and stores it in localStorage

#### Scenario: Subsequent sync modal opens
- **WHEN** the user opens the sync modal and a sync token already exists in localStorage
- **THEN** the system displays the existing token (does not generate a new one)

### Requirement: Auto-sync on plan changes
The system SHALL automatically push plan state to the server on every change when a sync token is present, debounced by 3 seconds.

#### Scenario: Debounced sync after change
- **WHEN** the user adds a screening to their plan and a sync token exists
- **THEN** the system waits 3 seconds of inactivity, then sends a PUT request to `/api/sync/[token]` with the current plan state

#### Scenario: Rapid changes reset debounce
- **WHEN** the user makes multiple changes within 3 seconds
- **THEN** only one PUT request is sent, 3 seconds after the last change

#### Scenario: No sync without token
- **WHEN** the user makes a plan change and no sync token exists in localStorage
- **THEN** no sync request is made

### Requirement: Initial pull on mount
The system SHALL pull the latest plan data from the server when the plan page mounts and a sync token exists.

#### Scenario: Pull on page load
- **WHEN** the plan page loads and a sync token exists in localStorage
- **THEN** the system sends a GET request to `/api/sync/[token]` and merges the response with local state

### Requirement: Merge application to contexts
The system SHALL apply merged data from the server to both PlanContext and FavouritesContext.

#### Scenario: Remote changes applied
- **WHEN** a sync response contains items not present locally
- **THEN** the system adds those items to the appropriate React context and localStorage

#### Scenario: Remote removals applied
- **WHEN** a sync response marks an item as removed with a newer timestamp than the local state
- **THEN** the system removes that item from the appropriate React context and localStorage

### Requirement: Sync status tracking
The system SHALL expose sync status (idle, syncing, synced, error) for UI consumption.

#### Scenario: Status transitions
- **WHEN** a sync request is initiated
- **THEN** status changes to "syncing", then to "synced" on success or "error" on failure
