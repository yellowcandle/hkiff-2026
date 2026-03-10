## MODIFIED Requirements

### Requirement: FilmCard shows plan membership badge
A FilmCard SHALL display a visual indicator when any screening of that film is currently in the user's plan.

#### Scenario: Film in plan
- **WHEN** at least one screening of the film is in the user's plan
- **THEN** the FilmCard displays a "✓" or "In Plan" badge

#### Scenario: Film not in plan
- **WHEN** no screenings of the film are in the user's plan
- **THEN** no badge is shown on the FilmCard
