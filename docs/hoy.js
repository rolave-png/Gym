// Vista "Hoy": registro por texto/voz, botones rápidos de 1 toque, barras de macros y simulador "¿Me cabe hoy?".
(function () {
  const q = (s) => document.querySelector(s);
  const goals = () => ({ p: db.settings.protGoal || 160, c: db.settings.carbGoal || 70, f: db.settings.fatGoal || 85 });
  const r1 = (v) => Math.round(v * 10) / 10;
  let lastData = { total: 0, goal: 2200, p: 0, c: 0, f: 0, n: 0 }, sim = null, simBase = null;

  // ---------- B) Botones rápidos ----------
  const QUICK = [
    { label: '☕ Café + Proteína', name: 'Café con 1 scoop de proteína', kcal: 122, p: 25, c: 2, f: 1.5 },
    { label: '🥚 +1 Huevo duro', name: '1 huevo duro', kcal: 70, p: 6, c: 0.5, f: 5 },
    { label: '🐟 Atún + Ensalada', name: 'Ensalada con 1 lata de atún', kcal: 155, p: 28, c: 3, f: 2 },
    { label: '🍗 Pollo/Carne + Ensalada', name: 'Pollo o carne con ensalada', kcal: 280, p: 40, c: 5, f: 11 },
    { label: '🥑 +1 Palta', name: '1 palta', kcal: 240, p: 3, c: 12, f: 21 },
    { label: '🍌 +1 Plátano', name: '1 plátano', kcal: 105, p: 1.3, c: 27, f: 0.4 },
  ];
  const addFood = (f, mult = 1) => addMeal(date, { name: mult === 1 ? f.name : `${f.name} (×${mult})`, calories: f.kcal * mult, protein: f.p * mult, carbs: f.c * mult, fat: f.f * mult });
  q('#chips').innerHTML = QUICK.map((f, i) => `<button type="button" class="chipq" data-q="${i}">${f.label} <span>+${f.kcal}</span></button>`).join('');
  q('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const m = addFood(QUICK[+b.dataset.q]); loadMeals();
    if (window.toastMsg) window.toastMsg(`✅ ${m.name}: +${m.calories} kcal`);
  });

  // ---------- A) Texto libre o dictado, sin foto ----------
  const PROMPT_DAY = `Eres un nutricionista deportivo experto en dietas altas en proteína y low-carb en Chile. La persona vive en Chile: entiende palta, presa de pollo, lata de atún, completo, porotos, etc.
Recibirás un texto con una o varias comidas del día (por ejemplo "café con proteína, 4 huevos duros, palta, presa de pollo, plátano").
Responde SOLO con JSON válido, sin bloques markdown y sin texto adicional, con esta estructura exacta:
{"items": [{"nombre": "nombre claro de la comida", "kcal": número, "proteina": gramos, "carbs": gramos, "grasa": gramos}]}
Si menciona varias comidas del día (mañana, almuerzo, cena, colación), sepáralas en objetos distintos dentro de "items". Si no indica cantidades, supón una ración normal para un adulto.`;
  let lastIds = [];
  async function analyzeText() {
    const text = q('#note').value.trim(), st = q('#status');
    if (!text) { st.textContent = '⚠️ Escribe o dicta lo que comiste.'; return; }
    if (!db.settings.apiKey) { st.textContent = '⚠️ Para analizar con IA pon tu clave de Gemini en ⚙️ Ajustes (o usa los botones rápidos).'; return; }
    q('#aiText').disabled = true; st.textContent = '⚡ Analizando tu texto…';
    try {
      const info = await analyze(null, text, (t) => { st.textContent = t; }, 'image/jpeg', PROMPT_DAY);
      const items = (Array.isArray(info.items) ? info.items : []).filter((i) => Number(i.kcal ?? i.calories) > 0);
      if (!items.length) throw new Error('No pude identificar comidas en ese texto. Cuéntame qué comiste con un poco más de detalle.');
      const added = items.map((i) => addMeal(date, { name: String(i.nombre || i.name || 'Comida').slice(0, 80), calories: i.kcal ?? i.calories, protein: i.proteina ?? i.protein, carbs: i.carbs, fat: i.grasa ?? i.fat }));
      lastIds = added.map((m) => m.id); q('#note').value = '';
      const kcal = added.reduce((a, m) => a + m.calories, 0);
      st.innerHTML = `✅ Agregué ${added.length} ${added.length === 1 ? 'comida' : 'comidas'} (${kcal} kcal). <button class="link" id="undoAI">Deshacer</button>`;
      q('#undoAI').onclick = () => { db.meals = db.meals.filter((m) => !lastIds.includes(m.id)); save(); st.textContent = '↩️ Quité las comidas que agregó la IA.'; loadMeals(); };
      loadMeals();
    } catch (err) { st.textContent = '⚠️ ' + errMsg(err); }
    q('#aiText').disabled = false;
  }
  q('#aiText').onclick = analyzeText;

  // Dictado de voz (si el navegador lo permite)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    q('#micBtn').hidden = false; let rec = null;
    q('#micBtn').onclick = () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'es-CL'; rec.interimResults = false; rec.continuous = false;
      q('#micBtn').textContent = '⏹'; q('#status').textContent = '🎤 Te escucho…';
      rec.onresult = (e) => { const t = [...e.results].map((r) => r[0].transcript).join(' '); q('#note').value = (q('#note').value ? q('#note').value + ' ' : '') + t; };
      rec.onerror = () => { q('#status').textContent = '⚠️ No pude usar el micrófono. Puedes dictar con el micrófono del teclado.'; };
      rec.onend = () => { rec = null; q('#micBtn').textContent = '🎤'; if (q('#note').value.trim() && q('#status').textContent.startsWith('🎤')) q('#status').textContent = 'Listo: revisa el texto y pulsa «Analizar texto con IA».'; };
      try { rec.start(); } catch { rec = null; q('#micBtn').textContent = '🎤'; }
    };
  }

  // ---------- C) Barras de macros, badge y simulador ----------
  function badge(c, n) {
    const b = q('#carbBadge'); b.hidden = !n && !sim;
    const k = c < 30 ? ['keto', '⚡ Rango Keto (<30 g)'] : c <= 75 ? ['low', '🔥 Low-Carb Óptimo (30-75 g)'] : ['mod', '⚖️ Carbs Moderados (>75 g)'];
    b.className = 'cbadge ' + k[0]; b.textContent = `${k[1]} · hoy llevas ${r1(c)} g${sim ? ' (con lo simulado)' : ''}`;
  }
  function renderMacros(d) {
    lastData = d; const g = goals(), s = sim || { kcal: 0, p: 0, c: 0, f: 0 };
    q('#mp').textContent = Math.round(d.p); q('#mc').textContent = Math.round(d.c); q('#mf').textContent = Math.round(d.f);
    q('#mpg').textContent = g.p; q('#mcg').textContent = g.c; q('#mfg').textContent = g.f;
    for (const [k, cur, add, goal] of [['p', d.p, s.p, g.p], ['c', d.c, s.c, g.c], ['f', d.f, s.f, g.f]]) {
      const w1 = Math.min(cur / goal, 1) * 100, w2 = Math.min((cur + add) / goal, 1) * 100 - w1;
      q('#m' + k + 'b').style.width = w1 + '%'; q('#m' + k + 'b').className = cur > goal ? 'over' : '';
      q('#m' + k + 'x').style.width = Math.max(0, w2) + '%'; q('#m' + k + 'x').style.left = w1 + '%'; q('#m' + k + 'x').className = 'ghost' + (cur + add > goal ? ' over' : '');
    }
    // anillo: el tramo ámbar es lo que sumaría lo simulado
    const f1 = Math.min(d.total / d.goal, 1), f2 = Math.min((d.total + s.kcal) / d.goal, 1), x = q('#arc2');
    if (x) { x.style.strokeDasharray = `${Math.max(0, f2 - f1) * 326.7} 326.7`; x.style.strokeDashoffset = -f1 * 326.7; }
    q('#ringPrev').textContent = sim ? `+${Math.round(s.kcal)} → ${Math.round(d.total + s.kcal)}` : '';
    badge(d.c + s.c, d.n);
  }
  window.renderMacros = renderMacros;

  function foodList(text) {
    const t = text.trim(), l = [];
    const mine = QUICK.map((f) => ({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f }));
    const norm = (s) => window.GUIA.norm(s);
    for (const f of mine) if (!t || norm(f.name).includes(norm(t))) l.push(f);
    if (t.length >= 2 && window.searchLocalFoods) for (const f of window.searchLocalFoods(t).slice(0, 8)) { const g = f.unit ? f.unit.g : 100, k = g / 100; l.push({ name: f.unit ? (f.name.split(' (')[0].toLowerCase().includes(f.unit.name.toLowerCase()) ? `1 ${f.name.split(' (')[0].toLowerCase()}` : `1 ${f.unit.name} de ${f.name.split(' (')[0].toLowerCase()}`) : `100 g de ${f.name.split(' (')[0].toLowerCase()}`, kcal: f.kcal100 * k, p: f.protein100 * k, c: f.carbs100 * k, f: f.fat100 * k }); }
    return l.slice(0, 10);
  }
  function showList() { const l = foodList(q('#simQ').value); q('#simList').innerHTML = l.map((f, i) => `<button type="button" data-s="${i}">${f.name} <small>· ${Math.round(f.kcal)} kcal</small></button>`).join('') || '<p class="muted">Sin resultados.</p>'; q('#simList')._l = l; }
  function simUpdate() {
    if (!simBase) return; const m = Number(q('#simX').value); q('#simXv').textContent = m + '×';
    sim = { kcal: simBase.kcal * m, p: simBase.p * m, c: simBase.c * m, f: simBase.f * m };
    const d = lastData, left = d.goal - d.total - sim.kcal;
    q('#simInfo').textContent = `+${Math.round(sim.kcal)} kcal · P ${r1(sim.p)} g · C ${r1(sim.c)} g · G ${r1(sim.f)} g. ${left >= 0 ? `Te quedarían ${Math.round(left)} kcal para hoy.` : `Te pasarías ${Math.round(-left)} kcal de tu meta.`}`;
    renderMacros(d);
  }
  function simClear() { sim = null; simBase = null; q('#simBox').hidden = true; renderMacros(lastData); }
  q('#simQ').addEventListener('input', showList);
  q('#sim').addEventListener('toggle', () => { if (q('#sim').open) { showList(); } else simClear(); });
  q('#simList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]'); if (!b) return; simBase = q('#simList')._l[+b.dataset.s];
    q('#simName').textContent = simBase.name; q('#simX').value = 1; q('#simBox').hidden = false; simUpdate();
  });
  q('#simX').addEventListener('input', simUpdate);
  q('#simCancel').onclick = () => { q('#sim').open = false; };
  q('#simOk').onclick = () => {
    if (!simBase) return; const m = Number(q('#simX').value);
    addFood({ name: simBase.name, kcal: simBase.kcal, p: simBase.p, c: simBase.c, f: simBase.f }, m); q('#sim').open = false; loadMeals();
    if (window.toastMsg) window.toastMsg(`✅ Sumado: ${Math.round(simBase.kcal * m)} kcal`);
  };
  loadMeals();
})();
