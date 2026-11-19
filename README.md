# Motus Solver

A solver for the word game Motus, in **French** and **English**.

**Use it online: https://indianarex.github.io/motus-solver/**, or download the repository and open `index.html` (double-click works, no server needed). Nothing to install, works offline.

## Usage

1. Pick the language (FR / EN), the word length and, if known, the first letter.
2. Type your guess (or click "Play this word").
3. Click each letter to set its colour: blue = absent, yellow = wrong spot, red = right spot. Press Enter to move to the next row.
4. The side panel shows the best guess and the words that are still possible.

The best guess is sometimes a **probe word**: a valid word that cannot be the answer but splits the remaining candidates better (e.g. to escape traps like `RA_ES` → RARES / RATES / RACES / RAMES…).

## How it works

- `data/words-fr.js` / `data/words-en.js`: ~272k French and ~248k English words (4 to 12 letters, accents removed), sorted by usage frequency. About 105k French and 58k English words are marked as common: they are shown by default and preferred as answers; the others appear with the "rare words" option.
- `solver.js`: exact candidate filtering (repeated letters handled the same way as in the game), then each guess is scored by the **expected number of guesses** it leads to: probability of being the answer + entropy (expected information) of the feedback over the remaining candidates.
- `app.js` / `style.css` / `index.html`: the user interface (available in French and English).

## Performance

`node tools/benchmark.js 150` plays 1,800 simulated games (FR + EN, 5 to 10 letters, first letter given, answers among the 3,000 most common words of each length):

| | average guesses | games needing 4+ | thinking time per turn |
|---|---|---|---|
| current solver | **2.48** | 93 | 4.8 ms avg, 28 ms worst |

58% of games are solved in 2 guesses. Ranking the whole 10-letter French dictionary (51k candidates, no letter known) takes under 60 ms in a browser. The rare long games are unavoidable traps where many words differ by a single letter and no valid word can tell them apart.

## Security

- No backend, no network access at runtime, no third-party resources (fonts are self-hosted).
- A strict Content-Security-Policy only allows the app's own scripts, styles and fonts.
- Saved state (`localStorage`) is treated as untrusted and validated field by field before use; the DOM is only written with `textContent`.

## Tools

- `tools/build-words.mjs`: regenerates `data/` from the raw word lists (see the header of the file).
- `tools/benchmark.js`: the simulation above.

Found a security issue? See [SECURITY.md](SECURITY.md).

## License

- **Code**: [PolyForm Noncommercial 1.0.0](LICENSE.md). Free to use, modify and share for any noncommercial purpose (personal use, study, research, hobby projects, non-profits…). **Commercial use requires a separate license**: ask in [Discussions](https://github.com/Indianarex/motus-solver/discussions).
- **Word lists** (`data/`): [CC BY-SA 4.0](data/LICENSE.md), adapted from [an-array-of-french-words](https://github.com/words/an-array-of-french-words) and [an-array-of-english-words](https://github.com/words/an-array-of-english-words) (MIT), [Lexique 3.83](http://www.lexique.org) (CC BY-SA 4.0), [SCOWL](http://wordlist.aspell.net/) (permissive) and [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (CC BY-SA 4.0).
- **Fonts** (`fonts/`): Archivo Black and Inter, [SIL Open Font License 1.1](fonts/).

Motus is a trademark of its respective owners; this project is an unofficial fan-made tool and is not affiliated with or endorsed by them.
