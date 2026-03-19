## ADDED Requirements

### Requirement: Sync Devices button on Plan page
The system SHALL display a "Sync Devices" button in the Plan page header actions area.

#### Scenario: Button opens sync modal
- **WHEN** the user clicks the "Sync Devices" button
- **THEN** the sync modal opens

### Requirement: Persistent sync badge
The system SHALL display a sync status badge in the Plan page header when sync is active (token exists).

#### Scenario: Badge shows sync code
- **WHEN** the user has an active sync token "7X3K"
- **THEN** a green badge displays "Synced: 7X3K" with a checkmark icon

#### Scenario: Badge shows syncing state
- **WHEN** a sync request is in progress
- **THEN** the badge displays a spinner icon

#### Scenario: Badge shows error state
- **WHEN** a sync request fails
- **THEN** the badge displays a warning icon

#### Scenario: No badge without sync
- **WHEN** no sync token exists
- **THEN** no badge is displayed

#### Scenario: Badge is clickable
- **WHEN** the user clicks the sync badge
- **THEN** the sync modal opens

### Requirement: Sync modal displays code, QR, and link
The system SHALL display a modal with three ways to share the sync code: a 4-character code display, a QR code encoding the sync URL, and a "Copy Sync Link" button.

#### Scenario: Code display
- **WHEN** the sync modal is open and a token exists
- **THEN** the modal displays the 4-character code in large, distinct character boxes

#### Scenario: QR code
- **WHEN** the sync modal is open
- **THEN** a QR code encoding `<site-url>/plan?sync=<token>` is displayed

#### Scenario: Copy link
- **WHEN** the user clicks "Copy Sync Link"
- **THEN** the sync URL is copied to clipboard and the button shows confirmation

### Requirement: Sync modal join flow
The system SHALL allow users to enter a sync code from another device to join that sync group.

#### Scenario: Enter code and join
- **WHEN** the user enters a 4-character code in the input field and clicks "Sync"
- **THEN** the system fetches data from `/api/sync/[code]`, merges with local state, saves the token, and shows a merge summary

#### Scenario: Invalid code
- **WHEN** the user enters a code that returns 404 from the API
- **THEN** an error message is displayed: "Code not found. Check and try again."

### Requirement: Query parameter join flow
The system SHALL handle the `?sync=<token>` query parameter on the Plan page to trigger the join flow.

#### Scenario: Opening sync link
- **WHEN** the Plan page loads with `?sync=7X3K` in the URL
- **THEN** the system fetches data for token `7X3K`, merges with local state, saves the token, shows a merge summary toast, and removes the `?sync` param from the URL

#### Scenario: Sync link with existing different token
- **WHEN** the Plan page loads with `?sync=ABCD` and the user already has token `7X3K`
- **THEN** the system shows a confirmation dialog: "This will merge your current plan with another device's plan. Continue?"

### Requirement: Merge summary toast
The system SHALL display a toast notification after a successful merge showing what changed.

#### Scenario: Merge with changes
- **WHEN** a merge adds 3 screenings, 2 favourites, and removes 1 screening
- **THEN** the toast displays "+ 3 screenings added", "+ 2 favourites added", "− 1 screening removed" with a "View My Plan" button

#### Scenario: Merge with no changes
- **WHEN** a merge results in no differences
- **THEN** the toast displays "Already in sync — no changes needed."
