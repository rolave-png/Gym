// Pestaña Salud: sueño, pulso en reposo, estrés, pasos y peso, con balance semanal y evolución.
(function () {
  const q = (s) => document.querySelector(s);
  const fmtD = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const shift = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return fmtD(d); };
  const nice = (iso) => new Date(iso + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const H = () => (db.health = db.health || {});
  const goals = () => ({ sleep: Number(db.settings.sleepGoal) || 7.5, steps: Number(db.settings.stepsGoal) || 8000 });
  const nf = (n) => Math.round(n).toLocaleString('es');
  const hm = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`;
  const pos = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null; };

  // good: 'up' = más es mejor, 'down' = menos es mejor, 'none' = solo mostrar la tendencia
  const METRICS = [
    { k: 'sleep', name: 'Sueño', icon: '😴', val: (d) => (d.sleepMin ? d.sleepMin / 60 : null), show: (v) => hm(v * 60), diff: (x) => `${Math.abs(Math.round(x * 60))} min`, good: 'up', eps: 0.15,
      goal: () => goals().sleep, goalText: () => `meta ${hm(goals().sleep * 60)}`, status: (a) => (a >= goals().sleep ? 'ok' : a >= goals().sleep - 1 ? 'mid' : 'bad') },
    { k: 'steps', name: 'Pasos', icon: '👟', val: (d) => d.steps || null, show: (v) => nf(v), diff: (x) => nf(Math.abs(x)), good: 'up', eps: 150,
      goal: () => goals().steps, goalText: () => `meta ${nf(goals().steps)}`, status: (a) => (a >= goals().steps ? 'ok' : a >= goals().steps * 0.7 ? 'mid' : 'bad') },
    { k: 'hrRest', name: 'Pulso en reposo', icon: '❤️', val: (d) => d.hrRest || null, show: (v) => `${Math.round(v)} lpm`, diff: (x) => `${Math.abs(Math.round(x))} lpm`, good: 'down', eps: 1 },
    { k: 'stress', name: 'Estrés', icon: '🧠', val: (d) => d.stress || null, show: (v) => `${Math.round(v)}`, diff: (x) => `${Math.abs(Math.round(x))}`, good: 'down', eps: 2,
      status: (a) => (a <= 45 ? 'ok' : a <= 59 ? 'mid' : 'bad'), goalText: () => 'bajo es mejor (1 a 99)' },
    { k: 'moveKcal', name: 'Movimiento (kcal activas)', icon: '🔥', val: (d) => d.moveKcal || null, show: (v) => `${nf(v)} kcal`, diff: (x) => `${nf(Math.abs(x))} kcal`, good: 'up' },
    { k: 'weight', name: 'Peso', icon: '⚖️', val: (d) => d.weight || null, show: (v) => `${v.toFixed(1).replace('.', ',')} kg`, diff: (x) => `${Math.abs(x).toFixed(1).replace('.', ',')} kg`, good: 'none', eps: 0.2 },
  ];

  const days = (n, end = date) => Array.from({ length: n }, (_, i) => shift(end, i - (n - 1)));
  const series = (m, ds) => ds.map((d) => m.val(H()[d] || {}));
  const avg = (arr) => { const v = arr.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  // Promedio de los últimos 7 días y de los 7 anteriores
  const cmp = (m) => { const cur = avg(series(m, days(7))), prev = avg(series(m, days(7, shift(date, -7)))); return { cur, prev }; };
  function trend(m, cur, prev) {
    if (cur == null || prev == null) return { cls: 'none', txt: 'sin comparación' };
    const d = cur - prev;
    if (Math.abs(d) < (m.eps != null ? m.eps : Math.max(Math.abs(prev), 1e-9) * 0.02)) return { cls: 'none', txt: '→ igual que la semana anterior' };
    const up = d > 0, better = m.good === 'none' ? null : (m.good === 'up') === up;
    return { cls: better === null ? 'none' : better ? 'ok' : 'bad', txt: `${up ? '▲' : '▼'} ${m.diff(d)} vs la semana anterior` };
  }

  // ---------- Hoy ----------
  function today_() {
    const d = H()[date] || {}, box = q('#hToday');
    const tile = (icon, label, value, sub) => `<div class="htile"><span>${icon} ${label}</span><b>${value}</b><small>${sub || ''}</small></div>`;
    box.innerHTML = `
      <div class="act-head"><h2>❤️ Salud · ${nice(date)}</h2></div>
      <div class="htiles">
        ${tile('😴', 'Sueño', d.sleepMin ? hm(d.sleepMin) : '—', d.sleepScore ? `puntuación ${d.sleepScore}` : '')}
        ${tile('👟', 'Pasos', d.steps ? nf(d.steps) : '—', d.steps ? `${Math.round(d.steps / goals().steps * 100)}% de la meta` : '')}
        ${tile('❤️', 'Pulso reposo', d.hrRest ? `${d.hrRest} lpm` : '—', '')}
        ${tile('🧠', 'Estrés', d.stress ? d.stress : '—', d.stress ? (d.stress <= 29 ? 'relajado' : d.stress <= 59 ? 'normal' : d.stress <= 79 ? 'medio' : 'alto') : '')}
        ${d.weight ? tile('⚖️', 'Peso', `${String(d.weight).replace('.', ',')} kg`, '') : ''}
        ${d.moveKcal ? tile('🔥', 'Movimiento', `${nf(d.moveKcal)} kcal`, 'calorías activas') : ''}
        ${d.exMin ? tile('🏃', 'Ejercicio', `${d.exMin} min`, '') : ''}
        ${d.standH ? tile('🧍', 'De pie', `${d.standH} h`, '') : ''}
        ${d.spo2 ? tile('🫁', 'Oxígeno (SpO₂)', `${d.spo2}%`, '') : ''}
        ${d.hr ? tile('💓', 'Pulso (última medición)', `${d.hr} lpm`, '') : ''}
      </div>
      <div class="hbtns"><label class="btn primary">📷 Subir captura de Huawei Health<input type="file" id="hQuick" accept="image/*" multiple hidden></label></div>
      <p id="hQuickMsg" class="muted center" aria-live="polite">Se lee y se guarda sola. Puedes subir varias capturas a la vez.</p>
      <p class="center"><button class="link" data-h="add">✍️ Escribir o corregir a mano</button></p>`;
  }

  // ---------- Balance de la semana ----------
  function week_() {
    const rows = [];
    for (const m of METRICS) { const { cur, prev } = cmp(m), t = trend(m, cur, prev); rows.push({ name: `${m.icon} ${m.name}`, cur: cur == null ? '—' : m.show(cur), prev: prev == null ? '—' : m.show(prev), t, st: cur != null && m.status ? m.status(cur) : null }); }
    // Lo que ya registra el resto de la app
    const wk = (end) => days(7, end), sum = (f, end) => wk(end).reduce((a, d) => a + f(d), 0);
    const sess = (d) => (db.activity?.[d] || []).length, kc = (d) => (window.burnedOn ? window.burnedOn(d) : 0);
    const eatenAvg = (end) => { const v = wk(end).map((d) => db.meals.filter((m) => m.date === d).reduce((a, m) => a + m.calories, 0)).filter((x) => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const pairs = [
      ['🏋️ Entrenamientos', sum(sess, date), sum(sess, shift(date, -7)), 'up', (x) => String(x), (x) => `${Math.abs(x)}`],
      ['🔥 Calorías quemadas (activas)', sum(kc, date), sum(kc, shift(date, -7)), 'up', (x) => `${nf(x)} kcal`, (x) => `${nf(Math.abs(x))} kcal`],
      ['🍽️ Comida por día (promedio)', eatenAvg(date), eatenAvg(shift(date, -7)), 'none', (x) => `${nf(x)} kcal`, (x) => `${nf(Math.abs(x))} kcal`],
      ['🫁 Días con respiración', sum((d) => ((db.wellness?.[d] || {}).am || (db.wellness?.[d] || {}).pm ? 1 : 0), date), sum((d) => ((db.wellness?.[d] || {}).am || (db.wellness?.[d] || {}).pm ? 1 : 0), shift(date, -7)), 'up', (x) => String(x), (x) => `${Math.abs(x)}`],
      ['📖 Páginas leídas', sum((d) => Number((db.reading?.log || {})[d]) || 0, date), sum((d) => Number((db.reading?.log || {})[d]) || 0, shift(date, -7)), 'up', (x) => nf(x), (x) => nf(Math.abs(x))],
    ];
    for (const [name, cur, prev, good, show, diff] of pairs) {
      const m = { good, diff }, t = cur == null || prev == null || (cur === 0 && prev === 0) ? { cls: 'none', txt: 'sin comparación' } : trend(m, cur, prev);
      rows.push({ name, cur: cur == null ? '—' : show(cur), prev: prev == null ? '—' : show(prev), t, st: null });
    }
    const dot = { ok: '🟢', mid: '🟡', bad: '🔴' };
    q('#hWeek').innerHTML = `<h2>📊 Balance de los últimos 7 días</h2><p class="muted">Hasta el ${nice(date)}, comparado con los 7 días anteriores.</p>` +
      rows.map((r) => `<div class="hrow"><div class="hn">${r.st ? dot[r.st] + ' ' : ''}${r.name}</div><div class="hv"><b>${r.cur}</b><small>antes: ${r.prev}</small></div><div class="ht ${r.t.cls}">${r.t.txt}</div></div>`).join('') +
      insights();
  }

  function insights() {
    const out = [], g = goals(), s = cmp(METRICS[0]), st = cmp(METRICS[1]), hr = cmp(METRICS[2]), sr = cmp(METRICS[3]);
    if (s.cur != null) out.push(s.cur >= g.sleep ? `😴 Estás durmiendo bien: ${hm(s.cur * 60)} de promedio.` : `😴 Duermes ${hm(s.cur * 60)} de promedio; tu meta es ${hm(g.sleep * 60)}. Dormir poco dificulta bajar de peso y recuperarte del entrenamiento.`);
    if (st.cur != null) out.push(st.cur >= g.steps ? `👟 Cumples tu meta de pasos con ${nf(st.cur)} al día.` : `👟 Caminas ${nf(st.cur)} pasos al día; te faltan ${nf(g.steps - st.cur)} para tu meta.`);
    if (hr.cur != null && hr.prev != null && hr.cur - hr.prev >= 3) out.push('❤️ Tu pulso en reposo subió unos latidos esta semana. Puede deberse a cansancio, poco sueño o estrés; si sigue subiendo, descansa más.');
    if (sr.cur != null && sr.cur > 59) out.push('🧠 Tu estrés promedio está alto. Prueba la respiración de la pestaña Bienestar.');
    return out.length ? `<div class="hinsights">${out.map((x) => `<p>${x}</p>`).join('')}<p class="muted">Son datos de tu reloj y sirven como guía, no como diagnóstico. Si algo te preocupa, consúltalo con un profesional de la salud.</p></div>` : '';
  }

  // ---------- Evolución ----------
  function bars(m, ds) {
    const vals = series(m, ds), W = 300, Ht = 70, bw = W / ds.length, goal = m.goal ? m.goal() : null;
    const max = Math.max(1, ...vals.filter((x) => x != null), goal || 0) * 1.12, y = (v) => Ht - (v / max) * Ht;
    const base = m.k === 'hrRest' || m.k === 'weight' ? Math.min(...vals.filter((x) => x != null), 1e9) * 0.9 : 0;
    const yy = (v) => (base ? Ht - ((v - base) / (max - base)) * Ht : y(v));
    let s = `<svg viewBox="0 0 ${W} ${Ht + 14}" class="hchart" role="img" aria-label="Evolución de ${m.name}">`;
    ds.forEach((d, i) => {
      const v = vals[i], x = i * bw + 2, w = bw - 4;
      s += v == null ? `<rect x="${x}" y="${Ht - 2}" width="${w}" height="2" class="hnone"/>` : `<rect x="${x}" y="${Math.max(0, yy(v))}" width="${w}" height="${Math.max(2, Ht - yy(v))}" rx="2" class="hbar${d === date ? ' sel' : ''}"><title>${nice(d)}: ${m.show(v)}</title></rect>`;
      s += `<text x="${x + w / 2}" y="${Ht + 11}" class="hlab">${new Date(d + 'T12:00').toLocaleDateString('es', { weekday: 'narrow' })}</text>`;
    });
    if (goal && !base) s += `<line x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" class="hgoal"/>`;
    return s + '</svg>';
  }
  function charts_() {
    const ds = days(14);
    q('#hCharts').innerHTML = METRICS.map((m) => {
      const { cur, prev } = cmp(m), t = trend(m, cur, prev), has = series(m, ds).some((x) => x != null);
      return `<div class="card hcard"><h2>${m.icon} ${m.name}</h2>` + (has
        ? `<p class="hsum"><b>${cur == null ? '—' : m.show(cur)}</b> <small>promedio 7 días${m.goalText ? ' · ' + m.goalText() : ''}</small></p><p class="ht ${t.cls}">${t.txt}</p>${bars(m, ds)}`
        : '<p class="muted">Aún no hay datos. Carga tus capturas de Huawei Health o anótalos a mano.</p>') + '</div>';
    }).join('');
  }

  function load() { today_(); week_(); charts_(); }

  // ---------- Cargar datos (a mano o desde capturas) ----------
  const FIELDS = { hSleepH: null, hSleepM: null, hScore: 'sleepScore', hDeep: 'deepMin', hRem: 'remMin', hRest: 'hrRest', hStress: 'stress', hSteps: 'steps', hWeight: 'weight' };
  let entryDate = null;
  function open() {
    const d = H()[date] || {}; entryDate = null;
    q('#hSleepH').value = d.sleepMin ? Math.floor(d.sleepMin / 60) : ''; q('#hSleepM').value = d.sleepMin ? d.sleepMin % 60 : '';
    q('#hScore').value = d.sleepScore || ''; q('#hDeep').value = d.deepMin || ''; q('#hRem').value = d.remMin || ''; q('#hRest').value = d.hrRest || '';
    q('#hStress').value = d.stress || ''; q('#hSteps').value = d.steps || ''; q('#hWeight').value = d.weight || '';
    q('#hDay').textContent = nice(date); q('#hPhotoMsg').textContent = ''; q('#hDlg').showModal();
  }
  const HUAWEI_PROMPT = () => `Eres un asistente que lee capturas de la app Huawei Health (Salud de Huawei) y de otras apps de relojes inteligentes. Hoy es ${today()}.
Mira la imagen y extrae SOLO los datos de salud que se vean claramente. Responde SOLO con JSON válido y sin texto adicional:
{"date": "AAAA-MM-DD o null", "sleep_minutes": entero o null, "sleep_score": entero o null, "deep_minutes": entero o null, "rem_minutes": entero o null, "hr_rest": entero o null, "stress": entero o null, "steps": entero o null, "weight_kg": número o null, "error": null}
Reglas:
- "sleep_minutes" es el tiempo total dormido, en minutos (por ejemplo 7 h 12 min son 432). "sleep_score" es la puntuación de sueño (0 a 100).
- "deep_minutes" sueño profundo y "rem_minutes" sueño REM, en minutos.
- "hr_rest" es el pulso en reposo en latidos por minuto (lpm). No uses el pulso máximo ni el instantáneo.
- "stress" es el nivel de estrés promedio (1 a 99).
- "steps" son los pasos del día.
- Si la fecha se ve (por ejemplo "12 de octubre"), úsala con el año de hoy; si no, null. Lo que no se vea es null. No inventes números.
- Si la imagen no tiene datos de salud, responde {"date": null, "error": "No veo datos de salud en la imagen"} con los demás campos en null.`;
    const say = (t) => { q('#hPhotoMsg').textContent = t; };

  function fill(info) {
    const got = [];
    const set = (id, v, label) => { if (v != null && Number.isFinite(Number(v)) && Number(v) > 0) { q('#' + id).value = Math.round(Number(v) * 10) / 10; got.push(label); } };
    if (info.sleep_minutes > 0) { q('#hSleepH').value = Math.floor(info.sleep_minutes / 60); q('#hSleepM').value = Math.round(info.sleep_minutes % 60); got.push(`sueño ${hm(info.sleep_minutes)}`); }
    set('hScore', info.sleep_score, `puntuación de sueño ${info.sleep_score}`); set('hDeep', info.deep_minutes, 'sueño profundo'); set('hRem', info.rem_minutes, 'sueño REM');
    set('hRest', info.hr_rest, `pulso en reposo ${info.hr_rest} lpm`); set('hStress', info.stress, `estrés ${info.stress}`); set('hSteps', info.steps, `${nf(info.steps || 0)} pasos`); set('hWeight', info.weight_kg, `peso ${info.weight_kg} kg`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(info.date || '') && info.date <= fmtD(new Date(Date.now() + 864e5)) && info.date !== date) entryDate = info.date;
    return got;
  }
  async function readPhotos(files) {
    if (!db.settings.apiKey) { say('⚠️ Para leer las capturas pon tu clave de Gemini en ⚙️ Ajustes.'); return; }
    const all = [];
    for (let i = 0; i < files.length; i++) {
      say(`📷 Leyendo la captura ${i + 1} de ${files.length}…`);
      try {
        let full, mime = 'image/jpeg';
        try { full = (await resizeImage(files[i], 1600)).split(',')[1]; } catch { const raw = await readRaw(files[i]); full = raw.data; mime = raw.mime; }
        const info = await analyze(full, '', (t) => say(t), mime, HUAWEI_PROMPT());
        const got = fill(info);
        if (!got.length) { say(`⚠️ ${info.error || 'No encontré datos de salud en la captura ' + (i + 1) + '.'}`); if (files.length === 1) return; } else all.push(...got);
      } catch (err) { say('⚠️ ' + errMsg(err)); return; }
    }
    if (all.length) say(`✅ Leí: ${all.join(', ')}.${entryDate ? ' La captura es del ' + nice(entryDate) + ' y se guardará en esa fecha.' : ''} Revisa y pulsa Guardar.`);
  }
  function save_(ev) {
    if (ev.submitter?.value !== 'ok') return;
    const d = entryDate || date, h = pos(q('#hSleepH').value) || 0, m = pos(q('#hSleepM').value) || 0, rec = { ...(H()[d] || {}) };
    if (h || m) rec.sleepMin = Math.round(h * 60 + m); else delete rec.sleepMin;
    for (const [id, key] of Object.entries(FIELDS)) { if (!key) continue; const v = pos(q('#' + id).value); if (v != null) rec[key] = v; else delete rec[key]; }
    if (Object.keys(rec).length) H()[d] = rec; else delete H()[d];
    save(); if (d !== date) { date = d; q('#date').value = d; }
    load(); if (window.loadMeals) loadMeals();
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t || !q('#tab-salud') || q('#tab-salud').hidden) return;
    if (t.dataset.h === 'add') open();
    else if (t.id === 'hGoals') { q('#hgSleep').value = goals().sleep; q('#hgSteps').value = goals().steps; q('#hgDlg').showModal(); }
  });
  q('#hPhoto').addEventListener('change', (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) readPhotos(fs); });
  q('#hForm').addEventListener('submit', save_);
  q('#hgForm').addEventListener('submit', (ev) => {
    if (ev.submitter?.value !== 'ok') return;
    const s = Number(String(q('#hgSleep').value).replace(',', '.')), st = Number(q('#hgSteps').value);
    if (s >= 3 && s <= 14) db.settings.sleepGoal = s; if (st >= 1000 && st <= 50000) db.settings.stepsGoal = Math.round(st);
    save(); load();
  });

  // ---- Subir captura y guardar al instante (con "Deshacer") ----
  const SK = { sleep_minutes: 'sleepMin', sleep_score: 'sleepScore', deep_minutes: 'deepMin', rem_minutes: 'remMin', hr_rest: 'hrRest', hr_last: 'hr', stress: 'stress', spo2: 'spo2', steps: 'steps', weight_kg: 'weight', move_kcal: 'moveKcal', exercise_minutes: 'exMin', stand_hours: 'standH' };
  const SL = { sleepMin: 'sueño', sleepScore: 'puntuación de sueño', deepMin: 'sueño profundo', remMin: 'sueño REM', hrRest: 'pulso en reposo', hr: 'pulso', stress: 'estrés', spo2: 'oxígeno', steps: 'pasos', weight: 'peso', moveKcal: 'movimiento', exMin: 'ejercicio', standH: 'horas de pie' };
  const HEALTH_PROMPT2 = () => `Eres un asistente que lee capturas de la app Huawei Health (Salud de Huawei). Hoy es ${today()}.
Extrae SOLO los datos que se vean claramente. Responde SOLO con JSON válido y sin texto adicional:
{"metrics": {"sleep_minutes": {"v": entero o null, "d": fecha}, "sleep_score": {...}, "deep_minutes": {...}, "rem_minutes": {...}, "hr_rest": {...}, "hr_last": {...}, "stress": {...}, "spo2": {...}, "steps": {...}, "weight_kg": {...}, "move_kcal": {...}, "exercise_minutes": {...}, "stand_hours": {...}}, "steps_goal": entero o null, "error": null}
Cada métrica tiene "v" (el número) y "d" (la fecha a la que pertenece). Reglas:
- "d": "AAAA-MM-DD" si la tarjeta muestra una fecha (por ejemplo 14/10; usa el año de hoy); "hoy" si dice "de hoy" o es el dato del día actual; null si no se sabe.
- sleep_minutes: tiempo total dormido en minutos (6 h 53 min = 413). sleep_score: puntuación 0 a 100 si se ve.
- hr_rest: SOLO si dice pulso o frecuencia cardíaca EN REPOSO. hr_last: la frecuencia cardíaca que muestra la tarjeta "Corazón" (lpm o p. p. m.) cuando no dice reposo.
- stress: nivel de estrés (1 a 99). spo2: oxígeno en sangre (%). weight_kg: peso en kg (96.4 es 96.4).
- steps: pasos del día (11,811 es 11811). steps_goal: la meta de pasos si se ve (15,000 es 15000).
- move_kcal: "Movimiento" en kcal (calorías activas del día). exercise_minutes: minutos de "Ejercicio". stand_hours: horas de "Estar de pie".
- Lo que no se vea es {"v": null, "d": null}. No inventes números. Si no es Huawei Health ni una pantalla de salud, responde {"metrics": {}, "error": "No veo datos de salud en la imagen"}.`;

  async function quickImport(files) {
    const msg = q('#hQuickMsg'); if (!msg) return;
    if (!db.settings.apiKey) { msg.textContent = '⚠️ Para leer capturas pon tu clave de Gemini en ⚙️ Ajustes.'; return; }
    const changes = []; let goal = null, lastErr = '';
    for (let i = 0; i < files.length; i++) {
      msg.textContent = `📷 Leyendo la captura ${i + 1} de ${files.length}…`;
      try {
        let full, mime = 'image/jpeg';
        try { full = (await resizeImage(files[i], 1600)).split(',')[1]; } catch { const raw = await readRaw(files[i]); full = raw.data; mime = raw.mime; }
        const info = await analyze(full, '', (t) => { msg.textContent = t; }, mime, HEALTH_PROMPT2());
        const m = info.metrics || {}; let n = 0;
        for (const [k, key] of Object.entries(SK)) {
          const x = m[k]; if (!x || x.v == null) continue; const v = Number(String(x.v).replace(',', '.')); if (!Number.isFinite(v) || v <= 0) continue;
          let d = x.d === 'hoy' ? today() : /^\d{4}-\d{2}-\d{2}$/.test(x.d || '') && x.d <= fmtD(new Date(Date.now() + 864e5)) ? x.d : date;
          changes.push({ d, key, v: Math.round(v * 10) / 10 }); n++;
        }
        if (Number(info.steps_goal) >= 1000) goal = Math.round(Number(info.steps_goal));
        if (!n) lastErr = info.error || 'No encontré datos de salud en la captura ' + (i + 1) + '.';
      } catch (err) { lastErr = errMsg(err); break; }
    }
    if (!changes.length) { msg.textContent = '⚠️ ' + (lastErr || 'No pude leer datos en esa captura.'); return; }
    const prev = [], seen = {};
    for (const c of changes) { const old = (H()[c.d] || {})[c.key]; prev.push({ ...c, old }); (H()[c.d] = H()[c.d] || {})[c.key] = c.v; seen[c.key] = c; }
    let goalSet = false; if (goal && !db.settings.stepsGoal) { db.settings.stepsGoal = goal; goalSet = true; }
    save(); load();
    const names = Object.values(seen).map((c) => `${SL[c.key]} ${c.key === 'sleepMin' ? hm(c.v) : String(c.v).replace('.', ',')}${c.d !== date ? ' (' + nice(c.d) + ')' : ''}`);
    const box = q('#hQuickMsg'); box.innerHTML = `✅ Guardé: ${names.join(', ')}.${goalSet ? ` Usé tu meta de ${nf(goal)} pasos.` : ''} <button class="link" id="hUndo">Deshacer</button>${lastErr ? `<br>⚠️ ${lastErr}` : ''}`;
    q('#hUndo').onclick = () => { for (const p of prev.reverse()) { const r = H()[p.d] || {}; if (p.old == null) delete r[p.key]; else r[p.key] = p.old; if (!Object.keys(r).length) delete H()[p.d]; } if (goalSet) delete db.settings.stepsGoal; save(); load(); q('#hQuickMsg').textContent = '↩️ Deshice los cambios de esa captura.'; };
  }
  document.addEventListener('change', (e) => { if (e.target.id === 'hQuick') { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) quickImport(fs); } });

  window.loadSalud = load;
})();
