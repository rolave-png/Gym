# 🏋️ Gym Tracker

App web (móvil primero) para:
- **Rutina semanal**: define ejercicios por día y márcalos al hacerlos.
- **Calorías por foto**: sube una foto de tu comida y se estiman calorías y macros con Google Gemini (plan gratuito). Sin clave también puedes buscar el alimento (Open Food Facts, gratis) e indicar los gramos. Puedes corregir cualquier valor tocando las kcal.
- **Progreso**: gráfica de calorías de los últimos días frente a tu objetivo.

## Uso
```bash
npm install
cp .env.example .env   # opcional: GEMINI_API_KEY gratis en https://aistudio.google.com/apikey
npm start              # http://localhost:3000
```
Los datos se guardan en `data/` (JSON + fotos). Para usarla desde el móvil, abre la IP de tu ordenador en la misma red (`http://IP:3000`) o despliégala en un servidor.

> Las calorías son estimaciones a partir de la foto; ajústalas si hace falta.
