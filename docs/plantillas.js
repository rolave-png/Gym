// Catálogo de rutinas (gimnasio y casa). La persona elige cuál usar y en qué días.
(function () {
  const G = window.GUIA, q = (s) => document.querySelector(s);
  const DAYN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], ORDER = [1, 2, 3, 4, 5, 6, 0];
  const WARM_GYM = ['cal_cinta', 'circulos_brazos', 'sentadilla_aire', 'balanceo_piernas'];
  const WARM_HOME = ['marcha_sitio', 'circulos_brazos', 'balanceo_piernas'];
  const COOL = ['est_pecho', 'est_cuads', 'est_isquios', 'est_hombro', 'est_espalda'];
  const S = (name, main) => ({ name, main }); // main: ids o [id, series, reps]

  const TEMPLATES = [
    { id: 'gym3', where: 'gym', name: 'Cuerpo completo · 3 días', level: 'Principiante / intermedio', days: [1, 3, 5],
      desc: 'Trabajas todo el cuerpo tres veces por semana. Ideal si vas empezando o entrenas de forma intermitente.',
      sessions: [
        S('Día 1 · Cuerpo completo A', ['prensa', 'press_pecho_maq', 'remo_pecho', 'press_hombro_maq', 'curl_femoral', 'abdominal']),
        S('Día 2 · Cuerpo completo B', ['jalon', 'hip_thrust', 'press_inc_mancuernas', 'remo_mancuerna', 'ext_pierna', 'hiperext']),
        S('Día 3 · Cuerpo completo C', ['sentadilla_smith', 'pec_deck', 'remo_polea', 'laterales', 'abductor', 'curl_biceps', 'triceps_polea', 'abdominal'])] },
    { id: 'gym2', where: 'gym', name: 'Cuerpo completo · 2 días', level: 'Poco tiempo', days: [1, 4],
      desc: 'Dos sesiones completas a la semana. Para cuando tienes poco tiempo o estás retomando.',
      sessions: [
        S('Día 1 · Cuerpo completo A', ['prensa', 'press_pecho_maq', 'jalon', 'press_hombro_maq', 'hip_thrust', 'plancha']),
        S('Día 2 · Cuerpo completo B', ['sentadilla_smith', 'press_inc_mancuernas', 'remo_pecho', 'rdl', 'laterales', 'abdominal'])] },
    { id: 'gym4', where: 'gym', name: 'Torso / Pierna · 4 días', level: 'Intermedio', days: [1, 2, 4, 5],
      desc: 'Dos días de torso y dos de pierna. Más volumen por músculo, para cuando ya tienes el hábito.',
      sessions: [
        S('Torso A', ['press_pecho_maq', 'jalon', 'press_hombro_maq', 'remo_pecho', 'curl_biceps', 'triceps_polea']),
        S('Pierna A', ['prensa', 'curl_femoral', 'hip_thrust', 'ext_pierna', 'abductor', 'abdominal']),
        S('Torso B', ['press_inc_mancuernas', 'remo_polea', 'pec_deck', 'laterales', 'curl_biceps', 'triceps_polea']),
        S('Pierna B', ['sentadilla_smith', 'rdl', 'hip_thrust', 'curl_femoral', 'hiperext', 'plancha'])] },
    { id: 'gym3ppl', where: 'gym', name: 'Empuje / Tirón / Pierna · 3 días', level: 'Intermedio', days: [1, 3, 5],
      desc: 'Un día para empujar (pecho, hombro, tríceps), uno para tirar (espalda, bíceps) y uno de pierna.',
      sessions: [
        S('Empuje', ['press_pecho_maq', 'press_inc_mancuernas', 'press_hombro_maq', 'laterales', 'pec_deck', 'triceps_polea']),
        S('Tirón', ['jalon', 'remo_pecho', 'remo_polea', 'remo_mancuerna', 'curl_biceps', 'hiperext']),
        S('Pierna', ['prensa', 'sentadilla_smith', 'curl_femoral', 'ext_pierna', 'hip_thrust', 'abductor'])] },

    { id: 'home0', where: 'home', name: 'Casa sin equipo · 3 días', level: 'Principiante', days: [1, 3, 5],
      desc: 'Solo con tu peso corporal. No necesitas nada: ni mancuernas ni máquinas.',
      sessions: [
        S('Día 1 · Piernas y glúteos', [['sentadilla_aire', 3, '15'], 'zancadas', 'puente_suelo', 'elevacion_talones', 'plancha']),
        S('Día 2 · Torso y espalda', ['flexiones_inclinadas', 'flexiones_rodillas', 'superman', 'plancha', 'abdominal_suelo']),
        S('Día 3 · Cuerpo completo', [['sentadilla_aire', 3, '15'], 'flexiones_rodillas', 'zancadas', 'puente_suelo', 'superman', 'abdominal_suelo'])] },
    { id: 'home1', where: 'home', name: 'Casa con mancuernas · 3 días', level: 'Principiante / intermedio', days: [1, 3, 5],
      desc: 'Con un par de mancuernas y una silla o banco. Puedes hacer los presses en el suelo.',
      sessions: [
        S('Día 1 · Cuerpo completo A', ['sentadilla_goblet', 'rdl', 'press_mancuernas', 'remo_mancuerna', 'press_hombro_mancu', 'plancha']),
        S('Día 2 · Cuerpo completo B', ['zancadas', 'puente_suelo', 'flexiones_rodillas', 'remo_mancuerna', 'curl_biceps', 'abdominal_suelo']),
        S('Día 3 · Cuerpo completo C', ['sentadilla_goblet', 'puente_gluteo', 'press_mancuernas', 'laterales', 'curl_biceps', 'superman'])] },
    { id: 'home2', where: 'home', name: 'Cardio y core en casa · 3 días', level: 'Todos', days: [1, 3, 5],
      desc: 'Bicicleta estática más trabajo de abdomen y espalda. Suave con las articulaciones y fácil de mantener.',
      sessions: [
        S('Día 1 · Bici + core', ['bici', 'plancha', 'abdominal_suelo', 'superman']),
        S('Día 2 · Bici + piernas', ['bici', 'puente_suelo', 'elevacion_talones', 'plancha']),
        S('Día 3 · Bici + core', ['bici', 'abdominal_suelo', 'superman', 'plancha'])] },
    { id: 'home1b', where: 'home', name: 'Casa con mancuernas · nivel 2 · 4 días', level: 'Intermedio', days: [1, 2, 4, 5],
      desc: 'Para cuando la rutina de 3 días ya te resulta fácil. Dos días de piernas y dos de torso, con mancuernas.',
      sessions: [
        S('Piernas A', ['sentadilla_goblet', 'zancadas', 'rdl', 'puente_gluteo', 'elevacion_talones']),
        S('Torso A', ['press_mancuernas', 'remo_mancuerna', 'press_hombro_mancu', 'curl_biceps', 'plancha']),
        S('Piernas B', ['zancadas', 'sentadilla_goblet', 'puente_gluteo', 'rdl', 'abdominal_suelo']),
        S('Torso B', ['flexiones_rodillas', 'remo_mancuerna', 'laterales', 'press_mancuernas', 'curl_biceps', 'superman'])] },
    { id: 'home2b', where: 'home', name: 'Bici con intervalos y core · 3 días', level: 'Intermedio', days: [1, 3, 5],
      desc: 'El siguiente paso de la bici estática: intervalos para quemar más, más trabajo de abdomen y espalda.',
      sessions: [
        S('Día 1 · Intervalos + core', ['bici_intervalos', 'plancha', 'abdominal_suelo']),
        S('Día 2 · Bici suave + piernas', ['bici', 'puente_suelo', 'zancadas', 'elevacion_talones']),
        S('Día 3 · Intervalos + espalda', ['bici_intervalos', 'superman', 'plancha'])] },
  ];

  let filter = 'all', pick = null, chosen = [];

  const ex = (spec, sec, opt) => {
    const [id, sets, reps] = Array.isArray(spec) ? spec : [spec], l = G.EX[id];
    return { id: uid(), gid: id, name: l.name, sets: sets || l.sets, reps: reps || l.reps, weight: '', sec, opt: opt || undefined };
  };

  function build(t, days, o) {
    const gym = t.where === 'gym', warm = gym ? WARM_GYM : WARM_HOME, routine = {};
    for (let d = 0; d < 7; d++) routine[d] = { name: 'Descanso', exercises: [] };
    days.forEach((d, i) => {
      const s = t.sessions[i];
      routine[d] = { name: s.name, exercises: [
        ...(o.warm ? warm.map((x) => ex(x, 'warm')) : []),
        ...s.main.map((x) => ex(x, 'main')),
        ...(o.treadmill && gym ? [ex('trotadora', 'cardio', true)] : []),
        ...(o.cool ? COOL.map((x) => ex(x, 'cool')) : []),
      ] };
    });
    if (o.bike) { // 2 días de bici en los días libres, lo más separados posible de los de entrenamiento
      const free = ORDER.filter((d) => !days.includes(d));
      const dist = (d) => Math.min(...days.map((x) => Math.min(Math.abs(x - d), 7 - Math.abs(x - d))));
      free.sort((a, b) => dist(b) - dist(a));
      free.slice(0, 2).forEach((d) => { routine[d] = { name: 'Bicicleta estática (casa)', exercises: [ex('bici', 'main')] }; });
    }
    return routine;
  }

  const cardHTML = (t) => `<button class="tpl" data-tpl="${t.id}"><span class="tag">${t.where === 'gym' ? '🏋️ Gimnasio' : '🏠 Casa'} · ${t.days.length} días/sem</span><b>${t.name}</b><small>${t.level}</small><p>${t.desc}</p></button>`;

  function list() {
    q('#tplBody').innerHTML = `
      <h2>Elige tu rutina</h2><p class="muted">Escoge dónde vas a entrenar y cuál se ajusta a ti. Después eliges los días.</p>
      <div class="chips-row">${[['all', 'Todas'], ['gym', '🏋️ Gimnasio'], ['home', '🏠 Casa']].map(([k, l]) => `<button class="chip ${filter === k ? 'sel' : ''}" data-filter="${k}">${l}</button>`).join('')}</div>
      <div class="tpls">${TEMPLATES.filter((t) => filter === 'all' || t.where === filter).map(cardHTML).join('')}</div>`;
  }

  function detail() {
    const t = TEMPLATES.find((x) => x.id === pick), n = t.days.length;
    q('#tplBody').innerHTML = `
      <p><button class="link" data-act="back">← Volver al catálogo</button></p>
      <h2>${t.name}</h2><p class="muted">${t.desc}</p>
      <h3>¿Qué días vas a entrenar? <small class="muted">(elige ${n})</small></h3>
      <div class="chips-row" id="tplDays">${ORDER.map((d) => `<button class="chip ${chosen.includes(d) ? 'sel' : ''}" data-day="${d}">${DAYN[d]}</button>`).join('')}</div>
      <h3>Opciones</h3>
      <label class="opt"><input type="checkbox" id="oWarm" checked> Incluir calentamiento (6-8 min)</label>
      <label class="opt"><input type="checkbox" id="oCool" checked> Incluir estiramientos al final (5 min)</label>
      ${t.where === 'gym' ? '<label class="opt"><input type="checkbox" id="oTread"> Sumar cardio opcional en trotadora</label>' : ''}
      <label class="opt"><input type="checkbox" id="oBike" ${t.id === 'home2' ? 'disabled' : ''}> Sumar 2 días de bicicleta estática</label>
      <h3>Qué incluye</h3>
      ${t.sessions.map((s) => `<details><summary><b>${s.name}</b> · ${s.main.length} ejercicios</summary><ul>${s.main.map((x) => `<li>${G.EX[Array.isArray(x) ? x[0] : x].name}</li>`).join('')}</ul></details>`).join('')}
      <button class="btn primary wide" id="tplUse" ${chosen.length === n ? '' : 'disabled'}>Usar esta rutina</button>
      <p class="muted center">Reemplaza la rutina que tienes ahora.</p>`;
  }

  function apply(tpl, days, o) {
    db.routine = build(tpl, days, o); db.supportV = 2; db.lastAdjust = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); save();
    selDay = days[0]; loadRoutine();
  }

  function open(f) { filter = typeof f === 'string' ? f : 'all'; pick = null; list(); q('#tplDlg').showModal(); q('#tplDlg').scrollTop = 0; }

  document.addEventListener('click', (e) => {
    const dlg = q('#tplDlg'); if (!dlg || !dlg.open) return;
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.filter) { filter = t.dataset.filter; list(); }
    else if (t.dataset.tpl) { pick = t.dataset.tpl; chosen = [...TEMPLATES.find((x) => x.id === pick).days]; detail(); dlg.scrollTop = 0; }
    else if (t.dataset.act === 'back') { pick = null; list(); }
    else if (t.dataset.day) {
      const d = +t.dataset.day, n = TEMPLATES.find((x) => x.id === pick).days.length;
      if (chosen.includes(d)) chosen = chosen.filter((x) => x !== d); else if (chosen.length < n) chosen.push(d);
      const keep = { w: q('#oWarm').checked, c: q('#oCool').checked, b: q('#oBike').checked, tr: q('#oTread')?.checked };
      detail(); q('#oWarm').checked = keep.w; q('#oCool').checked = keep.c; q('#oBike').checked = keep.b; if (q('#oTread')) q('#oTread').checked = keep.tr;
    } else if (t.id === 'tplUse') {
      const tpl = TEMPLATES.find((x) => x.id === pick);
      if (!confirm('Se reemplazará tu rutina actual por «' + tpl.name + '». ¿Continuar?')) return;
      const days = [...chosen].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
      apply(tpl, days, { warm: q('#oWarm').checked, cool: q('#oCool').checked, bike: q('#oBike').checked && !q('#oBike').disabled, treadmill: q('#oTread')?.checked });
      dlg.close();
    } else if (t.id === 'tplClose') dlg.close();
  });

  q('#tplBtn').onclick = () => open();
  window.openCatalog = open;
  window.GYM_TEMPLATES = TEMPLATES;
})();
