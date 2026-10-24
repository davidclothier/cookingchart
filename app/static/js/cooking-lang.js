// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart Language (CCL) — parser
// Convierte el texto de una receta en el formato compacto que entiende
// recipe-model.js. Especificación: SPEC.md (en) / SPEC.es.md (es).
//
//   const { recipe, diagnostics, ok } = CookingLang.parse(texto, { locale: 'es' });
//
// CCL es bilingüe: palabras clave, verbos y unidades se aceptan en español
// y en inglés, y pueden mezclarse. `locale` solo decide el idioma de los
// mensajes de error; el idioma de la receta (recipe.lang) se declara con
// `idioma`/`language` o se deduce de las palabras clave usadas.

(function (global) {
    'use strict';

    const LANGS = ['es', 'en'];

    // ------------------------------------------------------------------
    // Vocabulario controlado de verbos
    // ------------------------------------------------------------------
    // Cada verbo tiene un identificador canónico (en inglés), un tipo, un modo
    // de atención por defecto y sus formas en cada idioma.
    //   kind: prep | heat | oven | rest | assemble

    const VERB_TABLE = [
        // Preparación (mecánico): transforma forma o textura aplicando fuerza
        ['chop', 'prep', 'active', 'picar', 'chop mince'],
        ['cut', 'prep', 'active', 'cortar trocear', 'cut dice cube'],
        ['slice', 'prep', 'active', 'laminar filetear', 'slice fillet'],
        ['grate', 'prep', 'active', 'rallar', 'grate'],
        ['peel', 'prep', 'active', 'pelar', 'peel'],
        ['beat', 'prep', 'active', 'batir', 'beat whisk whip'],
        ['blend', 'prep', 'active', 'triturar', 'blend purée puree'],
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
        // Montaje (combinación): junta materias en una nueva
        ['mix', 'assemble', 'active', 'mezclar combinar', 'mix combine'],
        ['add', 'assemble', 'active', 'añadir incorporar', 'add fold incorporate'],
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
        ['saute', 'heat', 'active', 'saltear', 'sauté saute stir_fry'],
        ['sweat', 'heat', 'active', 'pochar rehogar sofreír', 'sweat soften'],
        ['brown', 'heat', 'active', 'dorar marcar', 'brown sear'],
        ['fry', 'heat', 'active', 'freír', 'fry deep_fry'],
        ['toast', 'heat', 'active', 'tostar nacarar', 'toast'],
        ['caramelize', 'heat', 'active', 'caramelizar', 'caramelize caramelise'],
        ['melt', 'heat', 'active', 'fundir derretir', 'melt'],
        ['cook', 'heat', 'active', 'cocinar', 'cook'],
        ['flambe', 'heat', 'active', 'flambear', 'flambé flambe'],
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
    // Un paquete añade verbos a una receta que lo declara con `usa "nombre"`
    // / `use "name"`. Sus identificadores llevan el prefijo del paquete
    // (`pastry:temper`) y, dentro de esa receta, tienen prioridad sobre el
    // vocabulario base (en pastelería, "laminar" es hojaldrar, no cortar).
    //
    //   CookingLang.registerPack({
    //       id: 'pastry', names: { es: 'pastelería', en: 'pastry' },
    //       verbs: [['temper', 'heat', 'active', 'atemperar', 'temper'], ...]
    //   });

    const PACKS = {};
    const fold = w => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function registerPack(def) {
        if (!def || !/^[a-z][a-z0-9_-]*$/.test(def.id || '')) throw new Error('registerPack: id inválido');
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

    // Tipos que el autor puede asignar con @tipo:… / @kind:…
    const KIND_NAMES = {
        prep: ['prep', 'preparacion', 'preparación', 'mecanico', 'mecánico'],
        assemble: ['assemble', 'assembly', 'montaje', 'combinacion', 'combinación'],
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
        description: { es: ['descripcion', 'descripción'], en: ['description'] },
        cuisine:     { es: ['cocina'], en: ['cuisine'] },
        language:    { es: ['idioma'], en: ['language', 'lang'] },
        servings:    { es: ['raciones'], en: ['servings', 'serves'] },
        cooks:       { es: ['cocineros'], en: ['cooks'] },
        burners:     { es: ['fuegos'], en: ['burners'] },
        plan:        { es: ['plan', 'planificación', 'planificacion'], en: ['schedule'] },
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
    // Unidades: forma canónica + cómo se muestra en cada idioma
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
        ['handful', 'puñado', 'handful', 'puñado puñados handful handfuls'],
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
              chorrito: 'chorritos', 'puñado': 'puñados', manojo: 'manojos' },
        en: { cup: 'cups', glass: 'glasses', pinch: 'pinches', clove: 'cloves', leaf: 'leaves', sprig: 'sprigs',
              stalk: 'stalks', can: 'cans', sachet: 'sachets', slice: 'slices', splash: 'splashes', handful: 'handfuls', bunch: 'bunches' }
    };
    const UNITS = {};        // canónica -> { es, en }
    const UNIT_LOOKUP = {};  // forma escrita -> canónica
    UNIT_TABLE.forEach(([id, es, en, forms]) => {
        UNITS[id] = { es, en };
        forms.split(' ').forEach(f => { UNIT_LOOKUP[f] = id; });
    });
    function unitLabel(id, lang, quantity) {
        const one = UNITS[id][lang];
        // Plural solo con cantidades numéricas distintas de 1 (las fracciones van en singular: 1/2 taza)
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
            badCooks: () => '"cocineros" espera un número (o "ilimitados")',
            badBurners: () => '"fuegos" espera un número',
            unknownPack: n => `Paquete de vocabulario desconocido "${n}"`,
            badKind: v => `Tipo desconocido "${v}". Usa preparación, montaje, fuego, horno o reposo`,
            badPlan: v => `Plan desconocido "${v}". Usa "lo_antes_posible" o "justo_a_tiempo"`,
            badLang: v => `Idioma desconocido "${v}". Usa "es" o "en"`,
            blockUsage: () => 'Uso: bloque "Nombre"',
            serveUsage: () => 'Uso: servir <resultado>',
            plusOrphan: () => 'Un "+" tiene que ir justo después de un paso',
            plusUsage: () => 'Uso: + ingrediente[, ingrediente] a los <tiempo>   (p. ej. "+ vino a los 5min")',
            badTime: t => `No entiendo el tiempo "${t}"`,
            addLate: (at, d) => `Se añade en el minuto ${at}, pero el paso solo dura ${d}`,
            notUnderstoodIndented: () => 'No entiendo esta línea. ¿Querías un añadido? Empieza por "+".',
            notUnderstood: l => `No entiendo "${l}". Un paso se escribe: resultado = verbo(ingredientes) duración`,
            badIngredient: () => 'Ingrediente mal escrito. Uso: nombre cantidad unidad "nombre visible"',
            dupIngredient: id => `El ingrediente "${id}" ya está declarado`,
            unknownUnit: u => `Unidad desconocida "${u}"; se mostrará tal cual`,
            badTool: t => `Herramienta mal escrita: "${t}". Uso: nombre [x cantidad]`,
            badInput: t => `Entrada mal escrita: "${t}"`,
            badFraction: f => `Fracción fuera de rango: ${f}`,
            dupResult: (id, l) => `"${id}" ya se ha producido en otro paso (línea ${l})`,
            resultIsIngredient: id => `"${id}" ya es un ingrediente; usa otro nombre para el resultado`,
            unknownVerb: v => `Verbo "${v}" fuera del vocabulario; se clasificará por aproximación`,
            noInputs: v => `"${v}" no tiene entradas`,
            badModifier: w => `No entiendo "${w}" en este paso`,
            noDurationCond: c => `Sin duración estimada para "hasta ${c}"; se usará 0`,
            noDuration: () => 'Falta la duración (p. ej. "10min", "1h30", "8-10min")',
            selfUse: id => `"${id}" no puede usarse a sí mismo`,
            undefinedName: id => `"${id}" no está definido: decláralo en ingredientes o prodúcelo en un paso anterior`,
            undeclaredTool: t => `Herramienta "${t}" no declarada en "herramientas"`,
            unusedIngredient: id => `El ingrediente "${id}" no se usa en ningún paso`,
            mixedParts: id => `"${id}" se usa entero y también por partes`,
            partsOver: (id, p) => `Las partes de "${id}" suman más del total (${p} %)`,
            partsUnder: (id, p) => `Solo se usa el ${p} % de "${id}"`,
            serveUndefined: id => `"${id}" no lo produce ningún paso`,
            missingServe: id => `Falta "servir <resultado>"; se toma "${id}" como plato final`,
            unusedResult: id => `"${id}" se produce pero no se usa ni se sirve`,
            noSteps: () => 'La receta no tiene pasos',
            cycle: id => `Dependencia circular en "${id}"`,
            keepOnFinal: () => '"aguanta"/"sin espera" no tiene efecto en el plato final',
            untitled: () => 'Receta sin título'
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
    // Léxico
    // ------------------------------------------------------------------

    const ID = '[\\p{L}_][\\p{L}\\p{N}_]*';
    const NUM = '\\d+(?:[.,]\\d+)?';
    // Parámetros: identificador, con prefijo x- y guiones para extensiones (@x-thermomix-velocidad:4)
    const PARAM = `(?:x-)?${ID}(?:-[\\p{L}\\p{N}_]+)*`;
    const re = (src, flags = '') => new RegExp(src, 'u' + flags);
    // Género y número gramatical opcionales tras un nombre: (f), (m), (f pl), (m pl).
    // Solo los usa el modo de elaboración para poner bien los artículos.
    const GRAM = '\\(\\s*([mf])\\.?\\s*(pl\\.?)?\\s*\\)';
    const gramOf = (g, pl) => (g ? g.toLowerCase() + (pl ? 'p' : '') : null);

    const RX = {
        header: re(`^(\\p{L}+)\\s+(.*)$`),
        string: re(`^"([^"]*)"$`),
        // cantidad: número, fracción (1/2) o rango (3-4)
        ingredient: re(`^(${ID})(?:\\s+(${NUM}(?:\\s*-\\s*${NUM})?|\\d+\\/\\d+)(?:\\s*([\\p{L}.]+))?)?(?:\\s+(al gusto|to taste|c\\.s\\.|as needed))?(?:\\s+"([^"]*)")?(?:\\s*${GRAM})?$`, 'i'),
        tool: re(`^(${ID})(?:\\s*${GRAM})?(?:\\s*[x×]\\s*(\\d+))?$`, 'i'),
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
        return `${s}°${scale.toUpperCase()}`;
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

    // Idioma de la receta: el declarado o, si no, el de la mayoría de sus palabras clave
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

        // Cada diagnóstico lleva un código estable (para la batería de conformidad
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

        // Paquetes de vocabulario: se leen antes que nada, estén donde estén
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

            // --- Añadido a mitad de proceso:  + vino a los 5min
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

            // --- Líneas dentro de secciones
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
                // Un rango va en plural (2-3 dientes); una fracción, en singular (1/2 taza)
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
                        // "con colador", "on rack": la preposición, si no es la de recipiente (en/in)
                        if (!/^(en|in)$/i.test(m[1])) step.toolPreps[t.trim()] = m[1].toLowerCase();
                    });
                } else if ((m = re(`^@\\s*(${NUM})\\s*(?:º|°)?\\s*([CF])(?!\\p{L})`, 'i').exec(s))) {
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
        // Resolución de nombres y validación
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
                    // Herramienta sin declarar: se admite, sin límite de capacidad
                    warn(step.line, 'undeclaredTool', t);
                    tools.set(t, { id: t, name: prettyId(t), capacity: null, implicit: true });
                    useTool(t);
                }
            });
            // Un paso que solo actúa sobre herramientas produce esa herramienta en otro estado
            const onlyTools = step.inputs.length && step.inputs.every(i => tools.has(i.ref) || toolState.has(i.ref));
            if (onlyTools) toolState.set(step.id, step.toolsBase[0]);
        });

        ingredients.forEach(i => { if (!i.used) warn(i.line, 'unusedIngredient', i.id); });

        // Fracciones: aceite[1/2] + aceite[1/2] debería sumar el total
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

        // Ciclos (un paso puede citar resultados declarados más abajo)
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
})(typeof window !== 'undefined' ? window : globalThis);
