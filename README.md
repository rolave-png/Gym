# 🏋️ Gym Tracker

App web (móvil primero) para:
- **Rutina semanal**: define ejercicios por día y márcalos al hacerlos.
- **Calorías por foto**: sube una foto de tu comida y se estiman calorías y macros con Claude (visión). Puedes corregir el valor tocando las kcal, o añadir comidas a mano.
- **Progreso**: gráfica de calorías de los últimos días frente a tu objetivo.

## Uso
```bash
npm install
cp .env.example .env   # y pon tu ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```
Los datos se guardan en `data/` (JSON + fotos). Para usarla desde el móvil, abre la IP de tu ordenador en la misma red (`http://IP:3000`) o despliégala en un servidor.

> Las calorías son estimaciones a partir de la foto; ajústalas si hace falta.
