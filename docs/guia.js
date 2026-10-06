// Guía de ejercicios: textos, animaciones (monito de palitos) y alternativas "si está ocupada".
(function () {
  const LEG = [28, 30], ARM = [23, 23];
  const FLOOR = '<line x1="8" y1="136" x2="192" y2="136" class="g-eq"/>';

  // Cinemática inversa de 2 huesos: devuelve la articulación del medio (rodilla / codo)
  function ik(a, b, l1, l2, s) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
    const dd = Math.min(d, l1 + l2 - 0.01), ux = dx / d, uy = dy / d;
    const x = (dd * dd + l1 * l1 - l2 * l2) / (2 * dd), h = Math.sqrt(Math.max(l1 * l1 - x * x, 0));
    return [a[0] + ux * x - s * uy * h, a[1] + uy * x + s * ux * h];
  }

  // Cada patrón: puntos de inicio (A) y de esfuerzo (B). legs/arms = [cadera|hombro, pie|mano, lado del doblez]
  const P = {
    press_h: {
      eq: FLOOR + '<rect x="30" y="100" width="108" height="7" rx="3" class="g-eq"/><line x1="48" y1="107" x2="48" y2="136" class="g-eq"/><line x1="120" y1="107" x2="120" y2="136" class="g-eq"/>',
      A: { head: [128, 93], shoulder: [112, 94], hip: [74, 94], foot: [44, 128], hand: [116, 72] },
      B: { hand: [112, 50] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', 1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'bar' },
    },
    press_v: {
      eq: FLOOR + '<rect x="54" y="98" width="42" height="7" rx="3" class="g-eq"/><rect x="48" y="36" width="8" height="64" rx="3" class="g-eq"/><line x1="76" y1="105" x2="76" y2="136" class="g-eq"/>',
      A: { head: [68, 42], shoulder: [68, 58], hip: [72, 96], foot: [108, 130], hand: [80, 38] },
      B: { hand: [74, 14] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot' },
    },
    pull_v: {
      eq: FLOOR + '<rect x="54" y="98" width="42" height="7" rx="3" class="g-eq"/><line x1="76" y1="105" x2="76" y2="136" class="g-eq"/><rect x="92" y="84" width="14" height="8" rx="4" class="g-eq"/>',
      A: { head: [64, 42], shoulder: [64, 58], hip: [70, 98], foot: [108, 130], hand: [84, 20] },
      B: { hand: [82, 56], head: [62, 42] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'bar', cable: [90, 4] },
    },
    row_seated: {
      eq: FLOOR + '<rect x="40" y="100" width="40" height="7" rx="3" class="g-eq"/><line x1="60" y1="107" x2="60" y2="136" class="g-eq"/><rect x="40" y="38" width="8" height="62" rx="3" class="g-eq"/><rect x="108" y="108" width="30" height="5" rx="2" class="g-eq"/>',
      A: { head: [58, 42], shoulder: [58, 58], hip: [60, 98], foot: [112, 106], hand: [100, 66] },
      B: { hand: [76, 72] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot', cable: [160, 66] },
    },
    squat_smith: {
      eq: FLOOR + '<line x1="116" y1="14" x2="116" y2="136" class="g-eq"/><line x1="84" y1="14" x2="84" y2="136" class="g-eq"/>',
      A: { head: [101, 30], shoulder: [100, 42], hip: [98, 80], foot: [100, 134], hand: [108, 50] },
      B: { head: [104, 54], shoulder: [100, 66], hip: [86, 100], hand: [108, 74] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'shoulder', kind: 'bar' },
    },
    squat_free: {
      eq: FLOOR,
      A: { head: [101, 30], shoulder: [100, 42], hip: [98, 80], foot: [100, 134], hand: [110, 54] },
      B: { head: [108, 56], shoulder: [102, 68], hip: [84, 100], hand: [114, 70] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot' },
    },
    leg_press: {
      eq: FLOOR + '<line x1="22" y1="82" x2="64" y2="124" stroke-width="7" stroke-linecap="round" class="g-eq"/><line x1="70" y1="130" x2="150" y2="50" class="g-eq"/>',
      A: { head: [24, 80], shoulder: [32, 88], hip: [58, 112], foot: [84, 94], hand: [46, 104] },
      B: { foot: [102, 77] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [], load: { pt: 'foot', kind: 'plate' },
    },
    hip_thrust: {
      eq: FLOOR + '<rect x="8" y="96" width="46" height="7" rx="3" class="g-eq"/><line x1="30" y1="103" x2="30" y2="136" class="g-eq"/>',
      A: { head: [32, 84], shoulder: [44, 91], hip: [76, 113], foot: [118, 128], bar: [76, 106] },
      B: { hip: [82, 90], bar: [82, 83] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [], load: { pt: 'bar', kind: 'bar' },
    },
    leg_ext: {
      eq: FLOOR + '<rect x="54" y="98" width="42" height="7" rx="3" class="g-eq"/><rect x="48" y="36" width="8" height="64" rx="3" class="g-eq"/><line x1="76" y1="105" x2="76" y2="136" class="g-eq"/>',
      A: { head: [62, 42], shoulder: [62, 58], hip: [72, 96], foot: [92, 132], hand: [86, 96] },
      B: { foot: [126, 100] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'foot', kind: 'dot' },
    },
    leg_curl: {
      eq: FLOOR + '<rect x="54" y="98" width="42" height="7" rx="3" class="g-eq"/><rect x="48" y="36" width="8" height="64" rx="3" class="g-eq"/><line x1="76" y1="105" x2="76" y2="136" class="g-eq"/>',
      A: { head: [62, 42], shoulder: [62, 58], hip: [72, 96], foot: [126, 100], hand: [86, 96] },
      B: { foot: [92, 132] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'foot', kind: 'dot' },
    },
    curl: {
      eq: FLOOR,
      A: { head: [100, 26], shoulder: [100, 42], hip: [100, 82], foot: [100, 134], hand: [108, 86] },
      B: { hand: [118, 52] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot' },
    },
    pushdown: {
      eq: FLOOR + '<line x1="116" y1="8" x2="116" y2="40" class="g-eq"/>',
      A: { head: [100, 26], shoulder: [100, 42], hip: [100, 82], foot: [100, 134], hand: [118, 54] },
      B: { hand: [106, 88] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot', cable: [116, 10] },
    },
    lateral: {
      eq: FLOOR,
      A: { head: [100, 24], shL: [84, 42], shR: [116, 42], hipL: [92, 84], hipR: [108, 84], footL: [90, 134], footR: [110, 134], handL: [78, 86], handR: [122, 86] },
      B: { handL: [42, 46], handR: [158, 46] },
      lines: [['shL', 'shR'], ['hipL', 'hipR'], ['shL', 'hipL'], ['shR', 'hipR'], ['shL', 'head'], ['shL', 'handL'], ['shR', 'handR'], ['hipL', 'footL'], ['hipR', 'footR']], legs: [], arms: [], load: { pt: 'handL', pt2: 'handR', kind: 'dot' },
    },
    fly: {
      eq: FLOOR,
      A: { head: [100, 24], shL: [84, 42], shR: [116, 42], hipL: [92, 84], hipR: [108, 84], footL: [90, 134], footR: [110, 134], handL: [54, 58], handR: [146, 58] },
      B: { handL: [94, 54], handR: [106, 54] },
      lines: [['shL', 'shR'], ['hipL', 'hipR'], ['shL', 'hipL'], ['shR', 'hipR'], ['shL', 'head'], ['hipL', 'footL'], ['hipR', 'footR']], legs: [], arms: [['shL', 'handL', -1], ['shR', 'handR', 1]], load: { pt: 'handL', pt2: 'handR', kind: 'dot' },
    },
    abduct: {
      eq: FLOOR + '<rect x="78" y="86" width="44" height="7" rx="3" class="g-eq"/>',
      A: { head: [100, 30], shoulder: [100, 46], hip: [100, 84], kneeL: [90, 98], kneeR: [110, 98], footL: [90, 130], footR: [110, 130] },
      B: { kneeL: [66, 98], kneeR: [134, 98], footL: [64, 130], footR: [136, 130] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head'], ['hip', 'kneeL'], ['hip', 'kneeR'], ['kneeL', 'footL'], ['kneeR', 'footR']], legs: [], arms: [], load: { pt: 'kneeL', pt2: 'kneeR', kind: 'dot' },
    },
    crunch: {
      eq: FLOOR + '<rect x="30" y="100" width="108" height="7" rx="3" class="g-eq"/><line x1="48" y1="107" x2="48" y2="136" class="g-eq"/><line x1="120" y1="107" x2="120" y2="136" class="g-eq"/>',
      A: { head: [36, 92], shoulder: [48, 94], hip: [86, 94], foot: [122, 94] },
      B: { head: [58, 52], shoulder: [64, 62], hip: [86, 94] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', 1]], arms: [], load: null,
    },
    backext: {
      eq: FLOOR + '<line x1="96" y1="62" x2="150" y2="116" stroke-width="7" stroke-linecap="round" class="g-eq"/><line x1="150" y1="116" x2="150" y2="136" class="g-eq"/>',
      A: { head: [52, 112], shoulder: [63, 101], hip: [90, 74], foot: [128, 112] },
      B: { head: [54, 36], shoulder: [62, 46] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', 1]], arms: [], load: null,
    },
    db_row: {
      eq: FLOOR + '<rect x="20" y="98" width="80" height="7" rx="3" class="g-eq"/><line x1="34" y1="105" x2="34" y2="136" class="g-eq"/><line x1="86" y1="105" x2="86" y2="136" class="g-eq"/>',
      A: { head: [48, 70], shoulder: [62, 74], hip: [98, 82], foot: [112, 134], hand: [72, 108], hand2: [52, 98] },
      B: { hand: [84, 84] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1], ['shoulder', 'hand2', 1]], load: { pt: 'hand', kind: 'dot' },
    },
    rdl: {
      eq: FLOOR,
      A: { head: [101, 28], shoulder: [100, 42], hip: [100, 82], foot: [100, 134], hand: [106, 88] },
      B: { head: [134, 60], shoulder: [122, 68], hip: [86, 82], hand: [124, 106] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot', -1]], arms: [['shoulder', 'hand', 1]], load: { pt: 'hand', kind: 'dot' },
    },
    plank: {
      eq: FLOOR,
      A: { head: [156, 92], shoulder: [142, 98], hip: [88, 108], foot: [32, 126], hand: [168, 126] },
      B: { hip: [88, 112], shoulder: [142, 99] },
      lines: [['shoulder', 'hip'], ['shoulder', 'head'], ['hip', 'foot']], legs: [], arms: [['shoulder', 'hand', 1]], load: null,
    },
    bike: {
      eq: FLOOR + '<line x1="60" y1="133" x2="150" y2="133" class="g-eq"/><line x1="96" y1="112" x2="82" y2="68" class="g-eq"/><line x1="96" y1="112" x2="132" y2="78" class="g-eq"/><line x1="132" y1="78" x2="142" y2="62" class="g-eq"/><rect x="70" y="63" width="22" height="5" rx="2" class="g-eq"/><circle cx="96" cy="112" r="16" fill="none" class="g-eq"/>',
      fn(sec) {
        const a = (sec / 1.6) * Math.PI * 2, C = [96, 112], r = 16;
        return {
          head: [112, 30], shoulder: [104, 46], hip: [84, 70], hand: [141, 64],
          foot: [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)], foot2: [C[0] - r * Math.cos(a), C[1] - r * Math.sin(a)],
        };
      },
      lines: [['shoulder', 'hip'], ['shoulder', 'head']], legs: [['hip', 'foot2', -1, 0.45], ['hip', 'foot', -1, 1]], arms: [['shoulder', 'hand', 1]], load: null,
    },
  };

  const f = (v) => v.toFixed(1);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  function poseAt(p, e, sec) {
    if (p.fn) return p.fn(sec);
    const out = {};
    for (const k in p.A) out[k] = p.B[k] ? lerp(p.A[k], p.B[k], e) : p.A[k];
    return out;
  }

  function drawPose(key, e, sec) {
    const p = P[key], q = poseAt(p, e, sec);
    let s = p.eq || '';
    if (p.load && p.load.cable) { const l = q[p.load.pt]; s += `<line x1="${p.load.cable[0]}" y1="${p.load.cable[1]}" x2="${f(l[0])}" y2="${f(l[1])}" class="g-eq"/>`; }
    for (const [a, b] of p.lines) s += `<line x1="${f(q[a][0])}" y1="${f(q[a][1])}" x2="${f(q[b][0])}" y2="${f(q[b][1])}" class="g-body"/>`;
    for (const [a, b, sg, op] of p.legs) { const m = ik(q[a], q[b], LEG[0], LEG[1], sg); s += `<polyline points="${f(q[a][0])},${f(q[a][1])} ${f(m[0])},${f(m[1])} ${f(q[b][0])},${f(q[b][1])}" class="g-body" ${op ? `opacity="${op}"` : ''}/>`; }
    for (const [a, b, sg] of p.arms) { const m = ik(q[a], q[b], ARM[0], ARM[1], sg); s += `<polyline points="${f(q[a][0])},${f(q[a][1])} ${f(m[0])},${f(m[1])} ${f(q[b][0])},${f(q[b][1])}" class="g-body"/>`; }
    s += `<circle cx="${f(q.head[0])}" cy="${f(q.head[1])}" r="8" class="g-head"/>`;
    if (p.load) for (const pt of [p.load.pt, p.load.pt2].filter(Boolean)) {
      const l = q[pt];
      if (p.load.kind === 'bar') s += `<line x1="${f(l[0] - 14)}" y1="${f(l[1])}" x2="${f(l[0] + 14)}" y2="${f(l[1])}" class="g-load"/><circle cx="${f(l[0] - 14)}" cy="${f(l[1])}" r="5" class="g-plate"/><circle cx="${f(l[0] + 14)}" cy="${f(l[1])}" r="5" class="g-plate"/>`;
      else if (p.load.kind === 'plate') s += `<rect x="${f(l[0] + 2)}" y="${f(l[1] - 16)}" width="6" height="32" rx="3" class="g-plate" transform="rotate(-38 ${f(l[0] + 5)} ${f(l[1])})"/>`;
      else s += `<circle cx="${f(l[0])}" cy="${f(l[1])}" r="5.5" class="g-plate"/>`;
    }
    return s;
  }

  // ---- Biblioteca de ejercicios ----
  const E = [
    // id, nombre, patrón, series, reps, músculos, ajuste, pasos, errores, truco, alternativas
    ['prensa', 'Prensa / sentadilla hack (discos)', 'leg_press', 3, '10-12', 'Cuádriceps y glúteos',
      'Ajusta el respaldo para que las rodillas queden a unos 90° al bajar. Pies al ancho de los hombros, centrados en la plataforma.',
      ['Empuja con los talones hasta estirar las piernas, sin bloquear las rodillas.', 'Baja despacio, contando 3 segundos, hasta unos 90°.', 'Mantén la espalda baja pegada al respaldo todo el tiempo.'],
      ['Rebotar abajo con el peso.', 'Estirar las rodillas del todo y "clavarlas" arriba.'],
      'Si no controlas la bajada, el peso es demasiado alto. Mejor menos peso y bien hecho.', ['sentadilla_smith', 'sentadilla_goblet']],
    ['press_pecho_maq', 'Press de pecho en máquina (discos)', 'press_h', 3, '10-12', 'Pecho, hombro y tríceps',
      'Ajusta el asiento para que las manijas queden a la altura del pecho. Espalda y cabeza apoyadas.',
      ['Empuja las manijas hacia adelante hasta casi estirar los brazos.', 'Vuelve despacio hasta que las manos queden a la altura del pecho.', 'Hombros abajo y hacia atrás, sin encogerlos.'],
      ['Despegar la espalda del respaldo.', 'Subir los hombros hacia las orejas.'],
      'Exhala al empujar, inhala al volver. Así no te quedas sin aire.', ['press_mancuernas', 'press_pecho_smith']],
    ['remo_pecho', 'Remo sentado con apoyo de pecho', 'row_seated', 3, '10-12', 'Espalda y bíceps',
      'Regula el asiento para que el pecho quede apoyado en el cojín y los brazos puedan estirarse del todo.',
      ['Con el pecho apoyado, tira de las manijas llevando los codos hacia atrás.', 'Junta los omóplatos al final, como si apretaras un lápiz entre ellos.', 'Vuelve lento, estirando los brazos sin soltar el peso de golpe.'],
      ['Encoger los hombros.', 'Tirar con los brazos en vez de con la espalda.'],
      'Imagina que tus manos son ganchos y que tiras con los codos.', ['remo_polea', 'remo_mancuerna']],
    ['press_hombro_maq', 'Press de hombro en máquina', 'press_v', 3, '10-12', 'Hombros y tríceps',
      'Asiento a una altura que deje las manijas a la altura de los hombros. Espalda apoyada.',
      ['Empuja hacia arriba hasta casi estirar los brazos.', 'Baja controlado hasta que las manos queden a la altura de la oreja.', 'Cuello relajado y abdomen firme.'],
      ['Arquear mucho la espalda.', 'Bajar de golpe y rebotar.'],
      'Si el hombro molesta, baja el peso y sube menos. Nunca fuerces con dolor.', ['press_hombro_mancu', 'laterales']],
    ['curl_femoral', 'Curl de pierna (isquios)', 'leg_curl', 3, '12', 'Parte de atrás del muslo',
      'Alinea la rodilla con el eje de la máquina y ajusta el rodillo justo sobre los tobillos.',
      ['Lleva los talones hacia el glúteo, doblando las rodillas.', 'Aprieta un segundo cuando llegues arriba.', 'Vuelve despacio hasta estirar casi del todo.'],
      ['Levantar la cadera del asiento.', 'Hacerlo a tirones con impulso.'],
      'Pie flexionado hacia ti, como si te pusieras de puntillas al revés.', ['rdl', 'puente_gluteo']],
    ['abdominal', 'Abdominal en banca', 'crunch', 3, '15', 'Abdomen',
      'Acuéstate con las rodillas dobladas y los pies apoyados. Manos cruzadas en el pecho o junto a las orejas, sin tirar del cuello.',
      ['Exhala y sube los hombros del banco enrollando el tronco.', 'Mira al techo para no encorvar el cuello.', 'Baja lento sin apoyar la cabeza del todo.'],
      ['Tirar del cuello con las manos.', 'Subir con impulso.'],
      'Sube poco pero fuerte. Menos recorrido y más control.', ['plancha']],
    ['jalon', 'Jalón al pecho', 'pull_v', 3, '10-12', 'Espalda (dorsales) y bíceps',
      'Ajusta el rodillo para que los muslos queden bien fijos. Agarre un poco más ancho que los hombros.',
      ['Saca el pecho y lleva la barra hasta la parte alta del pecho.', 'Los codos bajan hacia los costados, no hacia adelante.', 'Sube despacio hasta estirar los brazos.'],
      ['Jalar la barra detrás de la nuca.', 'Balancear el cuerpo para ayudarse.'],
      'Piensa en bajar los codos al bolsillo del pantalón.', ['jalon_funcional', 'remo_pecho']],
    ['hip_thrust', 'Hip thrust en máquina', 'hip_thrust', 3, '10-12', 'Glúteos',
      'Apoya la parte alta de la espalda en el banco y la barra o el cinturón sobre la cadera. Pies al ancho de caderas.',
      ['Empuja con los talones y sube la cadera hasta alinear rodillas, cadera y hombros.', 'Aprieta fuerte los glúteos arriba por 1 segundo.', 'Baja despacio sin apoyar del todo.'],
      ['Arquear la espalda baja al subir.', 'Empujar con la punta de los pies.'],
      'Barbilla pegada al pecho: mantiene las costillas abajo y la espalda neutra.', ['puente_gluteo', 'rdl']],
    ['press_inc_mancuernas', 'Press inclinado con mancuernas', 'press_h', 3, '10-12', 'Parte alta del pecho y hombros',
      'Pon el banco con una inclinación suave (unos 30°). Siéntate con las mancuernas sobre los muslos y échate hacia atrás.',
      ['Empuja las mancuernas hacia arriba hasta casi juntarlas.', 'Baja controlado hasta que los codos queden un poco por debajo del banco.', 'Muñecas firmes, sin doblarlas hacia atrás.'],
      ['Subir el banco demasiado (se vuelve hombro).', 'Dejar que las mancuernas se abran en exceso.'],
      'Si es tu primera vez, empieza con mancuernas ligeras: son más inestables que la máquina.', ['press_pecho_maq', 'press_pecho_smith']],
    ['remo_mancuerna', 'Remo a una mano con mancuerna', 'db_row', 3, '10-12 c/lado', 'Espalda y bíceps',
      'Apoya una mano y la rodilla del mismo lado en el banco. Espalda recta, mancuerna colgando bajo el hombro.',
      ['Tira de la mancuerna hacia la cadera, como arrancando una motosierra.', 'Aprieta la espalda arriba, codo cerca del cuerpo.', 'Baja despacio hasta estirar el brazo.'],
      ['Girar el tronco para subir el peso.', 'Redondear la espalda.'],
      'Mira al suelo, cuello en línea con la columna.', ['remo_polea', 'remo_pecho']],
    ['ext_pierna', 'Extensión de pierna (cuádriceps)', 'leg_ext', 3, '12-15', 'Cuádriceps',
      'Alinea la rodilla con el eje de la máquina y el rodillo sobre los tobillos. Espalda apoyada.',
      ['Estira las piernas hasta casi quedar rectas.', 'Aprieta el muslo un segundo arriba.', 'Baja despacio, sin dejar caer la pila.'],
      ['Balancear el cuerpo para subir.', 'Bloquear las rodillas de golpe.'],
      'Peso moderado y recorrido controlado: es un ejercicio exigente para las rodillas.', ['sentadilla_goblet', 'prensa']],
    ['hiperext', 'Hiperextensión 45° (espalda baja)', 'backext', 3, '12', 'Espalda baja y glúteos',
      'Ajusta el cojín para que quede bajo la cadera, no en el abdomen. Pies bien afirmados. Brazos cruzados en el pecho.',
      ['Baja el tronco con la espalda recta hasta sentir tensión atrás del muslo.', 'Sube hasta formar una línea recta con las piernas.', 'No pases de ahí: no hace falta arquear la espalda.'],
      ['Subir demasiado y arquear la espalda.', 'Moverse con rebotes.'],
      'Al subir, aprieta los glúteos; la espalda solo acompaña.', ['rdl', 'puente_gluteo']],
    ['sentadilla_smith', 'Sentadilla en máquina Smith', 'squat_smith', 3, '10-12', 'Piernas y glúteos',
      'Barra a la altura de los hombros, apoyada en la parte alta de la espalda. Pies un poco adelantados respecto a la barra.',
      ['Destraba la barra y baja doblando rodillas y cadera a la vez.', 'Baja hasta que los muslos queden casi paralelos al suelo.', 'Empuja con todo el pie para subir.'],
      ['Que las rodillas se vayan hacia adentro.', 'Despegar los talones del suelo.'],
      'La máquina Smith te da seguridad: úsala para aprender el movimiento. No olvides trabar la barra al terminar.', ['prensa', 'sentadilla_goblet']],
    ['pec_deck', 'Aperturas en pec deck', 'fly', 3, '12-15', 'Pecho',
      'Asiento a la altura que deje los brazos paralelos al suelo. Pecho afuera y espalda apoyada.',
      ['Junta los brazos al frente, con los codos ligeramente doblados.', 'Aprieta el pecho un segundo.', 'Vuelve lento hasta sentir estiramiento, sin pasarte hacia atrás.'],
      ['Estirar demasiado los brazos hacia atrás.', 'Encoger los hombros.'],
      'Imagina que abrazas un árbol grande. Menos peso, más sensación.', ['cruce_polea', 'aperturas_mancuernas']],
    ['remo_polea', 'Remo bajo en polea', 'row_seated', 3, '10-12', 'Espalda media',
      'Siéntate con las rodillas ligeramente flexionadas y los pies firmes. Espalda recta, pecho arriba.',
      ['Tira del agarre hacia el abdomen llevando los codos atrás.', 'Junta los omóplatos al final.', 'Vuelve despacio estirando los brazos, sin encorvar.'],
      ['Inclinarse hacia atrás para jalar.', 'Redondear la espalda al estirar.'],
      'Tira con la espalda y deja los brazos "colgados" del movimiento.', ['remo_pecho', 'remo_mancuerna']],
    ['laterales', 'Elevaciones laterales con mancuernas', 'lateral', 3, '12-15', 'Hombros (parte lateral)',
      'De pie, mancuernas ligeras a los costados. Codos con una leve flexión.',
      ['Sube los brazos hacia los lados hasta la altura de los hombros.', 'Baja despacio contando 3 segundos.', 'No subas más allá de la altura del hombro.'],
      ['Balancear el cuerpo para subir.', 'Usar demasiado peso.'],
      'Es de los ejercicios donde menos peso conviene: 3 a 6 kg suele bastar.', ['laterales_polea']],
    ['abductor', 'Abductor / aductor', 'abduct', 3, '15', 'Cara externa e interna de la cadera',
      'Siéntate con la espalda apoyada. Ajusta las almohadillas a la parte externa (o interna) de las rodillas.',
      ['Abre las piernas empujando las almohadillas hacia afuera.', 'Pausa breve al final del recorrido.', 'Vuelve controlado, sin dejar caer el peso.'],
      ['Usar impulso con el torso.', 'Soltar las almohadillas de golpe.'],
      'Cambia entre abducción y aducción girando la palanca de ajuste de la máquina.', ['puente_gluteo', 'sentadilla_goblet']],
    ['curl_biceps', 'Curl de bíceps con mancuernas', 'curl', 2, '12', 'Bíceps',
      'De pie, mancuernas a los lados con las palmas hacia adelante. Codos pegados al cuerpo.',
      ['Sube las mancuernas doblando solo los codos.', 'Aprieta el bíceps arriba.', 'Baja despacio hasta estirar el brazo.'],
      ['Balancear el cuerpo.', 'Mover los codos hacia adelante.'],
      'Si tienes que "empujar" con la espalda, el peso es demasiado.', ['curl_polea']],
    ['triceps_polea', 'Tríceps en polea', 'pushdown', 2, '12', 'Tríceps',
      'De pie frente a la polea alta, codos pegados a las costillas, agarre con las palmas hacia abajo.',
      ['Empuja el agarre hacia abajo hasta estirar los codos.', 'Aprieta el tríceps un segundo.', 'Sube despacio hasta que las manos lleguen a la altura del pecho.'],
      ['Abrir los codos hacia afuera.', 'Inclinarse mucho para ayudarse con el cuerpo.'],
      'Los codos son bisagras: que no se muevan de su sitio.', ['triceps_cuerda']],
    ['bici', 'Bici suave 30-40 min (puedes hablar)', 'bike', 1, '35 min', 'Corazón y piernas (quema de grasa)',
      'Regula el asiento para que la rodilla quede casi estirada con el pedal abajo. Espalda recta.',
      ['Pedalea a un ritmo en el que puedas conversar sin ahogarte.', 'Mantén ese ritmo de 30 a 40 minutos.', 'Calienta 5 minutos suave al empezar y baja el ritmo al final.'],
      ['Ir tan fuerte que no puedes hablar (agotas y recuperas peor).', 'Encorvarte sobre el manubrio.'],
      'Pon música o una serie. Si lo disfrutas, lo mantienes.', ['caminadora']],

    // ---- Variantes ("si está ocupada") ----
    ['sentadilla_goblet', 'Sentadilla goblet con mancuerna', 'squat_free', 3, '10-12', 'Piernas y glúteos',
      'Sujeta una mancuerna vertical contra el pecho, con las dos manos. Pies un poco más abiertos que los hombros.',
      ['Baja sentándote hacia atrás, manteniendo el pecho arriba.', 'Baja hasta que los muslos queden casi paralelos al suelo.', 'Empuja con todo el pie para subir.'],
      ['Que las rodillas se vayan hacia adentro.', 'Despegar los talones.'],
      'La mancuerna junto al pecho te ayuda a mantener la espalda derecha.', ['prensa', 'sentadilla_smith']],
    ['press_mancuernas', 'Press de pecho con mancuernas (banco plano)', 'press_h', 3, '10-12', 'Pecho, hombro y tríceps',
      'Échate en el banco plano con las mancuernas sobre el pecho, pies firmes en el suelo.',
      ['Empuja las mancuernas hacia arriba hasta casi juntarlas.', 'Baja controlado hasta que los codos queden a la altura del banco.', 'Mantén las muñecas rectas.'],
      ['Dejar caer las mancuernas hacia los lados.', 'Arquear mucho la espalda.'],
      'Si usas mucho peso, pídele a alguien que te ayude a subirlas y bajarlas.', ['press_pecho_maq', 'press_pecho_smith']],
    ['press_pecho_smith', 'Press de pecho en Smith (banco plano)', 'press_h', 3, '10-12', 'Pecho, hombro y tríceps',
      'Coloca el banco plano dentro de la Smith, con la barra sobre el pecho. Pies firmes. Pon los topes de seguridad un poco por encima del pecho.',
      ['Destraba la barra y bájala hasta rozar el pecho.', 'Empuja hasta casi estirar los brazos.', 'Al terminar, traba la barra girándola.'],
      ['Rebotar la barra en el pecho.', 'Olvidar los topes de seguridad.'],
      'Es de los más seguros para entrenar solo: la barra va guiada y se puede trabar.', ['press_pecho_maq', 'press_mancuernas']],
    ['press_hombro_mancu', 'Press de hombro con mancuernas (sentado)', 'press_v', 3, '10-12', 'Hombros y tríceps',
      'Siéntate en el banco con respaldo casi vertical. Mancuernas a la altura de los hombros.',
      ['Empuja hacia arriba hasta casi estirar los brazos.', 'Baja controlado hasta la altura de las orejas.', 'Abdomen firme y espalda apoyada.'],
      ['Arquear la espalda.', 'Chocar las mancuernas arriba.'],
      'Mancuernas ligeras: el hombro es una articulación delicada.', ['press_hombro_maq', 'laterales']],
    ['puente_gluteo', 'Puente de glúteo (con mancuerna)', 'hip_thrust', 3, '12-15', 'Glúteos',
      'Siéntate en el suelo apoyando la espalda alta en un banco. Pon una mancuerna sobre la cadera. Rodillas dobladas.',
      ['Empuja con los talones y sube la cadera.', 'Aprieta fuerte los glúteos arriba.', 'Baja controlado sin apoyar del todo.'],
      ['Arquear la espalda baja.', 'Empujar con la punta de los pies.'],
      'Sin banco también sirve: hazlo en el suelo y súbelo de dificultad después.', ['hip_thrust', 'rdl']],
    ['rdl', 'Peso muerto rumano con mancuernas', 'rdl', 3, '10-12', 'Isquios, glúteos y espalda baja',
      'De pie con una mancuerna en cada mano, pies al ancho de caderas, rodillas ligeramente flexionadas.',
      ['Lleva la cadera hacia atrás, dejando que las mancuernas bajen pegadas a las piernas.', 'Baja hasta sentir tensión atrás del muslo, con la espalda recta.', 'Sube empujando la cadera hacia adelante.'],
      ['Redondear la espalda.', 'Doblar demasiado las rodillas (se vuelve sentadilla).'],
      'Imagina que cierras una puerta con el trasero.', ['curl_femoral', 'puente_gluteo']],
    ['plancha', 'Plancha (abdominal estático)', 'plank', 3, '30-40 s', 'Abdomen y core',
      'Apoya los antebrazos en el suelo con los codos bajo los hombros. Cuerpo en línea recta.',
      ['Mantén el cuerpo recto desde la cabeza hasta los talones.', 'Aprieta abdomen y glúteos.', 'Respira normal, sin aguantar el aire.'],
      ['Dejar caer la cadera.', 'Subir demasiado el trasero.'],
      'Si es muy duro, apoya las rodillas. Ve sumando segundos cada semana.', ['abdominal']],
    ['jalon_funcional', 'Jalón en polea funcional', 'pull_v', 3, '10-12', 'Espalda (dorsales) y bíceps',
      'Pon la polea en lo más alto. Siéntate o ponte de rodillas frente a ella, con el agarre un poco más ancho que los hombros.',
      ['Saca el pecho y baja el agarre hasta la parte alta del pecho.', 'Baja los codos hacia los costados.', 'Sube despacio hasta estirar los brazos.'],
      ['Balancear el cuerpo.', 'Jalar con los brazos en vez de con la espalda.'],
      'Es la versión libre del jalón: sirve cuando la máquina está ocupada.', ['jalon', 'remo_polea']],
    ['laterales_polea', 'Elevaciones laterales en polea', 'lateral', 3, '12-15', 'Hombros (parte lateral)',
      'Polea baja, agarre en la mano contraria al cable, de pie a un lado de la máquina. Peso muy ligero.',
      ['Sube el brazo hacia el lado hasta la altura del hombro.', 'Baja despacio contando 3 segundos.', 'Mantén el tronco quieto.'],
      ['Balancear el cuerpo.', 'Subir por encima del hombro.'],
      'La polea mantiene tensión todo el recorrido: sientes más con menos peso.', ['laterales']],
    ['curl_polea', 'Curl de bíceps en polea', 'curl', 2, '12', 'Bíceps',
      'Polea baja con barra corta o cuerda, de pie, codos pegados al cuerpo.',
      ['Sube el agarre doblando solo los codos.', 'Aprieta el bíceps arriba.', 'Baja despacio hasta estirar los brazos.'],
      ['Balancear el cuerpo.', 'Despegar los codos.'],
      'Buena opción cuando las mancuernas están ocupadas.', ['curl_biceps']],
    ['triceps_cuerda', 'Tríceps con cuerda en polea', 'pushdown', 2, '12', 'Tríceps',
      'Polea alta con cuerda, codos pegados a las costillas.',
      ['Empuja la cuerda hacia abajo.', 'Al final, abre un poco las manos y aprieta.', 'Sube despacio.'],
      ['Mover los codos.', 'Inclinar mucho el tronco.'],
      'Variante de la barra: permite abrir las manos y trabaja un poco más.', ['triceps_polea']],
    ['cruce_polea', 'Cruce de poleas (pecho)', 'fly', 3, '12-15', 'Pecho',
      'Poleas a la altura del pecho o más altas. Da un paso adelante, con un pie adelantado y el torso levemente inclinado.',
      ['Junta las manos al frente con los codos ligeramente doblados.', 'Aprieta el pecho un segundo.', 'Vuelve despacio hasta sentir estiramiento.'],
      ['Usar demasiado peso y hacerlo con los brazos rectos.', 'Encoger los hombros.'],
      'Si el pec deck está ocupado, esta es la mejor alternativa.', ['pec_deck', 'aperturas_mancuernas']],
    ['aperturas_mancuernas', 'Aperturas con mancuernas (banco plano)', 'fly', 3, '12-15', 'Pecho',
      'Échate en un banco plano con las mancuernas arriba del pecho, codos ligeramente doblados. Mira la animación como si fuera vista de frente.',
      ['Abre los brazos hacia los lados en arco, como abriendo unas alas.', 'Baja hasta sentir estiramiento en el pecho.', 'Vuelve juntando las manos arriba.'],
      ['Bajar demasiado (riesgo en el hombro).', 'Usar demasiado peso.'],
      'Mancuernas ligeras: se siente mucho más que un press.', ['pec_deck', 'cruce_polea']],
    ['caminadora', 'Caminata en cinta (inclinada)', null, 1, '30 min', 'Corazón y piernas',
      'Pon una inclinación de 5-8 % y una velocidad cómoda.',
      ['Camina a paso rápido, sin agarrarte de las barras.', 'Mantén ese ritmo 30 minutos.', 'Baja la velocidad al final para recuperar.'],
      ['Agarrarte de las barras todo el rato.', 'Ir tan rápido que no puedas hablar.'],
      'Caminar inclinado exige más que correr suave y cuida las rodillas.', ['bici']],
  ];

  const EX = {};
  for (const e of E) EX[e[0]] = { id: e[0], name: e[1], pat: e[2], sets: e[3], reps: e[4], muscles: e[5], setup: e[6], steps: e[7], errors: e[8], tip: e[9], alts: e[10] };

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const byName = {};
  for (const id in EX) byName[norm(EX[id].name)] = id;
  const findId = (name) => byName[norm(name)] || null;

  // Animación (bucle de 3.6 s): mantiene el inicio, hace fuerza, mantiene, y vuelve lento
  function phase(sec) {
    const T = 3.6, u = sec % T;
    if (u < 0.3) return { e: 0, label: 'Posición de inicio' };
    if (u < 1.4) { const x = (u - 0.3) / 1.1; return { e: x * x * (3 - 2 * x), label: '💨 Empuja o tira (exhala)' }; }
    if (u < 1.8) return { e: 1, label: '✊ Aprieta el músculo' };
    const x = (u - 1.8) / 1.8; return { e: 1 - x * x * (3 - 2 * x), label: '🌬️ Vuelve lento (inhala)' };
  }

  function mount(svg, label, key) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = P[key];
    if (!p) { svg.innerHTML = '<text x="100" y="80" text-anchor="middle" class="g-txt">Sin animación</text>'; label.textContent = ''; return () => {}; }
    if (reduce) { svg.innerHTML = drawPose(key, 1, 0); label.textContent = 'Posición final'; return () => {}; }
    let raf, t0 = performance.now();
    const tick = (now) => {
      const sec = (now - t0) / 1000;
      if (p.fn) { svg.innerHTML = drawPose(key, 0, sec); label.textContent = '🚴 Pedalea suave, respira normal'; }
      else if (key === 'plank') { const e = 0.5 - 0.5 * Math.cos(sec * 2); svg.innerHTML = drawPose(key, e, sec); label.textContent = '🧱 Mantén el cuerpo recto, respira'; }
      else { const ph = phase(sec); svg.innerHTML = drawPose(key, ph.e, sec); label.textContent = ph.label; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  window.GUIA = { EX, P, drawPose, findId, mount, norm };
})();
