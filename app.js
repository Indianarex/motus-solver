/* Motus solver user interface. */
(function () {
  'use strict';
  const S = window.MotusSolver;
  const MIN_LEN = 4, MAX_LEN = 12;
  const $ = (id) => document.getElementById(id);

  const T = {
    fr: {
      length: 'Longueur', first: '1re lettre', reset: 'Nouvelle partie',
      help: 'Tapez votre essai, puis cliquez sur chaque lettre pour indiquer sa couleur : bleu = absente, jaune = mal placée, rouge = bien placée. Entrée pour valider et passer à la ligne suivante.',
      best: 'Meilleure proposition', use: 'Jouer ce mot', possible: 'mots possibles', rare: 'mots rares',
      more: 'Afficher plus', loading: 'Chargement du dictionnaire…', letters: 'lettres',
      bits: 'bits d’information', chance: 'de chances d’être la solution',
      only: 'C’est forcément ce mot !', none: 'Aucun mot ne correspond. Vérifiez les couleurs saisies.',
      noneRare: 'Aucun mot courant ne correspond — cochez « mots rares » pour élargir la recherche.',
      fallback: 'Aucun mot courant : affichage des mots rares.',
      conflict: (p, a, b) => `Incohérence : position ${p} marquée rouge avec « ${a} » puis « ${b} ».`,
      pending: 'Cliquez sur les lettres pour les colorier, puis Entrée.',
      solved: 'Trouvé ! 🎉', del: 'Supprimer la ligne', rareTag: 'rare',
    },
    en: {
      length: 'Length', first: '1st letter', reset: 'New game',
      help: 'Type your guess, then click each letter to set its colour: blue = absent, yellow = wrong spot, red = right spot. Press Enter to confirm and move to the next row.',
      best: 'Best guess', use: 'Play this word', possible: 'possible words', rare: 'rare words',
      more: 'Show more', loading: 'Loading dictionary…', letters: 'letters',
      bits: 'bits of information', chance: 'chance of being the answer',
      only: 'It has to be this word!', none: 'No word matches. Check the colours you entered.',
      noneRare: 'No common word matches — tick “rare words” to widen the search.',
      fallback: 'No common word left: showing rare words.',
      conflict: (p, a, b) => `Conflict: position ${p} marked red with “${a}” and then “${b}”.`,
      pending: 'Click the letters to colour them, then press Enter.',
      solved: 'Solved! 🎉', del: 'Delete row', rareTag: 'rare',
    },
  };
  const LAYOUT = {
    fr: ['AZERTYUIOP', 'QSDFGHJKLM', '⌫WXCVBN⏎'],
    en: ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'],
  };

  /* ---------- state ---------- */
  let st = {
    lang: 'fr', len: 6, first: '', rare: false,
    rows: [], cur: { r: 0, c: 0 },
  };
  let showLimit = 150;
  const dicts = {}; // dicts[lang][len] = { words: [], common: n }

  function save() {
    try { localStorage.setItem('motus-solver', JSON.stringify(st)); } catch (e) { /* ignore */ }
  }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem('motus-solver'));
      if (s && s.rows && s.len >= MIN_LEN && s.len <= MAX_LEN) st = Object.assign(st, s);
    } catch (e) { /* ignore */ }
  }

  const t = (k) => T[st.lang][k];
  const minCol = () => (st.first ? 1 : 0);
  const normLetter = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

  function newRow() {
    const row = { letters: Array(st.len).fill(''), marks: Array(st.len).fill(0), done: false };
    if (st.first) { row.letters[0] = st.first; row.marks[0] = 2; }
    return row;
  }
  function resetGame() {
    st.rows = [newRow()];
    st.cur = { r: 0, c: minCol() };
    showLimit = 150;
  }
  const complete = (row) => row.letters.every((l) => l);

  /** Known red letters (position -> letter) from confirmed rows. */
  function knownReds() {
    const k = {};
    for (const r of st.rows) if (r.done) r.letters.forEach((l, i) => { if (r.marks[i] === 2) k[i] = l; });
    if (st.first) k[0] = st.first;
    return k;
  }

  /* ---------- dictionaries ---------- */
  function loadLang(lang) {
    if (dicts[lang]) return Promise.resolve();
    $('loading').classList.add('on');
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `data/words-${lang}.js`;
      s.onload = () => {
        const raw = window.MOTUS_DATA[lang];
        dicts[lang] = {};
        for (const len in raw) {
          const str = raw[len].words, words = [];
          for (let i = 0; i < str.length; i += +len) words.push(str.substr(i, +len));
          dicts[lang][len] = { words, common: raw[len].common };
        }
        delete window.MOTUS_DATA[lang];
        $('loading').classList.remove('on');
        resolve();
      };
      s.onerror = () => { $('loading').textContent = 'Erreur de chargement / load error'; reject(); };
      document.head.appendChild(s);
    });
  }

  /* ---------- rendering ---------- */
  function renderI18n() {
    document.documentElement.lang = st.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === st.lang));
    const sel = $('len');
    sel.innerHTML = '';
    for (let n = MIN_LEN; n <= MAX_LEN; n++) {
      const o = document.createElement('option');
      o.value = n; o.textContent = `${n} ${t('letters')}`;
      sel.appendChild(o);
    }
    sel.value = st.len;
    $('first').value = st.first;
    $('rare').checked = st.rare;
  }

  function renderBoard() {
    const board = $('board');
    board.style.setProperty('--tile', `clamp(26px, ${Math.min(8.2, 84 / st.len)}vw, 52px)`);
    board.innerHTML = '';
    st.rows.forEach((row, r) => {
      const el = document.createElement('div');
      el.className = 'row';
      row.letters.forEach((l, c) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (!l) tile.classList.add('empty');
        else tile.classList.add('m' + row.marks[c]);
        if (st.cur.r === r && st.cur.c === c) tile.classList.add('cursor');
        tile.innerHTML = `<span>${l}</span>`;
        tile.addEventListener('click', () => onTile(r, c));
        el.appendChild(tile);
      });
      if (st.rows.length > 1) {
        const del = document.createElement('button');
        del.className = 'del'; del.textContent = '×'; del.title = t('del');
        del.addEventListener('click', (e) => { e.stopPropagation(); deleteRow(r); });
        el.appendChild(del);
      }
      board.appendChild(el);
    });
    renderKeyboard();
  }

  function renderKeyboard() {
    const state = {};
    for (const r of st.rows) {
      if (!r.done) continue;
      r.letters.forEach((l, i) => { state[l] = Math.max(state[l] ?? -1, r.marks[i]); });
    }
    const kbd = $('kbd');
    kbd.innerHTML = '';
    for (const line of LAYOUT[st.lang]) {
      const row = document.createElement('div');
      row.className = 'krow';
      for (const ch of line) {
        const b = document.createElement('button');
        b.className = 'key';
        if (ch === '⌫' || ch === '⏎') b.classList.add('wide');
        else if (state[ch] !== undefined) b.classList.add('k' + state[ch]);
        b.textContent = ch;
        b.addEventListener('click', () => onKey(ch === '⌫' ? 'Backspace' : ch === '⏎' ? 'Enter' : ch));
        row.appendChild(b);
      }
      kbd.appendChild(row);
    }
  }

  /* ---------- solving ---------- */
  let computeTimer = null;
  function scheduleCompute() {
    clearTimeout(computeTimer);
    computeTimer = setTimeout(compute, 30);
  }

  function compute() {
    const d = dicts[st.lang] && dicts[st.lang][st.len];
    if (!d) return;
    const warn = [];
    const rows = st.rows.filter((r) => r.done && complete(r)).map((r) => ({ word: r.letters.join(''), marks: r.marks }));

    const solved = rows.length && rows[rows.length - 1].marks.every((m) => m === 2);
    const cons = S.checkConsistency(rows);
    if (!cons.ok) warn.push(t('conflict')(cons.pos + 1, cons.a, cons.b));

    const first = st.first || '';
    let common = [], rare = [];
    const cc = d.common;
    for (let i = 0; i < d.words.length; i++) {
      const w = d.words[i];
      if (!S.matches(w, rows, first)) continue;
      if (i < cc) common.push({ w, weight: 0.25 + 0.75 * (1 - i / cc), common: true });
      else rare.push({ w, weight: 0.04, common: false });
    }
    let cands = st.rare ? common.concat(rare) : common;
    if (!cands.length && rare.length) { cands = rare; warn.push(t('fallback')); }

    $('count').textContent = cands.length.toLocaleString(st.lang);
    const last = st.rows[st.rows.length - 1];
    if (complete(last) && !last.done) warn.push(t('pending'));

    if (solved) {
      showBest(rows[rows.length - 1].word, t('solved'), []);
    } else if (!cands.length) {
      warn.push(!st.rare && rare.length === 0 && common.length === 0 ? t('none') : t('noneRare'));
      showBest('—', '', []);
    } else if (cands.length === 1) {
      showBest(cands[0].w, t('only'), []);
    } else {
      const ranked = S.rankGuesses(cands);
      const b = ranked[0];
      const pct = b.p * 100;
      showBest(b.w, `${b.entropy.toFixed(2)} ${t('bits')} · ${pct < 1 ? pct.toFixed(1) : Math.round(pct)}% ${t('chance')}`,
        ranked.slice(1, 9).map((x) => x.w));
    }

    renderCands(cands);
    const wEl = $('warn');
    wEl.hidden = !warn.length;
    wEl.textContent = warn.join(' ');
  }

  function showBest(word, meta, alts) {
    $('bestWord').textContent = word;
    $('bestMeta').textContent = meta;
    $('useBest').disabled = word === '—' || meta === t('solved');
    $('useBest').dataset.word = word;
    const a = $('alts');
    a.innerHTML = '';
    alts.forEach((w) => a.appendChild(chip(w, false)));
  }

  function chip(w, isRare) {
    const c = document.createElement('button');
    c.className = 'chip' + (isRare ? ' rare' : '');
    c.textContent = w;
    if (isRare) c.title = t('rareTag');
    c.addEventListener('click', () => playWord(w));
    return c;
  }

  function renderCands(cands) {
    const box = $('cands');
    box.innerHTML = '';
    const frag = document.createDocumentFragment();
    cands.slice(0, showLimit).forEach((c) => frag.appendChild(chip(c.w, !c.common)));
    box.appendChild(frag);
    $('more').hidden = cands.length <= showLimit;
  }

  /* ---------- actions ---------- */
  function update() { renderBoard(); scheduleCompute(); save(); }

  function playWord(w) {
    let r = st.rows.length - 1;
    const last = st.rows[r];
    const isBlank = last.letters.every((l, i) => !l || (i === 0 && st.first));
    if (!isBlank) {
      last.done = complete(last) || last.done;
      st.rows.push(newRow());
      r++;
    }
    const row = st.rows[r];
    const reds = knownReds();
    [...w].forEach((l, i) => { row.letters[i] = l; row.marks[i] = reds[i] === l ? 2 : 0; });
    row.done = false;
    st.cur = { r, c: st.len };
    update();
  }

  function onTile(r, c) {
    const row = st.rows[r];
    if (row.letters[c]) {
      row.marks[c] = (row.marks[c] + 1) % 3;
      if (complete(row)) row.done = true;
    } else {
      st.cur = { r, c };
    }
    update();
  }

  function deleteRow(r) {
    st.rows.splice(r, 1);
    if (!st.rows.length) st.rows.push(newRow());
    const lr = st.rows.length - 1;
    const c = st.rows[lr].letters.findIndex((l) => !l);
    st.cur = { r: lr, c: c === -1 ? st.len : c };
    update();
  }

  function onKey(key) {
    const row = st.rows[st.cur.r];
    if (!row) return;
    if (key === 'Backspace') {
      let c = st.cur.c;
      if (c >= st.len || !row.letters[c]) c--;
      if (c < minCol()) return;
      row.letters[c] = '';
      row.marks[c] = 0;
      row.done = false;
      st.cur.c = c;
      update();
    } else if (key === 'Enter') {
      if (!complete(row)) return;
      row.done = true;
      if (st.cur.r === st.rows.length - 1) st.rows.push(newRow());
      const nr = st.cur.r + 1;
      const c = st.rows[nr].letters.findIndex((l) => !l);
      st.cur = { r: nr, c: c === -1 ? st.len : c };
      update();
    } else if (/^[A-Z]$/.test(key)) {
      let c = st.cur.c;
      if (c >= st.len) return;
      if (c < minCol()) c = minCol();
      row.letters[c] = key;
      const reds = knownReds();
      row.marks[c] = reds[c] === key ? 2 : 0;
      let n = c + 1;
      while (n < st.len && row.letters[n]) n++;
      st.cur.c = n;
      update();
    }
  }

  /* ---------- events ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select') return;
    if (e.key === 'Backspace' || e.key === 'Enter') { e.preventDefault(); onKey(e.key); return; }
    const l = normLetter(e.key);
    if (l.length === 1) { e.preventDefault(); onKey(l); }
  });

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.lang === st.lang) return;
    st.lang = b.dataset.lang;
    resetGame();
    renderI18n();
    renderBoard();
    await loadLang(st.lang);
    update();
  }));

  $('len').addEventListener('change', (e) => { st.len = +e.target.value; resetGame(); update(); });

  $('first').addEventListener('input', (e) => {
    const l = normLetter(e.target.value).slice(0, 1);
    e.target.value = l;
    st.first = l;
    for (const row of st.rows) {
      if (l && (!row.letters[0] || row.marks[0] === 2)) { row.letters[0] = l; row.marks[0] = 2; }
      else if (!l && !row.done && row.letters.slice(1).every((x) => !x)) { row.letters[0] = ''; row.marks[0] = 0; }
    }
    const r = st.rows[st.cur.r];
    if (r && st.cur.c < minCol()) st.cur.c = minCol();
    if (r && !l && r.letters.every((x) => !x)) st.cur.c = 0;
    update();
  });

  $('rare').addEventListener('change', (e) => { st.rare = e.target.checked; showLimit = 150; update(); });
  $('reset').addEventListener('click', () => { resetGame(); update(); });
  $('useBest').addEventListener('click', () => playWord($('useBest').dataset.word));
  $('more').addEventListener('click', () => { showLimit += 400; scheduleCompute(); });

  /* ---------- startup ---------- */
  restore();
  if (!st.rows.length || st.rows[0].letters.length !== st.len) resetGame();
  renderI18n();
  renderBoard();
  loadLang(st.lang).then(update);
})();
