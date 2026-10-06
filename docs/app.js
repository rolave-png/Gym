const $ = (s) => document.querySelector(s);
// ---- Almacenamiento local (todo se guarda en este dispositivo) ----
const KEY = 'gym-tracker-v1';
const DEFAULT_DB = {
  settings: { goalCalories: 2200, apiKey: '', model: '' },
  routine: { 1: { name: 'Pecho y tríceps', exercises: [] }, 2: { name: 'Espalda y bíceps', exercises: [] }, 3: { name: 'Descanso', exercises: [] },
    4: { name: 'Pierna', exercises: [] }, 5: { name: 'Hombro y core', exercises: [] }, 6: { name: 'Descanso', exercises: [] }, 0: { name: 'Descanso', exercises: [] } },
  workouts: {}, meals: [],
};
let db;
try { const s = JSON.parse(localStorage.getItem(KEY)); db = s ? { ...structuredClone(DEFAULT_DB), ...s, settings: { ...DEFAULT_DB.settings, ...s.settings } } : structuredClone(DEFAULT_DB); }
catch { db = structuredClone(DEFAULT_DB); }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { alert('No hay espacio para guardar. Exporta tus datos y borra comidas antiguas.'); }
}
if (db.settings.model === 'gemini-2.5-flash') db.settings.model = '';
const uid = () => Math.random().toString(36).slice(2, 10);
const n0 = (v) => Math.max(0, Math.round(Number(v) || 0));

const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let date = today(), selDay = new Date().getDay();
$('#date').value = date;
$('#date').onchange = (e) => { date = e.target.value || today(); selDay = new Date(date + 'T12:00').getDay(); refresh(); };

// ---- Tabs ----
document.querySelectorAll('nav button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('active', x === b));
  for (const t of ['hoy', 'rutina', 'progreso']) $('#tab-' + t).hidden = t !== b.dataset.tab;
  refresh();
});

// ---- Comidas ----
async function loadMeals() {
  const meals = db.meals.filter((m) => m.date === date);
  const sum = (k) => meals.reduce((a, m) => a + m[k], 0);
  const total = sum('calories'), goal = db.settings.goalCalories;
  $('#total').textContent = total; $('#goal').textContent = goal;
  $('#mp').textContent = sum('protein'); $('#mc').textContent = sum('carbs'); $('#mf').textContent = sum('fat');
  $('#arc').style.strokeDashoffset = 326.7 * (1 - Math.min(total / goal, 1));
  $('#arc').style.stroke = total > goal ? '#f97316' : '';
  $('#meals').innerHTML = meals.map((m) => `
    <div class="card meal">
      ${m.photo ? `<img src="${m.photo}" alt="">` : '<div class="ph">🍴</div>'}
      <div class="info"><b>${esc(m.name)}</b><small>${m.time} · P ${m.protein}g · C ${m.carbs}g · G ${m.fat}g</small>
        ${m.items.length || m.notes ? `<details><summary>Detalle</summary><small>${m.items.map((i) => `${esc(i.name)} (${i.calories})`).join(', ')}${m.notes ? '<br>' + esc(m.notes) : ''}</small></details>` : ''}</div>
      <div class="kcal" data-id="${m.id}" title="Toca para corregir">${m.calories} kcal</div>
      <button class="x" data-del="${m.id}">✕</button>
    </div>`).join('') || '<p class="muted center">Aún no has registrado comidas hoy.</p>';
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (confirm('¿Borrar esta comida?')) { db.meals = db.meals.filter((m) => m.id !== b.dataset.del); save(); loadMeals(); }
  });
  document.querySelectorAll('.kcal').forEach((k) => k.onclick = async () => {
    const v = prompt('Calorías correctas:', parseInt(k.textContent));
    if (v && +v >= 0) { db.meals.find((m) => m.id === k.dataset.id).calories = n0(v); save(); loadMeals(); }
  });
}

function resizeImage(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const PROMPT = `Eres un nutricionista. Analiza la foto de comida y estima su contenido nutricional para la porción que se ve.
Responde SOLO con JSON válido, sin texto adicional, con este formato:
{"name": "nombre breve del plato en español", "calories": número, "protein": gramos, "carbs": gramos, "fat": gramos, "items": [{"name": "alimento", "calories": número}], "notes": "supuestos sobre la porción, máx. 1 frase"}
Si no hay comida en la imagen, responde {"error": "No veo comida en la foto"}.`;

const GEM = 'https://generativelanguage.googleapis.com/v1beta/';

// Elige un modelo "flash" disponible para esta clave (los nombres cambian con el tiempo)
async function listModels() {
  const r = await fetch(GEM + 'models?pageSize=200', { headers: { 'x-goog-api-key': db.settings.apiKey } });
  if (!r.ok) throw new Error(`No se pudo listar modelos (${r.status}). Revisa la clave en Ajustes.`);
  const list = (await r.json()).models || [];
  const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1]) || 0;
  const ok = list
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
    .filter((n) => /^gemini-[\d.]+-flash/.test(n) && !/(lite|image|tts|live|audio|thinking|embedding|exp|robotics|computer|learnlm)/.test(n));
  if (!ok.length) throw new Error('Tu clave no tiene modelos Gemini Flash disponibles.');
  ok.sort((a, b) => ver(b) - ver(a) || (/preview/.test(a) - /preview/.test(b)) || a.length - b.length);
  return ok;
}
const detectModel = async () => (await listModels())[0];

async function callGemini(model, base64, note) {
  return fetch(`${GEM}models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': db.settings.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: base64 } }, { text: PROMPT + (note ? `\nNota del usuario: ${note}` : '') }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (s) => s === 429 || s === 500 || s === 503;

async function analyze(base64, note, onStatus = () => {}) {
  let candidates = db.settings.model ? [db.settings.model] : [];
  let r, tried = 0, listed = false;
  for (let i = 0; i < 5; i++) {
    if (i >= candidates.length) { // sin candidatos pendientes: pedir la lista a Google
      if (listed) break;
      const all = await listModels(); listed = true;
      candidates = [...candidates, ...all.filter((m) => !candidates.includes(m))].slice(0, 4);
      if (i >= candidates.length) break;
    }
    const model = candidates[i];
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await callGemini(model, base64, note);
      if (!busy(r.status)) break;
      if (attempt < 2) { onStatus(`⏳ Gemini está saturado, reintentando (${attempt + 1}/2)…`); await sleep(2500 * (attempt + 1)); }
    }
    if (r.ok) { if (db.settings.model !== model) { db.settings.model = model; save(); } break; }
    if (!(busy(r.status) || r.status === 404)) break; // errores de clave u otros: no seguir probando
    onStatus('🔄 Probando otro modelo…');
  }
  if (!r.ok) {
    const t = await r.text();
    if (busy(r.status)) throw new Error('Gemini está saturado ahora mismo. Inténtalo de nuevo en unos minutos o usa «Buscar alimento».');
    throw new Error(`Gemini ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  const text = (j.candidates?.[0]?.content?.parts || []).map((c) => c.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Respuesta no interpretable');
  return JSON.parse(m[0]);
}

function addMeal(date, info, photo = null) {
  const meal = {
    id: uid(), date, photo, time: new Date().toTimeString().slice(0, 5),
    name: String(info.name || 'Comida').slice(0, 80),
    calories: n0(info.calories), protein: n0(info.protein), carbs: n0(info.carbs), fat: n0(info.fat),
    items: Array.isArray(info.items) ? info.items.slice(0, 15).map((i) => ({ name: String(i.name), calories: n0(i.calories) })) : [],
    notes: String(info.notes || '').slice(0, 200),
  };
  db.meals.push(meal); save();
  return meal;
}

$('#photo').onchange = async (e) => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  if (!db.settings.apiKey) { $('#status').textContent = '⚠️ Pon tu clave de Gemini en ⚙️ Ajustes (o usa «Buscar alimento»).'; return; }
  $('#status').textContent = '🔍 Analizando la foto…';
  try {
    const full = (await resizeImage(file)).split(',')[1];
    const thumb = await resizeImage(file, 240);
    const info = await analyze(full, $('#note').value, (t) => { $('#status').textContent = t; });
    if (info.error) throw new Error(info.error);
    const meal = addMeal(date, info, thumb);
    $('#note').value = '';
    $('#status').textContent = `✅ ${meal.name}: ${meal.calories} kcal`;
    loadMeals();
  } catch (err) { $('#status').textContent = '⚠️ ' + err.message; }
};

// ---- Buscar alimento (gratis, Open Food Facts) ----
async function searchFoods(q) {
  const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=15'
    + '&fields=product_name,brands,nutriments&search_terms=' + encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) throw new Error('Open Food Facts ' + r.status);
  const j = await r.json();
  return (j.products || []).filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null).slice(0, 10).map((p) => ({
    name: p.brands ? `${p.product_name} (${p.brands.split(',')[0]})` : p.product_name,
    kcal100: Math.round(p.nutriments['energy-kcal_100g']),
    protein100: +(p.nutriments.proteins_100g || 0), carbs100: +(p.nutriments.carbohydrates_100g || 0), fat100: +(p.nutriments.fat_100g || 0),
  }));
}
let picked = null, timer;
const updKcal = () => { $('#pickKcal').textContent = picked ? Math.round(picked.kcal100 * (+$('#grams').value || 0) / 100) : 0; };
$('#searchBtn').onclick = () => { picked = null; $('#pick').hidden = true; $('#results').innerHTML = ''; $('#q').value = ''; $('#dlg').showModal(); $('#q').focus(); };
$('#q').oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const q = $('#q').value.trim(); if (q.length < 2) return;
    $('#results').innerHTML = '<p class="muted">Buscando…</p>';
    try {
      const foods = await searchFoods(q);
      window._foods = foods;
      $('#results').innerHTML = foods.map((f, i) => `<button type="button" data-i="${i}">${esc(f.name)} <small>· ${f.kcal100} kcal/100g</small></button>`).join('') || '<p class="muted">Sin resultados.</p>';
      document.querySelectorAll('#results [data-i]').forEach((b) => b.onclick = () => {
        picked = window._foods[+b.dataset.i];
        $('#pickName').textContent = picked.name;
        $('#pickInfo').textContent = `${picked.kcal100} kcal · P ${picked.protein100}g · C ${picked.carbs100}g · G ${picked.fat100}g por 100 g`;
        $('#pick').hidden = false; updKcal(); $('#grams').focus();
      });
    } catch (err) { $('#results').innerHTML = `<p class="muted">⚠️ ${esc(err.message)}</p>`; }
  }, 400);
};
$('#grams').oninput = updKcal;
$('#foodForm').onsubmit = async (e) => {
  if (e.submitter?.id !== 'addFood' || !picked) return;
  const k = (+$('#grams').value || 0) / 100;
  addMeal(date, { name: `${picked.name} (${$('#grams').value} g)`, calories: picked.kcal100 * k,
    protein: picked.protein100 * k, carbs: picked.carbs100 * k, fat: picked.fat100 * k });
  loadMeals();
};
$('#freeBtn').onclick = async () => {
  $('#dlg').close();
  const name = prompt('¿Qué has comido?'); if (!name) return;
  const calories = prompt('Calorías aproximadas:'); if (calories === null) return;
  addMeal(date, { name, calories: +calories });
  loadMeals();
};

// ---- Ajustes, exportar / importar ----
$('#setBtn').onclick = () => {
  $('#setGoal').value = db.settings.goalCalories; $('#setKey').value = db.settings.apiKey; $('#setModel').value = db.settings.model;
  $('#setDlg').showModal();
};
$('#setForm').onsubmit = (e) => {
  if (e.submitter?.value !== 'ok') return;
  const g = +$('#setGoal').value;
  if (g > 0) db.settings.goalCalories = Math.round(g);
  db.settings.apiKey = $('#setKey').value.trim();
  db.settings.model = $('#setModel').value.trim();
  save(); refresh(); updateStatus();
};
$('#expBtn').onclick = () => {
  const copy = { ...db, settings: { ...db.settings, apiKey: '' } }; // la clave no se exporta
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(copy)], { type: 'application/json' }));
  a.download = `gym-tracker-${today()}.json`; a.click();
};
$('#impFile').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || !confirm('Esto reemplazará los datos actuales. ¿Continuar?')) return;
  try {
    const s = JSON.parse(await f.text());
    if (!s.routine || !Array.isArray(s.meals)) throw new Error();
    db = { ...structuredClone(DEFAULT_DB), ...s, settings: { ...DEFAULT_DB.settings, ...s.settings, apiKey: db.settings.apiKey } };
    save(); $('#setDlg').close(); refresh();
  } catch { alert('Archivo no válido'); }
};

// ---- Rutina ----
async function loadRoutine() {
  $('#days').innerHTML = DAYS.map((d, i) => `<button data-d="${i}" class="${i === selDay ? 'active' : ''}">${d}</button>`).join('');
  document.querySelectorAll('#days button').forEach((b) => b.onclick = () => { selDay = +b.dataset.d; loadRoutine(); });
  const day = db.routine[selDay] || { name: '', exercises: [] };
  const done = db.workouts[date] || {};
  const canCheck = selDay === new Date(date + 'T12:00').getDay();
  $('#dayName').value = day.name;
  $('#exercises').innerHTML = day.exercises.map((e, i) => `
    <div class="ex ${done[e.id] ? 'done' : ''}">
      ${canCheck ? `<input type="checkbox" data-ex="${e.id}" ${done[e.id] ? 'checked' : ''}>` : ''}
      <div class="t"><b>${esc(e.name)}</b><small>${e.sets || '-'} × ${esc(e.reps) || '-'} ${e.weight ? '· ' + esc(e.weight) + ' kg' : ''}</small></div>
      <button class="link" data-rm="${i}">✕</button>
    </div>`).join('') || '<p class="muted">Sin ejercicios. Añade el primero abajo.</p>';
  document.querySelectorAll('[data-ex]').forEach((c) => c.onchange = async () => {
    db.workouts[date] = db.workouts[date] || {};
    if (c.checked) db.workouts[date][c.dataset.ex] = true; else delete db.workouts[date][c.dataset.ex];
    save(); loadRoutine();
  });
  document.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { day.exercises.splice(+b.dataset.rm, 1); saveDay(day); });
}
function saveDay(day) {
  day.exercises = day.exercises.map((e) => ({ ...e, id: e.id || uid() })).filter((e) => e.name.trim());
  db.routine[selDay] = day; save(); loadRoutine();
}
$('#dayName').onchange = (e) => saveDay({ ...(db.routine[selDay] || { exercises: [] }), name: e.target.value });
$('#exForm').onsubmit = (e) => {
  e.preventDefault();
  const day = db.routine[selDay] || { name: '', exercises: [] };
  day.exercises.push({ name: $('#exName').value, sets: $('#exSets').value, reps: $('#exReps').value, weight: $('#exWeight').value });
  e.target.reset(); saveDay(day);
};

// ---- Progreso ----
function loadProgress() {
  const days = {};
  for (const m of db.meals) days[m.date] = (days[m.date] || 0) + m.calories;
  const h = Object.entries(days).sort().slice(-14).map(([date, calories]) => ({ date, calories }));
  const max = Math.max(db.settings.goalCalories, ...h.map((x) => x.calories), 1);
  $('#chart').innerHTML = h.length
    ? `<div class="bars">${h.map((x) => `<div class="${x.calories > db.settings.goalCalories ? 'over' : ''}" style="height:${x.calories / max * 100}%"><span>${x.calories}</span></div>`).join('')}</div>
       <div class="bars-labels">${h.map((x) => `<span>${x.date.slice(8)}/${x.date.slice(5, 7)}</span>`).join('')}</div>`
    : '<p class="muted">Todavía no hay datos.</p>';
}

async function refresh() {
  if (!$('#tab-hoy').hidden) loadMeals();
  if (!$('#tab-rutina').hidden) loadRoutine();
  if (!$('#tab-progreso').hidden) loadProgress();
}

function updateStatus() {
  $('#status').textContent = db.settings.apiKey ? '' : 'ℹ️ Añade tu clave gratuita de Gemini en ⚙️ Ajustes para analizar fotos. Sin ella, usa «Buscar alimento».';
}
updateStatus();
refresh();
