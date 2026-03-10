## MODIFIED Requirements

### Requirement: Screening row shows frame selection toggle
Each screening row on the film detail page SHALL display an "Add to Plan" / "✓ Selected" toggle button instead of a "Buy Tickets" link.

#### Scenario: Unselected screening
- **WHEN** the screening is not in the user's plan
- **THEN** the row shows an "Add to Plan" button

#### Scenario: Selected screening
- **WHEN** the screening is in the user's plan
- **THEN** the row shows a "✓ Selected" state and a remove affordance

#### Scenario: Toggle adds to plan
- **WHEN** user clicks "Add to Plan"
- **THEN** the screening is added to the plan and the row updates to show "✓ Selected"

#### Scenario: Toggle removes from plan
- **WHEN** user clicks on a "✓ Selected" row
- **THEN** the screening is removed from the plan

### Requirement: Inline conflict warning on screening row
The system SHALL display an inline warning on a screening row when adding it would create a time conflict with an existing plan entry. The warning SHALL appear before or immediately after the add action.

#### Scenario: Conflict warning shown
- **WHEN** a screening overlaps in time with another screening already in the plan
- **THEN** the row displays a conflict warning (e.g., "Conflicts with [other film title]")

#### Scenario: Warning does not block addition
- **WHEN** user adds a conflicting screening
- **THEN** the screening is added to the plan despite the conflict

### Requirement: Same-film duplicate warning on screening row
The system SHALL display an inline warning when the user adds a frame for a film that already has another frame in the plan.

#### Scenario: Duplicate film warning shown
- **WHEN** user adds a screening for a film that already has a different screening in the plan
- **THEN** the row displays a "You already have another screening of this film in your plan" warning

#### Scenario: Warning does not block addition
- **WHEN** user adds a duplicate-film screening
- **THEN** both screenings remain in the plan
