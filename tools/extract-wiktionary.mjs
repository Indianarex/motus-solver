// Streams a wiktextract JSONL.gz dump (https://kaikki.org) and writes the plain word list it contains.
//
// Usage: node tools/extract-wiktionary.mjs <url-or-file.jsonl.gz> <out.txt>
//   French:  https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl.gz
//   English: https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz
//
// Keeps headwords and their inflected forms, written in lower case only (capitalised entries
// are proper nouns or acronyms). Proper nouns, abbreviations, affixes, symbols and phrases are skipped.
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { Readable } from 'node:stream';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node tools/extract-wiktionary.mjs <url-or-file.jsonl.gz> <out.txt>'); process.exit(1); }

const SKIP_POS = new Set(['name', 'abbrev', 'symbol', 'prefix', 'suffix', 'affix', 'infix', 'interfix',
  'circumfix', 'phrase', 'proverb', 'character', 'punct', 'romanization', 'contraction']);
const plain = (w) => typeof w === 'string' && w.length >= 4 && w.length <= 16 && !/[\s.'’\-0-9]/.test(w) && w === w.toLowerCase();

const input = /^https?:/.test(src)
  ? Readable.fromWeb((await fetch(src)).body)
  : fs.createReadStream(src);
const rl = readline.createInterface({ input: input.pipe(zlib.createGunzip()), crlfDelay: Infinity });

const words = new Set();
let lines = 0;
for await (const line of rl) {
  if (++lines % 200000 === 0) console.log(lines, 'entries,', words.size, 'words');
  let e;
  try { e = JSON.parse(line); } catch { continue; }
  if (!e.word || SKIP_POS.has(e.pos)) continue;
  if (plain(e.word)) words.add(e.word);
  for (const f of e.forms || []) {
    const tags = f.tags || [];
    if (tags.includes('romanization') || tags.includes('table-tags') || tags.includes('inflection-template')) continue;
    if (plain(f.form)) words.add(f.form);
  }
}
fs.writeFileSync(out, [...words].sort().join('\n'));
console.log('done:', lines, 'entries,', words.size, 'words ->', out);
