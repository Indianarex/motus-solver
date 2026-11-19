// Builds data/words-fr.js and data/words-en.js from raw word lists + frequency lists.
//
// Usage: node tools/build-words.mjs <rawDir>
// <rawDir> must contain:
//   fr_dict.json, en_dict.json  JSON arrays from the npm packages
//                               an-array-of-french-words / an-array-of-english-words
//   Lexique383.tsv              Lexique 3.83 (http://www.lexique.org/databases/Lexique383/Lexique383.tsv)
//   scowl-final/                the `final/` directory of SCOWL 2020.12.07
//                               (http://wordlist.aspell.net/)
//   fr_full.txt, en_full.txt    "word count" lines from hermitdave/FrequencyWords
//                               (content/2018/<lang>/<lang>_full.txt)
//   fr_wikt.txt, en_wikt.txt    Wiktionary word lists made with tools/extract-wiktionary.mjs
//
// Output order per length: common words (by frequency), then other words of the main
// dictionaries, then words only found in Wiktionary (both alphabetically).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rawDir = process.argv[2];
if (!rawDir) { console.error('usage: node tools/build-words.mjs <rawDir>'); process.exit(1); }
const raw = (f) => path.join(rawDir, f);
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const MIN = 4, MAX = 12;
const SCOWL_MAX_SIZE = 80;     // 95 only adds esoteric words
const COMMON_PER_MILLION = 0.03; // ~10 occurrences in the subtitle corpus

// Motus ignores accents: É -> E, Œ -> OE, ...
const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').toUpperCase();
// only plain A-Z words: the output is executed as a script, so nothing else may get in
const valid = (n) => /^[A-Z]+$/.test(n) && n.length >= MIN && n.length <= MAX;

/** Subtitle frequencies, in occurrences per million words. */
function subtitleFreq(file) {
  const counts = new Map();
  let total = 0;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const [w, c] = line.trim().split(/\s+/);
    if (!w || !c) continue;
    total += Number(c);
    const n = norm(w);
    if (valid(n)) counts.set(n, (counts.get(n) || 0) + Number(c));
  }
  for (const [w, c] of counts) counts.set(w, (c / total) * 1e6);
  return counts;
}

function addAll(set, list) {
  for (const w of list) { const n = norm(w); if (valid(n)) set.add(n); }
}

const sources = {
  fr() {
    const words = new Set();
    addAll(words, JSON.parse(fs.readFileSync(raw('fr_dict.json'), 'utf8')));
    const freq = subtitleFreq(raw('fr_full.txt'));
    // Lexique 3.83: extra word forms + film/book frequencies (per million)
    const lines = fs.readFileSync(raw('Lexique383.tsv'), 'utf8').split(/\r?\n/);
    const head = lines[0].split('\t');
    const iO = head.indexOf('ortho'), iF = head.indexOf('freqfilms2'), iL = head.indexOf('freqlivres');
    const lexFreq = new Map();
    for (const l of lines.slice(1)) {
      const c = l.split('\t');
      const n = norm(c[iO] || '');
      if (!valid(n)) continue;
      words.add(n);
      const f = Math.max(Number(c[iF]) || 0, Number(c[iL]) || 0);
      lexFreq.set(n, Math.max(lexFreq.get(n) || 0, f));
    }
    for (const [w, f] of lexFreq) freq.set(w, Math.max(freq.get(w) || 0, f));
    return { words, freq };
  },
  en() {
    const words = new Set();
    addAll(words, JSON.parse(fs.readFileSync(raw('en_dict.json'), 'utf8')));
    const dir = raw('scowl-final');
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(english|american|british|canadian|variant_1)-words\.(\d+)$/);
      if (!m || Number(m[2]) > SCOWL_MAX_SIZE) continue;
      // skip capitalised entries (proper nouns) and anything with an apostrophe
      const lines = fs.readFileSync(path.join(dir, f), 'latin1').split(/\r?\n/).filter((l) => l && l === l.toLowerCase());
      addAll(words, lines);
    }
    return { words, freq: subtitleFreq(raw('en_full.txt')) };
  },
};

for (const lang of ['fr', 'en']) {
  const { words, freq } = sources[lang]();
  const wikt = new Set();
  addAll(wikt, fs.readFileSync(raw(`${lang}_wikt.txt`), 'utf8').split(/\r?\n/));
  const out = {};
  let total = 0, totalCommon = 0, totalKnown = 0;
  for (let len = MIN; len <= MAX; len++) {
    const list = [...new Set([...words, ...wikt])].filter((w) => w.length === len);
    const isCommon = (w) => (freq.get(w) || 0) >= COMMON_PER_MILLION;
    const common = list.filter(isCommon).sort((a, b) => freq.get(b) - freq.get(a));
    const rare = list.filter((w) => !isCommon(w) && words.has(w)).sort();
    const wiktOnly = list.filter((w) => !isCommon(w) && !words.has(w)).sort();
    out[len] = { common: common.length, known: common.length + rare.length, words: [...common, ...rare, ...wiktOnly].join('') };
    total += list.length; totalCommon += common.length; totalKnown += common.length + rare.length;
  }
  const js = `// Auto-generated — ${total} words. Words sorted by frequency ("common" ones first), concatenated without separator.\n` +
    `window.MOTUS_DATA = window.MOTUS_DATA || {};\nwindow.MOTUS_DATA.${lang} = ${JSON.stringify(out)};\n`;
  fs.writeFileSync(path.join(outDir, `words-${lang}.js`), js);
  console.log(lang, total, 'words,', totalCommon, 'common,', totalKnown - totalCommon, 'rare,', total - totalKnown, 'Wiktionary only,', (js.length / 1e6).toFixed(2), 'MB');
}
