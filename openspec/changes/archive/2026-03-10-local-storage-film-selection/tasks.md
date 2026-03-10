## 1. Storage Utility Module

- [x] 1.1 Create `src/lib/storage.ts` with typed interface: `StorageData { version: number; plan: string[]; favourites: string[] }`
- [x] 1.2 Implement `loadStorage()` — reads `hkiff50-data`, validates JSON, returns typed data or defaults
- [x] 1.3 Implement `saveStorage(data)` — writes versioned envelope, catches `QuotaExceededError`, returns success boolean
- [x] 1.4 Implement legacy migration: detect `hkiff50-plan`, migrate to new envelope, delete old key

## 2. Refactor PlanContext to Use Storage Utility

- [x] 2.1 Update `PlanContext.tsx` to import and use `loadStorage()` / `saveStorage()` instead of direct `localStorage` calls
- [x] 2.2 Add storage-failure feedback state (e.g. a `storageError` boolean exposed via context or callback)

## 3. Favourites Context

- [x] 3.1 Create `src/components/FavouritesContext.tsx` with `FavouritesProvider` and `useFavourites()` hook
- [x] 3.2 Implement `addFavourite(filmId)`, `removeFavourite(filmId)`, `isFavourite(filmId)` using storage utility
- [x] 3.3 Wire `FavouritesProvider` into `src/app/[locale]/layout.tsx` alongside `PlanProvider`

## 4. Film Card Favourite Toggle

- [x] 4.1 Add favourite toggle button (star icon) to `FilmCard.tsx`
- [x] 4.2 Connect toggle to `useFavourites()` context — add/remove on click, visual state reflects favourited status

## 5. Catalogue Favourites Filter

- [x] 5.1 Add "Favourites only" filter toggle to `FilmCatalogueClient.tsx`
- [x] 5.2 Filter displayed films by favourites list when toggle is active
- [x] 5.3 Show empty state message when filter is active but no films are favourited

## 6. i18n Strings

- [x] 6.1 Add translation keys for favourite toggle, filter label, empty state, and storage error messages in both `en` and `zh` locale files
