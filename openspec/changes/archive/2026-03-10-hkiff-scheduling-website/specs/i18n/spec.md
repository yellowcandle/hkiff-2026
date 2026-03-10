## ADDED Requirements

### Requirement: Locale-prefix routing
The system SHALL serve all pages under `/en/` and `/zh/` locale prefixes, with `/` redirecting to the default locale (`en`).

#### Scenario: Default locale redirect
- **WHEN** a user visits `/`
- **THEN** they are redirected to `/en`

#### Scenario: Chinese locale accessible
- **WHEN** a user visits `/zh/films`
- **THEN** the page renders with Traditional Chinese UI strings

### Requirement: UI string translation
The system SHALL store all UI strings (labels, headings, navigation, messages) in `messages/en.json` and `messages/zh.json`, served via `next-intl`.

#### Scenario: Strings translated
- **WHEN** the locale is `zh`
- **THEN** all navigation labels, filter labels, and UI messages appear in Traditional Chinese

### Requirement: Locale switcher
The system SHALL display a locale toggle in the site header that switches between EN and ZH while preserving the current page path.

#### Scenario: Switch locale
- **WHEN** a user on `/en/films/film-001` clicks the ZH toggle
- **THEN** they are navigated to `/zh/films/film-001`
