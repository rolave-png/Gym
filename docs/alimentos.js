// Alimentos básicos y comunes (valores aproximados por 100 g, ya preparados/cocidos cuando corresponde).
// [nombre, otras formas de buscarlo, kcal, proteína g, carbohidratos g, grasa g, unidad, gramos por unidad]
(function () {
  const F = [
    // Huevos
    ['Huevo entero cocido', 'huevo huevos duro cocido', 155, 12.6, 1.1, 10.6, 'huevo', 50],
    ['Huevo frito', 'huevo huevos frito', 196, 13.6, 0.8, 15, 'huevo', 46],
    ['Huevo revuelto', 'huevo huevos revuelto', 166, 11, 1.6, 12, 'huevo', 50],
    ['Clara de huevo', 'huevo huevos clara claras', 52, 10.9, 0.7, 0.2, 'clara', 33],
    // Carnes y pescados
    ['Pechuga de pollo cocida o a la plancha', 'pollo pechuga plancha cocido', 165, 31, 0, 3.6, 'filete', 120],
    ['Muslo de pollo cocido sin piel', 'pollo muslo trutro cocido', 177, 24, 0, 8, 'muslo', 90],
    ['Carne de vacuno magra cocida (lomo, posta)', 'vacuno carne res vaca lomo posta bistec filete', 215, 29, 0, 10, 'filete', 130],
    ['Carne molida de vacuno cocida', 'vacuno carne molida res', 250, 26, 0, 15, null, 0],
    ['Cerdo lomo cocido', 'cerdo chancho lomo', 200, 27, 0, 9, 'filete', 120],
    ['Jamón cocido', 'jamon cocido', 145, 18, 1.5, 6, 'rebanada', 20],
    ['Pechuga de pavo cocida', 'pavo pechuga', 135, 30, 0, 1, null, 0],
    ['Salmón cocido', 'salmon pescado', 206, 22, 0, 12, 'filete', 140],
    ['Atún en agua (lata)', 'atun lata pescado', 116, 26, 0, 1, 'lata', 120],
    ['Merluza cocida', 'merluza pescado', 105, 22, 0, 1.5, 'filete', 130],
    // Cereales, pan y legumbres
    ['Arroz blanco cocido', 'arroz blanco cocido', 130, 2.7, 28, 0.3, 'taza', 160],
    ['Arroz integral cocido', 'arroz integral cocido', 123, 2.7, 25.6, 1, 'taza', 160],
    ['Fideos o pasta cocida', 'fideos pasta tallarines espagueti cocida', 158, 5.8, 31, 0.9, 'taza', 140],
    ['Quinoa cocida', 'quinoa quinua', 120, 4.4, 21, 1.9, 'taza', 160],
    ['Avena en hojuelas (cruda)', 'avena hojuelas copos', 379, 13, 67, 6.5, 'cucharada', 10],
    ['Pan marraqueta o pan francés', 'pan marraqueta francés frances hallulla', 270, 9, 55, 1.5, 'mitad', 55],
    ['Pan de molde blanco', 'pan molde blanco rebanada', 265, 9, 49, 3.2, 'rebanada', 30],
    ['Pan integral', 'pan integral molde', 247, 13, 41, 3.4, 'rebanada', 30],
    ['Tortilla de trigo (wrap)', 'tortilla wrap trigo harina', 306, 8, 50, 8, 'unidad', 45],
    ['Papa cocida', 'papa patata cocida', 87, 1.9, 20, 0.1, 'papa mediana', 150],
    ['Papas fritas', 'papas fritas patatas', 312, 3.4, 41, 15, null, 0],
    ['Camote cocido', 'camote batata boniato', 90, 2, 21, 0.2, 'unidad', 130],
    ['Lentejas cocidas', 'lentejas legumbres', 116, 9, 20, 0.4, 'taza', 200],
    ['Garbanzos cocidos', 'garbanzos legumbres', 164, 8.9, 27, 2.6, 'taza', 160],
    ['Porotos o frijoles negros cocidos', 'porotos frijoles negros legumbres', 132, 8.9, 24, 0.5, 'taza', 170],
    ['Arvejas cocidas', 'arvejas guisantes', 84, 5.4, 15, 0.2, 'taza', 150],
    // Lácteos y grasas
    ['Leche entera', 'leche entera vaso', 61, 3.2, 4.8, 3.3, 'vaso', 240],
    ['Leche descremada', 'leche descremada light vaso', 34, 3.4, 5, 0.1, 'vaso', 240],
    ['Yogur natural', 'yogur yogurt natural', 61, 3.5, 4.7, 3.3, 'pote', 125],
    ['Yogur griego natural', 'yogur yogurt griego natural', 97, 9, 3.9, 5, 'pote', 150],
    ['Queso gouda o mantecoso', 'queso gouda mantecoso laminado', 356, 25, 2.2, 27, 'laminita', 20],
    ['Queso cottage', 'queso cottage requesón', 98, 11, 3.4, 4.3, 'cucharada', 25],
    ['Queso crema', 'queso crema', 342, 6, 4, 34, 'cucharada', 15],
    ['Mantequilla', 'mantequilla', 717, 0.9, 0.1, 81, 'cucharadita', 5],
    ['Aceite de oliva', 'aceite oliva', 884, 0, 0, 100, 'cucharada', 14],
    // Bebidas con café y platos caseros (aproximados: varían según la receta)
    ['Café negro (sin azúcar)', 'cafe negro americano espresso', 1, 0.1, 0, 0, 'taza', 240],
    ['Café con leche entera (mitad y mitad)', 'cafe con leche entera', 30, 1.6, 2.4, 1.6, 'taza', 240],
    ['Café con bebida de coco (de caja), sin azúcar', 'cafe con leche de coco bebida vegetal', 11, 0.1, 0.5, 0.9, 'taza', 240],
    ['Café con leche de coco de lata (un chorrito)', 'cafe con leche de coco lata crema', 52, 0.6, 1, 5, 'taza', 240],
    ['Leche de coco de lata', 'leche coco lata crema', 197, 2, 3, 21, 'cucharada', 15],
    ['Bebida de coco (de caja)', 'bebida leche coco vegetal caja', 20, 0.2, 1, 1.8, 'vaso', 240],
    ['Pastel de coliflor (con huevo y queso)', 'pastel coliflor tarta budin queque', 150, 9, 8, 9, 'porción', 150],
    // Frutas
    ['Plátano (banana)', 'platano banana', 89, 1.1, 23, 0.3, 'plátano', 120],
    ['Manzana', 'manzana', 52, 0.3, 14, 0.2, 'manzana', 180],
    ['Naranja', 'naranja', 47, 0.9, 12, 0.1, 'naranja', 130],
    ['Palta (aguacate)', 'palta aguacate', 160, 2, 8.5, 14.7, 'mitad', 70],
    ['Frutillas (fresas)', 'frutilla frutillas fresa fresas', 32, 0.7, 7.7, 0.3, 'taza', 150],
    ['Uvas', 'uva uvas', 69, 0.7, 18, 0.2, 'racimo chico', 100],
    ['Pera', 'pera', 57, 0.4, 15, 0.1, 'pera', 170],
    ['Sandía', 'sandia', 30, 0.6, 7.6, 0.2, 'trozo', 250],
    ['Piña', 'pina anana', 50, 0.5, 13, 0.1, 'rodaja', 80],
    ['Mango', 'mango', 60, 0.8, 15, 0.4, 'taza', 165],
    ['Kiwi', 'kiwi', 61, 1.1, 15, 0.5, 'kiwi', 70],
    ['Durazno', 'durazno melocoton', 39, 0.9, 10, 0.3, 'durazno', 150],
    ['Arándanos', 'arandano arandanos', 57, 0.7, 14, 0.3, 'puñado', 40],
    // Verduras
    ['Lechuga', 'lechuga ensalada', 15, 1.4, 2.9, 0.2, 'taza', 40],
    ['Tomate', 'tomate ensalada', 18, 0.9, 3.9, 0.2, 'tomate', 120],
    ['Zanahoria', 'zanahoria', 41, 0.9, 9.6, 0.2, 'zanahoria', 70],
    ['Brócoli cocido', 'brocoli brécol', 35, 2.4, 7.2, 0.4, 'taza', 150],
    ['Espárragos cocidos', 'esparragos esparrago', 22, 2.4, 4.1, 0.2, 'taza', 140],
    ['Espinaca cocida', 'espinaca espinacas', 23, 3, 3.8, 0.3, 'taza', 180],
    ['Pepino', 'pepino ensalada', 15, 0.7, 3.6, 0.1, 'pepino', 200],
    ['Cebolla', 'cebolla', 40, 1.1, 9.3, 0.1, 'cebolla', 110],
    ['Zapallo italiano (zucchini)', 'zapallo italiano zucchini calabacin', 17, 1.2, 3.1, 0.3, 'unidad', 200],
    ['Choclo (maíz) cocido', 'choclo maiz elote cocido', 96, 3.4, 21, 1.5, 'choclo', 150],
    ['Champiñones', 'champinon champinones hongos setas', 22, 3.1, 3.3, 0.3, 'taza', 90],
    ['Coliflor cocida', 'coliflor', 23, 1.8, 4.1, 0.5, 'taza', 130],
    ['Betarraga (remolacha) cocida', 'betarraga remolacha', 44, 1.7, 10, 0.2, 'unidad', 80],
    ['Pimentón', 'pimenton pimiento', 31, 1, 6, 0.3, 'pimentón', 150],
    // Frutos secos y otros
    ['Almendras', 'almendras frutos secos', 579, 21, 22, 50, 'puñado', 28],
    ['Nueces', 'nueces frutos secos', 654, 15, 14, 65, 'puñado', 28],
    ['Maní (cacahuate)', 'mani cacahuate frutos secos', 567, 26, 16, 49, 'puñado', 28],
    ['Mantequilla de maní', 'mantequilla mani cacahuate', 588, 25, 20, 50, 'cucharada', 16],
    ['Chocolate negro (70 %)', 'chocolate negro', 598, 7.8, 46, 43, 'cuadrito', 10],
    ['Azúcar', 'azucar', 387, 0, 100, 0, 'cucharadita', 4],
    ['Miel', 'miel', 304, 0.3, 82, 0, 'cucharada', 21],
    ['Mermelada', 'mermelada', 250, 0.4, 65, 0.1, 'cucharada', 20],
    ['Jugo de naranja', 'jugo naranja zumo', 45, 0.7, 10, 0.2, 'vaso', 240],
    ['Bebida cola', 'bebida cola gaseosa refresco', 42, 0, 10.6, 0, 'lata', 350],
    ['Cerveza', 'cerveza', 43, 0.5, 3.6, 0, 'lata', 350],
    ['Vino tinto', 'vino tinto', 85, 0.1, 2.6, 0, 'copa', 150],
    ['Pizza', 'pizza', 266, 11, 33, 10, 'porción', 110],
    ['Hamburguesa con pan', 'hamburguesa pan', 295, 17, 24, 14, 'unidad', 200],
    ['Proteína en polvo (whey)', 'proteina polvo whey suero', 400, 80, 8, 6, 'medida', 30],
  ];
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const stem = (t) => (t.length > 4 ? t.replace(/(es|s)$/, '') : t.replace(/s$/, ''));
  const FOODS = F.map(([name, alias, kcal, p, c, f, unit, g]) => ({ name, kcal100: kcal, protein100: p, carbs100: c, fat100: f, unit: unit ? { name: unit, g } : null, generic: true, key: norm(name + ' ' + alias) }));
  // Busca por palabras sueltas; "huevos" encuentra "huevo", "papas" encuentra "papa"
  window.searchLocalFoods = (q) => {
    const toks = norm(q).split(/\s+/).filter(Boolean).map(stem); if (!toks.length) return [];
    const first = toks[0];
    return FOODS.filter((x) => toks.every((t) => x.key.includes(t)))
      .sort((a, b) => (norm(b.name).startsWith(first) - norm(a.name).startsWith(first))).slice(0, 12);
  };
  window.FOODS_COUNT = FOODS.length;
})();
