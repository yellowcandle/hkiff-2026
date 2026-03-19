## MODIFIED Requirements

### Requirement: User can favourite a film
The system SHALL allow users to mark any film as a favourite by toggling a star/bookmark icon on the film card. When favourites change, the system SHALL notify the sync hook if one is registered.

#### Scenario: Adding a favourite from the film catalogue
- **WHEN** user clicks the favourite toggle on a film card that is not currently favourited
- **THEN** the film ID is added to the favourites list in localStorage with a current timestamp, the toggle visually reflects the favourited state, and the sync hook is notified of the change

#### Scenario: Removing a favourite
- **WHEN** user clicks the favourite toggle on a film card that is currently favourited
- **THEN** the film ID is moved to the removed map with a current timestamp, the toggle visually reflects the unfavourited state, and the sync hook is notified of the change

## ADDED Requirements

### Requirement: Contexts accept external state updates
PlanContext and FavouritesContext SHALL expose a method to apply merged state from the sync system without triggering a re-sync.

#### Scenario: Applying remote merge to PlanContext
- **WHEN** the sync client receives merged data from the server
- **THEN** PlanContext updates its internal state and localStorage to reflect the merged plan without triggering a new sync push

#### Scenario: Applying remote merge to FavouritesContext
- **WHEN** the sync client receives merged data from the server
- **THEN** FavouritesContext updates its internal state and localStorage to reflect the merged favourites without triggering a new sync push
