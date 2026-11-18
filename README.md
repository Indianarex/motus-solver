# Motus Solver

A solver for the word game Motus, in **French** and **English**. It's a static web app: open `index.html`, nothing to install.

## Usage

1. Pick the language (FR / EN), the word length and, if known, the first letter.
2. Type your guess (or click "Play this word").
3. Click each letter to set its colour: blue = absent, yellow = wrong spot, red = right spot. Press Enter to move to the next row.
4. The side panel shows the best guess and the words that are still possible.

## How it works

- `data/words-fr.js` / `data/words-en.js`: ~263k French and ~240k English words (4 to 12 letters, accents removed), sorted by usage frequency.
- `solver.js`: exact candidate filtering (repeated letters handled the same way as in the game) and guess ranking by entropy (expected information), weighted by the chance of each word being the answer.
- `app.js` / `style.css` / `index.html`: the user interface (available in French and English).

Data sources: [an-array-of-french-words](https://www.npmjs.com/package/an-array-of-french-words), [an-array-of-english-words](https://www.npmjs.com/package/an-array-of-english-words), frequencies from [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords).
