// Builds data/words-fr.js and data/words-en.js from raw word lists + frequency lists.
//
// Usage: node tools/build-words.mjs <rawDir>
// <rawDir> must contain:
//   fr_dict.json, en_dict.json  JSON arrays from the npm packages
//                               an-array-of-french-words / an-array-of-english-words
//   fr_freq.txt, en_freq.txt    "word count" lines from hermitdave/FrequencyWords
//                               (content/2018/<lang>/<lang>_50k.txt)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rawDir = process.argv[2];
if (!rawDir) { console.error('usage: node tools/build-words.mjs <rawDir>'); process.exit(1); }
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const MIN = 4, MAX = 12;

// Motus ignores accents: É -> E, Œ -> OE, ...
const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').toUpperCase();

for (const lang of ['fr', 'en']) {
  const dict = JSON.parse(fs.readFileSync(path.join(rawDir, `${lang}_dict.json`), 'utf8'));
  const freq = new Map();
  for (const line of fs.readFileSync(path.join(rawDir, `${lang}_freq.txt`), 'utf8').split(/\r?\n/)) {
    const [w, c] = line.trim().split(/\s+/);
    if (!w || !c) continue;
    const n = norm(w);
    freq.set(n, (freq.get(n) || 0) + Number(c));
  }
  // only plain A-Z words: the output is executed as a script, so nothing else may get in
  const words = new Set();
  for (const w of dict) {
    const n = norm(w);
    if (/^[A-Z]+$/.test(n) && n.length >= MIN && n.length <= MAX) words.add(n);
  }
  const out = {};
  let total = 0;
  for (let len = MIN; len <= MAX; len++) {
    const list = [...words].filter((w) => w.length === len);
    const common = list.filter((w) => freq.has(w)).sort((a, b) => freq.get(b) - freq.get(a));
    const rare = list.filter((w) => !freq.has(w)).sort();
    out[len] = { common: common.length, words: [...common, ...rare].join('') };
    total += list.length;
  }
  const js = `// Auto-generated — ${total} words. Words sorted by frequency ("common" ones first), concatenated without separator.\n` +
    `window.MOTUS_DATA = window.MOTUS_DATA || {};\nwindow.MOTUS_DATA.${lang} = ${JSON.stringify(out)};\n`;
  fs.writeFileSync(path.join(outDir, `words-${lang}.js`), js);
  console.log(lang, total, 'words');
}
