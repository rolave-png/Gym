# 🏋️ Gym Tracker

App web (móvil primero, instalable) para:
- **Rutina semanal**: define ejercicios por día y márcalos al hacerlos.
- **Calorías por foto**: sube una foto de tu comida y Google Gemini estima calorías y macros.
- **Buscar alimento** (sin clave): busca en Open Food Facts e indica los gramos.
- **Progreso**: calorías de los últimos días frente a tu objetivo.

Es una app 100 % de navegador (carpeta `docs/`): no hay servidor. Tus datos y tu clave de Gemini se guardan **solo en tu dispositivo** (localStorage). Desde ⚙️ Ajustes puedes exportar/importar los datos (la clave no se exporta).

## Publicarla en GitHub Pages
1. En el repositorio: **Settings → Pages**.
2. *Source*: **Deploy from a branch**; elige la rama (por ejemplo `main`) y la carpeta **/docs**. Guarda.
3. En un minuto tendrás la dirección `https://TU_USUARIO.github.io/NOMBRE_REPO/`.
4. Ábrela en el móvil, entra en ⚙️ y pega tu clave gratuita de https://aistudio.google.com/apikey.
5. Opcional: menú del navegador → «Añadir a pantalla de inicio».

## Probar en local
```bash
cd docs && python3 -m http.server 8000   # http://localhost:8000
```

> Las calorías son estimaciones a partir de la foto; toca las kcal de una comida para corregirlas.
