## 1. Type & Schema

- [x] 1.1 Add `imdbId?: string` and `letterboxdSlug?: string` to the `Film` type in `src/lib/types.ts`

## 2. Data

- [x] 2.1 For each film in `data/films.json`, use cmux browser automation to look up IMDb and Letterboxd IDs:
  - IMDb: navigate to `https://www.imdb.com/find/?q={title}+{year}&s=tt&ttype=ft`, snapshot the results, extract the `tt` ID from the first matching result link
  - Letterboxd: navigate to `https://letterboxd.com/search/films/{title}/`, snapshot the results, extract the slug from the first matching film link (`/film/{slug}/`)
  - Verify each match is correct (title + director confirm), skip if ambiguous or not found
  - Write confirmed `imdbId` and `letterboxdSlug` values into `data/films.json`

## 3. UI

- [x] 3.1 In `src/app/[locale]/films/[id]/page.tsx`, add an external links row between the metadata `<dl>` and the synopsis — render IMDb link when `film.imdbId` is present, Letterboxd link when `film.letterboxdSlug` is present; skip the row entirely when both are absent
