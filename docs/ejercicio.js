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
    entryDate = null; q('#acMulti').hidden = true; q('#acPhotoMsg').textContent = '';
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
    const d = entryDate || date, arr = (db.activity[d] = list(d).filter((e) => e.id !== entry.id)); arr.push(entry); save();
    if (d !== date) { date = d; q('#date').value = d; }   // si la foto era de otro día, se muestra ese día
    loadMeals();
  });
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.actAdd) openDialog();
    else if (t.dataset.actEdit) openDialog(t.dataset.actEdit);
    else if (t.dataset.actDel && confirm('¿Borrar este ejercicio?')) { db.activity[date] = list(date).filter((e) => e.id !== t.dataset.actDel); if (!db.activity[date].length) delete db.activity[date]; save(); loadMeals(); }
  });

  // ---- Leer una foto del reloj o de Samsung Health ----
  const WATCH_PROMPT = () => `Eres un asistente que lee pantallas de relojes inteligentes y de apps de salud (Samsung Health, Garmin, Apple, etc.). Mira la imagen y extrae los entrenamientos que se vean. Hoy es ${today()}.
Responde SOLO con JSON válido y sin texto adicional, con este formato:
{"sessions": [{"date": "AAAA-MM-DD o null", "minutes": número entero, "kcal": número, "kcal_kind": "total" | "active" | "unknown", "type": "gym" | "bici" | "camina" | "otro", "note": "texto corto o vacío"}], "error": null}
Reglas:
- "minutes" va en minutos: convierte formatos como 01:51:28 (son 111 minutos) o 54 min 17 s.
- "date": si solo se ve día y mes, usa el año de hoy. Si no se ve la fecha, usa null.
- "kcal_kind": "total" si dice calorías totales o kcal (total); "active" si dice activas; "unknown" si no se aclara.
- "type": gimnasio, fuerza o pesas = "gym"; bicicleta = "bici"; caminata, correr o cinta = "camina"; otro = "otro".
- Si hay varias sesiones en la lista, devuélvelas todas. Si hay una sola, devuelve una.
- No inventes números que no se vean. Si no es una pantalla de ejercicio, responde {"sessions": [], "error": "No veo un entrenamiento en la imagen"}.`;
  const okDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && d >= '2020-01-01' && d <= fmt(new Date(Date.now() + 864e5));
  const norm = (s) => ({ date: okDate(s.date) ? s.date : null, minutes: num(s.minutes), kcal: num(s.kcal), kind: ['total', 'active'].includes(s.kcal_kind) ? s.kcal_kind : 'unknown', type: TYPES[s.type] ? s.type : 'otro', note: String(s.note || '').slice(0, 60) });
  const say = (t) => { q('#acPhotoMsg').textContent = t; };
  let entryDate = null;

  async function readWatch(file) {
    if (!db.settings.apiKey) { say('⚠️ Para leer la foto pon tu clave de Gemini en ⚙️ Ajustes.'); return; }
    q('#acMulti').hidden = true; say('📷 Leyendo la foto…');
    try {
      let full, mime = 'image/jpeg';
      try { full = (await resizeImage(file, 1600)).split(',')[1]; } catch { const raw = await readRaw(file); full = raw.data; mime = raw.mime; }
      const info = await analyze(full, '', (t) => say(t), mime, WATCH_PROMPT());
      const ss = (Array.isArray(info.sessions) ? info.sessions : []).map(norm).filter((s) => s.kcal);
      if (!ss.length) throw new Error(info.error || 'No pude leer las calorías en la foto. Prueba con una foto más cerca y con buena luz, o escribe los datos a mano.');
      if (ss.length === 1) fillOne(ss[0]); else chooser(ss);
    } catch (err) { say('⚠️ ' + errMsg(err)); }
  }
  function fillOne(s) {
    q('#acType').value = s.type; q('#acMin').value = s.minutes || ''; q('#acKcal').value = s.kcal; q('#acTotal').checked = s.kind !== 'active';
    if (s.note && !q('#acNote').value) q('#acNote').value = s.note;
    entryDate = s.date && s.date !== date ? s.date : null; if (entryDate) q('#acDay').textContent = nice(entryDate);
    say(`✅ Leí ${s.minutes ? dur(s.minutes) + ' y ' : ''}${s.kcal} kcal${s.kind === 'unknown' ? ' (no se aclara si son totales o activas: dejé «total», cámbialo si hace falta)' : s.kind === 'active' ? ' activas' : ' totales'}${entryDate ? '. La foto es del ' + nice(entryDate) + ' y se guardará en esa fecha' : ''}. Revisa y pulsa Guardar.`);
    updPreview();
  }
  function chooser(ss) {
    q('#acMulti').hidden = false; q('#acMulti').dataset.s = JSON.stringify(ss);
    q('#acMulti').innerHTML = `<p><b>Encontré ${ss.length} entrenamientos.</b> Elige cuáles importar:</p>` + ss.map((s, i) => `<label class="opt"><input type="checkbox" data-pick="${i}" checked> ${s.date ? nice(s.date) : '<em>sin fecha: ' + nice(date) + '</em>'} · ${TYPES[s.type]} · ${s.minutes ? dur(s.minutes) + ' · ' : ''}${s.kcal} kcal ${s.kind === 'active' ? 'activas' : 'totales'}</label>`).join('') + '<button type="button" class="btn primary wide-btn" id="acImport">Importar seleccionados</button>';
    say('Revisa la lista. Al importar, las calorías «totales» se ajustan descontando el reposo.');
  }
  function importMany() {
    const ss = JSON.parse(q('#acMulti').dataset.s || '[]'); let n = 0, dup = 0;
    document.querySelectorAll('#acMulti [data-pick]:checked').forEach((c) => {
      const s = ss[+c.dataset.pick], d = s.date || date; db.activity = db.activity || {};
      if (list(d).some((e) => e.kcal === s.kcal && e.minutes === s.minutes)) { dup++; return; }
      const active = s.kind !== 'active' && s.minutes ? Math.max(0, s.kcal - Math.round(s.minutes * BASAL)) : s.kcal;
      db.activity[d] = [...list(d), { id: uid(), type: s.type, minutes: s.minutes, kcal: s.kcal, active: active !== s.kcal ? active : undefined, note: s.note }]; n++;
    });
    save(); q('#actDlg').close(); loadMeals(); if (window.toastMsg) window.toastMsg(`✅ ${n} entrenamiento${n === 1 ? '' : 's'} importado${n === 1 ? '' : 's'}${dup ? ` (${dup} ya estaba${dup === 1 ? '' : 'n'})` : ''}`);
  }
  q('#acPhoto').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) readWatch(f); });
  document.addEventListener('click', (e) => { if (e.target.id === 'acImport') importMany(); });

  window.renderActivity = renderActivity; window.renderActWeeks = renderWeeks;
  renderActivity();
})();
