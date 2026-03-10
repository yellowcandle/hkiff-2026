## Context

175 films in `films.json` have IMDb IDs (168) and Letterboxd URLs (162) from an initial scrape. Some are wrong due to title ambiguity. We now have accurate year, director, and Chinese titles from brochure enrichment.

## Goals / Non-Goals

**Goals:**
- Validate every IMDb ID points to the correct film
- Validate every Letterboxd URL resolves to the correct film
- Fix mismatches automatically where possible
- Report remaining issues for manual review

**Non-Goals:**
- Creating accounts or using authenticated APIs
- Matching compilation programmes (short film collections) to single entries

## Decisions

### 1. IMDb suggestions API for validation

**Decision**: Use `https://v2.sg.media-imdb.com/suggestion/{first_letter}/{query}.json` which returns JSON with `{id, l(title), y(year), q(type)}`. Query with `"title year"` format.

**Rationale**: Free, no API key, returns structured JSON. Tested with "cyclone 2026" and correctly returned tt37020774.

### 2. Letterboxd slug probing

**Decision**: Try these URL patterns in order: `/film/{slug}/`, `/film/{slug}-{year}/`, `/film/{slug}-{year}-1/`. Check HTTP status and extract director from page to verify.

**Rationale**: Letterboxd disambiguates by appending year or `-1` suffix. No search API available (403 on search pages), but direct URLs with WebFetch work.

### 3. Validation strategy

**Decision**: For each film:
1. Query IMDb suggestions with `"title year"`, find matching entry by title similarity + year
2. Compare found IMDb ID with existing one
3. If mismatch: flag and update
4. If no match: try Chinese title query as fallback
5. For Letterboxd: probe slug variations, verify director match

### 4. Rate limiting

**Decision**: 300ms delay between IMDb requests, 500ms between Letterboxd requests.

## Risks / Trade-offs

- **[IMDb suggestions may not find very new or obscure films]** → Flag for manual review, keep existing ID if no better match found
- **[Letterboxd 403 on search]** → Use direct URL probing instead of search
- **[Chinese title queries may return unexpected results]** → Only use as fallback, always verify director
