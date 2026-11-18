/* Motus solver engine — pure functions, usable in the browser and in Node.
 * Mark codes: 0 = absent (blue), 1 = wrong spot (yellow), 2 = right spot (red).
 * A pattern can also be encoded as a base-3 integer: sum(mark[i] * 3^i).
 */
(function (root) {
  'use strict';

  const COUNTS = new Int32Array(26);
  const EXACT = new Uint8Array(32);

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

  /** Same as feedback() but returns the base-3 integer code, without allocating. */
  function feedbackCode(guess, answer) {
    const n = guess.length;
    COUNTS.fill(0);
    for (let i = 0; i < n; i++) {
      const a = answer.charCodeAt(i);
      if (guess.charCodeAt(i) === a) EXACT[i] = 1;
      else { EXACT[i] = 0; COUNTS[a - 65]++; }
    }
    let code = 0, pow = 1;
    for (let i = 0; i < n; i++) {
      if (EXACT[i]) code += 2 * pow;
      else {
        const k = guess.charCodeAt(i) - 65;
        if (COUNTS[k] > 0) { code += pow; COUNTS[k]--; }
      }
      pow *= 3;
    }
    return code;
  }

  function marksToCode(marks) {
    let code = 0, pow = 1;
    for (let i = 0; i < marks.length; i++) { code += marks[i] * pow; pow *= 3; }
    return code;
  }

  /** A word is compatible if it reproduces exactly the marks of every guess. */
  function matches(word, rows, firstLetter) {
    if (firstLetter && word[0] !== firstLetter) return false;
    for (const r of rows) {
      if (feedbackCode(r.word, word) !== (r.code ?? marksToCode(r.marks))) return false;
    }
    return true;
  }

  /** Filters a word list against the guesses. Rows: [{word, marks}]. */
  function filterWords(words, rows, firstLetter) {
    const rs = rows.map((r) => ({ word: r.word, code: marksToCode(r.marks) }));
    // cheap pre-filter on red letters before the full pattern check
    const reds = [];
    for (const r of rows) r.marks.forEach((m, i) => { if (m === 2) reds.push([i, r.word.charCodeAt(i)]); });
    const out = [];
    outer: for (const w of words) {
      if (firstLetter && w[0] !== firstLetter) continue;
      for (const [i, c] of reds) if (w.charCodeAt(i) !== c) continue outer;
      for (const r of rs) if (feedbackCode(r.word, w) !== r.code) continue outer;
      out.push(w);
    }
    return out;
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
   * @param opts.extraGuesses optional array of words that may be played even if
   *        they are not candidates (probe words that split the candidates better)
   * @returns [{w, weight, p, entropy, score}] sorted by descending score
   */
  function rankGuesses(candidates, opts) {
    opts = opts || {};
    const POOL = opts.pool || 300;
    const EXTRA_POOL = opts.extraPool ?? 150;
    const TARGETS = opts.targets || 2500;
    const mode = opts.mode || 'expected';
    if (!candidates.length) return [];
    const L = candidates[0].w.length;
    const totalW = candidates.reduce((s, c) => s + c.weight, 0);

    // 1) fast heuristic: letter frequency per position + overall presence
    const pos = new Float64Array(L * 26);
    const any = new Float64Array(26);
    const seen = new Int32Array(26);
    let stamp = 0;
    for (const c of candidates) {
      stamp++;
      for (let i = 0; i < L; i++) {
        const k = c.w.charCodeAt(i) - 65;
        pos[i * 26 + k] += c.weight;
        if (seen[k] !== stamp) { any[k] += c.weight; seen[k] = stamp; }
      }
    }
    const heuristic = (w) => {
      stamp++;
      let s = 0;
      for (let i = 0; i < L; i++) {
        const k = w.charCodeAt(i) - 65;
        const fp = pos[i * 26 + k] / totalW; // a letter already certain here brings nothing
        s += fp * (1 - fp);
        if (seen[k] !== stamp) { const fa = any[k] / totalW; s += fa * (1 - fa); seen[k] = stamp; }
      }
      return s;
    };
    const heur = candidates.map((c) => ({ c, h: heuristic(c.w) + (c.weight / totalW) * 3 }));
    heur.sort((a, b) => b.h - a.h);
    const pool = heur.slice(0, POOL).map((x) => x.c);

    // optional probe words (not candidates): only worth it while many candidates remain
    if (opts.extraGuesses && candidates.length > (opts.extraMin ?? 3)) {
      const inPool = new Set(candidates.map((c) => c.w));
      const ex = [];
      for (const w of opts.extraGuesses) if (!inPool.has(w)) ex.push({ w, h: heuristic(w) });
      ex.sort((a, b) => b.h - a.h);
      for (let i = 0; i < Math.min(EXTRA_POOL, ex.length); i++) pool.push({ w: ex[i].w, weight: 0 });
    }

    // 2) exact entropy over a sample of targets (most likely first)
    const targets = candidates.length > TARGETS
      ? candidates.slice().sort((a, b) => b.weight - a.weight).slice(0, TARGETS)
      : candidates;
    const tW = targets.reduce((s, c) => s + c.weight, 0);
    let Hprior = 0;
    for (const t of targets) { const p = t.weight / tW; Hprior -= p * Math.log2(p); }

    const hist = new Float64Array(Math.pow(3, L));
    const used = new Int32Array(targets.length);
    const out = pool.map((g) => {
      let nUsed = 0;
      for (const t of targets) {
        const code = feedbackCode(g.w, t.w);
        if (hist[code] === 0) used[nUsed++] = code;
        hist[code] += t.weight;
      }
      let H = 0;
      for (let i = 0; i < nUsed; i++) {
        const p = hist[used[i]] / tW;
        H -= p * Math.log2(p);
        hist[used[i]] = 0;
      }
      const p = g.weight / totalW;
      let score;
      if (mode === 'entropy') {
        score = H + p * (opts.k ?? Math.max(2, Math.log2(candidates.length)));
      } else {
        // minimise the expected number of guesses: 1 if this is the answer,
        // otherwise 1 + estimated guesses for the uncertainty left over
        const left = Math.max(0, Hprior - H);
        // a/b tuned by simulation (see README): ~0.5 extra guess per remaining bit
        const a = opts.a ?? 0.5, b = opts.b ?? 1;
        const after = left < 1e-9 ? 1 : b + a * left;
        score = -(p * 1 + (1 - p) * (1 + after));
      }
      return { w: g.w, weight: g.weight, p, entropy: H, score };
    });
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  const api = { feedback, feedbackCode, marksToCode, matches, filterWords, checkConsistency, rankGuesses };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotusSolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
