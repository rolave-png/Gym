// Registro de ejercicio (kcal quemadas), balance con lo que comes y resumen por semanas.
(function () {
  const q = (s) => document.querySelector(s);
  const TYPES = { gym: '🏋️ Gimnasio', bici: '🚴 Bici estática', camina: '🚶 Caminata o trotadora', otro: '✨ Otro' };
  const BASAL = 1.2; // kcal por minuto que el cuerpo gasta en reposo (≈ 1.700 kcal al día)
  const num = (v) => Math.max(0, Math.round(Number(v) || 0));
  const list = (d) => ((db.activity || {})[d]) || [];
  const act = (e) => (e.active != null ? e.active : e.kcal);
  const burned = (d) => list(d).reduce((a, e) => a + act(e), 0);
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
  const fmt = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const nice = (iso) => new Date(iso + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });

  // La meta del día puede crecer con el ejercicio, según lo que elija la persona en Ajustes
  window.burnedOn = burned;
  window.goalExtra = (d) => { const m = db.settings.actMode || 'none', b = burned(d); return m === 'half' ? Math.round(b / 2) : m === 'all' ? b : 0; };

  function renderActivity() {
    const box = q('#actCard'); if (!box) return;
    const items = list(date), b = burned(date);
    const eaten = db.meals.filter((m) => m.date === date).reduce((a, m) => a + m.calories, 0);
    const extra = window.goalExtra(date);
    const rows = items.map((e) => `
      <div class="act-row">
        <div class="act-t"><b>${TYPES[e.type] || TYPES.otro}</b><small>${e.minutes ? dur(e.minutes) + ' · ' : ''}${e.active != null && e.active !== e.kcal ? `${e.kcal} kcal totales → <b>${e.active} activas</b>` : `${e.kcal} kcal`}${e.note ? ' · ' + esc(e.note) : ''}</small></div>
        <button class="x" data-act-edit="${e.id}" title="Editar">✏️</button><button class="x" data-act-del="${e.id}" title="Borrar">✕</button>
      </div>`).join('');
    box.innerHTML = `
      <div class="act-head"><h2>🔥 Ejercicio de hoy</h2><button class="btn primary" data-act-add="1">+ Registrar</button></div>
      ${items.length ? rows : '<p class="muted">Aún no registras ejercicio. Anota tu entrenamiento y las kcal que te marca tu reloj.</p>'}
      ${items.length || eaten ? `<div class="bal"><div><b>${eaten}</b><small>Comiste</small></div><div><b>${b}</b><small>Quemaste</small></div><div class="${eaten - b > 0 ? 'pos' : 'neg'}"><b>${eaten - b > 0 ? '+' : ''}${eaten - b}</b><small>Comida − ejercicio</small></div></div><p class="muted">Es solo comida menos ejercicio: no cuenta lo que tu cuerpo gasta en reposo durante el día.</p>` : ''}
      ${extra ? `<p class="muted">Tu meta de hoy subió ${extra} kcal por el ejercicio (puedes cambiarlo en ⚙️ Ajustes).</p>` : ''}`;
  }

  // Resumen de las últimas 4 semanas (lunes a domingo)
  function renderWeeks() {
    const box = q('#actWeeks'); if (!box) return;
    const wk = (iso) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return fmt(d); };
    const now = wk(today()), weeks = Array.from({ length: 4 }, (_, i) => { const d = new Date(now + 'T12:00'); d.setDate(d.getDate() - 7 * (3 - i)); return fmt(d); });
    const agg = Object.fromEntries(weeks.map((w) => [w, { n: 0, min: 0, kcal: 0 }]));
    for (const [d, es] of Object.entries(db.activity || {})) { const w = wk(d); if (agg[w]) for (const e of es) { agg[w].n++; agg[w].min += e.minutes || 0; agg[w].kcal += act(e); } }
    const max = Math.max(1, ...Object.values(agg).map((a) => a.kcal));
    const any = Object.values(agg).some((a) => a.n);
    box.innerHTML = '<h2>💪 Ejercicio por semana</h2>' + (any ? weeks.map((w) => {
      const a = agg[w], end = new Date(w + 'T12:00'); end.setDate(end.getDate() + 6);
      return `<div class="wkrow"><span class="wkl">${w === now ? 'Esta semana' : nice(w) + ' – ' + nice(fmt(end))}</span><div class="track"><div style="width:${a.kcal / max * 100}%"></div></div><span class="wkv">${a.n} ${a.n === 1 ? 'sesión' : 'sesiones'}${a.min ? ' · ' + dur(a.min) : ''} · ${a.kcal} kcal</span></div>`;
    }).join('') + '<p class="muted">Calorías activas estimadas (sin contar lo que gastas en reposo).</p>' : '<p class="muted">Cuando registres tus entrenamientos aparecerá aquí cuántos haces por semana.</p>');
  }

  // ---- Diálogo ----
  let editing = null;
  function openDialog(id) {
    editing = id || null;
    const e = id ? list(date).find((x) => x.id === id) : null;
    q('#acType').value = e ? e.type : 'gym'; q('#acMin').value = e ? e.minutes || '' : ''; q('#acKcal').value = e ? e.kcal : '';
    q('#acTotal').checked = e ? e.active != null && e.active !== e.kcal : true; q('#acNote').value = e ? e.note || '' : '';
    q('#acDay').textContent = nice(date); updPreview(); q('#actDlg').showModal();
  }
  function compute() {
    const kcal = num(q('#acKcal').value), min = num(q('#acMin').value);
    const active = q('#acTotal').checked && min ? Math.max(0, kcal - Math.round(min * BASAL)) : kcal;
    return { kcal, min, active };
  }
  function updPreview() {
    const { kcal, min, active } = compute();
    q('#acPrev').textContent = !kcal ? '' : q('#acTotal').checked && min ? `Calorías activas estimadas: ${active} kcal (descuento de reposo: ${kcal - active} kcal, a 1,2 kcal por minuto).` : `Se registrarán ${kcal} kcal.`;
  }
  q('#actForm').addEventListener('input', updPreview);
  q('#actForm').addEventListener('submit', (ev) => {
    if (ev.submitter?.value !== 'ok') return;
    const { kcal, min, active } = compute(); if (!kcal) return;
    db.activity = db.activity || {};
    const entry = { id: editing || uid(), type: q('#acType').value, minutes: min, kcal, active: active !== kcal ? active : undefined, note: q('#acNote').value.trim().slice(0, 60) };
    const arr = (db.activity[date] = list(date).filter((e) => e.id !== entry.id)); arr.push(entry); save(); loadMeals();
  });
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.actAdd) openDialog();
    else if (t.dataset.actEdit) openDialog(t.dataset.actEdit);
    else if (t.dataset.actDel && confirm('¿Borrar este ejercicio?')) { db.activity[date] = list(date).filter((e) => e.id !== t.dataset.actDel); if (!db.activity[date].length) delete db.activity[date]; save(); loadMeals(); }
  });
  window.renderActivity = renderActivity; window.renderActWeeks = renderWeeks;
  renderActivity();
})();
