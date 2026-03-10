/**
 * parse-brochure.mjs
 *
 * Parses the HKIFF50 brochure text file to extract film metadata.
 * Outputs a JSON file with all parsed film entries.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const brochurePath = join(rootDir, 'HKIFF50-BF.txt');
const outputPath = join(rootDir, 'data', 'brochure-films.json');

mkdirSync(dirname(outputPath), { recursive: true });

const text = readFileSync(brochurePath, 'utf-8');
const lines = text.split('\n');

// ── Section mapping ──────────────────────────────────────────────
// The brochure has section header lines like:
//   "｜ 星光盛宴 GALA PRESENTATION"
//   "首映禮 Galas"
//   "影迷嘉年華 Cinephile Paradise"
// These appear on their own lines (or with ｜ prefix).
// We map sub-section names to canonical section IDs.

const sectionRules = [
  // Order matters - more specific patterns first
  { pattern: /首映禮\s*Galas/i, section: 'gala-presentation' },
  { pattern: /影迷嘉年華\s*Cinephile Paradise/i, section: 'gala-presentation' },
  { pattern: /星光盛宴\s*GALA PRESENTATION/i, section: 'gala-presentation' },
  { pattern: /GALA PRESENTATION/i, section: 'gala-presentation' },

  { pattern: /茱麗葉庇洛仙.*Juliette Binoche/i, section: 'focus' },
  { pattern: /華語電影：長風破浪啟航時/i, section: 'focus' },
  { pattern: /Revisiting Chinese Cinema/i, section: 'focus' },
  { pattern: /^焦點$/m, section: 'focus' },
  { pattern: /^FOCUS$/m, section: 'focus' },

  { pattern: /新秀電影競賽（華語）/i, section: 'firebird-awards' },
  { pattern: /Young Cinema Competition \(Chinese/i, section: 'firebird-awards' },
  { pattern: /新秀電影競賽（世界）/i, section: 'firebird-awards' },
  { pattern: /Young Cinema Competition \(World/i, section: 'firebird-awards' },
  { pattern: /紀錄片競賽\s*Documentary Competition/i, section: 'firebird-awards' },
  { pattern: /國際短片競賽\s*Short Film Competition/i, section: 'firebird-awards' },
  { pattern: /亞洲新聲浪.*New Voices of Asia/i, section: 'firebird-awards' },
  { pattern: /火鳥大獎\s*$/m, section: 'firebird-awards' },
  { pattern: /^FIREBIRD AWARDS$/m, section: 'firebird-awards' },

  { pattern: /焦點影人\s*賈樟柯/i, section: 'pan-chinese-cinema' },
  { pattern: /Jia Zhangke.*Filmmaker in Focus/i, section: 'pan-chinese-cinema' },
  { pattern: /華語修復經典\s*Chinese-language Restored Classics/i, section: 'pan-chinese-cinema' },
  { pattern: /^華語電影$/m, section: 'pan-chinese-cinema' },
  { pattern: /^PAN-CHINESE CINEMA$/m, section: 'pan-chinese-cinema' },

  { pattern: /大師級\s*The Masters/i, section: 'masters-auteurs' },
  { pattern: /作者風\s*Auteurs/i, section: 'masters-auteurs' },
  { pattern: /陳哲藝的成長三部曲/i, section: 'masters-auteurs' },
  { pattern: /Anthony Chen's.*Growing Up.*Trilogy/i, section: 'masters-auteurs' },
  { pattern: /雪美蓮的光影私語/i, section: 'masters-auteurs' },
  { pattern: /Mary Stephen.*Inner Thoughts/i, section: 'masters-auteurs' },
  { pattern: /^大師與作者$/m, section: 'masters-auteurs' },
  { pattern: /^MASTERS & AUTEURS$/m, section: 'masters-auteurs' },

  { pattern: /環球視野\s*Global Vision/i, section: 'world-cinema' },
  { pattern: /^世界電影$/m, section: 'world-cinema' },
  { pattern: /^WORLD CINEMA$/m, section: 'world-cinema' },

  { pattern: /真的假不了\s*Reality Bites/i, section: 'documentaries' },
  { pattern: /影人影事\s*Filmmakers and Filmmaking/i, section: 'documentaries' },
  { pattern: /^紀錄片$/m, section: 'documentaries' },
  { pattern: /^DOCUMENTARIES$/m, section: 'documentaries' },

  { pattern: /奇幻青春\s*Fantastic Beats/i, section: 'kaleidoscope' },
  { pattern: /超人氣動畫\s*Animation Unlimited/i, section: 'kaleidoscope' },
  { pattern: /我愛午夜長\s*Midnight Heat/i, section: 'kaleidoscope' },
  { pattern: /詩影像\s*Poetry in Motion/i, section: 'kaleidoscope' },
  { pattern: /修復經典\s*Restored Classics/i, section: 'kaleidoscope' },
  { pattern: /^五光十色$/m, section: 'kaleidoscope' },
  { pattern: /^KALEIDOSCOPE$/m, section: 'kaleidoscope' },
];

// ── Language code patterns ───────────────────────────────────────
const LANG_CODES = new Set([
  'CHI', 'ENG', 'FRE', 'GER', 'SPA', 'ITA', 'JPN', 'KOR', 'ARA',
  'PER', 'THA', 'VIE', 'RUS', 'POR', 'HUN', 'RUM', 'MAC', 'SWE',
  'TUR', 'GRE', 'ICE', 'AFR', 'HEB', 'BUR', 'HIN', 'NEP', 'SIN',
  'TIB', 'UKR', 'LIT', 'BOS', 'HRV', 'FIL', 'LAT', 'GLG', 'CAT',
  'ARM', 'ROR', 'NAP', 'CPP', 'GSW', 'VED', 'BER', 'IND',
]);

function isLangCodeLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  return tokens.length > 0 && tokens.length <= 6 && tokens.every(t => LANG_CODES.has(t));
}

// ── Regexes ──────────────────────────────────────────────────────
const directorRe = /^導演\s*Dir:\s*(.+)$/;
const countryYearRuntimeRe = /(\d{4})\s+(\d+)\s*min/;
const castRe = /^演員\s*Cast:\s*(.+)$/;
const voiceCastRe = /^聲演\s*Voice Cast:\s*(.+)$/;

// Lines to skip when looking for titles
function isNoiseLine(line) {
  const t = line.trim();
  return !t ||
    t.startsWith('AC Arts Centre') ||
    t.startsWith('｜') ||
    /^\d+$/.test(t) ||
    /^\d+\/\d+/.test(t) ||
    t.startsWith('香港文化中心') ||
    t.startsWith('東九文化中心') ||
    t.startsWith('英皇戲院') ||
    t.startsWith('PREMIERE') ||
    t.startsWith('M+') ||
    t.startsWith('GALA CINEMA') ||
    t.startsWith('香港藝術中心') ||
    t.startsWith('香港大會堂') ||
    /^\d{2}[A-Z]{2}\d{2}$/.test(t) ||
    /^0\d[A-Z]{2}\d+$/.test(t);
}

// Labels that might appear above Chinese title
const labelPatterns = [
  /^開幕電影\s*Opening Film$/,
  /^閉幕電影\s*Closing Film$/,
  /^頒獎禮之夜\s*Awards Gala$/,
  /^隆重首映\s*Gala Premiere$/,
  /^特別呈獻\s*Special Presentation$/,
  /^法國之夜\s*French Night$/,
  /^參考電影\s*Reference Film$/,
  /^亞洲首映$/,
  /^Asian$/,
  /^Premiere$/,
  /^世界首映$/,
  /^World$/,
  /^國際首映$/,
  /^International$/,
  /^© /,
  /^Images courtesy/,
  /^製作人／影評人/,
  /^Filmmaker\/film critic/,
  /^資助\s*Supported/,
  /^香港藝術發展局/,
  /^The Hong Kong Arts Development/,
  /^網上投票/,
  /^結果將於/,
  /^本單元/,
  /^The Firebird Award/,
  /^4K RESTORED/,
  /^共\d+分鐘/,
  /^Total:/,
];

function isLabelLine(line) {
  const t = line.trim();
  return labelPatterns.some(p => p.test(t));
}

// ── Detect section from a line ───────────────────────────────────
function detectSection(line) {
  const trimmed = line.trim();
  for (const rule of sectionRules) {
    if (rule.pattern.test(trimmed)) {
      return rule.section;
    }
  }
  return null;
}

// ── Main parsing ─────────────────────────────────────────────────
const films = [];
let currentSection = null;

// Only start section tracking after the table of contents / front matter
// The actual film sections start around line 960 with "星光盛宴 GALA PRESENTATION"
const SECTION_START_LINE = 950;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Track sections (only after front matter)
  if (i >= SECTION_START_LINE) {
    const sec = detectSection(line);
    if (sec) {
      currentSection = sec;
    }
  }

  // Look for director lines
  const dirMatch = line.match(directorRe);
  if (!dirMatch) continue;

  // Skip directors in front matter (biographies, staff lists, etc.)
  if (i < SECTION_START_LINE) continue;

  const directorFull = dirMatch[1].trim();

  // Parse director names
  const dirNameParts = directorFull.split(',').map(s => s.trim());
  const zhNames = [];
  const enNames = [];

  for (const part of dirNameParts) {
    const m = part.match(/^([\u4e00-\u9fff\u3400-\u4dbf·‧．\s]+)\s+(.+)$/);
    if (m) {
      zhNames.push(m[1].trim());
      enNames.push(m[2].trim());
    } else if (/^[A-Za-z]/.test(part)) {
      enNames.push(part);
    } else {
      zhNames.push(part);
    }
  }

  const directorZh = zhNames.join(', ');
  const directorEn = enNames.join(', ');

  // ── Look backwards for titles ──────────────────────────────────
  let titleZh = '';
  let titleEn = '';

  // The typical pattern before a director line:
  //   [label like "開幕電影 Opening Film"]  (optional)
  //   [language code like "CHI ENG"]        (optional, can be before or after title)
  //   Chinese Title
  //   English Title
  //   導演 Dir: ...
  //
  // OR sometimes:
  //   [language code]
  //   Chinese Title
  //   [blank]
  //   English Title (with subtitle like "(original title)")
  //   導演 Dir: ...

  let lb = i - 1;

  // Get the line right before director (should be country/year/runtime)
  while (lb >= 0 && !lines[lb].trim()) lb--;

  // The line directly above 導演 should be the country/year/runtime line
  // But sometimes the English title is right above the director line
  // Check if it's a country/year/runtime line
  if (lb >= 0 && countryYearRuntimeRe.test(lines[lb].trim())) {
    // Country line is here, English title is above it
    lb--;
    while (lb >= 0 && !lines[lb].trim()) lb--;
  }

  // Now lb should point to English title
  if (lb >= 0) {
    const candidate = lines[lb].trim();
    if (!isNoiseLine(candidate) && !isLabelLine(candidate) &&
        !countryYearRuntimeRe.test(candidate) && !directorRe.test(candidate) &&
        !castRe.test(candidate) && candidate.length < 150) {
      // Check if this is a language code
      if (isLangCodeLine(candidate)) {
        // Language code here, skip it
        lb--;
        while (lb >= 0 && !lines[lb].trim()) lb--;
        if (lb >= 0 && !isNoiseLine(lines[lb].trim()) && !isLabelLine(lines[lb].trim())) {
          titleEn = lines[lb].trim();
          lb--;
        }
      } else {
        titleEn = candidate;
        lb--;
      }
    }
  }

  // Skip empty lines
  while (lb >= 0 && !lines[lb].trim()) lb--;

  // Now look for Chinese title
  if (lb >= 0) {
    const candidate = lines[lb].trim();
    if (!isNoiseLine(candidate) && !isLabelLine(candidate) &&
        !countryYearRuntimeRe.test(candidate) && !directorRe.test(candidate) &&
        !castRe.test(candidate) && candidate.length < 150) {
      if (isLangCodeLine(candidate)) {
        // Skip language code
        lb--;
        while (lb >= 0 && !lines[lb].trim()) lb--;
        if (lb >= 0 && !isNoiseLine(lines[lb].trim()) && !isLabelLine(lines[lb].trim())) {
          titleZh = lines[lb].trim();
        }
      } else {
        titleZh = candidate;
      }
    }
  }

  // Handle the case where titleEn got a language code
  if (isLangCodeLine(titleEn)) {
    // titleEn is actually a language code, swap/fix
    titleEn = titleZh;
    titleZh = '';
    // Look further back for the real Chinese title
    lb--;
    while (lb >= 0 && !lines[lb].trim()) lb--;
    if (lb >= 0) {
      const candidate = lines[lb].trim();
      if (!isNoiseLine(candidate) && !isLabelLine(candidate) && candidate.length < 100) {
        titleZh = candidate;
      }
    }
  }

  // If titleZh looks like it's actually the English title (all English text)
  // and titleEn is Chinese, swap them
  if (titleZh && titleEn &&
      /^[A-Za-z\s\-':,.()\d!?&]+$/.test(titleZh) &&
      /[\u4e00-\u9fff]/.test(titleEn)) {
    [titleZh, titleEn] = [titleEn, titleZh];
  }

  // Clean 4K RESTORED prefix from titles
  titleEn = titleEn.replace(/^4K RESTORED\s*修復版\s*/, '').trim();
  titleZh = titleZh.replace(/^4K RESTORED\s*修復版\s*/, '').trim();

  // ── Look forward for metadata ──────────────────────────────────
  let country = '';
  let year = '';
  let runtime = '';
  let language = '';
  let cast = '';
  let synopsisZh = '';
  let synopsisEn = '';

  let lf = i + 1;

  // Country/Year/Runtime
  if (lf < lines.length) {
    const cLine = lines[lf].trim();
    const cyrMatch = cLine.match(countryYearRuntimeRe);
    if (cyrMatch) {
      year = cyrMatch[1];
      runtime = cyrMatch[2];

      const beforeYear = cLine.substring(0, cLine.indexOf(year)).trim();
      const countryParts = beforeYear.split('／').map(p => {
        const trimmed = p.trim();
        const cm = trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf]+\s+(.+)/);
        if (cm) return cm[1].trim();
        if (/^[A-Za-z\s]+$/.test(trimmed)) return trimmed;
        return trimmed;
      });
      country = countryParts.join(', ');
      lf++;
    }
  }

  // Cast (including voice cast for animation)
  if (lf < lines.length) {
    const castLine = lines[lf].trim();
    const castMatch = castLine.match(castRe) || castLine.match(voiceCastRe);
    if (castMatch) {
      const castParts = [castMatch[1].trim()];
      lf++;
      while (lf < lines.length) {
        const nextLine = lines[lf].trim();
        if (nextLine && !directorRe.test(nextLine) &&
            !countryYearRuntimeRe.test(nextLine) &&
            !isLangCodeLine(nextLine) &&
            !nextLine.startsWith('AC Arts Centre') &&
            (/[\u4e00-\u9fff]/.test(nextLine) || /^[A-Z][a-z]/.test(nextLine)) &&
            /[A-Za-z]/.test(nextLine) &&
            nextLine.length < 80 &&
            !nextLine.match(/^\d+\/\d+/) &&
            !nextLine.startsWith('設') &&
            !nextLine.startsWith('製作人') &&
            !nextLine.startsWith('Filmmaker') &&
            // Looks like a name continuation (has comma or Chinese+English names)
            (nextLine.includes(',') || /[\u4e00-\u9fff].*[A-Za-z]/.test(nextLine))) {
          castParts.push(nextLine);
          lf++;
        } else {
          break;
        }
      }
      cast = castParts.join(' ').replace(/,\s*$/, '');
    }
  }

  // ── Language code ──────────────────────────────────────────────
  // Search in a window around the title/director area
  // Check lines before title
  for (let k = i - 8; k < i; k++) {
    if (k >= 0 && isLangCodeLine(lines[k].trim())) {
      language = lines[k].trim();
      break;
    }
  }
  // Also check lines after cast
  if (!language) {
    for (let k = lf; k < Math.min(lines.length, lf + 4); k++) {
      if (isLangCodeLine(lines[k].trim())) {
        language = lines[k].trim();
        break;
      }
    }
  }

  // ── Synopsis ───────────────────────────────────────────────────
  // Chinese synopsis followed by English synopsis, typically appears
  // after scheduling/venue info
  for (let s = lf; s < Math.min(lines.length, i + 80); s++) {
    const sLine = lines[s].trim();

    // Skip noise
    if (!sLine || isLangCodeLine(sLine) ||
        /^\d+\/\d+/.test(sLine) ||
        sLine.startsWith('AC Arts Centre') ||
        /^\d+[A-Z]{2}\d+$/.test(sLine) ||
        /^\d{2}[A-Z]{2}\d{2}$/.test(sLine) ||
        sLine.startsWith('香港文化中心') ||
        sLine.startsWith('東九文化中心') ||
        sLine.startsWith('英皇戲院') ||
        sLine.startsWith('PREMIERE') ||
        sLine.startsWith('M+') ||
        sLine.startsWith('GALA CINEMA') ||
        sLine.startsWith('香港藝術中心') ||
        sLine.startsWith('香港大會堂') ||
        sLine.startsWith('設名家') || sLine.startsWith('Face to Face') ||
        sLine.startsWith('設大師班') || sLine.startsWith('Master Class') ||
        sLine.startsWith('設映後談') || sLine.startsWith('Post-talk') ||
        sLine.startsWith('設座談會') || sLine.startsWith('Seminar') ||
        sLine.startsWith('全力支持') || sLine.startsWith('Supported by') ||
        sLine.startsWith('合辦') || sLine.startsWith('Co-present') ||
        sLine.startsWith('Persons Aged') || sLine.startsWith('只准') ||
        sLine.startsWith('©') || sLine.startsWith('社區放映會') ||
        /^[A-Z]{2}\s*$/.test(sLine) ||
        /^\d+$/.test(sLine) ||
        /^[\d:]+pm$/.test(sLine) ||
        /^[\d:]+am$/.test(sLine)) {
      continue;
    }

    // Chinese synopsis paragraph
    if (/[\u4e00-\u9fff]/.test(sLine) && sLine.length > 30) {
      const zhParts = [sLine];
      let ss = s + 1;
      while (ss < lines.length) {
        const nextL = lines[ss].trim();
        if (nextL && /[\u4e00-\u9fff]/.test(nextL) && nextL.length > 15 &&
            !nextL.startsWith('AC Arts Centre') &&
            !/^\d+\/\d+/.test(nextL) &&
            !directorRe.test(nextL) &&
            !castRe.test(nextL)) {
          zhParts.push(nextL);
          ss++;
        } else {
          break;
        }
      }
      synopsisZh = zhParts.join('');

      // English synopsis
      while (ss < lines.length && !lines[ss].trim()) ss++;
      if (ss < lines.length) {
        const enLine = lines[ss].trim();
        if (/^[A-Z]/.test(enLine) && enLine.length > 30) {
          const enParts = [enLine];
          ss++;
          while (ss < lines.length) {
            const nextL = lines[ss].trim();
            if (nextL && /^[a-zA-Z'"(]/.test(nextL) && nextL.length > 10 &&
                !nextL.startsWith('AC Arts Centre') &&
                !/^\d+\/\d+/.test(nextL) &&
                !directorRe.test(nextL)) {
              enParts.push(nextL);
              ss++;
            } else {
              break;
            }
          }
          synopsisEn = enParts.join(' ');
        }
      }
      break;
    }

    // If we hit another director line, stop looking
    if (directorRe.test(sLine)) break;
    if (s > i + 50) break;
  }

  // ── Skip non-film entries ──────────────────────────────────────
  if (!titleEn && !titleZh) continue;

  // ── Build film object ──────────────────────────────────────────
  const film = {
    titleZh: titleZh || null,
    titleEn: titleEn || null,
    director: directorEn || directorFull,
    directorZh: directorZh || null,
    country: country || null,
    year: year ? parseInt(year) : null,
    runtime: runtime ? parseInt(runtime) : null,
    language: language || null,
    section: currentSection,
    cast: cast || null,
    synopsisZh: synopsisZh || null,
    synopsisEn: synopsisEn || null,
    _line: i + 1,
  };

  films.push(film);
}

// ── Post-processing: deduplicate ─────────────────────────────────
const seen = new Set();
const uniqueFilms = [];

for (const film of films) {
  const key = `${(film.titleEn || '').toLowerCase().trim()}_${(film.director || '').toLowerCase().trim()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  delete film._line;
  uniqueFilms.push(film);
}

// ── Write output ─────────────────────────────────────────────────
writeFileSync(outputPath, JSON.stringify(uniqueFilms, null, 2), 'utf-8');

console.log(`Parsed ${uniqueFilms.length} unique films from brochure.`);
console.log(`Output written to: ${outputPath}`);

// Section distribution
const sectionCounts = {};
for (const f of uniqueFilms) {
  const s = f.section || 'unknown';
  sectionCounts[s] = (sectionCounts[s] || 0) + 1;
}
console.log('\nSection distribution:');
for (const [sec, count] of Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${sec}: ${count}`);
}

// Sample entries
console.log('\nFirst 5 entries:');
for (const f of uniqueFilms.slice(0, 5)) {
  console.log(`  [${f.section}] ${f.titleEn} (${f.titleZh}) - Dir: ${f.director} - ${f.country} ${f.year} ${f.runtime}min - lang: ${f.language}`);
}

// Check for issues
const issues = uniqueFilms.filter(f => !f.titleEn || f.titleEn.length < 2);
if (issues.length) {
  console.log(`\nFilms with missing/short English title: ${issues.length}`);
  for (const f of issues.slice(0, 5)) {
    console.log(`  titleEn="${f.titleEn}" titleZh="${f.titleZh}" dir="${f.director}"`);
  }
}

const langIssues = uniqueFilms.filter(f => f.titleEn && isLangCodeLine(f.titleEn));
if (langIssues.length) {
  console.log(`\nFilms with language code as English title: ${langIssues.length}`);
  for (const f of langIssues) {
    console.log(`  titleEn="${f.titleEn}" titleZh="${f.titleZh}" dir="${f.director}"`);
  }
}
