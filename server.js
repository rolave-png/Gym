const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carga simple de .env (sin dependencias)
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(UPLOADS, { recursive: true });

const DEFAULT_DB = {
  settings: { goalCalories: 2200 },
  routine: { // 0 = domingo ... 6 = sábado
    1: { name: 'Pecho y tríceps', exercises: [] },
    2: { name: 'Espalda y bíceps', exercises: [] },
    3: { name: 'Descanso', exercises: [] },
    4: { name: 'Pierna', exercises: [] },
    5: { name: 'Hombro y core', exercises: [] },
    6: { name: 'Descanso', exercises: [] },
    0: { name: 'Descanso', exercises: [] },
  },
  workouts: {}, // fecha -> { [exerciseId]: true }
  meals: [],
};

function loadDb() {
  try { return { ...DEFAULT_DB, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; }
  catch { return structuredClone(DEFAULT_DB); }
}
let db = loadDb();
function save() {
  fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db, null, 2));
  fs.renameSync(DB_FILE + '.tmp', DB_FILE);
}
const uid = () => crypto.randomBytes(6).toString('hex');
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS));

app.get('/api/state', (req, res) => {
  res.json({ settings: db.settings, routine: db.routine, aiEnabled: !!process.env.ANTHROPIC_API_KEY });
});

app.put('/api/settings', (req, res) => {
  const g = Number(req.body.goalCalories);
  if (!(g > 0 && g < 10000)) return res.status(400).json({ error: 'Objetivo inválido' });
  db.settings.goalCalories = Math.round(g);
  save();
  res.json(db.settings);
});

// ---- Rutina ----
app.put('/api/routine/:day', (req, res) => {
  const day = Number(req.params.day);
  if (!(day >= 0 && day <= 6)) return res.status(400).json({ error: 'Día inválido' });
  const { name, exercises } = req.body;
  if (typeof name !== 'string' || !Array.isArray(exercises)) return res.status(400).json({ error: 'Datos inválidos' });
  db.routine[day] = {
    name: name.slice(0, 60),
    exercises: exercises.slice(0, 50).map((e) => ({
      id: String(e.id || uid()),
      name: String(e.name || '').slice(0, 80),
      sets: Number(e.sets) || 0,
      reps: String(e.reps || '').slice(0, 20),
      weight: String(e.weight || '').slice(0, 20),
    })).filter((e) => e.name),
  };
  save();
  res.json(db.routine[day]);
});

app.get('/api/workouts/:date', (req, res) => {
  res.json(db.workouts[req.params.date] || {});
});

app.put('/api/workouts/:date/:exId', (req, res) => {
  const { date, exId } = req.params;
  if (!isDate(date)) return res.status(400).json({ error: 'Fecha inválida' });
  db.workouts[date] = db.workouts[date] || {};
  if (req.body.done) db.workouts[date][exId] = true; else delete db.workouts[date][exId];
  save();
  res.json(db.workouts[date]);
});

// ---- Comidas ----
app.get('/api/meals', (req, res) => {
  const { date } = req.query;
  res.json(db.meals.filter((m) => m.date === date));
});

app.get('/api/history', (req, res) => {
  const days = {};
  for (const m of db.meals) days[m.date] = (days[m.date] || 0) + m.calories;
  const out = Object.entries(days).sort().slice(-14).map(([date, calories]) => ({ date, calories }));
  res.json(out);
});

const PROMPT = `Eres un nutricionista. Analiza la foto de comida y estima su contenido nutricional para la porción que se ve.
Responde SOLO con JSON válido, sin texto adicional, con este formato:
{"name": "nombre breve del plato en español", "calories": número, "protein": gramos, "carbs": gramos, "fat": gramos, "items": [{"name": "alimento", "calories": número}], "notes": "supuestos sobre la porción, máx. 1 frase"}
Si no hay comida en la imagen, responde {"error": "No veo comida en la foto"}.`;

async function analyze(image, mediaType, note) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
          { type: 'text', text: PROMPT + (note ? `\nNota del usuario: ${note}` : '') },
        ],
      }],
    }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = j.content.map((c) => c.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Respuesta no interpretable');
  return JSON.parse(m[0]);
}

app.post('/api/meals', async (req, res) => {
  try {
    const { date, image, mediaType, note, manual } = req.body;
    if (!isDate(date)) return res.status(400).json({ error: 'Fecha inválida' });
    let info;
    let photo = null;

    if (image) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
        return res.status(400).json({ error: 'Formato de imagen no soportado' });
      }
      const ext = mediaType.split('/')[1].replace('jpeg', 'jpg');
      photo = `${uid()}.${ext}`;
    }

    if (manual) {
      info = manual;
    } else {
      if (!image) return res.status(400).json({ error: 'Falta la imagen' });
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: 'Falta ANTHROPIC_API_KEY en el servidor. Puedes añadir la comida a mano.' });
      }
      info = await analyze(image, mediaType, note);
      if (info.error) return res.status(422).json({ error: info.error });
    }
    if (photo) fs.writeFileSync(path.join(UPLOADS, photo), Buffer.from(image, 'base64'));

    const n = (v) => Math.max(0, Math.round(Number(v) || 0));
    const meal = {
      id: uid(), date, photo,
      time: new Date().toTimeString().slice(0, 5),
      name: String(info.name || 'Comida').slice(0, 80),
      calories: n(info.calories), protein: n(info.protein), carbs: n(info.carbs), fat: n(info.fat),
      items: Array.isArray(info.items) ? info.items.slice(0, 15).map((i) => ({ name: String(i.name), calories: n(i.calories) })) : [],
      notes: String(info.notes || '').slice(0, 200),
    };
    db.meals.push(meal);
    save();
    res.json(meal);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/meals/:id', (req, res) => {
  const m = db.meals.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'No existe' });
  for (const k of ['calories', 'protein', 'carbs', 'fat']) if (k in req.body) m[k] = Math.max(0, Math.round(Number(req.body[k]) || 0));
  if (typeof req.body.name === 'string') m.name = req.body.name.slice(0, 80);
  save();
  res.json(m);
});

app.delete('/api/meals/:id', (req, res) => {
  const i = db.meals.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'No existe' });
  const [m] = db.meals.splice(i, 1);
  if (m.photo) fs.rmSync(path.join(UPLOADS, m.photo), { force: true });
  save();
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Gym tracker en http://localhost:${PORT}`));
