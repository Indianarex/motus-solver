// Plays simulated games to measure how many guesses the solver needs and how long it thinks.
//
// Usage: node tools/benchmark.js [gamesPerLength] [option=value,...]
// e.g.   node tools/benchmark.js 150
//        node tools/benchmark.js 60 mode=entropy        (compare with another scoring)
//
// Answers are drawn (deterministically) from the 3000 most common words of each length,
// FR and EN, 5 to 10 letters; the first letter is given, as in Motus.
const path = require('path');
const S = require('../solver.js');

const N = +(process.argv[2] || 60);
const opts = {};
for (const kv of (process.argv[3] || '').split(',').filter((x) => x.includes('='))) {
  const [k, v] = kv.split('=');
  opts[k] = isNaN(+v) ? v : +v;
}
global.window = {};
let seed = 1;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

let all = [], totalMs = 0, maxMs = 0, turns = 0;
for (const lang of ['fr', 'en']) {
  require(path.join(__dirname, '..', 'data', `words-${lang}.js`));
  for (let len = 5; len <= 10; len++) {
    const raw = window.MOTUS_DATA[lang][len];
    const words = raw.words.match(new RegExp(`.{${len}}`, 'g'));
    const cc = raw.common;
    const common = words.slice(0, cc);
    const weightOf = new Map(common.map((w, i) => [w, 0.25 + 0.75 * (1 - i / cc)]));
    seed = 1000 * len + (lang === 'fr' ? 1 : 2);
    for (let g = 0; g < N; g++) {
      const answer = common[Math.floor(rnd() * Math.min(cc, 3000))];
      const first = answer[0];
      const probes = words.filter((w) => w[0] === first);
      const rows = [];
      let tries = 0;
      while (tries < 15) {
        const t0 = performance.now();
        const cands = S.filterWords(common, rows, first).map((w) => ({ w, weight: weightOf.get(w) }));
        const guess = cands.length === 1 ? cands[0].w
          : S.rankGuesses(cands, Object.assign({ extraGuesses: probes }, opts))[0].w;
        const dt = performance.now() - t0;
        totalMs += dt; maxMs = Math.max(maxMs, dt); turns++;
        tries++;
        if (guess === answer) break;
        rows.push({ word: guess, marks: S.feedback(guess, answer) });
      }
      all.push(tries);
    }
  }
}
const dist = {};
all.forEach((t) => (dist[t] = (dist[t] || 0) + 1));
console.log(`${all.length} games — average ${(all.reduce((a, b) => a + b, 0) / all.length).toFixed(3)} guesses, ` +
  `worst ${Math.max(...all)}, distribution ${JSON.stringify(dist)}`);
console.log(`thinking time: ${(totalMs / turns).toFixed(1)} ms per turn on average, ${maxMs.toFixed(0)} ms worst`);
