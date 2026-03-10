#!/usr/bin/env node
/**
 * Scrape HKIFF film detail pages to find which screenings have
 * "Filmmaker/Film critic will attend the screening" markers.
 * Updates screenings.json with guestAttend field.
 */

import { readFileSync, writeFileSync } from "fs";

const screenings = JSON.parse(readFileSync("data/screenings.json", "utf-8"));

// Get unique fids
const fidSet = new Set();
for (const s of screenings) {
  const url = s.ticketUrl || "";
  const m = url.match(/fid=(\d+)/);
  if (m) fidSet.add(m[1]);
}
const fids = [...fidSet].sort();
console.log(`Scraping ${fids.length} film pages...`);

const guestScreeningCodes = new Set();
const errors = [];

for (let i = 0; i < fids.length; i++) {
  const fid = fids[i];
  const url = `https://www.hkiff.org.hk/film/getdetail?fid=${fid}`;
  try {
    const res = await fetch(url);
    const html = await res.text();

    // HTML structure: each screening is in a container with
    // <span>03KG03</span> <span>9:15 PM</span>
    // followed by a <div class="desc"> with attend.svg if applicable.
    // Find all screening codes and check if attend marker follows before next code.

    const codePattern = /<span>(\d{2}[A-Z]{2}\d{2})<\/span>/g;
    let match;
    const codePositions = [];
    while ((match = codePattern.exec(html)) !== null) {
      codePositions.push({ code: match[1], index: match.index });
    }

    for (let j = 0; j < codePositions.length; j++) {
      const { code, index } = codePositions[j];
      const nextIndex = j + 1 < codePositions.length
        ? codePositions[j + 1].index
        : index + 2000;
      const segment = html.substring(index, nextIndex);

      if (
        segment.includes("attend.svg") ||
        segment.includes("will attend the screening") ||
        segment.includes("將出席放映")
      ) {
        guestScreeningCodes.add(code);
      }
    }

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${fids.length} done...`);
  } catch (e) {
    errors.push({ fid, error: e.message });
  }
}

console.log(`\nFound ${guestScreeningCodes.size} screenings with guest attendance`);
if (errors.length) console.log(`Errors: ${errors.length}`, errors);

// Update screenings.json
let updated = 0;
for (const s of screenings) {
  if (guestScreeningCodes.has(s.screeningCode)) {
    s.guestAttend = true;
    updated++;
  }
}
console.log(`Updated ${updated} screenings in data`);

writeFileSync("data/screenings.json", JSON.stringify(screenings, null, 2) + "\n");
console.log("Saved data/screenings.json");

// Also save the raw set for reference
writeFileSync(
  "data/guest-attendance.json",
  JSON.stringify([...guestScreeningCodes].sort(), null, 2) + "\n"
);
console.log("Saved data/guest-attendance.json");
