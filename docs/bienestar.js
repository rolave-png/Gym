// Pestaña Bienestar: respiración guiada (mañana / noche) y seguimiento de lectura.
(function () {
  const q = (s) => document.querySelector(s);
  const shift = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const niceDate = (iso) => new Date(iso + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const num = (v) => Math.max(0, Math.round(Number(v) || 0));
  const hasData = () => db.wellness && db.reading;
  const ensure = () => { db.wellness = db.wellness || {}; db.reading = db.reading || { book: null, log: {}, done: [] }; };

  // ---------- Respiración ----------
  const PATTERNS = [
    { id: 'box', name: 'Caja 4-4-4-4', slot: 'am', tip: 'Para empezar el día con foco y calma.', ph: [['Inhala', 4, 1], ['Sostén', 4, 1], ['Exhala', 4, 0.5], ['Sostén', 4, 0.5]] },
    { id: 'coh', name: 'Coherente 5-5', slot: 'any', tip: 'Ritmo suave y parejo, bueno en cualquier momento.', ph: [['Inhala', 5, 1], ['Exhala', 5, 0.5]] },
    { id: '478', name: 'Calma 4-7-8', slot: 'pm', tip: 'Para soltar tensión y prepararte para dormir.', ph: [['Inhala', 4, 1], ['Sostén', 7, 1], ['Exhala', 8, 0.5]] },
  ];
  let slot = new Date().getHours() < 15 ? 'am' : 'pm', patId = slot === 'am' ? 'box' : '478', mins = 3, run = null;

  function breathChips() {
    ensure();
    const w = db.wellness[date] || {};
    q('#bChips').innerHTML = [['am', '☀️ Mañana'], ['pm', '🌙 Noche']].map(([k, l]) =>
      `<button class="chip ${w[k] ? 'on' : ''} ${slot === k ? 'sel' : ''}" data-slot="${k}">${l}${w[k] ? ' ✔' : ''}</button>`).join('');
    q('#bPats').innerHTML = PATTERNS.map((p) => `<button class="pat ${p.id === patId ? 'sel' : ''}" data-pat="${p.id}"><b>${p.name}</b><small>${p.tip}</small></button>`).join('');
    q('#bMins').innerHTML = [1, 3, 5].map((m) => `<button class="chip ${m === mins ? 'sel' : ''}" data-min="${m}">${m} min</button>`).join('');
    let streak = 0; for (let d = date; (db.wellness[d] || {}).am || (db.wellness[d] || {}).pm; d = shift(d, -1)) streak++;
    q('#bStreak').textContent = streak ? `🔥 ${streak} día${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''} respirando` : 'Tu primera sesión te espera 🌿';
  }

  function stopBreath(done) {
    if (!run) return;
    clearInterval(run.timer); const r = run; run = null;
    q('#bStage').hidden = true; q('#bSetup').hidden = false;
    if (done) {
      ensure(); const w = (db.wellness[date] = db.wellness[date] || {});
      w[r.slot] = (typeof w[r.slot] === 'number' ? w[r.slot] : 0) + r.mins; save();
      q('#bMsg').textContent = r.slot === 'am' ? '✅ ¡Respiración de la mañana lista! Que tengas un gran día.' : '✅ ¡Respiración de la noche lista! A descansar.';
    } else q('#bMsg').textContent = '';
    breathChips();
  }

  function startBreath() {
    const pat = PATTERNS.find((p) => p.id === patId), total = mins * 60, cycle = pat.ph.reduce((a, p) => a + p[1], 0);
    q('#bSetup').hidden = true; q('#bStage').hidden = false; q('#bMsg').textContent = '';
    const orb = q('#orb'); orb.style.transition = 'none'; orb.style.transform = 'scale(0.5)'; void orb.offsetWidth;
    run = { slot, mins, t0: Date.now(), last: '' };
    run.timer = setInterval(() => {
      const el = (Date.now() - run.t0) / 1000;
      if (el >= total) return stopBreath(true);
      const u = el % cycle; let acc = 0, i = 0;
      while (i < pat.ph.length - 1 && u >= acc + pat.ph[i][1]) { acc += pat.ph[i][1]; i++; }
      const [label, secs, scale] = pat.ph[i], key = Math.floor(el / cycle) + '-' + i;
      if (key !== run.last) {
        run.last = key; orb.style.transition = `transform ${secs}s ease-in-out`; orb.style.transform = `scale(${scale})`;
        try { navigator.vibrate && navigator.vibrate(25); } catch {}
      }
      q('#bPhase').textContent = label; q('#bCount').textContent = Math.ceil(acc + secs - u);
      const left = Math.ceil(total - el); q('#bLeft').textContent = `Quedan ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    }, 100);
  }

  // ---------- Lectura ----------
  const pagesOn = (d) => num((db.reading.log || {})[d]);
  const current = (b) => Math.min(b.total, b.base + Object.entries(db.reading.log || {}).filter(([d]) => d >= b.start).reduce((a, [, n]) => a + num(n), 0));

  function bookDialog(edit) {
    ensure(); const b = db.reading.book;
    q('#bkTitle').value = edit && b ? b.title : ''; q('#bkAuthor').value = edit && b ? b.author || '' : '';
    q('#bkTotal').value = edit && b ? b.total : ''; q('#bkNow').value = edit && b ? current(b) : '0';
    q('#bkGoal').value = edit && b ? b.goal : '10'; q('#bkTarget').value = edit && b ? b.target || '' : '';
    q('#bkDlg').dataset.edit = edit ? '1' : ''; q('#bkDlg').showModal();
  }

  function saveBook(ev) {
    if (ev.submitter?.value !== 'ok') return;
    ensure();
    const title = q('#bkTitle').value.trim(), total = num(q('#bkTotal').value), now = Math.min(num(q('#bkNow').value), total);
    if (!title || !total) return;
    let goal = Math.max(1, num(q('#bkGoal').value) || 10); const target = q('#bkTarget').value || '';
    if (target) { const days = Math.max(1, Math.round((new Date(target + 'T12:00') - new Date(today() + 'T12:00')) / 864e5) + 1); goal = Math.max(1, Math.ceil((total - now) / days)); }
    const old = db.reading.book, keepStart = q('#bkDlg').dataset.edit && old;
    // "página actual" se guarda como base + lecturas registradas desde el inicio
    const start = keepStart ? old.start : today(), logged = keepStart ? Object.entries(db.reading.log).filter(([d]) => d >= start).reduce((a, [, n]) => a + num(n), 0) : 0;
    db.reading.book = { title, author: q('#bkAuthor').value.trim(), total, goal, target, start, base: Math.max(0, now - logged) };
    save(); loadWellness();
  }

  function readCard() {
    ensure(); const r = db.reading, b = r.book, box = q('#readCard');
    const done = (r.done || []).map((d) => `<li>📗 ${esc(d.title)} <small>· ${niceDate(d.finished)}</small></li>`).join('');
    if (!b) {
      box.innerHTML = `<h2>📖 Lectura</h2><p class="muted">Carga el libro que estás leyendo, dime en qué página vas y ponte una meta diaria. Cada día anotas lo que leíste y yo llevo la cuenta.</p>
        <button class="btn primary wide" data-act="newbook">Cargar un libro</button>${done ? `<h3>Libros terminados</h3><ul class="done-list">${done}</ul>` : ''}`;
      return;
    }
    const cur = current(b), pct = Math.round(cur / b.total * 100), left = b.total - cur, today0 = pagesOn(date);
    const finishedBook = cur >= b.total;
    const days = Math.ceil(left / b.goal), eta = shift(today(), Math.max(0, days - 1));
    let streak = 0; for (let d = pagesOn(date) > 0 ? date : shift(date, -1); pagesOn(d) > 0; d = shift(d, -1)) streak++;
    const week = Array.from({ length: 7 }, (_, i) => shift(date, i - 6)), max = Math.max(b.goal, ...week.map(pagesOn), 1);
    const bars = week.map((d) => { const n = pagesOn(d); return `<div class="rb ${n >= b.goal ? 'ok' : ''}" title="${niceDate(d)}: ${n} pág."><i style="height:${Math.max(n / max * 100, n ? 6 : 2)}%"></i><span>${new Date(d + 'T12:00').toLocaleDateString('es', { weekday: 'narrow' })}</span></div>`; }).join('');
    box.innerHTML = `
      <h2>📖 ${esc(b.title)}</h2>${b.author ? `<p class="muted" style="margin:-6px 0 8px">${esc(b.author)}</p>` : ''}
      <div class="track big"><div style="width:${pct}%"></div></div>
      <p class="rd-line"><b>Página ${cur}</b> de ${b.total} · ${pct}% ${finishedBook ? '' : `· faltan ${left}`}</p>
      ${finishedBook ? `<div class="tip">🎉 ¡Terminaste el libro! Guárdalo y empieza otro cuando quieras.</div><button class="btn primary wide" data-act="finish">Guardar como terminado</button>` : `
      <h3>Hoy (${niceDate(date)})</h3>
      <div class="rd-today"><b>${today0}</b><span>de ${b.goal} páginas</span>${today0 >= b.goal ? '<em>✅ ¡Meta cumplida!</em>' : `<em>te faltan ${b.goal - today0}</em>`}</div>
      <div class="track"><div style="width:${Math.min(today0 / b.goal * 100, 100)}%"></div></div>
      <div class="rd-add">
        <button class="chip" data-add="1">+1</button><button class="chip" data-add="5">+5</button><button class="chip" data-add="10">+10</button>
        <input id="rdPages" type="number" min="0" inputmode="numeric" placeholder="Total de hoy" value="${today0 || ''}">
        <button class="btn primary" data-act="setpages">Guardar</button>
      </div>
      <p class="muted">${streak ? `🔥 ${streak} día${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''} leyendo · ` : ''}A este ritmo (${b.goal} pág./día) lo terminas el <b>${niceDate(eta)}</b> (en ${days} día${days > 1 ? 's' : ''}).${b.target ? ` Tu fecha meta: ${niceDate(b.target)}.` : ''}</p>`}
      <h3>Últimos 7 días</h3><div class="rbars">${bars}</div>
      <p class="center"><button class="link" data-act="editbook">Editar libro y meta</button> · <button class="link" data-act="newbook">Cambiar de libro</button></p>
      ${done ? `<h3>Libros terminados</h3><ul class="done-list">${done}</ul>` : ''}`;
  }

  function loadWellness() {
    if (!hasData()) ensure();
    breathChips(); readCard();
    const w = db.wellness[date] || {}; q('#bDay').textContent = `${niceDate(date)}: ${w.am ? '☀️✔' : '☀️·'}  ${w.pm ? '🌙✔' : '🌙·'}`;
  }

  // ---------- Eventos ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t || !q('#tab-bienestar') || q('#tab-bienestar').hidden) return;
    ensure();
    if (t.dataset.slot) { slot = t.dataset.slot; patId = slot === 'am' ? 'box' : '478'; loadWellness(); }
    else if (t.dataset.act === 'toggleslot') { const w = (db.wellness[date] = db.wellness[date] || {}); if (w[slot]) delete w[slot]; else w[slot] = 1; save(); loadWellness(); }
    else if (t.dataset.pat) { patId = t.dataset.pat; breathChips(); }
    else if (t.dataset.min) { mins = +t.dataset.min; breathChips(); }
    else if (t.id === 'bStart') startBreath();
    else if (t.id === 'bStop') stopBreath(false);
    else if (t.dataset.add) { const b = db.reading.book; if (!b) return; db.reading.log[date] = pagesOn(date) + +t.dataset.add; save(); readCard(); }
    else if (t.dataset.act === 'setpages') { db.reading.log[date] = num(q('#rdPages').value); save(); readCard(); }
    else if (t.dataset.act === 'newbook') bookDialog(false);
    else if (t.dataset.act === 'editbook') bookDialog(true);
    else if (t.dataset.act === 'finish') { const b = db.reading.book; db.reading.done = [{ title: b.title, finished: today() }, ...(db.reading.done || [])]; db.reading.book = null; save(); readCard(); }
  });
  q('#bkForm').addEventListener('submit', saveBook);
  window.loadWellness = loadWellness;
})();
