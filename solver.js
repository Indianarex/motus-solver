/* Motus solver engine — pure functions, usable in the browser and in Node.
 * Mark codes: 0 = absent (blue), 1 = wrong spot (yellow), 2 = right spot (red).
 */
(function (root) {
  'use strict';

  /** Returns the pattern (array of 0/1/2) that `guess` would get if the answer were `answer`. */
  function feedback(guess, answer) {
    const n = guess.length;
    const res = new Array(n).fill(0);
    const left = {};
    for (let i = 0; i < n; i++) {
      if (guess[i] === answer[i]) res[i] = 2;
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < n; i++) {
      if (res[i] === 2) continue;
      const c = guess[i];
      if (left[c] > 0) { res[i] = 1; left[c]--; }
    }
    return res;
  }

  /** Same thing, encoded as a base-3 integer (fast for histograms). */
  function feedbackCode(guess, answer, counts) {
    const n = guess.length;
    let code = 0, pow = 1;
    const exact = [];
    counts.fill(0);
    for (let i = 0; i < n; i++) {
      if (guess.charCodeAt(i) === answer.charCodeAt(i)) exact[i] = true;
      else { exact[i] = false; counts[answer.charCodeAt(i) - 65]++; }
    }
    for (let i = 0; i < n; i++) {
      let v = 0;
      if (exact[i]) v = 2;
      else {
        const k = guess.charCodeAt(i) - 65;
        if (counts[k] > 0) { v = 1; counts[k]--; }
      }
      code += v * pow;
      pow *= 3;
    }
    return code;
  }

  /** A word is compatible if it reproduces exactly the marks of every guess. */
  function matches(word, rows, firstLetter) {
    if (firstLetter && word[0] !== firstLetter) return false;
    for (const r of rows) {
      const fb = feedback(r.word, word);
      for (let i = 0; i < fb.length; i++) if (fb[i] !== r.marks[i]) return false;
    }
    return true;
  }

  /** Checks that a set of guesses is not self-contradictory (detects input mistakes). */
  function checkConsistency(rows) {
    const known = {};
    for (const r of rows) {
      for (let i = 0; i < r.word.length; i++) {
        if (r.marks[i] === 2) {
          if (known[i] && known[i] !== r.word[i]) {
            return { ok: false, pos: i, a: known[i], b: r.word[i] };
          }
          known[i] = r.word[i];
        }
      }
    }
    return { ok: true };
  }

  /**
   * Ranks the possible guesses.
   * @param candidates [{w, weight}] words still possible
   * @returns [{w, weight, p, entropy, score}] sorted by descending score
   */
  function rankGuesses(candidates, opts) {
    opts = opts || {};
    const POOL = opts.pool || 300;
    const TARGETS = opts.targets || 2500;
    if (!candidates.length) return [];
    const L = candidates[0].w.length;
    const totalW = candidates.reduce((s, c) => s + c.weight, 0);

    // 1) fast heuristic: letter frequency per position + overall presence
    const pos = Array.from({ length: L }, () => new Float64Array(26));
    const any = new Float64Array(26);
    for (const c of candidates) {
      const seen = new Set();
      for (let i = 0; i < L; i++) {
        const k = c.w.charCodeAt(i) - 65;
        pos[i][k] += c.weight;
        if (!seen.has(k)) { any[k] += c.weight; seen.add(k); }
      }
    }
    const heur = candidates.map((c) => {
      let s = 0;
      const seen = new Set();
      for (let i = 0; i < L; i++) {
        const k = c.w.charCodeAt(i) - 65;
        // a letter already certain at this position brings no information
        const fp = pos[i][k] / totalW;
        s += fp * (1 - fp);
        if (!seen.has(k)) { const fa = any[k] / totalW; s += fa * (1 - fa); seen.add(k); }
      }
      return { c, h: s + (c.weight / totalW) * 3 };
    });
    heur.sort((a, b) => b.h - a.h);

    // 2) exact entropy over a sample of targets (most likely first)
    const targets = candidates.length > TARGETS
      ? candidates.slice().sort((a, b) => b.weight - a.weight).slice(0, TARGETS)
      : candidates;
    const tW = targets.reduce((s, c) => s + c.weight, 0);
    const pool = heur.slice(0, POOL).map((x) => x.c);
    const counts = new Int32Array(26);
    const hist = new Map();
    const out = pool.map((g) => {
      hist.clear();
      for (const t of targets) {
        const code = feedbackCode(g.w, t.w, counts);
        hist.set(code, (hist.get(code) || 0) + t.weight);
      }
      let H = 0;
      for (const v of hist.values()) { const p = v / tW; H -= p * Math.log2(p); }
      const p = g.weight / totalW;
      // bonus when the word has a good chance of being the answer itself
      return { w: g.w, weight: g.weight, p, entropy: H, score: H + p * Math.max(2, Math.log2(candidates.length)) };
    });
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  const api = { feedback, feedbackCode, matches, checkConsistency, rankGuesses };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotusSolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
