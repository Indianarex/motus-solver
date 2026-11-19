# Word list license

The files in this directory (`words-fr.js`, `words-en.js`) are licensed under the
**Creative Commons Attribution-ShareAlike 4.0 International** license (CC BY-SA 4.0):
https://creativecommons.org/licenses/by-sa/4.0/

They are an adaptation of the following works, generated with `tools/build-words.mjs`.

## Sources

- **an-array-of-french-words** and **an-array-of-english-words** by Zeke Sikelianos,
  MIT License (full notice below).
  https://github.com/words/an-array-of-french-words — https://github.com/words/an-array-of-english-words
- **Lexique 3.83** by Boris New and Christophe Pallier, licensed under CC BY-SA 4.0
  (extra French word forms and film/book frequencies). http://www.lexique.org
- **SCOWL** (Spell Checker Oriented Word Lists) 2020.12.07 by Kevin Atkinson, sizes up to 80,
  English/American/British/Canadian words without proper nouns (notice below).
  http://wordlist.aspell.net/
- **Wiktionary** (French Wiktionary for French, English Wiktionary for English), by the
  Wiktionary contributors, licensed under CC BY-SA 4.0. https://fr.wiktionary.org —
  https://en.wiktionary.org — extracted with wiktextract (Tatu Ylonen) and downloaded from
  https://kaikki.org, then reduced to plain word forms with `tools/extract-wiktionary.mjs`.
- **FrequencyWords** by Hermit Dave, content licensed under CC BY-SA 4.0, built from
  the OpenSubtitles 2018 corpus (http://opus.nlpl.eu/OpenSubtitles2018.php).
  https://github.com/hermitdave/FrequencyWords

## Changes made

- Words normalised to upper case A–Z (accents removed, Œ → OE, Æ → AE); words containing
  other characters dropped; only 4 to 12 letter words kept.
- Word lists merged (French: an-array-of-french-words + Lexique + French Wiktionary; English:
  an-array-of-english-words + SCOWL + English Wiktionary). From Wiktionary only headwords and
  inflected forms written in lower case are kept (no proper nouns, abbreviations or affixes).
- Words found only in Wiktionary are placed after the other rare words.
- Words grouped by length and sorted by frequency (FrequencyWords `content/2018/{fr,en}/*_full.txt`,
  plus Lexique film/book frequencies for French). Words used at least ~0.03 times per million are
  marked as common; the others are appended alphabetically. Frequencies themselves are not included.

## SCOWL notice

Copyright 2000-2018 by Kevin Atkinson

Permission to use, copy, modify, distribute and sell these word lists, the associated
scripts, the output created from the scripts, and its documentation for any purpose is
hereby granted without fee, provided that the above copyright notice appears in all copies
and that both that copyright notice and this permission notice appear in supporting
documentation. Kevin Atkinson makes no representations about the suitability of this array
for any purpose. It is provided "as is" without express or implied warranty.

SCOWL also includes material from other authors (12Dicts by Alan Beale, ENABLE, Moby Words II
and others); their notices are in the `Copyright` file of the SCOWL distribution:
http://wordlist.aspell.net/scowl-readme/

## MIT notice for an-array-of-french-words / an-array-of-english-words

Copyright (c) 2014 Zeke Sikelianos (an-array-of-english-words)
Copyright (c) 2016 Zeke Sikelianos (an-array-of-french-words)

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
