## ADDED Requirements

### Requirement: Share/Export button on plan page
The system SHALL provide a single Share/Export action on the plan page that is disabled when the plan is empty.

#### Scenario: Button disabled when empty
- **WHEN** no screenings are in the plan
- **THEN** the Share/Export button is disabled or absent

#### Scenario: Button enabled when plan has items
- **WHEN** one or more screenings are in the plan
- **THEN** the Share/Export button is enabled

### Requirement: Export uses native share on mobile
The system SHALL invoke `navigator.share()` with the plain-text schedule when it is available.

#### Scenario: Native share triggered
- **WHEN** user taps Share/Export on a device where `navigator.share` is available
- **THEN** the native share sheet opens with the plain-text schedule as the shared text

### Requirement: Export copies to clipboard on desktop
The system SHALL copy the plain-text schedule to the clipboard when `navigator.share` is unavailable, and show a brief confirmation.

#### Scenario: Clipboard copy
- **WHEN** user clicks Share/Export and `navigator.share` is not available
- **THEN** the schedule text is copied to the clipboard and a "Copied!" confirmation appears

### Requirement: Export plain-text format
The exported text SHALL follow this structure:
1. Header: "My HKIFF 50 Plan"
2. One section per date with a date heading
3. Each screening row: `HH:MM–HH:MM  <Film Title>  <VenueCode>  [<ScreeningCode>]`
4. Conflict rows annotated with `← overlaps` indicators
5. A footer line listing all booking codes separated by ` · `

#### Scenario: Booking codes in footer
- **WHEN** the export text is generated
- **THEN** all screening codes in the plan appear on a single "Booking codes:" footer line

#### Scenario: Conflicts annotated in export
- **WHEN** two screenings in the plan conflict
- **THEN** both conflicting rows in the export text include an overlap annotation
