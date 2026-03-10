## ADDED Requirements

### Requirement: User can favourite a film
The system SHALL allow users to mark any film as a favourite by toggling a star/bookmark icon on the film card.

#### Scenario: Adding a favourite from the film catalogue
- **WHEN** user clicks the favourite toggle on a film card that is not currently favourited
- **THEN** the film ID is added to the favourites list in localStorage and the toggle visually reflects the favourited state

#### Scenario: Removing a favourite
- **WHEN** user clicks the favourite toggle on a film card that is currently favourited
- **THEN** the film ID is removed from the favourites list in localStorage and the toggle visually reflects the unfavourited state

### Requirement: Favourites persist across sessions
The system SHALL persist the user's film favourites in browser localStorage so they survive page reloads and browser restarts.

#### Scenario: Reload preserves favourites
- **WHEN** user has favourited 3 films and reloads the page
- **THEN** all 3 films still show as favourited

### Requirement: Filter catalogue by favourites
The system SHALL provide a filter option in the film catalogue to show only favourited films.

#### Scenario: Filtering to favourites only
- **WHEN** user activates the "favourites only" filter in the film catalogue
- **THEN** only films whose IDs are in the favourites list are displayed

#### Scenario: No favourites with filter active
- **WHEN** user activates the "favourites only" filter but has no favourited films
- **THEN** an empty state message is displayed indicating no favourites have been saved

### Requirement: Favourites are independent of screening plan
The favourites list SHALL be independent of the screening plan. Adding or removing a screening from the plan MUST NOT affect favourites, and vice versa.

#### Scenario: Removing a screening does not unfavourite the film
- **WHEN** user has favourited film X and has a screening of film X in their plan, then removes the screening
- **THEN** film X remains in the favourites list
