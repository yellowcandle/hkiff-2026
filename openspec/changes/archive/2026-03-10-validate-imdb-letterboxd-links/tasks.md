## 1. Validation Script

- [x] 1.1 Create `scripts/validate-film-links.mjs` — validates IMDb IDs via suggestions API, Letterboxd via slug probing
- [x] 1.2 Add Chinese title fallback — for films where English title query fails
- [x] 1.3 Add Letterboxd validation — probe slug and slug-year patterns, verify director

## 2. Run Validation

- [x] 2.1 Run the validator on all 175 films — 25 genuine IMDb fixes, 3 Letterboxd fixes, 16 false positives cleaned up
- [x] 2.2 Review report and clean false matches (Samba Infinito tt36844384 → restored originals)
- [x] 2.3 Updated films.json with corrected links

## 3. Verify

- [x] 3.1 Verified Cyclone tt37020774, Year One tt0071148, Stars tt0053306, The World tt0423176 are correct
- [x] 3.2 Film Detail pages show correct IMDb/Letterboxd links
