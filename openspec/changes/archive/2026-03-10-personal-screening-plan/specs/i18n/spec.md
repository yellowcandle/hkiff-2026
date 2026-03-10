## MODIFIED Requirements

### Requirement: Plan UI strings in both locales
All user-visible strings for the plan feature SHALL have translations in `messages/en.json` and `messages/zh.json` under a `plan` namespace.

Required keys:
- `plan.title` — page heading
- `plan.empty` — empty state message
- `plan.browseFilms` — CTA link text to films page
- `plan.share` — share/export button label
- `plan.copied` — clipboard confirmation message
- `plan.removeScreening` — remove button aria-label
- `plan.conflict` — conflict indicator label
- `plan.conflictWith` — inline conflict warning (accepts film title param)
- `plan.duplicateFilm` — same-film duplicate warning
- `plan.inPlan` — "In Plan" badge label on FilmCard
- `plan.addToPlan` — add button label on film detail
- `plan.selected` — selected state label on film detail
- `plan.bookingCodes` — footer label in export text
- `nav.plan` — navigation link label for header

#### Scenario: English strings present
- **WHEN** locale is `en`
- **THEN** all plan namespace keys resolve without missing-translation errors

#### Scenario: Chinese strings present
- **WHEN** locale is `zh`
- **THEN** all plan namespace keys resolve without missing-translation errors
