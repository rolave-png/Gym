// Explorar ejercicios, ajustar la semana (evolución), bienvenida y compartir.
(function () {
  const G = window.GUIA, q = (s) => document.querySelector(s);
  const iso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EQ_LABEL = { maq: '🏋️ Máquina', man: '🏠 Mancuernas', peso: '🙌 Sin equipo', bici: '🚴 Bici', cinta: '🏃 Cinta' };
  const PLACES = [['all', 'Todo'], ['gym', '🏋️ Gimnasio'], ['home', '🏠 Casa: mancuernas y bici'], ['home0', '🙌 Casa: sin equipo']];
  const PLACE_EQ = { all: null, gym: null, home: ['man', 'peso', 'bici'], home0: ['peso'] };
  const GROUPS = ['Todos', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Glúteos', 'Abdomen', 'Cardio', 'Movilidad'];
  let place = 'all', grp = 'Todos';

  // ---------- Explorar ----------
  function chips() {
    q('#expPlace').innerHTML = PLACES.map(([k, l]) => `<button class="chip ${place === k ? 'sel' : ''}" data-xplace="${k}">${l}</button>`).join('');
    q('#expGrp').innerHTML = GROUPS.map((k) => `<button class="chip ${grp === k ? 'sel' : ''}" data-xgrp="${k}">${k}</button>`).join('');
  }
  function results() {
    const text = G.norm(q('#expQ').value), eqs = PLACE_EQ[place];
    const items = Object.values(G.EX).filter((e) => (!eqs || eqs.includes(e.eq)) && (grp === 'Todos' || e.grp === grp) && (!text || G.norm(e.name + ' ' + e.muscles).includes(text)));
    q('#expCount').textContent = `${items.length} ejercicio${items.length === 1 ? '' : 's'}`;
    q('#expList').innerHTML = items.map((e) => `<button class="xcard" data-xex="${e.id}"><b>${esc2(e.name)}</b><small>${e.grp} · ${EQ_LABEL[e.eq]} · ${e.sets} × ${esc2(e.reps)}</small></button>`).join('') || '<p class="muted">No hay ejercicios con esos filtros.</p>';
  }
  function openExplorer() { chips(); results(); q('#expDlg').showModal(); q('#expDlg').scrollTop = 0; }

  // ---------- Evolución semanal ----------
  const bump = (reps, d) => {
    if (/min|\bs\b|seg/.test(reps)) return reps;
    const m = String(reps).match(/^(\d+)(?:-(\d+))?(.*)$/); if (!m) return reps;
    const a = Math.max(5, +m[1] + d), b = m[2] ? Math.max(a, +m[2] + d) : null;
    return `${a}${b !== null ? '-' + b : ''}${m[3]}`;
  };
  function swap(e, gid) { const l = G.EX[gid]; Object.assign(e, { gid, name: l.name, sets: l.sets, reps: l.reps }); }
  function adjust(mode) {
    const out = [];
    for (const day of Object.values(db.routine)) for (const e of day.exercises || []) {
      if ((e.sec || 'main') !== 'main' || e.opt) continue;
      const l = G.EX[e.gid], sets = +e.sets || 0, old = e.name;
      if (mode === 'up') {
        if (G.HARDER[e.gid]) { swap(e, G.HARDER[e.gid]); out.push(`${old} → ${e.name}`); }
        else if (l && l.grp === 'Cardio') continue;
        else if (sets && sets < 4) { e.sets = sets + 1; out.push(`${old}: ${e.sets} series`); }
        else { const r = bump(e.reps, 2); if (r !== e.reps) { e.reps = r; out.push(`${old}: ${r} repeticiones`); } }
      } else {
        if (l && l.grp === 'Cardio') continue;
        if (sets > 2) { e.sets = sets - 1; out.push(`${old}: ${e.sets} series`); }
        else if (G.EASIER[e.gid]) { swap(e, G.EASIER[e.gid]); out.push(`${old} → ${e.name}`); }
        else { const r = bump(e.reps, -2); if (r !== e.reps) { e.reps = r; out.push(`${old}: ${r} repeticiones`); } }
      }
    }
    db.lastAdjust = iso(); save(); loadRoutine(); updateBanner();
    return out;
  }
  function showResult(mode, changes) {
    const title = mode === 'up' ? '💪 ¡Subimos un escalón!' : mode === 'down' ? '🌿 Bajamos un poco el ritmo' : '👌 Perfecto, seguimos igual';
    q('#wkResult').innerHTML = `<h3>${title}</h3>` + (changes.length ? `<ul>${changes.slice(0, 14).map((c) => `<li>${esc2(c)}</li>`).join('')}</ul>${changes.length > 14 ? `<p class="muted">… y ${changes.length - 14} cambios más.</p>` : ''}` : '<p class="muted">Tu rutina se mantiene esta semana.</p>') + '<p class="muted">Te lo recordaré en una semana.</p>';
    q('#wkResult').hidden = false; q('#wkChoices').hidden = true;
  }
  function updateBanner() {
    const b = q('#weekBanner'); if (!b) return;
    const has = Object.values(db.routine).some((d) => (d.exercises || []).some((e) => (e.sec || 'main') === 'main'));
    const days = (new Date(iso() + 'T12:00') - new Date((db.lastAdjust || iso()) + 'T12:00')) / 864e5;
    b.hidden = !(has && days >= 7);
  }

  // ---------- Bienvenida ----------
  function welcome() {
    if (db.onboarded) return;
    q('#welDlg').showModal();
  }

  // ---------- Compartir ----------
  async function share() {
    const url = location.origin + location.pathname.replace(/index\.html$/, '');
    const text = 'Mira esta app de rutinas para entrenar en gimnasio o en casa, con ejercicios animados, calentamiento, estiramientos y respiración:';
    try { if (navigator.share) { await navigator.share({ title: 'Gym Tracker', text, url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(`${text} ${url}`); toastMsg('📋 Enlace copiado: pégalo en WhatsApp'); } catch { prompt('Copia este enlace:', url); }
  }
  function toastMsg(t) {
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.xplace) { place = t.dataset.xplace; chips(); results(); }
    else if (t.dataset.xgrp) { grp = t.dataset.xgrp; chips(); results(); }
    else if (t.dataset.xex) openGuide(t.dataset.xex, { add: true });
    else if (t.id === 'expClose') q('#expDlg').close();
    else if (t.id === 'wkClose') q('#wkDlg').close();
    else if (t.dataset.wk) { const m = t.dataset.wk; showResult(m, m === 'same' ? (db.lastAdjust = iso(), save(), updateBanner(), []) : adjust(m)); }
    else if (t.dataset.wel) {
      db.onboarded = true; save(); q('#welDlg').close();
      if (t.dataset.wel === 'gym') window.openCatalog('gym'); else if (t.dataset.wel === 'home') window.openCatalog('home'); else if (t.dataset.wel === 'home0') window.openCatalog('home');
    }
  });
  q('#expQ').addEventListener('input', results);
  q('#expBtn').onclick = openExplorer;
  q('#wkBtn').onclick = () => { q('#wkResult').hidden = true; q('#wkChoices').hidden = false; q('#wkDlg').showModal(); };
  q('#weekBannerBtn').onclick = q('#wkBtn').onclick;
  q('#shareBtn').onclick = share;
  window.updateWeekBanner = updateBanner; window.toastMsg = toastMsg;
  updateBanner(); welcome();
})();
