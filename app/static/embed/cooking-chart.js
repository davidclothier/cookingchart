/*! Cooking Chart \u2014 embeddable build \u00b7 Apache-2.0 \u00b7 Copyright 2025-2026 David Clothier */
(function () {
'use strict';
if (window.customElements && window.customElements.get('cooking-chart')) return;
const scope = { __CSS__: "/* SPDX-License-Identifier: Apache-2.0 \u00b7 Copyright 2025-2026 David Clothier */\n/* Cooking Chart v2 */\n\n.cc-scroll { overflow-x: auto; overflow-y: hidden; }\n.cc-svg { display: block; font-family: Inter, system-ui, sans-serif; font-size: 11px; }\n\n.cc-axis .grid { stroke: #e7e5e4; stroke-width: 1; }\n.cc-axis text { fill: #a8a29e; font-size: 10px; font-variant-numeric: tabular-nums; }\n.cc-axis .axis-title { fill: #a8a29e; }\n\n.cc-flow { fill: none; stroke-linecap: butt; }\n.cc-flow.wait { stroke-dasharray: 14 5; opacity: 0.4; }\n.cc-flow.wait.spoiled { stroke: #dc2626; opacity: 0.55; }\n\n.cc-ing-line { fill: none; stroke: #86efac; stroke-width: 1.2; }\n.cc-ing-text { fill: #292524; font-size: 11px; }\n.cc-ing-text .qty { fill: #a8a29e; font-variant-numeric: tabular-nums; }\n\n.cc-step { cursor: pointer; outline: none; }\n.cc-step rect { transition: filter 120ms; }\n.cc-step:hover rect:first-child,\n.cc-step:focus rect:first-child { filter: brightness(1.08) drop-shadow(0 2px 4px rgb(0 0 0 / 0.18)); }\n.cc-step-name { fill: #fff; font-weight: 600; pointer-events: none; }\n.cc-step-dur { fill: rgb(255 255 255 / 0.8); font-variant-numeric: tabular-nums; pointer-events: none; }\n.cc-critical-mark { fill: rgb(255 255 255 / 0.85); pointer-events: none; }\n\n.cc-below { fill: #57534e; font-size: 10.5px; }\n.cc-below.step { font-weight: 600; fill: #292524; }\n.cc-below.dur { fill: #78716c; font-variant-numeric: tabular-nums; }\n.cc-below.derived { fill: #a16207; font-style: italic; }\n\n.cc-dish-name { font-weight: 700; font-size: 13px; fill: #1c1917; }\n.cc-dish-time { fill: #78716c; font-size: 11px; }\n\n.cc-cursor line { stroke: #1c1917; stroke-width: 1; stroke-dasharray: 2 3; opacity: 0.5; pointer-events: none; }\n.cc-cursor text { fill: #1c1917; font-size: 10.5px; font-weight: 600; pointer-events: none; }\n\n.hl { transition: opacity 150ms; }\n.hl.dim { opacity: 0.12; }\n\n.cc-tooltip {\n  position: absolute; pointer-events: none; z-index: 10;\n  max-width: 280px; padding: 10px 12px;\n  background: #fff; border: 1px solid #e7e5e4; border-radius: 8px;\n  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);\n  font-size: 12px; color: #44403c; line-height: 1.45;\n  transition: opacity 100ms;\n}\n.cc-tooltip .tt-kind { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }\n.cc-tooltip .tt-title { font-weight: 700; font-size: 14px; color: #1c1917; }\n.cc-tooltip .tt-time { color: #78716c; font-variant-numeric: tabular-nums; margin-bottom: 4px; }\n.cc-tooltip .tt-meta { color: #78716c; }\n.cc-tooltip .tt-row span { display: inline-block; width: 30px; color: #a8a29e; }\n.cc-tooltip .tt-crit { margin-top: 6px; color: #b91c1c; font-weight: 600; }\n.cc-tooltip .tt-slack { margin-top: 6px; color: #15803d; }\n\n.cc-strip-label { fill: #78716c; font-size: 10.5px; }\n.cc-strip-bg { fill: #f5f5f4; }\n.cc-strip .seg { fill: #57534e; }\n.cc-strip .seg.over { fill: #dc2626; }\n.cc-strip-warn { fill: #b91c1c; font-size: 10.5px; }\n\n.cc-signature { width: 100%; height: auto; display: block; }\n\n.recipe-card { transition: border-color 120ms, box-shadow 120ms; }\n.recipe-card[aria-pressed=\"true\"] { border-color: #f97316; box-shadow: 0 0 0 3px rgb(249 115 22 / 0.15); }\n\n\n.plan-row.critical .plan-time { color: #b91c1c; }\n\n/* Vistas de texto: plan de trabajo y modo de elaboraci\u00f3n (recipe-text.js) */\n.cc-muted { color: #78716c; }\n.cc-h { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #78716c; margin: 0 0 8px; }\n.cc-h .cc-muted { text-transform: none; letter-spacing: 0; font-weight: 400; }\n\n.cc-method { display: grid; grid-template-columns: minmax(180px, 1fr) 3fr; gap: 24px; font-size: 14px; line-height: 1.6; color: #292524; }\n.cc-method ul, .cc-method ol { list-style: none; margin: 0; padding: 0; }\n.cc-method-ings li { padding: 3px 6px; margin: 0 -6px; border-radius: 4px; }\n.cc-method-tools { margin: 12px 0 0; font-size: 13px; color: #57534e; }\n.cc-moment { display: flex; gap: 12px; padding: 6px 0; border-top: 1px solid #f5f5f4; }\n.cc-moment:first-child { border-top: 0; }\n.cc-moment p { margin: 0; flex: 1; min-width: 0; }\n.cc-when { flex: 0 0 52px; font-weight: 600; color: #57534e; font-variant-numeric: tabular-nums; }\n.cc-moment-end .cc-when { color: #a16207; }\n.cc-clause { border-radius: 4px; transition: background-color 150ms; }\n.cc-ref { color: inherit; text-decoration: none; border-bottom: 1px solid; }\n.cc-ref-ing { border-color: #86efac; }\n.cc-ref-step { border-color: #d6d3d1; }\n.cc-ref-out { color: #b45309; font-style: italic; border-color: #fcd34d; }\n.cc-ref:hover { color: #c2410c; border-bottom-width: 2px; }\n.cc-ref-tool { color: inherit; border-bottom: 0; }\n.cc-active, .cc-flash { background: #fff7ed; }\n.cc-flash { animation: cc-flash 1.2s ease-out; }\n@keyframes cc-flash { from { background: #fed7aa; } to { background: transparent; } }\n\n.cc-plan { list-style: none; margin: 0; padding: 0; font-size: 14px; color: #44403c; }\n.cc-plan-row { display: flex; gap: 14px; padding: 10px 8px; border-top: 1px solid #f5f5f4; border-radius: 4px; }\n.cc-plan-row:first-child { border-top: 0; }\n.cc-plan-time { flex: 0 0 72px; font-weight: 600; color: #44403c; font-variant-numeric: tabular-nums; }\n.cc-plan-kind { flex: 0 0 10px; height: 10px; margin-top: 6px; border-radius: 2px; }\n.cc-plan-main { flex: 1; min-width: 0; }\n.cc-plan-name { font-weight: 600; color: #1c1917; }\n.cc-plan-details { display: block; font-size: 12px; color: #78716c; }\n.cc-plan-flow { display: block; color: #57534e; }\n.cc-plan-flow em { color: #b45309; }\n.cc-plan-note { font-size: 12px; white-space: nowrap; margin-top: 2px; }\n.cc-plan-bad { color: #b91c1c; }\n.cc-plan-ok { color: #15803d; }\n\n@media (max-width: 640px) {\n    .cc-method { grid-template-columns: 1fr; gap: 16px; }\n    .cc-when { flex-basis: 40px; }\n    .cc-plan-row { flex-wrap: wrap; gap: 4px 10px; }\n    .cc-plan-time { flex-basis: auto; }\n    .cc-plan-note { flex-basis: 100%; padding-left: 0; }\n}\n@media (prefers-reduced-motion: reduce) { .cc-flash { animation: none; } }\n" };
// ---- cooking-lang.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart Language (CCL) \u2014 parser
// Convierte el texto de una receta en el formato compacto que entiende
// recipe-model.js. Especificaci\u00f3n: SPEC.md (en) / SPEC.es.md (es).
//
//   const { recipe, diagnostics, ok } = CookingLang.parse(texto, { locale: 'es' });
//
// CCL es biling\u00fce: palabras clave, verbos y unidades se aceptan en espa\u00f1ol
// y en ingl\u00e9s, y pueden mezclarse. `locale` solo decide el idioma de los
// mensajes de error; el idioma de la receta (recipe.lang) se declara con
// `idioma`/`language` o se deduce de las palabras clave usadas.

(function (global) {
    'use strict';

    const LANGS = ['es', 'en'];

    // ------------------------------------------------------------------
    // Vocabulario controlado de verbos
    // ------------------------------------------------------------------
    // Cada verbo tiene un identificador can\u00f3nico (en ingl\u00e9s), un tipo, un modo
    // de atenci\u00f3n por defecto y sus formas en cada idioma.
    //   kind: prep | heat | oven | rest | assemble

    const VERB_TABLE = [
        // Preparaci\u00f3n (mec\u00e1nico): transforma forma o textura aplicando fuerza
        ['chop', 'prep', 'active', 'picar', 'chop mince'],
        ['cut', 'prep', 'active', 'cortar trocear', 'cut dice cube'],
        ['slice', 'prep', 'active', 'laminar filetear', 'slice fillet'],
        ['grate', 'prep', 'active', 'rallar', 'grate'],
        ['peel', 'prep', 'active', 'pelar', 'peel'],
        ['beat', 'prep', 'active', 'batir', 'beat whisk whip'],
        ['blend', 'prep', 'active', 'triturar', 'blend pur\u00e9e puree'],
        ['mash', 'prep', 'active', 'majar aplastar', 'mash crush'],
        ['knead', 'prep', 'active', 'amasar', 'knead'],
        ['sift', 'prep', 'active', 'tamizar', 'sift'],
        ['drain', 'prep', 'active', 'escurrir colar', 'drain strain'],
        ['wash', 'prep', 'active', 'lavar', 'wash rinse'],
        ['weigh', 'prep', 'active', 'pesar', 'weigh measure'],
        ['squeeze', 'prep', 'active', 'exprimir', 'squeeze juice'],
        ['crumble', 'prep', 'active', 'desmigar', 'crumble shred'],
        ['debone', 'prep', 'active', 'deshuesar', 'debone pit'],
        ['dry', 'prep', 'active', 'secar', 'dry pat_dry'],
        ['stir', 'prep', 'active', 'remover', 'stir'],
        ['divide', 'prep', 'active', 'dividir porcionar', 'divide portion'],
        // Montaje (combinaci\u00f3n): junta materias en una nueva
        ['mix', 'assemble', 'active', 'mezclar combinar', 'mix combine'],
        ['add', 'assemble', 'active', 'a\u00f1adir incorporar', 'add fold incorporate'],
        ['assemble', 'assemble', 'active', 'montar', 'assemble layer'],
        ['plate', 'assemble', 'active', 'emplatar servir', 'plate'],
        ['fill', 'assemble', 'active', 'rellenar', 'fill stuff'],
        ['shape', 'assemble', 'active', 'formar bolear', 'shape form'],
        ['wrap', 'assemble', 'active', 'envolver', 'wrap'],
        ['coat', 'assemble', 'active', 'rebozar empanar', 'coat bread dredge'],
        ['glaze', 'assemble', 'active', 'napar', 'glaze nap'],
        ['roll', 'assemble', 'active', 'estirar', 'roll'],
        ['garnish', 'assemble', 'active', 'decorar', 'garnish decorate'],
        ['finish', 'assemble', 'active', 'mantecar', 'finish'],
        ['bind', 'assemble', 'active', 'ligar', 'bind thicken'],
        ['emulsify', 'assemble', 'active', 'emulsionar', 'emulsify'],
        ['season', 'assemble', 'active', 'sazonar salpimentar salar', 'season'],
        ['dissolve', 'assemble', 'active', 'disolver diluir', 'dissolve dilute'],
        ['pour', 'assemble', 'active', 'verter', 'pour'],
        ['sprinkle', 'assemble', 'active', 'espolvorear', 'sprinkle dust'],
        ['brush', 'assemble', 'active', 'pincelar pintar', 'brush'],
        ['arrange', 'assemble', 'active', 'colocar disponer', 'arrange place'],
        // Fuego, atendido: hay que estar encima
        ['saute', 'heat', 'active', 'saltear', 'saut\u00e9 saute stir_fry'],
        ['sweat', 'heat', 'active', 'pochar rehogar sofre\u00edr', 'sweat soften'],
        ['brown', 'heat', 'active', 'dorar marcar', 'brown sear'],
        ['fry', 'heat', 'active', 'fre\u00edr', 'fry deep_fry'],
        ['toast', 'heat', 'active', 'tostar nacarar', 'toast'],
        ['caramelize', 'heat', 'active', 'caramelizar', 'caramelize caramelise'],
        ['melt', 'heat', 'active', 'fundir derretir', 'melt'],
        ['cook', 'heat', 'active', 'cocinar', 'cook'],
        ['flambe', 'heat', 'active', 'flambear', 'flamb\u00e9 flambe'],
        ['heat', 'heat', 'active', 'calentar', 'heat warm'],
        ['blanch', 'heat', 'active', 'escaldar blanquear', 'blanch scald'],
        ['grill', 'heat', 'active', 'asar_a_la_plancha asar_a_la_parrilla planchear', 'grill griddle'],
        // Fuego, desatendido: cocciones largas que se vigilan de vez en cuando
        ['boil', 'heat', 'passive', 'cocer hervir', 'boil'],
        ['simmer', 'heat', 'passive', 'guisar estofar', 'simmer stew'],
        ['reduce', 'heat', 'passive', 'reducir', 'reduce'],
        ['confit', 'heat', 'passive', 'confitar', 'confit'],
        ['poach', 'heat', 'passive', 'escalfar', 'poach'],
        ['braise', 'heat', 'passive', 'brasear', 'braise'],
        ['steam', 'heat', 'passive', 'cocer_al_vapor', 'steam'],
        // Horno
        ['bake', 'oven', 'passive', 'hornear', 'bake'],
        ['gratin', 'oven', 'passive', 'gratinar', 'gratin gratinate broil'],
        ['roast', 'oven', 'passive', 'asar', 'roast'],
        ['preheat', 'oven', 'passive', 'precalentar', 'preheat'],
        // Reposo: el tiempo hace el trabajo
        ['rest', 'rest', 'passive', 'reposar', 'rest'],
        ['proof', 'rest', 'passive', 'levar fermentar', 'proof prove rise ferment'],
        ['cool', 'rest', 'passive', 'enfriar templar', 'cool'],
        ['chill', 'rest', 'passive', 'refrigerar', 'chill refrigerate'],
        ['freeze', 'rest', 'passive', 'congelar', 'freeze'],
        ['marinate', 'rest', 'passive', 'marinar macerar', 'marinate macerate'],
        ['soak', 'rest', 'passive', 'hidratar remojar', 'soak hydrate'],
        ['thaw', 'rest', 'passive', 'descongelar', 'thaw defrost'],
        ['infuse', 'rest', 'passive', 'infusionar', 'infuse steep']
    ];

    const VERBS = {};        // id -> { kind, attention, names: {es, en} }
    const VERB_LOOKUP = {};  // forma escrita -> id
    VERB_TABLE.forEach(([id, kind, attention, es, en]) => {
        VERBS[id] = { kind, attention, names: { es: es.split(' '), en: en.split(' ') } };
        [...es.split(' '), ...en.split(' ')].forEach(w => { VERB_LOOKUP[w.toLowerCase()] = id; });
    });
    const lookupVerb = w => VERB_LOOKUP[w.toLowerCase()];

    // ------------------------------------------------------------------
    // Paquetes de vocabulario (extensiones)
    // ------------------------------------------------------------------
    // Un paquete a\u00f1ade verbos a una receta que lo declara con `usa "nombre"`
    // / `use "name"`. Sus identificadores llevan el prefijo del paquete
    // (`pastry:temper`) y, dentro de esa receta, tienen prioridad sobre el
    // vocabulario base (en pasteler\u00eda, "laminar" es hojaldrar, no cortar).
    //
    //   CookingLang.registerPack({
    //       id: 'pastry', names: { es: 'pasteler\u00eda', en: 'pastry' },
    //       verbs: [['temper', 'heat', 'active', 'atemperar', 'temper'], ...]
    //   });

    const PACKS = {};
    const fold = w => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function registerPack(def) {
        if (!def || !/^[a-z][a-z0-9_-]*$/.test(def.id || '')) throw new Error('registerPack: id inv\u00e1lido');
        const pack = { id: def.id, names: def.names || {}, version: def.version || null, verbs: {}, lookup: {} };
        (def.verbs || []).forEach(([id, kind, attention, es = '', en = '']) => {
            const full = `${def.id}:${id}`;
            pack.verbs[full] = { kind, attention, names: { es: es.split(' ').filter(Boolean), en: en.split(' ').filter(Boolean) } };
            [...pack.verbs[full].names.es, ...pack.verbs[full].names.en].forEach(w => { pack.lookup[w.toLowerCase()] = full; });
        });
        PACKS[def.id] = pack;
        return pack;
    }

    function findPack(name) {
        const f = fold(name);
        return Object.values(PACKS).find(p => p.id === f || Object.values(p.names).some(n => fold(n) === f));
    }

    // Verbo -> { id, kind, attention } con los paquetes activos de una receta
    function resolveVerb(word, packs = []) {
        const w = word.toLowerCase();
        for (const p of packs) {
            if (p.lookup[w]) return { id: p.lookup[w], ...p.verbs[p.lookup[w]] };
        }
        const id = VERB_LOOKUP[w];
        return id ? { id, ...VERBS[id] } : null;
    }

    // Tipos que el autor puede asignar con @tipo:\u2026 / @kind:\u2026
    const KIND_NAMES = {
        prep: ['prep', 'preparacion', 'preparaci\u00f3n', 'mecanico', 'mec\u00e1nico'],
        assemble: ['assemble', 'assembly', 'montaje', 'combinacion', 'combinaci\u00f3n'],
        heat: ['heat', 'stovetop', 'fuego'],
        oven: ['oven', 'horno'],
        rest: ['rest', 'reposo']
    };
    const kindOf = v => Object.keys(KIND_NAMES).find(k => KIND_NAMES[k].includes(v.toLowerCase()));

    // ------------------------------------------------------------------
    // Palabras clave
    // ------------------------------------------------------------------

    const KW = {
        recipe:      { es: ['receta'], en: ['recipe'] },
        description: { es: ['descripcion', 'descripci\u00f3n'], en: ['description'] },
        cuisine:     { es: ['cocina'], en: ['cuisine'] },
        language:    { es: ['idioma'], en: ['language', 'lang'] },
        servings:    { es: ['raciones'], en: ['servings', 'serves'] },
        cooks:       { es: ['cocineros'], en: ['cooks'] },
        burners:     { es: ['fuegos'], en: ['burners'] },
        plan:        { es: ['plan', 'planificaci\u00f3n', 'planificacion'], en: ['schedule'] },
        ingredients: { es: ['ingredientes'], en: ['ingredients'] },
        tools:       { es: ['herramientas', 'utensilios'], en: ['tools', 'equipment'] },
        block:       { es: ['bloque'], en: ['block'] },
        end:         { es: ['fin'], en: ['end'] },
        serve:       { es: ['servir'], en: ['serve'] },
        in:          { es: ['en', 'con'], en: ['in', 'with', 'on'] },
        until:       { es: ['hasta'], en: ['until'] },
        attended:    { es: ['atendido'], en: ['attended'] },
        unattended:  { es: ['desatendido'], en: ['unattended'] },
        keeps:       { es: ['aguanta'], en: ['keeps'] },
        use:         { es: ['usa', 'usar'], en: ['use'] }
    };
    const KEYWORDS = Object.fromEntries(Object.entries(KW).map(([k, v]) => [k, [...v.es, ...v.en]]));
    const isKw = (word, key) => KEYWORDS[key].includes(word.toLowerCase());
    const kwLang = word => LANGS.find(l => Object.values(KW).some(v => v[l].includes(word.toLowerCase())));

    const PLAN_VALUES = {
        asap: ['asap', 'lo_antes_posible', 'lo antes posible', 'cuanto_antes', 'as_soon_as_possible'],
        alap: ['alap', 'jit', 'justo_a_tiempo', 'justo a tiempo', 'just_in_time', 'just in time']
    };

    // ------------------------------------------------------------------
    // Unidades: forma can\u00f3nica + c\u00f3mo se muestra en cada idioma
    // ------------------------------------------------------------------

    const UNIT_TABLE = [
        ['g', 'g', 'g', 'g gr gramo gramos gram grams'],
        ['kg', 'kg', 'kg', 'kg kilo kilos kilogram kilograms'],
        ['mg', 'mg', 'mg', 'mg'],
        ['oz', 'oz', 'oz', 'oz onza onzas ounce ounces'],
        ['lb', 'lb', 'lb', 'lb lbs libra libras pound pounds'],
        ['ml', 'ml', 'ml', 'ml mililitro mililitros milliliter milliliters millilitre millilitres'],
        ['cl', 'cl', 'cl', 'cl'],
        ['dl', 'dl', 'dl', 'dl'],
        ['l', 'l', 'l', 'l lt litro litros liter liters litre litres'],
        ['unit', 'ud', 'pc', 'ud uds un unidad unidades pieza piezas unit units pc pcs piece pieces'],
        ['tbsp', 'cda', 'tbsp', 'cda cdas cd cucharada cucharadas tbsp tbsps tablespoon tablespoons'],
        ['tsp', 'cdta', 'tsp', 'cdta cdtas ct cucharadita cucharaditas tsp tsps teaspoon teaspoons'],
        ['cup', 'taza', 'cup', 'taza tazas cup cups'],
        ['glass', 'vaso', 'glass', 'vaso vasos glass glasses'],
        ['pinch', 'pizca', 'pinch', 'pizca pizcas pz pinch pinches'],
        ['splash', 'chorrito', 'splash', 'chorro chorros chorrito chorritos splash splashes dash dashes'],
        ['handful', 'pu\u00f1ado', 'handful', 'pu\u00f1ado pu\u00f1ados handful handfuls'],
        ['bunch', 'manojo', 'bunch', 'manojo manojos bunch bunches'],
        ['clove', 'diente', 'clove', 'diente dientes clove cloves'],
        ['leaf', 'hoja', 'leaf', 'hoja hojas leaf leaves'],
        ['sprig', 'rama', 'sprig', 'rama ramas ramita ramitas sprig sprigs'],
        ['stalk', 'tallo', 'stalk', 'tallo tallos stalk stalks'],
        ['can', 'lata', 'can', 'lata latas can cans tin tins'],
        ['sachet', 'sobre', 'sachet', 'sobre sobres sachet sachets packet packets'],
        ['slice', 'rebanada', 'slice', 'rebanada rebanadas slice slices'],
        ['rasher', 'loncha', 'slice', 'loncha lonchas rasher rashers']
    ];
    // Plural de las unidades que no son abreviaturas (2 dientes, 6 leaves)
    const PLURALS = {
        es: { taza: 'tazas', vaso: 'vasos', pizca: 'pizcas', diente: 'dientes', hoja: 'hojas', rama: 'ramas',
              tallo: 'tallos', lata: 'latas', sobre: 'sobres', rebanada: 'rebanadas', loncha: 'lonchas',
              chorrito: 'chorritos', 'pu\u00f1ado': 'pu\u00f1ados', manojo: 'manojos' },
        en: { cup: 'cups', glass: 'glasses', pinch: 'pinches', clove: 'cloves', leaf: 'leaves', sprig: 'sprigs',
              stalk: 'stalks', can: 'cans', sachet: 'sachets', slice: 'slices', splash: 'splashes', handful: 'handfuls', bunch: 'bunches' }
    };
    const UNITS = {};        // can\u00f3nica -> { es, en }
    const UNIT_LOOKUP = {};  // forma escrita -> can\u00f3nica
    UNIT_TABLE.forEach(([id, es, en, forms]) => {
        UNITS[id] = { es, en };
        forms.split(' ').forEach(f => { UNIT_LOOKUP[f] = id; });
    });
    function unitLabel(id, lang, quantity) {
        const one = UNITS[id][lang];
        // Plural solo con cantidades num\u00e9ricas distintas de 1 (las fracciones van en singular: 1/2 taza)
        return typeof quantity === 'number' && quantity !== 1 ? (PLURALS[lang][one] || one) : one;
    }
    const SPECIAL_QTY = {
        to_taste: { es: 'al gusto', en: 'to taste' },
        as_needed: { es: 'c.s.', en: 'as needed' }
    };

    // ------------------------------------------------------------------
    // Mensajes
    // ------------------------------------------------------------------

    const MSG = {
        es: {
            badCooks: () => '"cocineros" espera un n\u00famero (o "ilimitados")',
            badBurners: () => '"fuegos" espera un n\u00famero',
            unknownPack: n => `Paquete de vocabulario desconocido "${n}"`,
            badKind: v => `Tipo desconocido "${v}". Usa preparaci\u00f3n, montaje, fuego, horno o reposo`,
            badPlan: v => `Plan desconocido "${v}". Usa "lo_antes_posible" o "justo_a_tiempo"`,
            badLang: v => `Idioma desconocido "${v}". Usa "es" o "en"`,
            blockUsage: () => 'Uso: bloque "Nombre"',
            serveUsage: () => 'Uso: servir <resultado>',
            plusOrphan: () => 'Un "+" tiene que ir justo despu\u00e9s de un paso',
            plusUsage: () => 'Uso: + ingrediente[, ingrediente] a los <tiempo>   (p. ej. "+ vino a los 5min")',
            badTime: t => `No entiendo el tiempo "${t}"`,
            addLate: (at, d) => `Se a\u00f1ade en el minuto ${at}, pero el paso solo dura ${d}`,
            notUnderstoodIndented: () => 'No entiendo esta l\u00ednea. \u00bfQuer\u00edas un a\u00f1adido? Empieza por "+".',
            notUnderstood: l => `No entiendo "${l}". Un paso se escribe: resultado = verbo(ingredientes) duraci\u00f3n`,
            badIngredient: () => 'Ingrediente mal escrito. Uso: nombre cantidad unidad "nombre visible"',
            dupIngredient: id => `El ingrediente "${id}" ya est\u00e1 declarado`,
            unknownUnit: u => `Unidad desconocida "${u}"; se mostrar\u00e1 tal cual`,
            badTool: t => `Herramienta mal escrita: "${t}". Uso: nombre [x cantidad]`,
            badInput: t => `Entrada mal escrita: "${t}"`,
            badFraction: f => `Fracci\u00f3n fuera de rango: ${f}`,
            dupResult: (id, l) => `"${id}" ya se ha producido en otro paso (l\u00ednea ${l})`,
            resultIsIngredient: id => `"${id}" ya es un ingrediente; usa otro nombre para el resultado`,
            unknownVerb: v => `Verbo "${v}" fuera del vocabulario; se clasificar\u00e1 por aproximaci\u00f3n`,
            noInputs: v => `"${v}" no tiene entradas`,
            badModifier: w => `No entiendo "${w}" en este paso`,
            noDurationCond: c => `Sin duraci\u00f3n estimada para "hasta ${c}"; se usar\u00e1 0`,
            noDuration: () => 'Falta la duraci\u00f3n (p. ej. "10min", "1h30", "8-10min")',
            selfUse: id => `"${id}" no puede usarse a s\u00ed mismo`,
            undefinedName: id => `"${id}" no est\u00e1 definido: decl\u00e1ralo en ingredientes o prod\u00facelo en un paso anterior`,
            undeclaredTool: t => `Herramienta "${t}" no declarada en "herramientas"`,
            unusedIngredient: id => `El ingrediente "${id}" no se usa en ning\u00fan paso`,
            mixedParts: id => `"${id}" se usa entero y tambi\u00e9n por partes`,
            partsOver: (id, p) => `Las partes de "${id}" suman m\u00e1s del total (${p} %)`,
            partsUnder: (id, p) => `Solo se usa el ${p} % de "${id}"`,
            serveUndefined: id => `"${id}" no lo produce ning\u00fan paso`,
            missingServe: id => `Falta "servir <resultado>"; se toma "${id}" como plato final`,
            unusedResult: id => `"${id}" se produce pero no se usa ni se sirve`,
            noSteps: () => 'La receta no tiene pasos',
            cycle: id => `Dependencia circular en "${id}"`,
            keepOnFinal: () => '"aguanta"/"sin espera" no tiene efecto en el plato final',
            untitled: () => 'Receta sin t\u00edtulo'
        },
        en: {
            badCooks: () => '"cooks" expects a number (or "unlimited")',
            badBurners: () => '"burners" expects a number',
            unknownPack: n => `Unknown vocabulary pack "${n}"`,
            badKind: v => `Unknown kind "${v}". Use prep, assembly, stovetop, oven or rest`,
            badPlan: v => `Unknown schedule "${v}". Use "asap" or "just_in_time"`,
            badLang: v => `Unknown language "${v}". Use "es" or "en"`,
            blockUsage: () => 'Usage: block "Name"',
            serveUsage: () => 'Usage: serve <result>',
            plusOrphan: () => 'A "+" must come right after a step',
            plusUsage: () => 'Usage: + ingredient[, ingredient] at <time>   (e.g. "+ wine at 5min")',
            badTime: t => `Can't read the time "${t}"`,
            addLate: (at, d) => `Added at minute ${at}, but the step only lasts ${d}`,
            notUnderstoodIndented: () => 'Can\'t read this line. Did you mean an addition? Start it with "+".',
            notUnderstood: l => `Can't read "${l}". A step is written: result = verb(ingredients) duration`,
            badIngredient: () => 'Malformed ingredient. Usage: name quantity unit "display name"',
            dupIngredient: id => `Ingredient "${id}" is already declared`,
            unknownUnit: u => `Unknown unit "${u}"; it will be shown as is`,
            badTool: t => `Malformed tool: "${t}". Usage: name [x amount]`,
            badInput: t => `Malformed input: "${t}"`,
            badFraction: f => `Fraction out of range: ${f}`,
            dupResult: (id, l) => `"${id}" is already produced by another step (line ${l})`,
            resultIsIngredient: id => `"${id}" is already an ingredient; pick another name for the result`,
            unknownVerb: v => `Verb "${v}" is not in the vocabulary; it will be classified approximately`,
            noInputs: v => `"${v}" has no inputs`,
            badModifier: w => `Can't read "${w}" in this step`,
            noDurationCond: c => `No estimated duration for "until ${c}"; 0 will be used`,
            noDuration: () => 'Missing duration (e.g. "10min", "1h30", "8-10min")',
            selfUse: id => `"${id}" can't use itself`,
            undefinedName: id => `"${id}" is not defined: declare it under ingredients or produce it in a step`,
            undeclaredTool: t => `Tool "${t}" is not declared under "tools"`,
            unusedIngredient: id => `Ingredient "${id}" is not used by any step`,
            mixedParts: id => `"${id}" is used both whole and in parts`,
            partsOver: (id, p) => `Parts of "${id}" add up to more than the total (${p} %)`,
            partsUnder: (id, p) => `Only ${p} % of "${id}" is used`,
            serveUndefined: id => `No step produces "${id}"`,
            missingServe: id => `Missing "serve <result>"; "${id}" is taken as the final dish`,
            unusedResult: id => `"${id}" is produced but never used or served`,
            noSteps: () => 'The recipe has no steps',
            cycle: id => `Circular dependency in "${id}"`,
            keepOnFinal: () => '"keeps"/"no wait" has no effect on the final dish',
            untitled: () => 'Untitled recipe'
        }
    };

    // ------------------------------------------------------------------
    // L\u00e9xico
    // ------------------------------------------------------------------

    const ID = '[\\p{L}_][\\p{L}\\p{N}_]*';
    const NUM = '\\d+(?:[.,]\\d+)?';
    // Par\u00e1metros: identificador, con prefijo x- y guiones para extensiones (@x-thermomix-velocidad:4)
    const PARAM = `(?:x-)?${ID}(?:-[\\p{L}\\p{N}_]+)*`;
    const re = (src, flags = '') => new RegExp(src, 'u' + flags);
    // G\u00e9nero y n\u00famero gramatical opcionales tras un nombre: (f), (m), (f pl), (m pl).
    // Solo los usa el modo de elaboraci\u00f3n para poner bien los art\u00edculos.
    const GRAM = '\\(\\s*([mf])\\.?\\s*(pl\\.?)?\\s*\\)';
    const gramOf = (g, pl) => (g ? g.toLowerCase() + (pl ? 'p' : '') : null);

    const RX = {
        header: re(`^(\\p{L}+)\\s+(.*)$`),
        string: re(`^"([^"]*)"$`),
        // cantidad: n\u00famero, fracci\u00f3n (1/2) o rango (3-4)
        ingredient: re(`^(${ID})(?:\\s+(${NUM}(?:\\s*-\\s*${NUM})?|\\d+\\/\\d+)(?:\\s*([\\p{L}.]+))?)?(?:\\s+(al gusto|to taste|c\\.s\\.|as needed))?(?:\\s+"([^"]*)")?(?:\\s*${GRAM})?$`, 'i'),
        tool: re(`^(${ID})(?:\\s*${GRAM})?(?:\\s*[x\u00d7]\\s*(\\d+))?$`, 'i'),
        // verbo: del vocabulario, de un paquete, o propio con prefijo x-
        step: re(`^(${ID})(?:\\s+"([^"]*)")?(?:\\s*${GRAM})?\\s*=\\s*(x-${ID}(?:-[\\p{L}\\p{N}_]+)*|${ID})\\s*\\(([^)]*)\\)\\s*(.*)$`),
        input: re(`^(${ID})(?:\\s*\\[\\s*(\\d+\\s*\\/\\s*\\d+|${NUM}\\s*%)\\s*\\])?$`),
        addition: re(`^\\+\\s*(.+?)\\s+(?:a los|a las|al|at|after|@)\\s*(.+)$`, 'i'),
        serve: re(`^(\\p{L}+)\\s+(${ID})(?:\\s+"([^"]*)")?$`),
        block: re(`^(\\p{L}+)\\s+"([^"]*)"\\s*\\{?$`),
        // grupos: 1 aprox, 2 desde, 3 hasta, 4 minutos tras las horas (1h30), 5 unidad si no son horas
        duration: re(`^(~)?\\s*(${NUM})(?:\\s*-\\s*(${NUM}))?\\s*(?:h(?!\\p{L})(?:\\s*(\\d+)(?:\\s*min(?!\\p{L}))?)?|(min|m|seg|sec|s)(?!\\p{L}))`, 'i'),
        noWait: re(`^(?:sin\\s+espera|no\\s+wait|inmediato|immediately)(?!\\p{L})`, 'i')
    };

    const num = s => parseFloat(String(s).replace(',', '.'));

    // "1h30" -> 90, "8-10min" -> {min: 8, max: 10}, "90s" -> 1.5
    function parseDuration(text) {
        const m = RX.duration.exec(text.trim());
        if (!m) return null;
        const factor = m[5] ? { min: 1, m: 1, s: 1 / 60, seg: 1 / 60, sec: 1 / 60 }[m[5].toLowerCase()] : 60;
        const extra = m[4] ? num(m[4]) : 0;
        const lo = num(m[2]) * factor + extra;
        const hi = m[3] ? num(m[3]) * factor + extra : lo;
        return { min: lo, max: hi, approx: !!m[1], length: m[0].length };
    }

    function formatTemp(v, scale, lang) {
        const s = lang === 'es' ? String(v).replace('.', ',') : String(v);
        return `${s}\u00b0${scale.toUpperCase()}`;
    }

    // carne_dorada -> "Carne dorada"
    function prettyId(id) {
        const s = id.replace(/_/g, ' ');
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function stripComment(line) {
        let inStr = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') inStr = !inStr;
            if (!inStr && (c === '#' || (c === '/' && line[i + 1] === '/') || (c === '%' && line[i + 1] === '%'))) {
                return line.slice(0, i);
            }
        }
        return line;
    }

    // Idioma de la receta: el declarado o, si no, el de la mayor\u00eda de sus palabras clave
    function detectLanguage(lines) {
        const votes = { es: 0, en: 0 };
        lines.forEach(raw => {
            const line = stripComment(raw).trim();
            const lang = (/^\p{L}+/u.exec(line) || [])[0];
            const l = lang && kwLang(lang);
            if (l && !isKw(lang, 'plan')) votes[l]++;
            const m = re(`^(\\p{L}+)\\s+(\\p{L}+)$`).exec(line);
            if (m && isKw(m[1], 'language') && LANGS.includes(m[2].toLowerCase())) votes[m[2].toLowerCase()] += 1000;
            const v = re(`=\\s*(${ID})\\s*\\(`).exec(line);
            if (v && lookupVerb(v[1])) {
                const id = lookupVerb(v[1]);
                LANGS.forEach(lg => { if (VERBS[id].names[lg].includes(v[1].toLowerCase())) votes[lg] += 0.5; });
            }
        });
        return votes.es > votes.en ? 'es' : 'en';
    }

    // ------------------------------------------------------------------
    // Parser
    // ------------------------------------------------------------------

    function parse(text, options = {}) {
        const lines = text.split(/\r?\n/);
        const lang = detectLanguage(lines);
        const locale = LANGS.includes(options.locale) ? options.locale : lang;
        const T = MSG[locale];

        // Cada diagn\u00f3stico lleva un c\u00f3digo estable (para la bater\u00eda de conformidad
        // y para otras implementaciones) y el mensaje en el idioma pedido
        const diagnostics = [];
        const report = severity => (line, code, ...args) =>
            diagnostics.push({ severity, line, code, message: T[code](...args) });
        const error = report('error');
        const warn = report('warning');

        const recipe = {
            name: T.untitled(),
            description: '',
            cuisine: null,
            lang,
            plan: null,
            servings: null,
            cooks: null,
            burners: null,
            ingredients: [],
            tools: [],
            steps: [],
            dish: null
        };
        const ingredients = new Map();   // id -> ingrediente
        const tools = new Map();         // id -> {id, name, capacity}
        const steps = new Map();         // id de salida -> paso
        const toolState = new Map();     // var que es una herramienta en otro estado -> herramienta base
        let section = null;
        let block = null;
        let lastStep = null;
        let serve = null;

        // Paquetes de vocabulario: se leen antes que nada, est\u00e9n donde est\u00e9n
        const packs = [];
        recipe.packs = [];
        lines.forEach((raw, idx) => {
            const m = re(`^(\\p{L}+)\\s+"([^"]+)"$`).exec(stripComment(raw).trim());
            if (!m || !isKw(m[1], 'use')) return;
            const pack = findPack(m[2]);
            if (pack) { packs.push(pack); recipe.packs.push(pack.id); } else warn(idx + 1, 'unknownPack', m[2]);
        });

        lines.forEach((rawLine, idx) => {
            const ln = idx + 1;
            const indented = /^\s/.test(rawLine);
            const line = stripComment(rawLine).trim();
            if (!line) return;
            const first = line.split(/\s+/)[0];

            // --- Secciones
            if (isKw(first, 'ingredients') && line.split(/\s+/).length === 1) { section = 'ingredients'; return; }
            if (isKw(first, 'tools')) {
                section = 'tools';
                const rest = line.slice(first.length).trim();
                if (rest) parseTools(rest, ln);
                return;
            }

            // --- Cabecera
            const h = RX.header.exec(line);
            if (h && !line.includes('=') && !line.startsWith('+')) {
                const value = h[2].trim();
                const str = RX.string.exec(value);
                if (isKw(first, 'recipe')) { recipe.name = str ? str[1] : value; section = null; return; }
                if (isKw(first, 'description')) { recipe.description = str ? str[1] : value; return; }
                if (isKw(first, 'cuisine')) { recipe.cuisine = str ? str[1] : value; return; }
                if (isKw(first, 'language')) {
                    if (!LANGS.includes(value.toLowerCase())) error(ln, 'badLang', value);
                    return;
                }
                if (isKw(first, 'servings')) { recipe.servings = num(value); return; }
                if (isKw(first, 'cooks')) {
                    if (/^(\d+)$/.test(value)) recipe.cooks = parseInt(value, 10);
                    else if (!/^(ilimitados|unlimited)$/i.test(value)) error(ln, 'badCooks');
                    return;
                }
                if (isKw(first, 'burners')) {
                    if (/^(\d+)$/.test(value)) recipe.burners = parseInt(value, 10);
                    else error(ln, 'badBurners');
                    return;
                }
                if (isKw(first, 'use')) return;   // ya procesado
                if (isKw(first, 'plan')) {
                    const v = value.toLowerCase();
                    const mode = Object.keys(PLAN_VALUES).find(k => PLAN_VALUES[k].includes(v));
                    if (mode) recipe.plan = mode; else error(ln, 'badPlan', value);
                    return;
                }
                if (isKw(first, 'block')) {
                    const b = RX.block.exec(line);
                    if (!b) { error(ln, 'blockUsage'); return; }
                    block = b[2]; section = null; return;
                }
                if (isKw(first, 'serve')) {
                    const s = RX.serve.exec(line);
                    if (!s) { error(ln, 'serveUsage'); return; }
                    serve = { id: s[2], name: s[3], line: ln };
                    section = null;
                    return;
                }
            }
            if (isKw(first, 'end') || line === '}') { block = null; return; }

            // --- A\u00f1adido a mitad de proceso:  + vino a los 5min
            if (line.startsWith('+')) {
                if (!lastStep) { error(ln, 'plusOrphan'); return; }
                const a = RX.addition.exec(line);
                if (!a) { error(ln, 'plusUsage'); return; }
                const at = parseDuration(a[2]);
                if (!at) { error(ln, 'badTime', a[2]); return; }
                if (at.min > lastStep.durationMax) warn(ln, 'addLate', at.min, lastStep.durationMax);
                a[1].split(',').forEach(part => {
                    const inp = parseInput(part.trim(), ln);
                    if (inp) lastStep.inputs.push({ ...inp, at: at.min, line: ln });
                });
                return;
            }

            // --- Paso:  salida = verbo(entradas) modificadores
            const st = RX.step.exec(line);
            if (st) {
                section = null;
                parseStep(st, ln);
                return;
            }

            // --- L\u00edneas dentro de secciones
            if (section === 'ingredients') { parseIngredient(line, ln); return; }
            if (section === 'tools') { parseTools(line, ln); return; }

            if (indented && lastStep) { error(ln, 'notUnderstoodIndented'); return; }
            error(ln, 'notUnderstood', line);
        });

        function parseIngredient(line, ln) {
            const m = RX.ingredient.exec(line);
            if (!m) { error(ln, 'badIngredient'); return; }
            const [, id, qty, unitRaw, special, label, g, pl] = m;
            if (ingredients.has(id)) { error(ln, 'dupIngredient', id); return; }
            const range = qty && /\d\s*-\s*\d/.test(qty);
            let unit;
            if (unitRaw) {
                const canon = UNIT_LOOKUP[unitRaw.toLowerCase().replace(/\.$/, '')];
                // Un rango va en plural (2-3 dientes); una fracci\u00f3n, en singular (1/2 taza)
                if (canon) unit = unitLabel(canon, lang, range ? 2 : qty && !qty.includes('/') ? num(qty) : qty);
                else { warn(ln, 'unknownUnit', unitRaw); unit = unitRaw; }
            }
            let quantity = null;
            if (qty) quantity = qty.includes('/') || range ? qty.replace(/\s/g, '') : num(qty);
            if (special) {
                const key = /gusto|taste/i.test(special) ? 'to_taste' : 'as_needed';
                if (quantity == null) { quantity = ''; unit = SPECIAL_QTY[key][lang]; }
            }
            ingredients.set(id, { id, name: label || prettyId(id), quantity, unit, gram: gramOf(g, pl), line: ln, used: false });
        }

        function parseTools(line, ln) {
            line.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
                const m = RX.tool.exec(t);
                if (!m) { error(ln, 'badTool', t); return; }
                tools.set(m[1], { id: m[1], name: prettyId(m[1]), gram: gramOf(m[2], m[3]), capacity: m[4] ? parseInt(m[4], 10) : 1, line: ln });
            });
        }

        function parseInput(text, ln) {
            const m = RX.input.exec(text);
            if (!m) { error(ln, 'badInput', text); return null; }
            let fraction = null;
            if (m[2]) {
                const f = m[2].replace(/\s/g, '');
                fraction = f.endsWith('%') ? num(f) / 100 : num(f.split('/')[0]) / num(f.split('/')[1]);
                if (!(fraction > 0 && fraction <= 1)) { error(ln, 'badFraction', m[2]); fraction = null; }
            }
            return { ref: m[1], fraction, fractionText: m[2] ? m[2].replace(/\s/g, '') : null };
        }

        function parseStep(st, ln) {
            const [, out, outLabel, g, pl, verbRaw, inputsRaw, rest] = st;
            if (steps.has(out)) { error(ln, 'dupResult', out, steps.get(out).line); return; }
            if (ingredients.has(out)) { error(ln, 'resultIsIngredient', out); return; }
            const custom = /^x-/i.test(verbRaw);
            const verbInfo = custom ? null : resolveVerb(verbRaw, packs);
            if (!verbInfo && !custom) warn(ln, 'unknownVerb', verbRaw);

            const step = {
                id: out, verb: verbRaw.toLowerCase(), verbId: verbInfo ? verbInfo.id : null, verbInfo, kind: null,
                outLabel, gram: gramOf(g, pl), line: ln, block,
                inputs: [], tools: [], toolPreps: {}, params: {}, temperature: null,
                duration: null, durationMax: null, approx: false,
                condition: null, attention: null, keep: null
            };
            inputsRaw.split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
                const inp = parseInput(part, ln);
                if (inp) step.inputs.push({ ...inp, at: 0, line: ln });
            });
            if (!step.inputs.length) warn(ln, 'noInputs', verbRaw);

            // Modificadores, en cualquier orden
            let s = rest.trim();
            while (s.length) {
                let m;
                if ((m = re(`^(\\p{L}+)\\s+(${ID}(?:\\s*,\\s*${ID})*)`).exec(s)) && isKw(m[1], 'in')) {
                    m[2].split(',').forEach(t => {
                        step.tools.push(t.trim());
                        // "con colador", "on rack": la preposici\u00f3n, si no es la de recipiente (en/in)
                        if (!/^(en|in)$/i.test(m[1])) step.toolPreps[t.trim()] = m[1].toLowerCase();
                    });
                } else if ((m = re(`^@\\s*(${NUM})\\s*(?:\u00ba|\u00b0)?\\s*([CF])(?!\\p{L})`, 'i').exec(s))) {
                    step.temperature = formatTemp(m[1], m[2], lang);
                } else if ((m = re(`^@\\s*(${PARAM})\\s*:\\s*([^\\s]+)`).exec(s))) {
                    const key = m[1].toLowerCase();
                    if (key === 'tipo' || key === 'kind') {
                        step.kind = kindOf(m[2]) || null;
                        if (!step.kind) warn(ln, 'badKind', m[2]);
                    } else {
                        step.params[key] = m[2].replace(/_/g, ' ');
                    }
                } else if ((m = re(`^@\\s*(${PARAM})`).exec(s))) {
                    step.params[m[1].toLowerCase()] = true;
                } else if ((m = re(`^(\\p{L}+)\\s+"([^"]*)"`).exec(s)) && isKw(m[1], 'until')) {
                    step.condition = m[2];
                } else if ((m = RX.noWait.exec(s))) {
                    step.keep = 0;
                } else if ((m = re(`^(\\p{L}+)\\s+`).exec(s)) && isKw(m[1], 'keeps') && parseDuration(s.slice(m[0].length))) {
                    const d = parseDuration(s.slice(m[0].length));
                    step.keep = d.max;
                    m = [s.slice(0, m[0].length + d.length)];
                } else if ((m = re(`^(\\p{L}+)(?!\\p{L})`).exec(s)) && (isKw(m[1], 'attended') || isKw(m[1], 'unattended'))) {
                    step.attention = isKw(m[1], 'attended') ? 'active' : 'passive';
                } else if (RX.duration.test(s)) {
                    const d = parseDuration(s);
                    step.duration = d.min;
                    step.durationMax = d.max;
                    step.approx = d.approx;
                    m = [s.slice(0, d.length)];
                } else {
                    error(ln, 'badModifier', s.split(/\s+/)[0]);
                    break;
                }
                s = s.slice(m[0].length).trim();
            }
            if (step.duration === null) {
                if (step.condition) warn(ln, 'noDurationCond', step.condition);
                else error(ln, 'noDuration');
                step.duration = step.durationMax = 0;
            }

            steps.set(out, step);
            lastStep = step;
        }

        // ------------------------------------------------------------------
        // Resoluci\u00f3n de nombres y validaci\u00f3n
        // ------------------------------------------------------------------

        const resolved = [...steps.values()];
        resolved.forEach(step => {
            step.uses = [];
            step.toolsBase = [];
            const useTool = t => { if (!step.toolsBase.includes(t)) step.toolsBase.push(t); };

            step.inputs.forEach(inp => {
                if (ingredients.has(inp.ref)) {
                    ingredients.get(inp.ref).used = true;
                    step.uses.push({ ref: inp.ref, at: inp.at, fraction: inp.fraction, fractionText: inp.fractionText });
                } else if (steps.has(inp.ref)) {
                    if (inp.ref === step.id) { error(inp.line, 'selfUse', inp.ref); return; }
                    steps.get(inp.ref).consumed = true;
                    step.uses.push({ ref: inp.ref, at: inp.at, fraction: inp.fraction, fractionText: inp.fractionText });
                    if (toolState.has(inp.ref)) useTool(toolState.get(inp.ref));
                } else if (tools.has(inp.ref)) {
                    useTool(inp.ref);
                } else {
                    error(inp.line, 'undefinedName', inp.ref);
                }
            });
            step.tools.forEach(t => {
                if (tools.has(t)) useTool(t);
                else if (steps.has(t)) {
                    // "en horno_caliente": dependencia de un paso + uso de la herramienta base
                    steps.get(t).consumed = true;
                    step.uses.push({ ref: t, at: 0 });
                    if (toolState.has(t)) useTool(toolState.get(t));
                } else {
                    // Herramienta sin declarar: se admite, sin l\u00edmite de capacidad
                    warn(step.line, 'undeclaredTool', t);
                    tools.set(t, { id: t, name: prettyId(t), capacity: null, implicit: true });
                    useTool(t);
                }
            });
            // Un paso que solo act\u00faa sobre herramientas produce esa herramienta en otro estado
            const onlyTools = step.inputs.length && step.inputs.every(i => tools.has(i.ref) || toolState.has(i.ref));
            if (onlyTools) toolState.set(step.id, step.toolsBase[0]);
        });

        ingredients.forEach(i => { if (!i.used) warn(i.line, 'unusedIngredient', i.id); });

        // Fracciones: aceite[1/2] + aceite[1/2] deber\u00eda sumar el total
        const parts = new Map();
        resolved.forEach(st => st.uses.forEach(u => {
            if (!parts.has(u.ref)) parts.set(u.ref, { sum: 0, whole: false, line: st.line });
            const p = parts.get(u.ref);
            if (u.fraction) p.sum += u.fraction; else p.whole = true;
        }));
        parts.forEach((p, ref) => {
            if (!p.sum) return;
            if (p.whole) warn(p.line, 'mixedParts', ref);
            else if (p.sum > 1 + 1e-6) warn(p.line, 'partsOver', ref, Math.round(p.sum * 100));
            else if (p.sum < 1 - 1e-6) warn(p.line, 'partsUnder', ref, Math.round(p.sum * 100));
        });

        // El plato final
        let finalId = null;
        if (serve) {
            if (!steps.has(serve.id)) error(serve.line, 'serveUndefined', serve.id);
            else finalId = serve.id;
        } else if (resolved.length) {
            const sinks = resolved.filter(s => !s.consumed);
            finalId = (sinks[sinks.length - 1] || resolved[resolved.length - 1]).id;
            warn(resolved[resolved.length - 1].line, 'missingServe', finalId);
        }
        resolved.forEach(s => {
            if (!s.consumed && s.id !== finalId && !toolState.has(s.id)) warn(s.line, 'unusedResult', s.id);
            if (s.id === finalId && s.keep !== null) warn(s.line, 'keepOnFinal');
        });
        if (!resolved.length) error(1, 'noSteps');

        // Ciclos (un paso puede citar resultados declarados m\u00e1s abajo)
        const visiting = new Set();
        const done = new Set();
        const visit = id => {
            if (done.has(id)) return true;
            if (visiting.has(id)) return false;
            visiting.add(id);
            const ok = steps.get(id).uses.every(u => !steps.has(u.ref) || visit(u.ref));
            visiting.delete(id);
            done.add(id);
            return ok;
        };
        resolved.forEach(s => { if (!visit(s.id)) error(s.line, 'cycle', s.id); });

        // ------------------------------------------------------------------
        // Salida en formato compacto (recipe-model.js)
        // ------------------------------------------------------------------

        recipe.ingredients = [...ingredients.values()].filter(i => i.used).map(i => ({
            id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, ...(i.gram ? { gram: i.gram } : {})
        }));
        recipe.tools = [...tools.values()].map(t => ({ id: t.id, name: t.name, capacity: t.capacity, ...(t.gram ? { gram: t.gram } : {}) }));
        recipe.steps = resolved.map(s => {
            const v = s.verbInfo;
            const params = Object.entries(s.params).map(([k, val]) => (val === true ? k : `${k} ${val}`));
            return {
                id: s.id,
                name: prettyId(s.verb.replace(/^x-/, '')) + (s.temperature ? ` ${s.temperature}` : ''),
                verb: s.verb,
                verbId: s.verbId || null,
                kind: s.kind || (v ? v.kind : undefined),
                attention: s.attention || (v ? v.attention : undefined),
                duration: s.durationMax,
                durationMin: s.duration,
                approx: s.approx,
                condition: s.condition,
                keep: s.id === finalId ? null : s.keep,
                temperature: s.temperature || undefined,
                params,
                tool: s.toolsBase.map(t => tools.get(t).name).join(', ') || undefined,
                tools: s.toolsBase,
                ...(Object.keys(s.toolPreps).length ? { toolPreps: s.toolPreps } : {}),
                block: s.block,
                line: s.line,
                uses: s.uses,
                makes: s.id === finalId ? null : (s.outLabel || prettyId(s.id)),
                ...(s.gram ? { makesGram: s.gram } : {})
            };
        });
        recipe.dish = serve && serve.name ? serve.name : (finalId && steps.get(finalId).outLabel) || recipe.name;
        recipe.finalStep = finalId;

        diagnostics.sort((a, b) => a.line - b.line);
        return { recipe, diagnostics, ok: !diagnostics.some(d => d.severity === 'error') };
    }

    global.CookingLang = {
        parse, registerPack, resolveVerb, lookupVerb,
        VERBS, PACKS, UNITS, KEYWORDS, KW, PLAN_VALUES, LANGS
    };
})(scope);

// ---- cooking-packs.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart \u2014 paquetes de vocabulario incluidos
//
// Un paquete es una extensi\u00f3n del vocabulario base que una receta activa con
// `usa "pasteler\u00eda"` / `use "pastry"`. Este fichero es tambi\u00e9n el ejemplo de
// c\u00f3mo publicar un paquete propio: basta con llamar a CookingLang.registerPack
// despu\u00e9s de cargar cooking-lang.js. Ver SPEC.md \u00a79.

(function (global) {
    'use strict';

    const { registerPack } = global.CookingLang;

    // [id, tipo, atenci\u00f3n por defecto, formas en espa\u00f1ol, formas en ingl\u00e9s]
    registerPack({
        id: 'pastry',
        version: '0.1',
        names: { es: 'pasteler\u00eda', en: 'pastry' },
        verbs: [
            ['temper', 'heat', 'active', 'atemperar', 'temper'],
            ['laminate', 'prep', 'active', 'laminar hojaldrar', 'laminate'],
            ['pipe', 'assemble', 'active', 'escudillar mangar', 'pipe'],
            ['cream', 'prep', 'active', 'cremar blanquear_mantequilla', 'cream'],
            ['blind_bake', 'oven', 'passive', 'hornear_en_blanco', 'blind_bake'],
            ['set', 'rest', 'passive', 'cuajar gelificar', 'set'],
            ['glaze', 'assemble', 'active', 'glasear abrillantar', 'glaze'],
            ['dock', 'prep', 'active', 'pinchar', 'dock'],
            ['bloom', 'rest', 'passive', 'hidratar_gelatina', 'bloom']
        ]
    });
})(scope);

// ---- recipe-model.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart \u2014 modelo de receta
// Normaliza la salida del parser, planifica los pasos en el tiempo (CPM) y
// asigna carriles. No sabe nada de SVG: todo lo visual vive en recipe-chart.js.

(function (global) {
    'use strict';

    // ------------------------------------------------------------------
    // Tipos de paso
    // ------------------------------------------------------------------

    const KINDS = {
        prep:     { label: { es: 'Preparaci\u00f3n', en: 'Prep' },     color: '#0e7490' },
        heat:     { label: { es: 'Fuego',       en: 'Stovetop' }, color: '#ea580c' },
        oven:     { label: { es: 'Horno',       en: 'Oven' },     color: '#b91c1c' },
        rest:     { label: { es: 'Reposo',      en: 'Rest' },     color: '#64748b' },
        assemble: { label: { es: 'Montaje',     en: 'Assembly' }, color: '#7c3aed' }
    };

    const KIND_RULES = [
        ['rest',     /repos|levad|levar|ferment|enfri|marin|refriger|esperar|templar|hidratar/i],
        ['oven',     /horne|gratin/i],
        ['heat',     /cocin|cocer|cocci|fre[\u00edi]r|saltea|sofr|herv|reduc|tost|dorar|guis|plancha|roux|bechamel|derret|calent|pochar|confit/i],
        ['assemble', /mont|emplat|servir|mezcl|combin|incorpor|rellen|formar|bolear/i],
        ['prep',     /pic|bat|cort|amas|ralla|pel|trit|lav|pes|tamiz/i]
    ];

    function inferKind(step) {
        if (step.kind && KINDS[step.kind]) return step.kind;
        for (const [kind, re] of KIND_RULES) {
            if (re.test(step.name)) return kind;
        }
        if (step.action === 'thermal') return 'heat';
        return 'prep';
    }

    // \u00bfRequiere al cocinero durante todo el paso, o puede desatenderlo?
    function inferAttention(step) {
        if (step.attention === 'active' || step.attention === 'passive') return step.attention;
        if (step.kind === 'rest' || step.kind === 'oven') return 'passive';
        if (step.kind === 'heat' && step.duration >= 20) return 'passive';
        return 'active';
    }

    // "PICAR VERDURAS" -> "Picar verduras", "HORNEAR 180\u00b0C" -> "Hornear 180\u00b0C"
    function prettyName(name) {
        if (!name || name !== name.toUpperCase()) return name;
        const lower = name.toLowerCase().replace(/(\d)\s*\u00b0c/g, '$1\u00b0C');
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    // ------------------------------------------------------------------
    // Normalizaci\u00f3n: salida del parser -> modelo com\u00fan
    // ------------------------------------------------------------------
    //
    // Modelo com\u00fan:
    //   recipe.ingredients: { id: {id, name, quantity, unit} }
    //   recipe.steps: [{ id, name, duration, tool, temperature, kind, attention,
    //                    ingredients: [ingId], feeders: [{from: stepId, via}],
    //                    inputs: [id] (en el orden en que las escribe el autor),
    //                    output: {id, name, gram} | null, consumers: [stepId] }]
    //   recipe.dish: {id, name}
    //   recipe.finalStep: stepId

    function normalize(raw) {
        const recipe = fromCompact(raw);
        finish(recipe);
        return recipe;
    }

    // Formato compacto (la salida del parser de CCL):
    //   { name, description, dish, cooks?, burners?, tools?: [{id, name, capacity}],
    //     ingredients: [{id, name, quantity, unit}],
    //     steps: [{id, name, duration, uses: [id | {ref, at, fraction, fractionText}], makes,
    //              kind?, attention?, tool?, tools?, temperature?, params?, condition?,
    //              durationMin?, approx?, block?, line?}] }
    function fromCompact(raw) {
        const ingredients = {};
        raw.ingredients.forEach(i => { ingredients[i.id] = { ...i }; });
        const stepIds = new Set(raw.steps.map(s => s.id));
        const byId = new Map(raw.steps.map(s => [s.id, s]));
        const use = u => (typeof u === 'string' ? { ref: u, at: 0 } : { at: 0, ...u });

        const steps = raw.steps.map(s => {
            const uses = (s.uses || []).map(use);
            return {
                id: s.id, name: s.name, duration: s.duration,
                durationMin: s.durationMin, approx: s.approx, condition: s.condition,
                tool: s.tool, tools: s.tools || [], toolPreps: s.toolPreps || {}, temperature: s.temperature, params: s.params || [],
                kind: s.kind, attention: s.attention, verb: s.verb, verbId: s.verbId, block: s.block, line: s.line,
                keep: s.keep == null ? null : s.keep,
                ingredients: uses.filter(u => ingredients[u.ref]).map(u => u.ref),
                ingredientAt: Object.fromEntries(uses.filter(u => ingredients[u.ref] && u.at).map(u => [u.ref, u.at])),
                ingredientFraction: Object.fromEntries(uses.filter(u => ingredients[u.ref] && u.fraction).map(u => [u.ref, u.fraction])),
                feeders: uses.filter(u => stepIds.has(u.ref)).map(u => ({
                    from: u.ref, at: u.at || 0, fraction: u.fraction, fractionText: u.fractionText,
                    via: byId.get(u.ref).makes ? { id: u.ref + '__out', name: byId.get(u.ref).makes, gram: byId.get(u.ref).makesGram || null } : null
                })),
                inputs: uses.map(u => u.ref),
                output: s.makes ? { id: s.id + '__out', name: s.makes, gram: s.makesGram || null } : null,
                isFinal: raw.finalStep === s.id
            };
        });

        return {
            name: raw.name,
            description: raw.description,
            servings: raw.servings,
            cuisine: raw.cuisine || null,
            lang: raw.lang || 'es',
            plan: raw.plan || null,
            cooks: raw.cooks,
            burners: raw.burners,
            tools: raw.tools || [],
            ingredients,
            steps,
            dish: { id: 'dish', name: raw.dish || raw.name }
        };
    }

    function finish(recipe) {
        const byId = new Map(recipe.steps.map(s => [s.id, s]));
        recipe.byId = byId;

        recipe.steps.forEach(s => {
            s.label = prettyName(s.name);
            s.kind = inferKind(s);
            s.attention = inferAttention(s);
            s.duration = Math.max(0, +s.duration || 0);
            s.consumers = [];
            s.feeders = s.feeders.filter(f => byId.has(f.from));
            s.feeders.forEach(f => { f.at = f.at || 0; });
            s.ingredientAt = s.ingredientAt || {};
            s.ingredientFraction = s.ingredientFraction || {};
            s.tools = s.tools || [];
        });
        recipe.steps.forEach(s => s.feeders.forEach(f => byId.get(f.from).consumers.push(s.id)));

        recipe.order = topoSort(recipe.steps, byId);

        // "Masa": cu\u00e1ntos ingredientes base lleva acumulados la banda de cada paso
        recipe.order.forEach(s => {
            const upstream = new Set(s.ingredients);
            s.feeders.forEach(f => byId.get(f.from).upstreamIngredients.forEach(i => upstream.add(i)));
            s.upstreamIngredients = upstream;
            s.mass = upstream.size;
        });

        // Recursos: solo restringen si se declaran. Una receta dom\u00e9stica no
        // dice nada; una cocina profesional declara lo que tiene.
        //   herramientas con capacidad   -> cada paso que la usa ocupa una
        //   cocineros N                  -> cada paso atendido ocupa a un cocinero
        //   fuegos N                     -> cada paso de tipo Fuego ocupa un fuego,
        //                                   atendido o no (el guiso sigue en el fuego)
        recipe.capacity = {};
        (recipe.tools || []).forEach(t => { if (t.capacity) recipe.capacity['tool:' + t.id] = t.capacity; });
        if (recipe.cooks) recipe.capacity.cook = recipe.cooks;
        if (recipe.burners) recipe.capacity.burner = recipe.burners;
        recipe.steps.forEach(s => {
            s.resources = s.tools.map(t => 'tool:' + t).filter(r => recipe.capacity[r]);
            if (recipe.cooks && s.attention === 'active') s.resources.push('cook');
            if (recipe.burners && s.kind === 'heat') s.resources.push('burner');
        });

        // El plato lo produce el paso final; si no est\u00e1 marcado, el \u00faltimo sumidero
        const sinks = recipe.steps.filter(s => s.consumers.length === 0);
        const marked = recipe.steps.find(s => s.isFinal);
        recipe.finalStep = (marked || sinks[sinks.length - 1] || recipe.order[recipe.order.length - 1]).id;
        if (byId.get(recipe.finalStep).output && !marked) {
            // En el formato compacto el \u00faltimo "makes" es el propio plato
            byId.get(recipe.finalStep).output = null;
        }
    }

    function topoSort(steps, byId) {
        const indeg = new Map(steps.map(s => [s.id, s.feeders.length]));
        const queue = steps.filter(s => indeg.get(s.id) === 0);
        const out = [];
        while (queue.length) {
            const s = queue.shift();
            out.push(s);
            s.consumers.forEach(c => {
                indeg.set(c, indeg.get(c) - 1);
                if (indeg.get(c) === 0) queue.push(byId.get(c));
            });
        }
        if (out.length !== steps.length) throw new Error('La receta tiene un ciclo entre pasos');
        return out;
    }

    // ------------------------------------------------------------------
    // Planificaci\u00f3n
    // ------------------------------------------------------------------
    //
    // Sin recursos limitados es el m\u00e9todo de la ruta cr\u00edtica (CPM). Con
    // cocineros o herramientas limitadas se usa un esquema de generaci\u00f3n en
    // serie (serial SGS): los pasos se colocan por prioridad (el que m\u00e1s
    // camino tiene por delante) en el primer hueco con recursos libres.
    //
    // mode 'asap': SGS desde el principio: cada paso, en cuanto puede.
    // mode 'alap': SGS desde el plato hacia atr\u00e1s: cada paso termina lo m\u00e1s
    //              cerca posible de cuando se necesita (la bechamel no espera
    //              una hora y el risotto no se pasa mientras se hacen las setas).
    //
    // Despu\u00e9s se fija el orden en que cada recurso atiende a los pasos del
    // plan y, sobre ese grafo aumentado, se calculan inicio temprano, tard\u00edo,
    // holgura y ruta cr\u00edtica. Mover un paso dentro de su holgura nunca crea
    // solapes nuevos: dos pasos que no se solapaban siguen sin hacerlo.
    //
    // Precedencia con a\u00f1adidos a mitad de proceso: si c usa lo que produce f
    // en el minuto `at` de c, entonces c.start >= f.end - at.

    const EPS = 1e-6;

    // Aristas gen\u00e9ricas: succ.t >= pred.t + lag
    function precedenceEdges(recipe) {
        const edges = [];
        recipe.order.forEach(c => c.feeders.forEach(f => {
            const p = recipe.byId.get(f.from);
            edges.push({ pred: p, succ: c, lag: p.duration - f.at });
        }));
        return edges;
    }

    function topo(steps, edges) {
        const indeg = new Map(steps.map(s => [s.id, 0]));
        const out = new Map(steps.map(s => [s.id, []]));
        edges.forEach(e => { indeg.set(e.succ.id, indeg.get(e.succ.id) + 1); out.get(e.pred.id).push(e); });
        const queue = steps.filter(s => indeg.get(s.id) === 0);
        const order = [];
        while (queue.length) {
            const s = queue.shift();
            order.push(s);
            out.get(s.id).forEach(e => {
                indeg.set(e.succ.id, indeg.get(e.succ.id) - 1);
                if (indeg.get(e.succ.id) === 0) queue.push(e.succ);
            });
        }
        return { order: order.length === steps.length ? order : steps, out };
    }

    // SGS gen\u00e9rico. Devuelve el instante de inicio de cada paso.
    // urgency(s): n\u00famero menor = se coloca antes (opcional)
    function serialSchedule(steps, edges, capacity, release, urgency = () => 0) {
        const { order, out } = topo(steps, edges);
        const preds = new Map(steps.map(s => [s.id, []]));
        edges.forEach(e => preds.get(e.succ.id).push(e));

        const tail = new Map();
        [...order].reverse().forEach(s => {
            tail.set(s.id, Math.max(s.duration, ...out.get(s.id).map(e => e.lag + tail.get(e.succ.id))));
        });
        const index = new Map(order.map((s, i) => [s.id, i]));

        const t = new Map();
        const usage = {};   // recurso -> [[a, b]]
        const pending = new Map(steps.map(s => [s.id, preds.get(s.id).length]));
        const ready = steps.filter(s => pending.get(s.id) === 0);

        while (ready.length) {
            ready.sort((a, b) => (urgency(a) - urgency(b)) || (tail.get(b.id) - tail.get(a.id)) || (index.get(a.id) - index.get(b.id)));
            const s = ready.shift();
            let start = Math.max(0, release(s), ...preds.get(s.id).map(e => t.get(e.pred.id) + e.lag));

            if (s.duration > 0 && s.resources.length) {
                for (let guard = 0; guard < 10000; guard++) {
                    const end = start + s.duration;
                    let next = Infinity;
                    s.resources.forEach(r => {
                        const overl = (usage[r] || []).filter(([a, b]) => a < end - EPS && start < b - EPS);
                        if (overl.length >= capacity[r]) next = Math.min(next, ...overl.map(([, b]) => b));
                    });
                    if (next === Infinity) break;
                    start = next;
                }
                s.resources.forEach(r => (usage[r] = usage[r] || []).push([start, start + s.duration]));
            }

            t.set(s.id, start);
            out.get(s.id).forEach(e => {
                pending.set(e.succ.id, pending.get(e.succ.id) - 1);
                if (pending.get(e.succ.id) === 0) ready.push(e.succ);
            });
        }
        return t;
    }

    // ------------------------------------------------------------------
    // Cu\u00e1nto aguanta un intermedio (decisi\u00f3n del autor: `aguanta 30min`,
    // `sin espera`). Restricci\u00f3n de desfase m\u00e1ximo:
    //     c.start + at - p.end <= keep
    // Se repara el plan retrasando el productor (en orden topol\u00f3gico inverso,
    // para que el retraso se propague a sus predecesores) al primer hueco con
    // recursos libres. Si no hay hueco, queda como violaci\u00f3n y se avisa.
    // ------------------------------------------------------------------

    function consumerDeadline(recipe, p, startOf) {
        return Math.min(...p.consumers.map(cid => {
            const c = recipe.byId.get(cid);
            const f = c.feeders.find(x => x.from === p.id);
            return startOf(c) + (f ? f.at : 0);
        }));
    }

    function repairKeeps(recipe, plan) {
        const { capacity } = recipe;
        const fits = (s, start) => s.resources.every(r => {
            const overl = recipe.steps.filter(o => o !== s && o.resources.includes(r) && o.duration > 0 &&
                plan.get(o.id) < start + s.duration - EPS && start < plan.get(o.id) + o.duration - EPS);
            return overl.length < capacity[r];
        });
        [...recipe.order].reverse().forEach(p => {
            if (p.keep == null || !p.consumers.length) return;
            const deadline = consumerDeadline(recipe, p, c => plan.get(c.id));
            const latest = deadline - p.duration;
            const earliestOk = deadline - p.keep - p.duration;
            if (plan.get(p.id) >= earliestOk - EPS) return;
            // Candidatos: justo en el l\u00edmite, o justo cuando se libera un recurso
            const cands = [earliestOk, ...recipe.steps
                .filter(o => o !== p && o.resources.some(r => p.resources.includes(r)))
                .map(o => plan.get(o.id) + o.duration)]
                .filter(t => t >= earliestOk - EPS && t <= latest + EPS)
                .sort((a, b) => a - b);
            const t = p.duration > 0 && p.resources.length ? cands.find(c => fits(p, c)) : earliestOk;
            if (t !== undefined) plan.set(p.id, t);
        });
    }

    function keepViolations(recipe) {
        const out = [];
        recipe.steps.forEach(p => {
            if (p.keep == null || !p.consumers.length) return;
            p.consumers.forEach(cid => {
                const c = recipe.byId.get(cid);
                const f = c.feeders.find(x => x.from === p.id);
                const wait = c.start + (f ? f.at : 0) - p.end;
                if (wait > p.keep + 0.01) out.push({ step: p.id, consumer: cid, wait, keep: p.keep });
            });
        });
        return out;
    }

    // Calidad de un plan: minutos de espera por encima de lo que aguanta cada
    // intermedio, y duraci\u00f3n total
    function planScore(recipe, plan) {
        let excess = 0;
        recipe.steps.forEach(p => {
            if (p.keep == null) return;
            p.consumers.forEach(cid => {
                const c = recipe.byId.get(cid);
                const f = c.feeders.find(x => x.from === p.id);
                const wait = plan.get(cid) + (f ? f.at : 0) - (plan.get(p.id) + p.duration);
                excess += Math.max(0, wait - p.keep);
            });
        });
        const makespan = Math.max(0, ...recipe.steps.map(s => plan.get(s.id) + s.duration));
        return { excess, makespan };
    }

    function schedule(recipe, mode) {
        const { order, capacity } = recipe;
        const edges = precedenceEdges(recipe);

        // 1. Plan. El SGS es una heur\u00edstica: se prueban varias prioridades y se
        //    elige el plan con menos esperas excesivas (\u00a74.5) y, a igualdad, el
        //    m\u00e1s corto. Las recetas son peque\u00f1as, as\u00ed que sale barato.
        const keepOf = s => (s.keep == null ? Infinity : s.keep);
        const urgencies = mode === 'alap'
            // hacia atr\u00e1s, colocar antes = m\u00e1s cerca del consumidor
            ? [() => 0, s => (s.keep === 0 ? 0 : 1), keepOf, s => (s.keep === 0 ? 0 : s.keep == null ? 2 : 1)]
            // hacia delante, colocar despu\u00e9s = m\u00e1s cerca del consumidor
            : [() => 0, s => (s.keep == null ? 0 : 1), s => -keepOf(s)];

        let plan = null;
        let best = null;
        urgencies.forEach(urgency => {
            let candidate;
            if (mode === 'alap') {
                // Tiempo espejado r = T - fin:  f.r >= c.r + c.dur - at
                const rev = edges.map(e => ({ pred: e.succ, succ: e.pred, lag: e.succ.duration - (e.pred.duration - e.lag) }));
                const r = serialSchedule(order, rev, capacity, () => 0, urgency);
                const span = Math.max(0, ...order.map(s => r.get(s.id) + s.duration));
                candidate = new Map(order.map(s => [s.id, span - r.get(s.id) - s.duration]));
            } else {
                candidate = serialSchedule(order, edges, capacity, () => 0, urgency);
            }
            // 1b. Lo que no aguanta esperar se retrasa hasta donde haga falta
            repairKeeps(recipe, candidate);
            const score = planScore(recipe, candidate);
            if (!best || score.excess < best.excess - EPS ||
                (Math.abs(score.excess - best.excess) < EPS && score.makespan < best.makespan - EPS)) {
                best = score;
                plan = candidate;
            }
        });

        // 2. Fijar el orden de cada recurso en ese plan
        const all = [...edges];
        const users = order.filter(s => s.resources.length && s.duration > 0);
        users.forEach(a => users.forEach(b => {
            if (a === b || plan.get(a.id) + a.duration > plan.get(b.id) + EPS) return;
            if (a.resources.some(r => b.resources.includes(r))) all.push({ pred: a, succ: b, lag: a.duration });
        }));

        // 3. Inicio temprano / tard\u00edo sobre el grafo aumentado
        const { order: seq, out } = topo(order, all);
        const inc = new Map(order.map(s => [s.id, []]));
        all.forEach(e => inc.get(e.succ.id).push(e));
        seq.forEach(s => {
            s.es = Math.max(0, ...inc.get(s.id).map(e => e.pred.es + e.lag));
            s.ef = s.es + s.duration;
        });
        const total = Math.max(0, ...order.map(s => s.ef));
        [...seq].reverse().forEach(s => {
            s.ls = Math.min(total - s.duration, ...out.get(s.id).map(e => e.succ.ls - e.lag));
            s.lf = s.ls + s.duration;
        });
        order.forEach(s => {
            // ASAP: el plan tal cual (ya reparado); ALAP: lo m\u00e1s tarde posible
            s.start = mode === 'alap' ? s.ls : Math.min(plan.get(s.id), s.ls);
            s.end = s.start + s.duration;
            // Holgura = ventana [es, ls] en la que puede empezar sin retrasar el plato
            s.slack = Math.max(0, s.ls - s.es);
            s.critical = s.slack < EPS;
        });

        recipe.mode = mode;
        recipe.total = total;
        recipe.violations = keepViolations(recipe);
        recipe.constrained = Object.keys(capacity).length > 0;
        return recipe;
    }

    // ------------------------------------------------------------------
    // Carriles
    // ------------------------------------------------------------------
    //
    // Cada carril es una cadena de pasos que transforman la misma "masa".
    // Partiendo del paso final, la cadena principal sigue hacia atr\u00e1s por el
    // afluente que llega m\u00e1s tarde (el que marca el ritmo). El resto de
    // afluentes forman sub-bloques que se colocan alternando arriba/abajo,
    // los que desembocan antes m\u00e1s cerca del carril padre.
    //
    // Como cada sub\u00e1rbol ocupa un bloque contiguo de carriles y sus bandas
    // terminan antes de que el padre lo cruce, las conexiones no se cruzan.

    function buildLanes(recipe) {
        const { byId } = recipe;
        const placed = new Set();

        function chainEndingAt(end) {
            const chain = [end];
            placed.add(end.id);
            let cur = end;
            for (;;) {
                const cands = cur.feeders.filter(f => !f.at).map(f => byId.get(f.from)).filter(s => !placed.has(s.id));
                if (!cands.length) break;
                cands.sort((a, b) => (b.end - a.end) || (b.mass - a.mass));
                cur = cands[0];
                chain.unshift(cur);
                placed.add(cur.id);
            }
            return chain;
        }

        function block(end, side) {
            const lane = { steps: chainEndingAt(end) };
            const secondary = [];
            lane.steps.forEach(c => c.feeders.forEach(f => {
                const s = byId.get(f.from);
                if (!placed.has(s.id)) secondary.push({ s, at: c.start });
            }));
            secondary.sort((a, b) => a.at - b.at);

            const above = [];
            const below = [];
            let next = side > 0 ? 1 : -1;  // primero hacia fuera; la ra\u00edz empieza arriba
            secondary.forEach(({ s }) => {
                if (placed.has(s.id)) return;  // ya colocado por otro hermano (salida compartida)
                (next < 0 ? above : below).push(block(s, next));
                next = -next;
            });
            return [...above.reverse().flat(), lane, ...below.flat()];
        }

        const lanes = block(byId.get(recipe.finalStep), 0);

        // Pasos sueltos que no desembocan en el plato (receta mal formada)
        recipe.order.filter(s => !placed.has(s.id)).forEach(s => lanes.push(...block(s, 1)));

        lanes.forEach((lane, i) => {
            lane.index = i;
            lane.steps.forEach(s => { s.lane = i; });
        });
        recipe.lanes = lanes;
        return lanes;
    }

    // ------------------------------------------------------------------
    // M\u00e9tricas
    // ------------------------------------------------------------------

    function unionLength(intervals) {
        const sorted = intervals.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
        let total = 0;
        let curA = null;
        let curB = null;
        sorted.forEach(([a, b]) => {
            if (curB === null || a > curB) {
                if (curB !== null) total += curB - curA;
                curA = a; curB = b;
            } else {
                curB = Math.max(curB, b);
            }
        });
        if (curB !== null) total += curB - curA;
        return total;
    }

    function maxConcurrency(steps) {
        const events = [];
        steps.forEach(s => {
            if (s.duration <= 0) return;
            events.push([s.start, 1], [s.end, -1]);
        });
        events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let cur = 0;
        let max = 0;
        events.forEach(([, d]) => { cur += d; max = Math.max(max, cur); });
        return max;
    }

    function stats(recipe) {
        const steps = recipe.steps;
        const sequential = steps.reduce((a, s) => a + s.duration, 0);
        const busy = steps.filter(s => s.attention === 'active').map(s => [s.start, s.end]);
        const active = unionLength(busy);
        return {
            total: recipe.total,
            active,
            hands_free: recipe.total - active,
            sequential,
            saved: sequential - recipe.total,
            steps: steps.length,
            ingredients: Object.keys(recipe.ingredients).length,
            parallel: maxConcurrency(steps),
            handsAtOnce: maxConcurrency(steps.filter(s => s.attention === 'active')),
            critical: recipe.order.filter(s => s.critical)
        };
    }

    // Todo lo que alimenta a un paso, y todo lo que sale de \u00e9l
    function lineage(recipe, id) {
        const { byId } = recipe;
        const set = new Set([id]);
        const up = [id];
        while (up.length) {
            byId.get(up.pop()).feeders.forEach(f => {
                if (!set.has(f.from)) { set.add(f.from); up.push(f.from); }
            });
        }
        const down = [id];
        while (down.length) {
            byId.get(down.pop()).consumers.forEach(c => {
                if (!set.has(c)) { set.add(c); down.push(c); }
            });
        }
        return set;
    }

    function formatMinutes(min) {
        const m = Math.round(min);
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        const r = m % 60;
        return r ? `${h} h ${r}` : `${h} h`;
    }

    // Intervalos en los que el cocinero tiene las manos ocupadas
    function busyIntervals(recipe) {
        const sorted = recipe.steps.filter(s => s.attention === 'active' && s.duration > 0)
            .map(s => [s.start, s.end]).sort((a, b) => a[0] - b[0]);
        const out = [];
        sorted.forEach(([a, b]) => {
            const last = out[out.length - 1];
            if (last && a <= last[1] + EPS) last[1] = Math.max(last[1], b);
            else out.push([a, b]);
        });
        return out;
    }

    // mode: 'asap' | 'alap'. Si no se indica, el que declare la receta (`plan`)
    function prepare(raw, mode) {
        const recipe = normalize(raw);
        mode = mode || recipe.plan || 'asap';
        schedule(recipe, mode);
        buildLanes(recipe);
        return recipe;
    }

    global.RecipeModel = {
        KINDS, normalize, schedule, buildLanes, stats, lineage, prepare, formatMinutes, busyIntervals
    };
})(scope);

// ---- recipe-chart.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart \u2014 renderizado D3
// Geometr\u00eda (computeGeometry) separada del dibujo (RecipeChart.render) para
// poder reutilizarla en las miniaturas de "firma visual".

(function (global) {
    'use strict';

    const { KINDS, lineage, formatMinutes, busyIntervals } = global.RecipeModel;

    // Textos del gr\u00e1fico. El gr\u00e1fico se dibuja en el idioma de la receta.
    const I18N = {
        es: {
            ready: t => `listo en ${t}`,
            aria: n => `Gr\u00e1fico de la receta ${n}`,
            hands: 'Manos', cooks: n => `${n} cocineros`,
            burners: n => `${n} ${n === 1 ? 'fuego' : 'fuegos'}`,
            activeTask: ['tarea activa', 'tareas activas'], burnerUse: ['fuego en uso', 'fuegos en uso'],
            over: (n, what) => `\u26a0 ${n} ${what} a la vez`,
            of: (cap, over) => (over ? ` \u2014 hay ${cap}` : ` de ${cap}`),
            declareCooks: ' (declara "cocineros 1" para planificar con una sola persona)',
            active: 'activo', passive: 'desatendido',
            until: c => `hasta que ${c}`, at: t => ` (a los ${t}\u2032)`, partOf: f => `${f} de `,
            uses: 'Usa', gives: 'Da', block: b => `Bloque: ${b}`,
            critical: 'En la ruta cr\u00edtica: cualquier retraso retrasa el plato',
            window: (a, b) => `Puede empezar entre el min ${a} y el ${b} sin retrasar el plato`,
            keeps: k => (k === 0 ? 'Sin espera: se usa en cuanto est\u00e1' : `Aguanta ${k} esperando`),
            spoiled: (w, k) => `\u26a0 Espera ${w}, pero aguanta ${k}`,
            cursor: (t, n, busy) => `${t}\u2032 \u00b7 ${n ? `${n} en marcha${busy ? `, ${busy} con manos` : ''}` : 'nada en marcha'}`,
            decimal: ','
        },
        en: {
            ready: t => `ready in ${t}`,
            aria: n => `Cooking chart of ${n}`,
            hands: 'Hands', cooks: n => `${n} cooks`,
            burners: n => `${n} ${n === 1 ? 'burner' : 'burners'}`,
            activeTask: ['active task', 'active tasks'], burnerUse: ['burner in use', 'burners in use'],
            over: (n, what) => `\u26a0 ${n} ${what} at once`,
            of: (cap, over) => (over ? ` \u2014 only ${cap}` : ` of ${cap}`),
            declareCooks: ' (declare "cooks 1" to plan for a single person)',
            active: 'hands-on', passive: 'unattended',
            until: c => `until ${c}`, at: t => ` (at ${t}\u2032)`, partOf: f => `${f} of `,
            uses: 'In', gives: 'Out', block: b => `Block: ${b}`,
            critical: 'On the critical path: any delay delays the dish',
            window: (a, b) => `Can start anywhere between min ${a} and ${b} without delaying the dish`,
            keeps: k => (k === 0 ? 'No wait: used as soon as it is ready' : `Keeps for ${k}`),
            spoiled: (w, k) => `\u26a0 Waits ${w}, but only keeps for ${k}`,
            cursor: (t, n, busy) => `${t}\u2032 \u00b7 ${n ? `${n} running${busy ? `, ${busy} hands-on` : ''}` : 'nothing running'}`,
            decimal: '.'
        }
    };
    const textsFor = lang => I18N[lang] || I18N.en;

    // "10 min", "8\u201310 min", "~10 min"
    function durationLabel(s) {
        const lo = s.durationMin != null ? s.durationMin : s.duration;
        const base = lo < s.duration - 1e-6
            ? `${Math.round(lo)}\u2013${formatMinutes(s.duration)}`
            : formatMinutes(s.duration);
        return (s.approx ? '~' : '') + base;
    }

    const STYLE = {
        font: '11px Inter, system-ui, sans-serif',
        fontBold: '600 11px Inter, system-ui, sans-serif',
        band: '#d6d3d1',
        bandCritical: '#a8a29e',
        ingredient: '#16a34a',
        dish: '#ca8a04',
        rowH: 15,         // altura de una fila de ingredientes
        labelRowH: 13,    // altura de una fila de etiquetas bajo el carril
        laneGap: 16,
        axisH: 34,
        minPxPerMin: 2.5,
        minTimeline: 240,     // px m\u00ednimos para el eje de tiempo
        maxPxPerMin: 110
    };

    const thickness = mass => 3 + 3.2 * Math.sqrt(Math.max(1, mass));
    const barHeight = s => Math.max(22, thickness(s.mass) + 12);

    let measureCtx = null;
    function textWidth(text, font = STYLE.font) {
        if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
        measureCtx.font = font;
        return measureCtx.measureText(text).width;
    }

    // Cantidad que entra en un paso concreto (aceite[1/2] -> la mitad)
    function ingredientText(ing, fraction, L = I18N.es) {
        let q = ing.quantity;
        if (fraction && typeof q === 'number') q = Math.round(q * fraction * 100) / 100;
        else if (fraction && q != null && q !== '') q = `${q} \u00d7 ${Math.round(fraction * 100) / 100}`;
        if (typeof q === 'number') q = String(q).replace('.', L.decimal);
        const qty = q != null && q !== '' ? `${q}${ing.unit ? ' ' + ing.unit : ''}` : (ing.unit || '');
        return { name: ing.name, qty };
    }

    // Coloca cajas [x0, x1] en filas sin solaparse; devuelve el n\u00famero de filas
    function packRows(items, gap = 6) {
        const rowsEnd = [];
        items.sort((a, b) => a.x0 - b.x0).forEach(it => {
            const span = it.rows || 1;
            let r = 0;
            for (;;) {
                let ok = true;
                for (let k = r; k < r + span; k++) {
                    if (rowsEnd[k] !== undefined && rowsEnd[k] + gap > it.x0) { ok = false; break; }
                }
                if (ok) break;
                r++;
            }
            it.row = r;
            for (let k = r; k < r + span; k++) rowsEnd[k] = it.x1;
        });
        return rowsEnd.length;
    }

    // Grupos de ingredientes: si dos se solapan, el que entra m\u00e1s tarde va
    // encima. As\u00ed las l\u00edneas que bajan de un grupo nunca atraviesan el texto
    // de otro (el texto se extiende hacia la izquierda de su punto de entrada).
    function stackChips(groups) {
        const placed = [];
        groups.sort((a, b) => a.anchor - b.anchor).forEach(g => {
            g.row = 0;
            placed.forEach(p => {
                if (p.x1 + 10 > g.x0 && p.x0 < g.x1 + 10) g.row = Math.max(g.row, p.row + p.rows);
            });
            placed.push(g);
        });
        return Math.max(0, ...groups.map(g => g.row + g.rows));
    }

    // Tramos con n pasos simult\u00e1neos de los que cumplen `uses`
    function concurrency(recipe, uses) {
        const ev = [];
        recipe.steps.filter(s => uses(s) && s.duration > 0).forEach(s => {
            ev.push([s.start, 1, s.id], [s.end, -1, s.id]);
        });
        ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const segs = [];
        const open = new Set();
        let prev = null;
        ev.forEach(([t, d, id]) => {
            if (prev !== null && t > prev + 1e-6 && open.size) segs.push({ a: prev, b: t, n: open.size, ids: [...open] });
            if (d > 0) open.add(id); else open.delete(id);
            prev = t;
        });
        return segs;
    }

    // ------------------------------------------------------------------
    // Geometr\u00eda
    // ------------------------------------------------------------------

    function computeGeometry(recipe, { width, signature = false, pxPerMin: fixedScale = null, lang }) {
        const L = textsFor(lang || recipe.lang);
        const { byId, lanes } = recipe;
        const total = Math.max(recipe.total, 1);

        // Grupos de ingredientes: uno por paso y momento de entrada (+ vino a los 5min)
        const groupsOf = s => {
            const byAt = new Map();
            s.ingredients.forEach(id => {
                const at = s.ingredientAt[id] || 0;
                if (!byAt.has(at)) byAt.set(at, []);
                byAt.get(at).push(id);
            });
            return [...byAt.entries()].map(([at, ids]) => ({ at, ids }));
        };

        // c\u00edrculo del plato (34 + 16) + texto a su derecha
        const rightNeed = signature ? 50 : 62 + Math.max(
            textWidth(recipe.dish.name, '700 13px Inter, system-ui, sans-serif'),
            textWidth(L.ready(formatMinutes(recipe.total)))) + 12;

        // Margen izquierdo: el texto de cada grupo de ingredientes se extiende a
        // la izquierda de su punto de entrada, tambi\u00e9n si entra despu\u00e9s del
        // minuto 0. La escala depende del margen, as\u00ed que se ajusta hasta que cabe.
        const groups = signature ? [] : recipe.steps.flatMap(s => groupsOf(s).map(gr => ({
            t: s.start + gr.at, start: s.start, end: s.end, w: groupWidth(gr.ids)
        })));
        let leftNeed = signature ? 20 : 44;
        let pxPerMin;
        for (let i = 0; i < 6; i++) {
            // En pantallas estrechas la l\u00ednea de tiempo conserva un m\u00ednimo legible;
            // si no cabe, el gr\u00e1fico se desplaza en horizontal
            const timeline = Math.max(STYLE.minTimeline, width - leftNeed - rightNeed);
            pxPerMin = fixedScale || Math.min(STYLE.maxPxPerMin, Math.max(STYLE.minPxPerMin, timeline / total));
            const need = Math.max(leftNeed, ...groups.map(gr =>
                gr.w + 16 - Math.min(gr.t * pxPerMin, Math.max(gr.end * pxPerMin, gr.start * pxPerMin + 4) - 4)));
            if (need <= leftNeed + 0.5) break;
            leftNeed = need;
        }
        const x = t => leftNeed + t * pxPerMin;

        function groupWidth(ids) {
            return Math.max(...ids.map(id => {
                const t = ingredientText(recipe.ingredients[id], 1, L);
                return textWidth(t.name) + (t.qty ? textWidth(t.qty) + 6 : 0) + 14;
            }));
        }

        // --- Pasos: posici\u00f3n horizontal y forma de la etiqueta
        const steps = new Map();
        recipe.steps.forEach(s => {
            const x0 = x(s.start);
            const x1 = Math.max(x(s.end), x0 + 4);
            const g = { s, x0, x1, w: x1 - x0, h: barHeight(s), thick: thickness(s.mass) };
            const dur = durationLabel(s);
            const inner = g.w - 12;
            if (signature) g.labelMode = 'none';
            else if (textWidth(`${s.label}  ${dur}`, STYLE.fontBold) <= inner) g.labelMode = 'full';
            else if (textWidth(s.label, STYLE.fontBold) <= inner) g.labelMode = 'name';
            else g.labelMode = 'below';
            g.dur = dur;
            steps.set(s.id, g);
        });

        // --- Por carril: ingredientes encima, etiquetas debajo
        const laneGeo = lanes.map(lane => {
            const chips = [];
            const below = [];
            if (!signature) {
                lane.steps.forEach(s => {
                    const g = steps.get(s.id);
                    groupsOf(s).forEach(gr => {
                        const w = groupWidth(gr.ids);
                        const anchor = Math.min(x(s.start + gr.at), g.x1 - 4);
                        chips.push({ s, at: gr.at, ids: gr.ids, anchor, x0: anchor - w - 4, x1: anchor + 4, rows: gr.ids.length, w });
                    });
                    if (g.labelMode === 'below') {
                        const text = `${s.label} \u00b7 ${g.dur}`;
                        below.push({ kind: 'step', s, text, x0: g.x0, x1: g.x0 + textWidth(text, STYLE.fontBold) });
                    } else if (g.labelMode === 'name') {
                        below.push({ kind: 'dur', s, text: g.dur, x0: g.x0, x1: g.x0 + textWidth(g.dur) });
                    }
                    if (s.output) {
                        const text = s.output.name;
                        below.push({ kind: 'derived', s, text, x0: g.x1 + 4, x1: g.x1 + 4 + textWidth(text) + 4 });
                    }
                });
            }
            const chipRows = stackChips(chips);
            const labelRows = packRows(below, 8);
            const half = Math.max(...lane.steps.map(s => steps.get(s.id).h)) / 2;
            return {
                lane, chips, below, half,
                top: (chipRows ? chipRows * STYLE.rowH + 10 : 4),
                bottom: labelRows * STYLE.labelRowH + 6
            };
        });

        let y = signature ? 12 : STYLE.axisH + 10;
        laneGeo.forEach(lg => {
            y += lg.top + lg.half;
            lg.y = y;
            y += lg.half + lg.bottom + (signature ? 6 : STYLE.laneGap);
        });
        lanes.forEach((lane, i) => lane.steps.forEach(s => {
            const g = steps.get(s.id);
            g.y = laneGeo[i].y;
            g.top = g.y - g.h / 2;
            g.bottom = g.y + g.h / 2;
        }));

        // --- Ingredientes: posici\u00f3n de cada fila y punto de entrada a la barra
        const ingredients = [];
        laneGeo.forEach(lg => lg.chips.forEach(c => {
            const g = steps.get(c.s.id);
            const n = c.ids.length;
            const room = c.at ? Math.max(4, g.x1 - c.anchor - 2) : g.w * 0.45;
            c.ids.forEach((id, i) => {
                const row = c.row + (n - 1 - i);
                ingredients.push({
                    s: c.s, at: c.at, ing: recipe.ingredients[id],
                    text: ingredientText(recipe.ingredients[id], c.s.ingredientFraction[id], L),
                    tx: c.anchor - 6, ty: g.top - 9 - row * STYLE.rowH,
                    ex: c.anchor + Math.min(6 + i * 4, room), ey: g.top
                });
            });
            c.entryMax = c.anchor + Math.min(6 + (n - 1) * 4, room);
        }));

        // --- Bandas dentro del carril y afluentes entre carriles
        const bands = [];
        const ribbons = [];
        const sideCount = new Map();   // cu\u00e1ntos afluentes entran ya por arriba/abajo de cada barra

        recipe.steps.forEach(s => {
            const g = steps.get(s.id);
            s.consumers.forEach(cid => {
                const c = byId.get(cid);
                const cg = steps.get(cid);
                if (c.lane === s.lane) {
                    bands.push({
                        ids: [s.id, cid], x0: g.x1, x1: cg.x0, y: g.y, thick: g.thick, keepX: s.keep == null ? null : x(s.end + s.keep),
                        wait: c.start - s.end > 0.01, critical: s.critical && c.critical
                    });
                    return;
                }
                const fromAbove = g.y < cg.y;
                const key = cid + (fromAbove ? 'a' : 'b');
                const k = sideCount.get(key) || 0;
                sideCount.set(key, k + 1);
                const at = (c.feeders.find(f => f.from === s.id) || {}).at || 0;
                const entry = Math.min(x(c.start + at), cg.x1 - 4);
                const chip = fromAbove && laneGeo[c.lane].chips.find(ch => ch.s === c && ch.at === at);
                const base = chip ? chip.entryMax - entry + g.thick / 2 + 4 : g.thick / 2 + 6;
                const ex = Math.min(entry + base + k * (g.thick + 3), cg.x1 - g.thick / 2 - 1);
                const ey = fromAbove ? cg.top : cg.bottom;
                const dy = Math.abs(ey - g.y);
                const turn = Math.max(g.x1, ex - Math.min(56, dy * 0.9));
                ribbons.push({
                    ids: [s.id, cid], x0: g.x1, turn, ex, ey, y: g.y, thick: g.thick, keepX: s.keep == null ? null : x(s.end + s.keep),
                    wait: turn - g.x1 > 1, critical: s.critical && c.critical
                });
            });
        });

        const fg = steps.get(recipe.finalStep);
        const dish = { x: fg.x1 + 34, y: fg.y, r: signature ? 9 : 16, thick: fg.thick };

        // --- Franjas de recursos: manos siempre; fuegos si se declaran
        const strips = [];
        if (!signature) {
            const defs = [{
                label: recipe.cooks > 1 ? L.cooks(recipe.cooks) : L.hands,
                cap: recipe.cooks || 1,
                declared: !!recipe.cooks,
                what: L.activeTask,
                segments: concurrency(recipe, s => s.attention === 'active')
            }];
            if (recipe.burners) {
                defs.push({
                    label: L.burners(recipe.burners),
                    cap: recipe.burners,
                    declared: true,
                    what: L.burnerUse,
                    segments: concurrency(recipe, s => s.kind === 'heat')
                });
            }
            defs.forEach(d => {
                strips.push({ ...d, y: y + 2, h: 10 });
                y += 26;
            });
            y += 8;
        }

        const height = y + (signature ? 0 : 10);
        const widthOut = signature ? dish.x + dish.r + 4 : Math.max(width, fg.x1 + rightNeed);
        return { x, pxPerMin, steps, laneGeo, ingredients, bands, ribbons, dish, strips, width: widthOut, height, left: leftNeed, L };
    }

    // ------------------------------------------------------------------
    // Paths
    // ------------------------------------------------------------------

    function ribbonPath(r) {
        const dx = r.ex - r.turn;
        const dy = r.ey - r.y;
        return `M${r.turn},${r.y}` +
            `C${r.turn + dx * 0.75},${r.y} ${r.ex},${r.y + dy * 0.25} ${r.ex},${r.ey}`;
    }

    function ingredientPath(i) {
        const dx = i.ex - i.tx;
        return `M${i.tx},${i.ty}C${i.tx + dx * 0.9},${i.ty} ${i.ex},${i.ty + (i.ey - i.ty) * 0.3} ${i.ex},${i.ey}`;
    }

    function setIds(sel, fn) {
        return sel.each(function (d) { this.__ids = fn(d); });
    }

    function defs(svg, uid) {
        const d = svg.append('defs');
        d.append('pattern')
            .attr('id', `hatch-${uid}`).attr('width', 6).attr('height', 6)
            .attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)')
            .append('rect').attr('width', 2.2).attr('height', 6).attr('fill', 'rgba(255,255,255,0.38)');
    }

    let uidCounter = 0;

    // ------------------------------------------------------------------
    // Gr\u00e1fico completo
    // ------------------------------------------------------------------

    class RecipeChart {
        // lang: fuerza el idioma del gr\u00e1fico (por defecto, el de la receta)
        constructor(container, { onHoverStep, lang } = {}) {
            this.container = d3.select(container);
            this.lang = lang;
            this.onHoverStep = onHoverStep;
            this.uid = ++uidCounter;
        }

        render(recipe) {
            this.recipe = recipe;
            const node = this.container.node();
            const cs = getComputedStyle(node);
            const width = Math.max(320, node.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
            const geo = this.geo = computeGeometry(recipe, { width, lang: this.lang });
            this.L = geo.L;
            const uid = this.uid;

            this.container.selectAll('*').remove();
            this.container.style('position', 'relative');

            const scroller = this.container.append('div').attr('class', 'cc-scroll');
            const svg = this.svg = scroller.append('svg')
                .attr('class', 'cc-svg')
                .attr('width', geo.width).attr('height', geo.height)
                .attr('role', 'img')
                .attr('aria-label', geo.L.aria(recipe.name));
            defs(svg, uid);

            this.tooltip = this.container.append('div').attr('class', 'cc-tooltip').style('opacity', 0);

            this.renderAxis(svg, geo, recipe);
            const content = svg.append('g');
            this.renderBands(content, geo);
            this.renderIngredients(content, geo);
            this.renderSteps(content, geo, recipe, uid);
            this.renderBelowLabels(content, geo);
            this.renderDish(content, geo, recipe);
            this.renderStrips(content, geo, recipe);
            this.renderCursor(svg, geo, recipe);
        }

        renderAxis(svg, geo, recipe) {
            const scale = d3.scaleLinear().domain([0, recipe.total]).range([geo.x(0), geo.x(recipe.total)]);
            const step = [1, 2, 5, 10, 15, 30, 60].find(s => s * geo.pxPerMin >= 46) || 60;
            const ticks = d3.range(0, recipe.total + 0.001, step);
            if (ticks[ticks.length - 1] < recipe.total - step * 0.4) ticks.push(recipe.total);

            const g = svg.append('g').attr('class', 'cc-axis');
            g.selectAll('line.grid').data(ticks).join('line')
                .attr('class', 'grid')
                .attr('x1', scale).attr('x2', scale)
                .attr('y1', STYLE.axisH - 6).attr('y2', geo.height - 4);
            g.selectAll('text').data(ticks).join('text')
                .attr('x', scale).attr('y', STYLE.axisH - 12)
                .attr('text-anchor', 'middle')
                .text(t => (t === 0 ? '0' : `${Math.round(t)}\u2032`));
            g.append('text')
                .attr('class', 'axis-title')
                .attr('x', geo.x(0) - 8).attr('y', STYLE.axisH - 12)
                .attr('text-anchor', 'end')
                .text('min');
        }

        renderBands(g, geo) {
            const bandColor = d => (d.critical ? STYLE.bandCritical : STYLE.band);

            const waits = [
                ...geo.ribbons.filter(d => d.wait).map(d => ({ ...d, x1: d.turn })),
                ...geo.bands.filter(d => d.wait)
            ];
            // Si el intermedio aguanta menos de lo que espera, el exceso va en rojo
            const okWaits = [];
            const spoiled = [];
            waits.forEach(d => {
                if (d.keepX == null || d.keepX >= d.x1 - 0.5) { okWaits.push(d); return; }
                if (d.keepX > d.x0) okWaits.push({ ...d, x1: d.keepX });
                spoiled.push({ ...d, x0: Math.max(d.x0, d.keepX) });
            });
            setIds(g.append('g').selectAll('line').data(okWaits).join('line')
                .attr('class', 'cc-flow wait hl')
                .attr('x1', d => d.x0).attr('x2', d => d.x1)
                .attr('y1', d => d.y).attr('y2', d => d.y)
                .attr('stroke', bandColor)
                .attr('stroke-width', d => d.thick), d => d.ids);
            setIds(g.append('g').selectAll('line').data(spoiled).join('line')
                .attr('class', 'cc-flow wait spoiled hl')
                .attr('x1', d => d.x0).attr('x2', d => d.x1)
                .attr('y1', d => d.y).attr('y2', d => d.y)
                .attr('stroke-width', d => d.thick), d => d.ids);

            setIds(g.append('g').selectAll('path').data(geo.ribbons).join('path')
                .attr('class', 'cc-flow hl')
                .attr('d', ribbonPath)
                .attr('stroke', bandColor)
                .attr('stroke-width', d => d.thick), d => d.ids);

            setIds(g.append('g').selectAll('line').data(geo.bands.filter(d => !d.wait)).join('line')
                .attr('class', 'cc-flow hl')
                .attr('x1', d => d.x0).attr('x2', d => d.x1)
                .attr('y1', d => d.y).attr('y2', d => d.y)
                .attr('stroke', bandColor)
                .attr('stroke-width', d => d.thick), d => d.ids);

            const d = geo.dish;
            const fid = this.recipe.finalStep;
            setIds(g.append('line')
                .datum({})
                .attr('class', 'cc-flow hl')
                .attr('x1', geo.steps.get(fid).x1).attr('x2', d.x - d.r)
                .attr('y1', d.y).attr('y2', d.y)
                .attr('stroke', STYLE.bandCritical).attr('stroke-width', d.thick), () => [fid]);
        }

        renderIngredients(g, geo) {
            const sel = g.append('g').attr('class', 'cc-ingredients')
                .selectAll('g').data(geo.ingredients).join('g')
                .attr('class', 'hl');
            setIds(sel, d => [d.s.id]);

            sel.append('path')
                .attr('class', 'cc-ing-line')
                .attr('d', ingredientPath);
            sel.append('circle')
                .attr('cx', d => d.tx + 1).attr('cy', d => d.ty).attr('r', 2.6)
                .attr('fill', STYLE.ingredient);
            const t = sel.append('text')
                .attr('x', d => d.tx - 5).attr('y', d => d.ty)
                .attr('dy', '0.35em').attr('text-anchor', 'end')
                .attr('class', 'cc-ing-text');
            t.append('tspan').text(d => d.text.name);
            t.append('tspan').attr('class', 'qty').attr('dx', 5).text(d => d.text.qty);
        }

        renderSteps(g, geo, recipe, uid) {
            const data = [...geo.steps.values()];
            const sel = g.append('g').selectAll('g').data(data).join('g')
                .attr('class', 'cc-step hl')
                .attr('tabindex', 0)
                .attr('transform', d => `translate(${d.x0},${d.top})`);
            setIds(sel, d => [d.s.id]);

            sel.append('rect')
                .attr('width', d => d.w).attr('height', d => d.h)
                .attr('rx', 5)
                .attr('fill', d => KINDS[d.s.kind].color);
            sel.filter(d => d.s.attention === 'passive').append('rect')
                .attr('width', d => d.w).attr('height', d => d.h)
                .attr('rx', 5)
                .attr('fill', `url(#hatch-${uid})`);
            sel.filter(d => d.s.critical).append('rect')
                .attr('class', 'cc-critical-mark')
                .attr('x', 3).attr('y', d => d.h - 3.5)
                .attr('width', d => Math.max(0, d.w - 6)).attr('height', 1.5)
                .attr('rx', 0.75);

            const inside = sel.filter(d => d.labelMode === 'full' || d.labelMode === 'name');
            inside.append('text')
                .attr('class', 'cc-step-name')
                .attr('x', 7).attr('y', d => d.h / 2).attr('dy', '0.35em')
                .text(d => d.s.label);
            inside.filter(d => d.labelMode === 'full').append('text')
                .attr('class', 'cc-step-dur')
                .attr('x', d => d.w - 7).attr('y', d => d.h / 2).attr('dy', '0.35em')
                .attr('text-anchor', 'end')
                .text(d => d.dur);

            const self = this;
            sel.on('mouseenter focus', function (event, d) { self.highlight(d.s.id); self.showTip(event, d); })
               .on('mousemove', (event, d) => this.showTip(event, d))
               .on('mouseleave blur', () => { this.highlight(null); this.hideTip(); });
        }

        renderBelowLabels(g, geo) {
            const items = [];
            geo.laneGeo.forEach(lg => lg.below.forEach(b => items.push({ ...b, y: lg.y + lg.half + 11 + b.row * STYLE.labelRowH })));
            setIds(g.append('g').selectAll('text').data(items).join('text')
                .attr('class', d => `cc-below ${d.kind} hl`)
                .attr('x', d => d.x0).attr('y', d => d.y)
                .text(d => (d.kind === 'derived' ? `\u2192 ${d.text}` : d.text)), d => [d.s.id]);
        }

        renderDish(g, geo, recipe) {
            const d = geo.dish;
            const dg = g.append('g').attr('class', 'cc-dish hl').attr('transform', `translate(${d.x},${d.y})`);
            setIds(dg, () => [recipe.finalStep]);
            dg.append('circle').attr('r', d.r + 5).attr('fill', 'none').attr('stroke', STYLE.dish).attr('stroke-width', 1.5);
            dg.append('circle').attr('r', d.r).attr('fill', STYLE.dish);
            dg.append('text').attr('class', 'cc-dish-name').attr('x', d.r + 12).attr('dy', '-0.15em').text(recipe.dish.name);
            dg.append('text').attr('class', 'cc-dish-time').attr('x', d.r + 12).attr('dy', '1.15em')
                .text(geo.L.ready(formatMinutes(recipe.total)));
        }

        // Una franja por recurso. La altura del tramo es la ocupaci\u00f3n (n / capacidad);
        // en rojo si se supera, es decir, si hacen falta m\u00e1s manos o fuegos de los que hay.
        renderStrips(g, geo, recipe) {
            geo.strips.forEach(st => {
                const sg = g.append('g').attr('class', 'cc-strip');
                sg.append('text').attr('class', 'cc-strip-label')
                    .attr('x', geo.x(0) - 8).attr('y', st.y + st.h / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
                    .text(st.label);
                sg.append('rect').attr('class', 'cc-strip-bg')
                    .attr('x', geo.x(0)).attr('y', st.y).attr('width', geo.x(recipe.total) - geo.x(0)).attr('height', st.h).attr('rx', 2);
                const fill = d => (d.n > st.cap ? st.h : st.h * d.n / st.cap);
                const segs = sg.selectAll('rect.seg').data(st.segments).join('rect')
                    .attr('class', d => `seg hl${d.n > st.cap ? ' over' : ''}`)
                    .attr('x', d => geo.x(d.a)).attr('y', d => st.y + st.h - fill(d))
                    .attr('width', d => Math.max(1, geo.x(d.b) - geo.x(d.a))).attr('height', fill);
                segs.append('title').text(d => `${d.n} ${st.what[d.n === 1 ? 0 : 1]}` + geo.L.of(st.cap, d.n > st.cap));
                setIds(segs, d => d.ids.slice(0, 1));

                const over = st.segments.find(d => d.n > st.cap);
                if (over) {
                    sg.append('text').attr('class', 'cc-strip-warn')
                        .attr('x', geo.x(over.a)).attr('y', st.y + st.h + 11)
                        .text(geo.L.over(over.n, st.what[1]) + (st.declared ? '' : geo.L.declareCooks));
                }
            });
        }

        renderCursor(svg, geo, recipe) {
            const cursor = svg.append('g').attr('class', 'cc-cursor').style('display', 'none');
            cursor.append('line').attr('y1', STYLE.axisH - 6).attr('y2', geo.height - 4);
            const label = cursor.append('text').attr('y', STYLE.axisH - 24).attr('text-anchor', 'middle');

            svg.on('mousemove.cursor', event => {
                const [mx] = d3.pointer(event);
                const t = (mx - geo.x(0)) / geo.pxPerMin;
                if (t < 0 || t > recipe.total) { cursor.style('display', 'none'); return; }
                const now = recipe.steps.filter(s => s.start <= t && t < s.end);
                const busy = now.filter(s => s.attention === 'active').length;
                cursor.style('display', null).attr('transform', `translate(${mx},0)`);
                label.text(geo.L.cursor(Math.floor(t), now.length, busy));
            }).on('mouseleave.cursor', () => cursor.style('display', 'none'));
        }

        highlight(id) {
            const all = this.svg.selectAll('.hl');
            if (this.onHoverStep) this.onHoverStep(id);
            if (id === null) { all.classed('dim', false); return; }
            const set = lineage(this.recipe, id);
            all.classed('dim', function () { return !(this.__ids || []).every(i => set.has(i)); });
        }

        showTip(event, g) {
            const s = g.s;
            const r = this.recipe;
            const L = this.L;
            const lang = this.lang || r.lang;
            const kindLabel = KINDS[s.kind].label[lang] || KINDS[s.kind].label.en;
            const rows = [];
            rows.push(`<div class="tt-kind" style="color:${KINDS[s.kind].color}">${kindLabel} \u00b7 ${s.attention === 'active' ? L.active : L.passive}</div>`);
            rows.push(`<div class="tt-title">${s.label}</div>`);
            rows.push(`<div class="tt-time">min ${round(s.start)} \u2192 ${round(s.end)} \u00b7 ${durationLabel(s)}</div>`);
            if (s.condition) rows.push(`<div class="tt-meta">${esc(L.until(s.condition))}</div>`);
            const meta = [s.tool, s.temperature && (/^\d+$/.test(s.temperature) ? `${s.temperature}\u00b0C` : s.temperature), ...(s.params || [])].filter(Boolean);
            if (meta.length) rows.push(`<div class="tt-meta">${meta.join(' \u00b7 ')}</div>`);
            const inputs = [
                ...s.feeders.map(f => (f.fractionText ? L.partOf(f.fractionText) : '') +
                    (f.via ? f.via.name : r.byId.get(f.from).label) + (f.at ? L.at(round(f.at)) : '')),
                ...s.ingredients.map(id => r.ingredients[id].name + (s.ingredientAt[id] ? L.at(round(s.ingredientAt[id])) : ''))
            ].map(esc);
            if (inputs.length) rows.push(`<div class="tt-row"><span>${L.uses}</span>${inputs.join(', ')}</div>`);
            rows.push(`<div class="tt-row"><span>${L.gives}</span>${esc(s.output ? s.output.name : r.dish.name)}</div>`);
            if (s.block) rows.push(`<div class="tt-meta">${esc(L.block(s.block))}</div>`);
            if (s.keep != null) rows.push(`<div class="tt-meta">${esc(L.keeps(s.keep === 0 ? 0 : formatMinutes(s.keep)))}</div>`);
            (r.violations || []).filter(v => v.step === s.id).forEach(v => {
                rows.push(`<div class="tt-crit">${esc(L.spoiled(formatMinutes(v.wait), formatMinutes(v.keep)))}</div>`);
            });
            rows.push(s.critical
                ? `<div class="tt-crit">${L.critical}</div>`
                : `<div class="tt-slack">${L.window(round(s.es), round(s.ls))}</div>`);
            this.tooltip.html(rows.join('')).style('opacity', 1);

            const box = this.container.node().getBoundingClientRect();
            const tip = this.tooltip.node().getBoundingClientRect();
            let left = event.clientX - box.left + 14;
            if (left + tip.width > box.width) left = event.clientX - box.left - tip.width - 14;
            this.tooltip.style('left', `${Math.max(0, left)}px`).style('top', `${event.clientY - box.top + 14}px`);
        }

        hideTip() { this.tooltip.style('opacity', 0); }
    }

    function round(v) { return Math.round(v * 10) / 10; }
    function esc(v) {
        return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // ------------------------------------------------------------------
    // Firma visual: el mismo gr\u00e1fico sin texto, para comparar recetas
    // ------------------------------------------------------------------

    function renderSignature(container, recipe, { pxPerMin = 2.2 } = {}) {
        const geo = computeGeometry(recipe, { width: 0, signature: true, pxPerMin });
        const uid = ++uidCounter;
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${geo.width} ${geo.height}`)
            .attr('class', 'cc-signature');
        defs(svg, uid);

        svg.append('g').selectAll('path').data(geo.ribbons).join('path')
            .attr('d', d => `M${d.x0},${d.y}H${d.turn}` + ribbonPath(d).replace(/^M[^C]*/, ''))
            .attr('fill', 'none')
            .attr('stroke', STYLE.band).attr('stroke-width', d => d.thick);
        svg.append('g').selectAll('line').data(geo.bands).join('line')
            .attr('x1', d => d.x0).attr('x2', d => d.x1).attr('y1', d => d.y).attr('y2', d => d.y)
            .attr('stroke', STYLE.band).attr('stroke-width', d => d.thick);
        const fg = geo.steps.get(recipe.finalStep);
        svg.append('line').attr('x1', fg.x1).attr('x2', geo.dish.x).attr('y1', fg.y).attr('y2', fg.y)
            .attr('stroke', STYLE.band).attr('stroke-width', geo.dish.thick);
        const bars = svg.append('g').selectAll('g').data([...geo.steps.values()]).join('g');
        bars.append('rect')
            .attr('x', d => d.x0).attr('y', d => d.top).attr('width', d => d.w).attr('height', d => d.h).attr('rx', 4)
            .attr('fill', d => KINDS[d.s.kind].color);
        bars.filter(d => d.s.attention === 'passive').append('rect')
            .attr('x', d => d.x0).attr('y', d => d.top).attr('width', d => d.w).attr('height', d => d.h).attr('rx', 4)
            .attr('fill', `url(#hatch-${uid})`);
        svg.append('circle').attr('cx', geo.dish.x).attr('cy', geo.dish.y).attr('r', geo.dish.r).attr('fill', STYLE.dish);
        return { svg, width: geo.width, height: geo.height };
    }

    global.RecipeChart = RecipeChart;
    global.recipeDurationLabel = durationLabel;
    global.renderRecipeSignature = renderSignature;
})(scope);

// ---- recipe-text.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart \u2014 vistas de texto
// Junto al gr\u00e1fico, la misma receta planificada se puede leer de dos formas:
//
//   plan de trabajo       una fila por paso, con su minuto, margen y tolerancias
//   modo de elaboraci\u00f3n   frases cortas en el orden en que se cocina, con enlaces
//                         entre lo que se produce y donde se usa
//
// Las dos salen del modelo planificado (RecipeModel.prepare); nada se escribe a
// mano. El texto va en el idioma de la receta, que es el de sus nombres.
//
//   RecipeText.renderMethod(container, recipe, { onHover })
//   RecipeText.renderPlan(container, recipe, { onHover })
//   RecipeText.describe(recipe)  -> { ingredients, tools, moments, total }
//   RecipeText.schema(recipe)    -> objeto schema.org/Recipe (JSON-LD)

(function (global) {
    'use strict';

    const { formatMinutes, KINDS } = global.RecipeModel;
    const CL = global.CookingLang;

    const TEXT = {
        es: {
            plan: 'Plan de trabajo', method: 'Modo de elaboraci\u00f3n', chart: 'Gr\u00e1fico',
            ingredients: 'Ingredientes', tools: 'Utensilios', steps: 'Elaboraci\u00f3n', servings: n => `para ${n}`,
            // plan de trabajo
            critical: 'cr\u00edtico', window: t => `margen ${t}`, unattended: 'desatendido', until: c => `hasta que ${c}`,
            at: t => ` a los ${t}\u2032`, partOf: p => `${p} % de `, keeps: t => `aguanta ${t}`, noWait: 'sin espera',
            spoiled: (w, k) => `espera ${w} y aguanta ${k}`,
            // modo de elaboraci\u00f3n
            meanwhile: 'mientras tanto', together: 'a la vez', and: 'y', of: 'de', in: 'en', with: 'con', to: 'a',
            during: d => `durante ${d}`, about: d => `unos ${d}`, temp: t => `a ${t}`, tempTo: t => `a ${t}`,
            handsOff: 'sin vigilar', cantWait: 'no admite espera',
            addAt: t => (t === '1 min' ? 'al minuto, a\u00f1ade' : `a los ${t}, a\u00f1ade`), let: 'deja',
            fractions: { '1/2': 'la mitad', '1/3': 'un tercio', '2/3': 'dos tercios', '1/4': 'un cuarto', '3/4': 'tres cuartos' },
            ready: (t, dish) => [`Listo para servir en ${t}: `, dish, '.'],
            toTaste: 'al gusto'
        },
        en: {
            plan: 'Work plan', method: 'Method', chart: 'Chart',
            ingredients: 'Ingredients', tools: 'Equipment', steps: 'Method', servings: n => `serves ${n}`,
            critical: 'critical', window: t => `slack ${t}`, unattended: 'unattended', until: c => `until ${c}`,
            at: t => ` at ${t}\u2032`, partOf: p => `${p} % of `, keeps: t => `keeps ${t}`, noWait: 'no wait',
            spoiled: (w, k) => `waits ${w}, keeps ${k}`,
            meanwhile: 'meanwhile', together: 'at the same time', and: 'and', of: 'of', in: 'in', with: 'with', to: 'to',
            during: d => `for ${d}`, about: d => `about ${d}`, temp: t => `at ${t}`, tempTo: t => `to ${t}`,
            handsOff: 'hands-off', cantWait: "can't wait",
            addAt: t => `after ${t}, add`, let: 'let',
            fractions: { '1/2': 'half', '1/3': 'a third', '2/3': 'two thirds', '1/4': 'a quarter', '3/4': 'three quarters' },
            ready: (t, dish) => [`Ready to serve in ${t}: `, dish, '.'],
            toTaste: 'to taste'
        }
    };
    const textsFor = lang => TEXT[lang] || TEXT.en;

    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const fold = w => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    // "Huevos batidos" -> "huevos batidos"; respeta siglas y nombres propios ("TARE", "Kung Pao" detr\u00e1s)
    function lower(name) {
        const first = name.split(/\s+/)[0];
        if (first.length > 1 && first === first.toUpperCase()) return name;
        return name.charAt(0).toLowerCase() + name.slice(1);
    }

    function number(v, lang) {
        const r = v >= 10 ? Math.round(v) : Math.round(v * 100) / 100;
        return lang === 'es' ? String(r).replace('.', ',') : String(r);
    }

    // ------------------------------------------------------------------
    // Espa\u00f1ol: art\u00edculos
    // ------------------------------------------------------------------
    // El autor puede declarar el g\u00e9nero y el n\u00famero de un nombre con (f), (m),
    // (f pl) o (m pl). Si no lo hace, se deduce del primer sustantivo con un
    // l\u00e9xico de cocina y las terminaciones habituales; si no hay certeza, la
    // frase va sin art\u00edculo, que nunca es incorrecto en una receta.

    const ES_M = new Set(('arroz aceite azucar pan tomate chocolate cafe te pure fumet roux wok bol molde colador ' +
        'rallador mortero robot tenedor perejil laurel jengibre limon maiz pimenton comino curry yogur flan merengue ' +
        'almibar caramelo chile aguacate salmon atun mejillon calamar filete relleno glaseado hojaldre mazapan jamon ' +
        'ramen tofu miso dashi sake mirin chashu wasabi ponzu pesto guacamole fondo jugo zumo nectar sirope jarabe ' +
        'fuego papel film cucharon embudo tamiz cuenco rodillo recipiente taper termometro microondas cuscus bulgur ' +
        'almidon panko macarron noqui ravioli caldo queso vinagre tahini hummus bao wonton nori kombu udon soba ' +
        'ajo pimiento guisante anis cilantro eneldo estragon tomillo romero oregano clavo sesamo cacahuete ' +
        'anacardo pistacho brocoli calabacin champinon pepino rabano nabo puerro apio bacon lomo solomillo cordero ' +
        'pato pavo conejo bacalao rape mero lenguado langostino marisco cangrejo pulpo sofrito majado adobo alino ' +
        'plato vaso cazo horno cazo cuchillo pincel sifon vapor biberon tarro frasco escurridor exprimidor ' +
        'tazon molcajete comal ragu wakame vino ron brandy cava jerez whisky licor rebozado empanado frito asado guiso estofado').split(' '));
    const ES_F = new Set(('leche sal carne miel nuez col coliflor piel base sarten fuente legumbre bechamel ganache ' +
        'mousse quiche nieve flor nube mano foto parte mitad red gelatina clara yema harina levadura masa salsa ' +
        'mezcla crema nata cebolla zanahoria lima naranja manzana pera fresa frambuesa vainilla canela pimienta ' +
        'mostaza soja albahaca menta hierbabuena salvia guindilla cayena lechuga berenjena patata papa calabaza ' +
        'pechuga ternera panceta costilla chuleta gamba almeja sepia merluza dorada lubina sardina anchoa tortilla ' +
        'pasta pizza tarta lasana sopa paella olla cazuela paellera bandeja batidora freidora parrilla plancha ' +
        'varilla espatula mandolina tabla cuchara manga vaporera thermomix mantequilla margarina manteca grasa ' +
        'reduccion emulsion infusion guarnicion racion porcion cantidad cebolleta chalota escalona').split(' '));
    // Femeninos con "a" t\u00f3nica: el agua, las aguas
    const ES_STRESSED_A = new Set(['agua', 'ave', 'alga', 'hacha', 'ala', 'asa', 'ama', 'aspa']);
    const ES_SINGULAR_S = new Set(['microondas', 'anis', 'cuscus', 'gas', 'mus', 'lunes', 'res', 'mies', 'pais']);

    function esGenderOf(sing) {
        if (ES_M.has(sing)) return 'm';
        if (ES_F.has(sing) || ES_STRESSED_A.has(sing)) return 'f';
        if (/(ion|dad|tad|tud|umbre)$/.test(sing)) return 'f';
        if (/(o|on|or|aje)$/.test(sing)) return 'm';
        if (/a$/.test(sing)) return 'f';
        return null;
    }

    function esGuessGram(name) {
        const word = fold(name.split(/\s+/)[0] || '');
        if (!word) return null;
        const plural = word.length > 3 && word.endsWith('s') && !ES_SINGULAR_S.has(word);
        if (!plural) {
            const g = esGenderOf(word);
            return g;
        }
        const candidates = [word.slice(0, -1), word.slice(0, -2), word.replace(/ces$/, 'z')];
        for (const c of candidates) if (ES_M.has(c) || ES_F.has(c)) return esGenderOf(c) + 'p';
        for (const c of candidates) { const g = esGenderOf(c); if (g) return g + 'p'; }
        return null;
    }

    // "horno caliente" -> "el horno caliente"; con preposici\u00f3n: "al horno caliente"
    function withArticle(name, gram, lang, prep = '') {
        const n = lower(name);
        if (lang !== 'es') return `${prep ? prep + ' ' : ''}the ${n}`;
        const g = gram || esGuessGram(name);
        let art = g ? { m: 'el', f: 'la', mp: 'los', fp: 'las' }[g] : '';
        if (g === 'f' && ES_STRESSED_A.has(fold(n.split(/\s+/)[0]))) art = 'el';
        if (prep === 'a' && art === 'el') return `al ${n}`;
        if (prep === 'de' && art === 'el') return `del ${n}`;
        return [prep, art, n].filter(Boolean).join(' ');
    }

    // ------------------------------------------------------------------
    // Verbos: imperativo
    // ------------------------------------------------------------------

    // Imperativo (t\u00fa) de los infinitivos irregulares del vocabulario y de verbos frecuentes
    const ES_IRREGULAR = {
        freir: 'fr\u00ede', sofreir: 'sofr\u00ede', cocer: 'cuece', hervir: 'hierve', colar: 'cuela', tostar: 'tuesta',
        calentar: 'calienta', precalentar: 'precalienta', envolver: 'envuelve', enfriar: 'enfr\u00eda', servir: 'sirve',
        derretir: 'derrite', vaciar: 'vac\u00eda', rociar: 'roc\u00eda', poner: 'pon', hacer: 'haz', verter: 'vierte',
        remover: 'remueve', mover: 'mueve', volcar: 'vuelca', probar: 'prueba', cerrar: 'cierra', regar: 'riega',
        tener: 'ten', salir: 'sal', fre\u00edr: 'fr\u00ede', sofre\u00edr: 'sofr\u00ede', desleir: 'desl\u00ede', reir: 'r\u00ede'
    };
    function esImperative(inf) {
        const f = fold(inf);
        if (ES_IRREGULAR[f]) return ES_IRREGULAR[f];
        if (/ar$/.test(inf)) return inf.slice(0, -2) + 'a';
        if (/[ei\u00ed]r$/.test(inf)) return inf.slice(0, -2) + 'e';
        return inf;
    }

    // Verbos de reposo: "deja reposar la masa" / "let the dough rest"
    const LET_VERBS = new Set(['rest', 'proof', 'cool', 'marinate', 'soak', 'infuse', 'thaw', 'pastry:set', 'pastry:bloom']);

    function verbNames(id) {
        if (!id || !CL) return null;
        if (id.includes(':')) {
            const pack = CL.PACKS[id.split(':')[0]];
            return pack && pack.verbs[id] ? pack.verbs[id].names : null;
        }
        return CL.VERBS[id] ? CL.VERBS[id].names : null;
    }

    // La forma que escribi\u00f3 el autor, o la principal del idioma de la receta si la escribi\u00f3 en otro
    function verbWord(step, lang) {
        const written = (step.verb || step.name || '').toLowerCase().replace(/^x-/, '');
        const names = verbNames(step.verbId);
        const word = names && names[lang] && names[lang].length && !names[lang].includes(written) ? names[lang][0] : written;
        return word.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    function imperative(step, lang) {
        const words = verbWord(step, lang).split(' ');
        if (lang === 'es') return [esImperative(words[0]), ...words.slice(1)].join(' ');
        return words.join('-');
    }

    // ------------------------------------------------------------------
    // Frases
    // ------------------------------------------------------------------
    // Una frase es una lista de segmentos: texto o referencias
    //   { ref: 'ing' | 'step' | 'tool', id, text, step }

    function durationText(s, L) {
        const lo = s.durationMin != null ? s.durationMin : s.duration;
        const hi = s.duration;
        let d;
        if (lo < hi - 1e-6) d = hi < 60 ? `${Math.round(lo)}\u2013${Math.round(hi)} min` : `${formatMinutes(lo)} \u2013 ${formatMinutes(hi)}`;
        else d = formatMinutes(hi);
        return s.approx ? L.about(d) : d;
    }

    // Plural de un nombre de una sola palabra (3 lima -> 3 limas); los compuestos se dejan como est\u00e1n
    const EN_PLURAL = { tomato: 'tomatoes', potato: 'potatoes', mango: 'mangoes', leaf: 'leaves', knife: 'knives' };
    function plural(name, lang) {
        if (/\s/.test(name) || /s$/i.test(name)) return name;
        if (lang === 'en' && EN_PLURAL[name.toLowerCase()]) return EN_PLURAL[name.toLowerCase()];
        if (lang === 'es') return /[aeiou\u00e1\u00e9\u00f3]$/i.test(name) ? name + 's' : /z$/i.test(name) ? name.slice(0, -1) + 'ces' : name + 'es';
        return /(sh|ch|x)$/i.test(name) ? name + 'es' : /[^aeiou]y$/i.test(name) ? name.slice(0, -1) + 'ies' : name + 's';
    }

    function singular(name, lang) {
        if (/\s/.test(name) || !/s$/i.test(name) || /ss$/i.test(name)) return name;
        if (lang === 'en') return name.replace(/ies$/i, 'y').replace(/(o|ch|sh|x)es$/i, '$1').replace(/s$/i, '');
        return /[aeiou]s$/i.test(name) ? name.slice(0, -1) : name;
    }

    // "1/2" -> "la mitad de \u2026" / "half of \u2026"
    function partOf(fraction, fractionText, name, gram, lang) {
        const L = textsFor(lang);
        const f = fractionText || `${Math.round(fraction * 100)} %`;
        const words = L.fractions[f] || f;
        return lang === 'es' ? `${words} ${withArticle(name, gram, lang, 'de')}` : `${words} of ${withArticle(name, gram, lang)}`;
    }

    function ingredientText(ing, fraction, fractionText, lang) {
        const L = textsFor(lang);
        const name = lower(ing.name);
        let q = ing.quantity;
        const unit = ing.unit || '';
        if (q === '') return unit === L.toTaste && lang === 'es' ? `${name} ${unit}` : `${name} (${unit})`;
        if (fraction) {
            if (typeof q === 'number') q = q * fraction;
            else return partOf(fraction, fractionText, ing.name, ing.gram, lang);
        }
        if (q == null) return name;
        const range = typeof q === 'string' && /\d-\d/.test(q);
        const qt = typeof q === 'number' ? ({ 0.5: '\u00bd', 0.25: '\u00bc', 0.75: '\u00be' }[Math.round(q * 100) / 100] || number(q, lang))
            : range ? q.replace('-', '\u2013') : q;
        if (!unit || unit === 'ud' || unit === 'pc') {
            const many = range || (typeof q === 'number' && q > 1);
            return `${qt} ${many ? plural(name, lang) : typeof q === 'number' && q <= 1 ? singular(name, lang) : name}`;
        }
        // "4 hojas de lima" y no "4 hojas de hojas de lima"
        if (fold(name).split(/\s+/).includes(fold(unit))) return `${qt} ${name}`;
        return lang === 'es' ? `${qt} ${unit} de ${name}` : `${qt} ${unit} ${name}`;
    }

    function joinList(items, L) {
        const out = [];
        items.forEach((segs, i) => {
            if (i > 0) out.push(i === items.length - 1 ? ` ${L.and} ` : ', ');
            out.push(...segs);
        });
        return out;
    }

    // Un paso que solo act\u00faa sobre herramientas (precalentar el horno) produce la herramienta en otro estado
    const isToolState = s => !s.ingredients.length && !s.feeders.length;

    function describe(recipe) {
        const lang = recipe.lang === 'es' ? 'es' : 'en';
        const L = textsFor(lang);
        const byId = recipe.byId;
        const toolById = id => recipe.tools.find(t => t.id === id) || { id, name: id };

        // Primer consumidor de cada resultado: a donde lleva el enlace de "\u2192 resultado"
        const nextOf = s => s.consumers.map(c => byId.get(c)).sort((a, b) => a.start - b.start)[0];

        const ingSeg = (s, id) => ({
            ref: 'ing', id, step: s.id,
            text: ingredientText(recipe.ingredients[id], s.ingredientFraction[id], null, lang)
        });
        const stepSeg = (from, prep, fraction, fractionText) => {
            const src = byId.get(from);
            const name = src.output ? src.output.name : src.label;
            const gram = src.output ? src.output.gram : null;
            let text = withArticle(name, gram, lang, fraction ? '' : prep);
            if (fraction) text = [prep, partOf(fraction, fractionText, name, gram, lang)].filter(Boolean).join(' ');
            return { ref: 'step', id: from, step: from, text };
        };
        // La preposici\u00f3n que escribi\u00f3 el autor (con, with, on), en el idioma de la receta
        const placePrep = (s, id) => {
            const w = (s.toolPreps || {})[id];
            if (!w) return L.in;
            if (w === 'con' || w === 'with') return L.with;
            return lang === 'en' ? w : L.in;
        };
        const toolSeg = (id, prep) => {
            const t = toolById(id);
            return { ref: 'tool', id, text: withArticle(t.name, t.gram, lang, prep) };
        };

        function clause(s) {
            const objs = [];
            const later = new Map();
            const states = [];
            const push = (at, segs) => {
                if (!at) objs.push(segs);
                else { if (!later.has(at)) later.set(at, []); later.get(at).push(segs); }
            };
            (s.inputs || [...s.feeders.map(f => f.from), ...s.ingredients]).forEach(ref => {
                if (s.ingredients.includes(ref)) { push(s.ingredientAt[ref] || 0, [ingSeg(s, ref)]); return; }
                const f = s.feeders.find(x => x.from === ref);
                if (!f) return;
                if (isToolState(byId.get(f.from)) && !f.at) { states.push(f.from); return; }
                push(f.at, [stepSeg(f.from, '', f.fraction, f.fractionText)]);
            });

            // D\u00f3nde: las herramientas del paso; si una est\u00e1 en otro estado (horno caliente), ese estado
            const coveredTools = new Set(states.flatMap(id => byId.get(id).tools || []));
            const placeTools = isToolState(s) ? [] : (s.tools || []).filter(t => !coveredTools.has(t));
            if (isToolState(s)) (s.tools || []).forEach(t => objs.push([toolSeg(t)]));

            const verb = imperative(s, lang);
            const out = [];
            if (LET_VERBS.has(s.verbId)) {
                if (lang === 'es') out.push(`${L.let} ${verbWord(s, lang)} `, ...joinList(objs, L));
                else out.push(`${L.let} `, ...joinList(objs, L), ` ${verbWord(s, lang)}`);
            } else if (s.verbId === 'add' && objs.length >= 2) {
                const [target, ...rest] = objs;
                const tgt = target[0].ref === 'step'
                    ? [stepSeg(target[0].id, L.to)]
                    : [`${L.to} `, ...target];
                out.push(`${verb} `, ...joinList(rest, L), ' ', ...tgt);
            } else {
                out.push(verb);
                if (objs.length) out.push(' ', ...joinList(objs, L));
            }

            // "en la sart\u00e9n y con el colador": se agrupan por preposici\u00f3n
            const places = [...states.map(id => [placePrep(s, id), stepSeg(id, '')]), ...placeTools.map(t => [placePrep(s, t), toolSeg(t)])];
            [...new Set(places.map(p => p[0]))].forEach(prep => {
                const group = places.filter(p => p[0] === prep).map(p => [p[1]]);
                if (group.length) out.push(` ${prep} `, ...joinList(group, L));
            });
            // La temperatura, salvo que ya la diga el nombre del estado ("horno a 180\u00b0C")
            const said = places.some(p => p[1].text.replace(/\s/g, '').includes((s.temperature || '-').replace(/\s/g, '')));
            if (s.temperature && !said) out.push(' ', (isToolState(s) ? L.tempTo : L.temp)(s.temperature.replace(/\u00b0/, ' \u00b0')));
            // El fuego va junto al verbo; el resto de par\u00e1metros, al final
            const extra = [];
            (s.params || []).forEach(p => {
                const [k, ...v] = p.replace(/_/g, ' ').split(' ');
                const val = v.join(' ');
                if (lang === 'es' && fold(k) === 'fuego' && val) out.push(` a fuego ${val}`);
                else if (lang === 'en' && k === 'heat' && val) out.push(` over ${val} heat`);
                else extra.push(p.replace(/_/g, ' '));
            });
            if (s.duration > 0) out.push(' ', L.during(durationText(s, L)));
            extra.forEach(p => out.push(`, ${p}`));
            if (s.condition) out.push(`, ${L.until(s.condition)}`);
            if (s.attention === 'passive' && !LET_VERBS.has(s.verbId) && !isToolState(s)) out.push(` (${L.handsOff})`);

            if (s.output && !isToolState(s)) {
                const next = nextOf(s);
                out.push(' \u2192 ', { ref: 'step', id: next ? next.id : s.id, step: s.id, text: lower(s.output.name), produced: true });
                if (s.keep === 0) out.push(` (${L.cantWait})`);
                else if (s.keep != null) out.push(` (${L.keeps(formatMinutes(s.keep))})`);
            }
            const sentences = [out];
            [...later.entries()].sort((a, b) => a[0] - b[0]).forEach(([at, items]) => {
                sentences.push([`${L.addAt(formatMinutes(at))} `, ...joinList(items, L)]);
            });
            return sentences;
        }

        // Momentos: los pasos que empiezan en el mismo minuto, en el orden del gr\u00e1fico
        const order = [...recipe.steps].sort((a, b) => a.start - b.start || a.lane - b.lane);
        const moments = [];
        order.forEach(s => {
            const t = Math.round(s.start);
            let m = moments[moments.length - 1];
            if (!m || m.t !== t) { m = { t, steps: [] }; moments.push(m); }
            m.steps.push(s);
        });
        moments.forEach(m => {
            const running = recipe.steps.some(o => !m.steps.includes(o) && o.start < m.t - 0.01 && o.end > m.t + 0.01);
            // "Mientras tanto" solo cuando se cambia de tarea; si el paso sigue con
            // lo que acaba de terminar, la frase se lee como continuaci\u00f3n
            const continues = m.steps[0].feeders.some(f => Math.abs(byId.get(f.from).end - m.t) < 0.6);
            m.clauses = m.steps.map((s, i) => {
                const sentences = clause(s);
                const prefix = i > 0 ? L.together : running && !continues ? L.meanwhile : null;
                const first = sentences[0];
                if (prefix) first.unshift(`${cap(prefix)}, `);
                else if (typeof first[0] === 'string') first[0] = cap(first[0]);
                sentences.slice(1).forEach(seg => { seg[0] = cap(seg[0]); });
                return { step: s.id, sentences };
            });
        });

        const ingredients = Object.values(recipe.ingredients).map(i => ({ id: i.id, text: ingredientText(i, null, null, lang) }));
        const tools = recipe.tools.filter(t => !t.implicit).map(t => ({ id: t.id, text: lower(t.name) }));
        const total = formatMinutes(recipe.total);
        return { lang, L, ingredients, tools, moments, total, end: L.ready(total, recipe.dish.name) };
    }

    // ------------------------------------------------------------------
    // HTML
    // ------------------------------------------------------------------

    let instances = 0;

    function segmentHTML(seg, p) {
        if (typeof seg === 'string') return esc(seg);
        const target = seg.ref === 'ing' ? `${p}i-${seg.id}` : seg.ref === 'step' ? `${p}s-${seg.id}` : null;
        if (!target) return `<span class="cc-ref cc-ref-tool">${esc(seg.text)}</span>`;
        const cls = seg.ref === 'ing' ? 'cc-ref-ing' : seg.produced ? 'cc-ref-out' : 'cc-ref-step';
        return `<a class="cc-ref ${cls}" href="#${target}" data-target="${target}" data-step="${esc(seg.step || '')}">${esc(seg.text)}</a>`;
    }

    // Enlaces internos que funcionan tambi\u00e9n dentro de Shadow DOM, y resaltado cruzado con el gr\u00e1fico
    function wire(container, onHover) {
        container.addEventListener('click', ev => {
            const a = ev.target.closest('a.cc-ref');
            if (!a) return;
            const root = container.getRootNode();
            const el = (root.getElementById ? root : document).getElementById(a.dataset.target);
            if (!el) return;
            ev.preventDefault();
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            el.classList.remove('cc-flash');
            void el.offsetWidth;
            el.classList.add('cc-flash');
        });
        if (!onHover) return;
        container.addEventListener('mouseover', ev => {
            const el = ev.target.closest('[data-step]');
            if (el && el.dataset.step) onHover(el.dataset.step);
        });
        container.addEventListener('mouseleave', () => onHover(null));
    }

    function renderMethod(container, recipe, { onHover } = {}) {
        const d = describe(recipe);
        const p = `cc${++instances}-`;
        const L = d.L;
        const servings = recipe.servings ? ` <span class="cc-muted">\u00b7 ${esc(L.servings(String(recipe.servings).replace('.', d.lang === 'es' ? ',' : '.')))}</span>` : '';
        container.innerHTML = `
            <div class="cc-method" lang="${d.lang}">
                <div class="cc-method-ings">
                    <h4 class="cc-h">${L.ingredients}${servings}</h4>
                    <ul>${d.ingredients.map(i => `<li id="${p}i-${esc(i.id)}">${esc(i.text)}</li>`).join('')}</ul>
                    ${d.tools.length ? `<p class="cc-method-tools"><strong>${L.tools}:</strong> ${esc(d.tools.map(t => t.text).join(', '))}</p>` : ''}
                </div>
                <div class="cc-method-steps">
                    <h4 class="cc-h">${L.steps}</h4>
                    <ol>${d.moments.map(m => `
                        <li class="cc-moment">
                            <span class="cc-when">${m.t}\u2032</span>
                            <p>${m.clauses.map(c => `<span class="cc-clause" id="${p}s-${esc(c.step)}" data-step="${esc(c.step)}">${
                                c.sentences.map(sen => sen.map(seg => segmentHTML(seg, p)).join('') + '.').join(' ')}</span>`).join(' ')}</p>
                        </li>`).join('')}
                        <li class="cc-moment cc-moment-end">
                            <span class="cc-when">${esc(d.total.replace(' min', '\u2032'))}</span>
                            <p>${esc(d.end[0])}<strong>${esc(d.end[1])}</strong>${esc(d.end[2])}</p>
                        </li>
                    </ol>
                </div>
            </div>`;
        wire(container, onHover);
        return d;
    }

    function renderPlan(container, recipe, { onHover } = {}) {
        const lang = recipe.lang === 'es' ? 'es' : 'en';
        const L = textsFor(lang);
        const steps = [...recipe.steps].sort((a, b) => a.start - b.start || a.lane - b.lane);
        const dur = s => durationText({ ...s, approx: false }, L).replace(/^/, s.approx ? '~' : '');
        container.innerHTML = `<ol class="cc-plan" lang="${lang}">${steps.map(s => {
            const uses = [
                ...s.feeders.map(f => (f.fractionText ? `${f.fractionText} ` : '') +
                    (f.via ? f.via.name : recipe.byId.get(f.from).label) + (f.at ? L.at(Math.round(f.at)) : '')),
                ...s.ingredients.map(id => {
                    const i = recipe.ingredients[id];
                    const at = s.ingredientAt[id] ? L.at(Math.round(s.ingredientAt[id])) : '';
                    const part = s.ingredientFraction[id] ? L.partOf(Math.round(s.ingredientFraction[id] * 100)) : '';
                    const qty = i.quantity != null && i.quantity !== '' ? ` (${part}${i.quantity} ${i.unit || ''})`.replace(' )', ')') : '';
                    return i.name + qty + at;
                })
            ];
            const gives = s.output ? s.output.name : recipe.dish.name;
            const violation = (recipe.violations || []).find(v => v.step === s.id);
            const keep = s.keep == null ? null : (s.keep === 0 ? L.noWait : L.keeps(formatMinutes(s.keep)));
            const details = [s.tool, s.temperature, ...(s.params || []), s.condition && L.until(s.condition), keep]
                .filter(Boolean).join(' \u00b7 ');
            const note = violation
                ? `<span class="cc-plan-bad">\u26a0 ${esc(L.spoiled(formatMinutes(violation.wait), formatMinutes(violation.keep)))}</span>`
                : s.critical
                    ? `<span class="cc-plan-bad">${L.critical}</span>`
                    : `<span class="cc-plan-ok">${L.window(formatMinutes(s.slack))}</span>`;
            return `
            <li class="cc-plan-row${s.critical ? ' critical' : ''}" data-step="${esc(s.id)}">
                <span class="cc-plan-time">${Math.round(s.start)}\u2032\u2013${Math.round(s.end)}\u2032</span>
                <span class="cc-plan-kind" style="background:${KINDS[s.kind].color}"></span>
                <span class="cc-plan-main">
                    <span class="cc-plan-name">${esc(s.label)}</span>
                    <span class="cc-muted">\u00b7 ${esc(dur(s))}${s.attention === 'passive' ? ` \u00b7 ${L.unattended}` : ''}</span>
                    ${details ? `<span class="cc-plan-details">${esc(details)}</span>` : ''}
                    <span class="cc-plan-flow">${uses.length ? esc(uses.join(', ')) + ' ' : ''}\u2192 <em>${esc(gives)}</em></span>
                </span>
                <span class="cc-plan-note">${note}</span>
            </li>`;
        }).join('')}</ol>`;
        wire(container, onHover);
    }

    // ------------------------------------------------------------------
    // schema.org/Recipe: lo que los buscadores leen de una receta
    // ------------------------------------------------------------------

    const isoDuration = min => {
        const m = Math.round(min);
        return `PT${Math.floor(m / 60) ? Math.floor(m / 60) + 'H' : ''}${m % 60 || !m ? (m % 60) + 'M' : ''}`;
    };
    const plain = segs => segs.map(s => (typeof s === 'string' ? s : s.text)).join('');

    function schema(recipe) {
        const d = describe(recipe);
        const hands = recipe.steps.filter(s => s.attention === 'active').reduce((a, s) => a + s.duration, 0);
        return {
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: recipe.name,
            ...(recipe.description ? { description: recipe.description } : {}),
            ...(recipe.cuisine ? { recipeCuisine: recipe.cuisine } : {}),
            ...(recipe.servings ? { recipeYield: String(recipe.servings) } : {}),
            inLanguage: d.lang,
            totalTime: isoDuration(recipe.total),
            prepTime: isoDuration(hands),
            recipeIngredient: d.ingredients.map(i => i.text),
            ...(d.tools.length ? { tool: d.tools.map(t => ({ '@type': 'HowToTool', name: t.text })) } : {}),
            recipeInstructions: d.moments.flatMap(m => m.clauses.map(c => ({
                '@type': 'HowToStep',
                text: c.sentences.map(sen => plain(sen) + '.').join(' ')
            })))
        };
    }

    global.RecipeText = { describe, renderMethod, renderPlan, schema, imperative, withArticle, TEXT };
})(scope);

// ---- embed-element.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart \u2014 componente incrustable <cooking-chart>
//
// Uso (ver README del embed en SPEC.md \u00a78):
//
//   <script src="https://HOST/embed/cooking-chart.js" defer></script>
//
//   <cooking-chart>
//   recipe "French omelette"
//   ...
//   </cooking-chart>
//
//   <cooking-chart src="/recipes/omelette.ccl" mode="jit" controls></cooking-chart>
//
// Tambi\u00e9n convierte autom\u00e1ticamente los bloques de c\u00f3digo Markdown
// ```ccl ... ``` (<pre><code class="language-ccl">) y <pre class="cooking-chart">.
//
// Atributos:
//   src       URL de un fichero .ccl (si no, se usa el texto del elemento)
//   mode      asap | jit (por defecto, el `plan` que declare la receta)
//   lang      es | en: fuerza el idioma del gr\u00e1fico (por defecto, el de la receta)
//   controls  muestra el selector "lo antes posible / justo a tiempo"
//   variant   "signature": miniatura sin texto
//   view      qu\u00e9 mostrar: chart (por defecto), plan, method, o varias separadas
//             por espacios ("chart method"), o "all"; con m\u00e1s de una, en pesta\u00f1as
//   schema    publica la receta como JSON-LD de schema.org/Recipe en la p\u00e1gina
//
// Este fichero se empaqueta con tools/build_embed.py; `scope` contiene
// CookingLang, RecipeModel, RecipeChart, RecipeText, renderRecipeSignature y __CSS__.

(function (scope) {
    'use strict';

    if (typeof customElements === 'undefined' || customElements.get('cooking-chart')) return;

    const { CookingLang, RecipeModel, RecipeChart, RecipeText, renderRecipeSignature } = scope;
    const VIEWS = ['chart', 'method', 'plan'];
    const scriptSrc = document.currentScript && document.currentScript.src;
    const ORIGIN = scriptSrc ? new URL(scriptSrc).origin : location.origin;
    // d3 7.9.0 se sirve desde el mismo sitio que embed.js: ni CDN ni terceros
    const D3_URL = ORIGIN + '/static/vendor/d3.min.js';
    const D3_SRI = 'sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i';

    const UI = {
        es: { asap: 'Lo antes posible', alap: 'Justo a tiempo', made: 'Hecho con Cooking Chart', open: 'Abrir en el editor', errors: 'La receta tiene errores' },
        en: { asap: 'As soon as possible', alap: 'Just in time', made: 'Made with Cooking Chart', open: 'Open in the editor', errors: 'The recipe has errors' }
    };

    const COMPONENT_CSS = `
        :host { display: block; font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1c1917; }
        .cc-card { border: 1px solid #e7e5e4; border-radius: 12px; background: #fff; overflow: hidden; }
        .cc-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; justify-content: space-between; padding: 12px 14px 4px; }
        .cc-title { font-weight: 700; font-size: 16px; margin: 0; }
        .cc-total { color: #78716c; font-size: 13px; font-variant-numeric: tabular-nums; }
        .cc-modes { display: inline-flex; border: 1px solid #d6d3d1; border-radius: 8px; overflow: hidden; font-size: 12px; }
        .cc-modes button { font: inherit; border: 0; background: #fff; color: #44403c; padding: 4px 10px; cursor: pointer; }
        .cc-modes button + button { border-left: 1px solid #d6d3d1; }
        .cc-modes button[aria-pressed="true"] { background: #1c1917; color: #fff; }
        .cc-body { padding: 4px 6px 0; }
        .cc-foot { display: flex; justify-content: flex-end; padding: 2px 12px 8px; font-size: 11px; }
        .cc-foot a { color: #a8a29e; text-decoration: none; }
        .cc-foot a:hover { color: #ea580c; text-decoration: underline; }
        .cc-errors { color: #b91c1c; font-size: 13px; padding: 12px 14px; margin: 0; }
        .cc-errors li { margin-left: 18px; }
        :host([variant="signature"]) .cc-card { border: 0; background: transparent; }
        .cc-tabs { display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #f5f5f4; overflow-x: auto; }
        .cc-tabs button { font: inherit; font-size: 13px; font-weight: 500; color: #78716c; background: none; border: 0;
            border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 6px 10px; cursor: pointer; white-space: nowrap; }
        .cc-tabs button:hover { color: #1c1917; }
        .cc-tabs button[aria-selected="true"] { color: #1c1917; border-bottom-color: #ea580c; }
        .cc-panel { padding: 12px 14px; }
        .cc-panel[data-panel="chart"] { padding: 4px 6px 0; }
    `;

    let d3Promise = null;
    function ensureD3() {
        if (window.d3) return Promise.resolve();
        if (!d3Promise) {
            d3Promise = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = D3_URL;
                s.integrity = D3_SRI;     // el navegador rechaza el fichero si el CDN lo cambia
                s.crossOrigin = 'anonymous';
                s.onload = resolve;
                s.onerror = () => reject(new Error('No se pudo cargar d3'));
                document.head.appendChild(s);
            });
        }
        return d3Promise;
    }

    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Quita la sangr\u00eda com\u00fan (el texto suele venir indentado dentro del HTML)
    function dedent(text) {
        const lines = text.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
        const indents = lines.filter(l => l.trim()).map(l => /^[ \t]*/.exec(l)[0].length);
        const min = indents.length ? Math.min(...indents) : 0;
        return lines.map(l => l.slice(min)).join('\n');
    }

    class CookingChartElement extends HTMLElement {
        static get observedAttributes() { return ['src', 'mode', 'lang', 'variant', 'controls', 'view', 'schema']; }

        connectedCallback() {
            if (!this._root) {
                this._root = this.attachShadow({ mode: 'open' });
                this._root.innerHTML = `<style>${scope.__CSS__}${COMPONENT_CSS}</style><div class="cc-card" part="card"></div>`;
                this._card = this._root.querySelector('.cc-card');
                this._ro = new ResizeObserver(() => {
                    clearTimeout(this._rt);
                    this._rt = setTimeout(() => this._draw(), 120);
                });
            }
            this._ro.observe(this);
            // Si el script se carg\u00f3 antes que el contenido, esperar al DOM
            if (document.readyState === 'loading' && !this.getAttribute('src')) {
                document.addEventListener('DOMContentLoaded', () => this._load(), { once: true });
            } else {
                this._load();
            }
        }

        disconnectedCallback() {
            if (this._ro) this._ro.disconnect();
            if (this._ld) { this._ld.remove(); this._ld = null; }
        }

        // Vistas pedidas con view="\u2026", en ese orden
        _views() {
            const raw = (this.getAttribute('view') || 'chart').toLowerCase().split(/[\s,]+/).filter(Boolean);
            const list = raw.includes('all') ? VIEWS : raw.filter(v => VIEWS.includes(v));
            return list.length ? [...new Set(list)] : ['chart'];
        }

        // JSON-LD junto al elemento (fuera del Shadow DOM, donde lo leen los buscadores)
        _publishSchema(recipe) {
            if (!this.hasAttribute('schema')) { if (this._ld) { this._ld.remove(); this._ld = null; } return; }
            if (!this._ld) {
                this._ld = document.createElement('script');
                this._ld.type = 'application/ld+json';
                this.after(this._ld);
            }
            this._ld.textContent = JSON.stringify(RecipeText.schema(recipe));
        }

        attributeChangedCallback() { if (this._root && this._source != null) this._load(); }

        // API: el.source = '...' vuelve a dibujar
        get source() { return this._source; }
        set source(text) { this._source = text; this._compile(); }

        async _load() {
            try {
                const src = this.getAttribute('src');
                if (src) this._source = await fetch(src).then(r => { if (!r.ok) throw new Error(`${r.status} ${src}`); return r.text(); });
                else if (this._source == null) {
                    const tpl = this.querySelector('script[type="text/ccl"], template');
                    this._source = dedent(tpl ? (tpl.content ? tpl.content.textContent : tpl.textContent) : this.textContent);
                }
                await ensureD3();
                this._compile();
            } catch (err) {
                this._card.innerHTML = `<p class="cc-errors">${esc(err.message)}</p>`;
            }
        }

        _compile() {
            const { recipe, diagnostics, ok } = CookingLang.parse(this._source || '');
            this._recipe = ok ? recipe : null;
            this._diagnostics = diagnostics;
            const m = (this.getAttribute('mode') || '').toLowerCase();
            this._mode = ['jit', 'alap', 'just_in_time', 'justo_a_tiempo'].includes(m) ? 'alap'
                : ['asap'].includes(m) ? 'asap'
                    : (recipe.plan || 'asap');
            this._draw();
            this.dispatchEvent(new CustomEvent('cooking-chart:render', { detail: { recipe, diagnostics, ok } }));
        }

        _draw() {
            if (!this._card || this._source == null || !window.d3) return;
            const lang = this.getAttribute('lang') || (this._recipe && this._recipe.lang) || 'en';
            const ui = UI[lang] || UI.en;
            if (!this._recipe) {
                const errs = this._diagnostics.filter(d => d.severity === 'error').slice(0, 5);
                this._card.innerHTML = `<p class="cc-errors">${ui.errors}:</p><ul class="cc-errors">${
                    errs.map(e => `<li>L${e.line}: ${esc(e.message)}</li>`).join('')}</ul>`;
                return;
            }
            const recipe = RecipeModel.prepare(this._recipe, this._mode);

            this._pendingChart = null;
            if (this.getAttribute('variant') === 'signature') {
                this._card.innerHTML = '';
                renderRecipeSignature(this._card, recipe);
                return;
            }

            const controls = this.hasAttribute('controls');
            const views = this._views();
            if (!views.includes(this._view)) this._view = views[0];
            const tl = RecipeText.TEXT[recipe.lang] || RecipeText.TEXT.en;
            this._card.innerHTML = `
                <div class="cc-head">
                    <h3 class="cc-title">${esc(recipe.name)} <span class="cc-total">\u00b7 ${RecipeModel.formatMinutes(recipe.total)}</span></h3>
                    ${controls ? `<div class="cc-modes" role="group">
                        <button data-mode="asap" aria-pressed="${this._mode === 'asap'}">${ui.asap}</button>
                        <button data-mode="alap" aria-pressed="${this._mode === 'alap'}">${ui.alap}</button>
                    </div>` : ''}
                </div>
                ${views.length > 1 ? `<div class="cc-tabs" role="tablist">${views.map(v =>
                    `<button role="tab" data-view="${v}" aria-selected="${v === this._view}">${tl[v]}</button>`).join('')}</div>` : ''}
                ${views.map(v => `<div class="cc-panel" data-panel="${v}" role="tabpanel"${v === this._view ? '' : ' hidden'}></div>`).join('')}
                <div class="cc-foot"><a href="${ORIGIN}${lang === 'es' ? '/es' : ''}/editor#ccl=${b64(this._source)}" target="_blank" rel="noopener" title="${ui.open}">${ui.made} \u2197</a></div>`;
            this._card.querySelectorAll('.cc-modes button').forEach(b => b.addEventListener('click', () => {
                this._mode = b.dataset.mode;
                this._draw();
            }));
            this._card.querySelectorAll('.cc-tabs button').forEach(b => b.addEventListener('click', () => {
                this._view = b.dataset.view;
                this._card.querySelectorAll('.cc-tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
                this._card.querySelectorAll('.cc-panel').forEach(p => { p.hidden = p.dataset.panel !== this._view; });
            }));
            const panel = v => this._card.querySelector(`.cc-panel[data-panel="${v}"]`);
            let chart = null;
            const hover = id => {
                if (chart) chart.highlight(id);
                else this._card.querySelectorAll('.cc-clause, .cc-plan-row').forEach(el => el.classList.toggle('cc-active', el.dataset.step === id));
            };
            if (views.includes('chart')) {
                chart = new RecipeChart(panel('chart'), {
                    lang: this.getAttribute('lang') || undefined,
                    onHoverStep: id => this._card.querySelectorAll('.cc-clause, .cc-plan-row')
                        .forEach(el => el.classList.toggle('cc-active', el.dataset.step === id))
                });
                // Un gr\u00e1fico en una pesta\u00f1a oculta no tiene ancho: se dibuja al mostrarse
                if (this._view === 'chart') chart.render(recipe);
                else this._pendingChart = () => chart.render(recipe);
            }
            if (views.includes('method')) RecipeText.renderMethod(panel('method'), recipe, { onHover: hover });
            if (views.includes('plan')) RecipeText.renderPlan(panel('plan'), recipe, { onHover: hover });
            this._card.querySelectorAll('.cc-tabs button[data-view="chart"]').forEach(b => b.addEventListener('click', () => {
                if (this._pendingChart) { const f = this._pendingChart; this._pendingChart = null; f(); }
            }));
            this._publishSchema(recipe);
        }
    }

    customElements.define('cooking-chart', CookingChartElement);

    // Bloques Markdown ```ccl y <pre class="cooking-chart"> -> <cooking-chart>
    function upgradeCodeBlocks(root = document) {
        root.querySelectorAll('pre > code.language-ccl, pre.cooking-chart, pre.ccl').forEach(node => {
            const pre = node.tagName === 'PRE' ? node : node.parentElement;
            if (pre.closest('[data-cooking-chart="off"]')) return;   // la p\u00e1gina quiere el c\u00f3digo tal cual
            const el = document.createElement('cooking-chart');
            el._source = node.textContent;
            [...pre.attributes].forEach(a => { if (/^data-(mode|lang|controls|variant|view|schema)$/.test(a.name)) el.setAttribute(a.name.slice(5), a.value); });
            pre.replaceWith(el);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => upgradeCodeBlocks());
    else upgradeCodeBlocks();

    window.CookingChart = {
        parse: CookingLang.parse,
        prepare: RecipeModel.prepare,
        upgrade: upgradeCodeBlocks,
        method: RecipeText.describe,
        schema: RecipeText.schema,
        registerPack: CookingLang.registerPack,
        VERBS: CookingLang.VERBS
    };
})(scope);

})();
