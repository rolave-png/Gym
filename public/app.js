const $ = (s) => document.querySelector(s);
const api = async (url, opts = {}) => {
  const r = await fetch(url, { headers: { 'content-type': 'application/json' }, ...opts, body: opts.body && JSON.stringify(opts.body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Error');
  return j;
};
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let state, date = today(), selDay = new Date().getDay();
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
  const meals = await api('/api/meals?date=' + date);
  const sum = (k) => meals.reduce((a, m) => a + m[k], 0);
  const total = sum('calories'), goal = state.settings.goalCalories;
  $('#total').textContent = total; $('#goal').textContent = goal;
  $('#mp').textContent = sum('protein'); $('#mc').textContent = sum('carbs'); $('#mf').textContent = sum('fat');
  $('#arc').style.strokeDashoffset = 326.7 * (1 - Math.min(total / goal, 1));
  $('#arc').style.stroke = total > goal ? '#f97316' : '';
  $('#meals').innerHTML = meals.map((m) => `
    <div class="card meal">
      ${m.photo ? `<img src="/uploads/${m.photo}" alt="">` : '<div class="ph">🍴</div>'}
      <div class="info"><b>${esc(m.name)}</b><small>${m.time} · P ${m.protein}g · C ${m.carbs}g · G ${m.fat}g</small>
        ${m.items.length || m.notes ? `<details><summary>Detalle</summary><small>${m.items.map((i) => `${esc(i.name)} (${i.calories})`).join(', ')}${m.notes ? '<br>' + esc(m.notes) : ''}</small></details>` : ''}</div>
      <div class="kcal" data-id="${m.id}" title="Toca para corregir">${m.calories} kcal</div>
      <button class="x" data-del="${m.id}">✕</button>
    </div>`).join('') || '<p class="muted center">Aún no has registrado comidas hoy.</p>';
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (confirm('¿Borrar esta comida?')) { await api('/api/meals/' + b.dataset.del, { method: 'DELETE' }); loadMeals(); }
  });
  document.querySelectorAll('.kcal').forEach((k) => k.onclick = async () => {
    const v = prompt('Calorías correctas:', parseInt(k.textContent));
    if (v && +v >= 0) { await api('/api/meals/' + k.dataset.id, { method: 'PUT', body: { calories: +v } }); loadMeals(); }
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
      resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

$('#photo').onchange = async (e) => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  $('#status').textContent = '🔍 Analizando la foto…';
  try {
    const image = await resizeImage(file);
    const meal = await api('/api/meals', { method: 'POST', body: { date, image, mediaType: 'image/jpeg', note: $('#note').value } });
    $('#note').value = '';
    $('#status').textContent = `✅ ${meal.name}: ${meal.calories} kcal`;
    loadMeals();
  } catch (err) { $('#status').textContent = '⚠️ ' + err.message; }
};

$('#manualBtn').onclick = async () => {
  const name = prompt('¿Qué has comido?'); if (!name) return;
  const calories = prompt('Calorías aproximadas:'); if (calories === null) return;
  await api('/api/meals', { method: 'POST', body: { date, manual: { name, calories: +calories } } });
  loadMeals();
};

$('#goalBtn').onclick = async () => {
  const v = prompt('Objetivo diario de calorías:', state.settings.goalCalories);
  if (v && +v > 0) { state.settings = await api('/api/settings', { method: 'PUT', body: { goalCalories: +v } }); loadMeals(); }
};

// ---- Rutina ----
async function loadRoutine() {
  $('#days').innerHTML = DAYS.map((d, i) => `<button data-d="${i}" class="${i === selDay ? 'active' : ''}">${d}</button>`).join('');
  document.querySelectorAll('#days button').forEach((b) => b.onclick = () => { selDay = +b.dataset.d; loadRoutine(); });
  const day = state.routine[selDay] || { name: '', exercises: [] };
  const done = selDay === new Date(date + 'T12:00').getDay() ? await api('/api/workouts/' + date) : {};
  const canCheck = selDay === new Date(date + 'T12:00').getDay();
  $('#dayName').value = day.name;
  $('#exercises').innerHTML = day.exercises.map((e, i) => `
    <div class="ex ${done[e.id] ? 'done' : ''}">
      ${canCheck ? `<input type="checkbox" data-ex="${e.id}" ${done[e.id] ? 'checked' : ''}>` : ''}
      <div class="t"><b>${esc(e.name)}</b><small>${e.sets || '-'} × ${esc(e.reps) || '-'} ${e.weight ? '· ' + esc(e.weight) + ' kg' : ''}</small></div>
      <button class="link" data-rm="${i}">✕</button>
    </div>`).join('') || '<p class="muted">Sin ejercicios. Añade el primero abajo.</p>';
  document.querySelectorAll('[data-ex]').forEach((c) => c.onchange = async () => {
    await api(`/api/workouts/${date}/${c.dataset.ex}`, { method: 'PUT', body: { done: c.checked } }); loadRoutine();
  });
  document.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { day.exercises.splice(+b.dataset.rm, 1); saveDay(day); });
}
async function saveDay(day) {
  state.routine[selDay] = await api('/api/routine/' + selDay, { method: 'PUT', body: day });
  loadRoutine();
}
$('#dayName').onchange = (e) => saveDay({ ...state.routine[selDay], name: e.target.value });
$('#exForm').onsubmit = (e) => {
  e.preventDefault();
  const day = state.routine[selDay] || { name: '', exercises: [] };
  day.exercises.push({ name: $('#exName').value, sets: $('#exSets').value, reps: $('#exReps').value, weight: $('#exWeight').value });
  e.target.reset(); saveDay(day);
};

// ---- Progreso ----
async function loadProgress() {
  const h = await api('/api/history');
  const max = Math.max(state.settings.goalCalories, ...h.map((x) => x.calories), 1);
  $('#chart').innerHTML = h.length
    ? `<div class="bars">${h.map((x) => `<div class="${x.calories > state.settings.goalCalories ? 'over' : ''}" style="height:${x.calories / max * 100}%"><span>${x.calories}</span></div>`).join('')}</div>
       <div class="bars-labels">${h.map((x) => `<span>${x.date.slice(8)}/${x.date.slice(5, 7)}</span>`).join('')}</div>`
    : '<p class="muted">Todavía no hay datos.</p>';
}

async function refresh() {
  if (!$('#tab-hoy').hidden) loadMeals();
  if (!$('#tab-rutina').hidden) loadRoutine();
  if (!$('#tab-progreso').hidden) loadProgress();
}

(async () => {
  state = await api('/api/state');
  if (!state.aiEnabled) $('#status').textContent = 'ℹ️ Sin ANTHROPIC_API_KEY: solo podrás añadir comidas a mano.';
  refresh();
})();
