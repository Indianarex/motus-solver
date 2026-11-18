# Motus Solver

A solver for the word game Motus, in **French** and **English**. It's a static web app: open `index.html` (double-click works, no server needed), nothing to install, works offline.

## Usage

1. Pick the language (FR / EN), the word length and, if known, the first letter.
2. Type your guess (or click "Play this word").
3. Click each letter to set its colour: blue = absent, yellow = wrong spot, red = right spot. Press Enter to move to the next row.
4. The side panel shows the best guess and the words that are still possible.

The best guess is sometimes a **probe word**: a valid word that cannot be the answer but splits the remaining candidates better (e.g. to escape traps like `RA_ES` → RARES / RATES / RACES / RAMES…).

## How it works

- `data/words-fr.js` / `data/words-en.js`: ~263k French and ~240k English words (4 to 12 letters, accents removed), sorted by usage frequency. Common words are preferred as answers.
- `solver.js`: exact candidate filtering (repeated letters handled the same way as in the game), then each guess is scored by the **expected number of guesses** it leads to: probability of being the answer + entropy (expected information) of the feedback over the remaining candidates.
- `app.js` / `style.css` / `index.html`: the user interface (available in French and English).

## Performance

`node tools/benchmark.js 150` plays 1,800 simulated games (FR + EN, 5 to 10 letters, first letter given, answers among the 3,000 most common words of each length):

| | average guesses | games needing 4+ | thinking time per turn |
|---|---|---|---|
| current solver | **2.44** | 97 | 3.9 ms avg, 26 ms worst |

61% of games are solved in 2 guesses. The rare long games are unavoidable traps where many words differ by a single letter and no valid word can tell them apart.

## Security

- No backend, no network access at runtime, no third-party resources (fonts are self-hosted).
- A strict Content-Security-Policy only allows the app's own scripts, styles and fonts.
- Saved state (`localStorage`) is treated as untrusted and validated field by field before use; the DOM is only written with `textContent`.

## Tools

- `tools/build-words.mjs`: regenerates `data/` from the raw word lists (see the header of the file).
- `tools/benchmark.js`: the simulation above.

## Credits

Word lists: [an-array-of-french-words](https://www.npmjs.com/package/an-array-of-french-words), [an-array-of-english-words](https://www.npmjs.com/package/an-array-of-english-words); frequencies from [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords). Fonts: Archivo Black and Inter, SIL Open Font License 1.1 (`fonts/`).
