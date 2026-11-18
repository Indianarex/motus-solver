# Word list license

The files in this directory (`words-fr.js`, `words-en.js`) are licensed under the
**Creative Commons Attribution-ShareAlike 4.0 International** license (CC BY-SA 4.0):
https://creativecommons.org/licenses/by-sa/4.0/

They are an adaptation of the following works, generated with `tools/build-words.mjs`.

## Sources

- **an-array-of-french-words** and **an-array-of-english-words** by Zeke Sikelianos,
  MIT License (full notice below).
  https://github.com/words/an-array-of-french-words — https://github.com/words/an-array-of-english-words
- **FrequencyWords** by Hermit Dave, content licensed under CC BY-SA 4.0, built from
  the OpenSubtitles 2018 corpus (http://opus.nlpl.eu/OpenSubtitles2018.php).
  https://github.com/hermitdave/FrequencyWords

## Changes made

- Words normalised to upper case A–Z (accents removed, Œ → OE, Æ → AE); words containing
  other characters dropped; only 4 to 12 letter words kept.
- Words grouped by length and sorted by their frequency in FrequencyWords
  (`content/2018/{fr,en}/*_50k.txt`); words absent from it are appended alphabetically.
  Frequency counts themselves are not included.

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
