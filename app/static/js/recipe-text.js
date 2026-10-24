// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — vistas de texto
// Junto al gráfico, la misma receta planificada se puede leer de dos formas:
//
//   plan de trabajo       una fila por paso, con su minuto, margen y tolerancias
//   modo de elaboración   frases cortas en el orden en que se cocina, con enlaces
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
            plan: 'Plan de trabajo', method: 'Modo de elaboración', chart: 'Gráfico',
            ingredients: 'Ingredientes', tools: 'Utensilios', steps: 'Elaboración', servings: n => `para ${n}`,
            // plan de trabajo
            critical: 'crítico', window: t => `margen ${t}`, unattended: 'desatendido', until: c => `hasta que ${c}`,
            at: t => ` a los ${t}′`, partOf: p => `${p} % de `, keeps: t => `aguanta ${t}`, noWait: 'sin espera',
            spoiled: (w, k) => `espera ${w} y aguanta ${k}`,
            // modo de elaboración
            meanwhile: 'mientras tanto', together: 'a la vez', and: 'y', of: 'de', in: 'en', with: 'con', to: 'a',
            during: d => `durante ${d}`, about: d => `unos ${d}`, temp: t => `a ${t}`, tempTo: t => `a ${t}`,
            handsOff: 'sin vigilar', cantWait: 'no admite espera',
            addAt: t => (t === '1 min' ? 'al minuto, añade' : `a los ${t}, añade`), let: 'deja',
            fractions: { '1/2': 'la mitad', '1/3': 'un tercio', '2/3': 'dos tercios', '1/4': 'un cuarto', '3/4': 'tres cuartos' },
            ready: (t, dish) => [`Listo para servir en ${t}: `, dish, '.'],
            toTaste: 'al gusto'
        },
        en: {
            plan: 'Work plan', method: 'Method', chart: 'Chart',
            ingredients: 'Ingredients', tools: 'Equipment', steps: 'Method', servings: n => `serves ${n}`,
            critical: 'critical', window: t => `slack ${t}`, unattended: 'unattended', until: c => `until ${c}`,
            at: t => ` at ${t}′`, partOf: p => `${p} % of `, keeps: t => `keeps ${t}`, noWait: 'no wait',
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
    const fold = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    // "Huevos batidos" -> "huevos batidos"; respeta siglas y nombres propios ("TARE", "Kung Pao" detrás)
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
    // Español: artículos
    // ------------------------------------------------------------------
    // El autor puede declarar el género y el número de un nombre con (f), (m),
    // (f pl) o (m pl). Si no lo hace, se deduce del primer sustantivo con un
    // léxico de cocina y las terminaciones habituales; si no hay certeza, la
    // frase va sin artículo, que nunca es incorrecto en una receta.

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
    // Femeninos con "a" tónica: el agua, las aguas
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

    // "horno caliente" -> "el horno caliente"; con preposición: "al horno caliente"
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

    // Imperativo (tú) de los infinitivos irregulares del vocabulario y de verbos frecuentes
    const ES_IRREGULAR = {
        freir: 'fríe', sofreir: 'sofríe', cocer: 'cuece', hervir: 'hierve', colar: 'cuela', tostar: 'tuesta',
        calentar: 'calienta', precalentar: 'precalienta', envolver: 'envuelve', enfriar: 'enfría', servir: 'sirve',
        derretir: 'derrite', vaciar: 'vacía', rociar: 'rocía', poner: 'pon', hacer: 'haz', verter: 'vierte',
        remover: 'remueve', mover: 'mueve', volcar: 'vuelca', probar: 'prueba', cerrar: 'cierra', regar: 'riega',
        tener: 'ten', salir: 'sal', freír: 'fríe', sofreír: 'sofríe', desleir: 'deslíe', reir: 'ríe'
    };
    function esImperative(inf) {
        const f = fold(inf);
        if (ES_IRREGULAR[f]) return ES_IRREGULAR[f];
        if (/ar$/.test(inf)) return inf.slice(0, -2) + 'a';
        if (/[eií]r$/.test(inf)) return inf.slice(0, -2) + 'e';
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

    // La forma que escribió el autor, o la principal del idioma de la receta si la escribió en otro
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
        if (lo < hi - 1e-6) d = hi < 60 ? `${Math.round(lo)}–${Math.round(hi)} min` : `${formatMinutes(lo)} – ${formatMinutes(hi)}`;
        else d = formatMinutes(hi);
        return s.approx ? L.about(d) : d;
    }

    // Plural de un nombre de una sola palabra (3 lima -> 3 limas); los compuestos se dejan como están
    const EN_PLURAL = { tomato: 'tomatoes', potato: 'potatoes', mango: 'mangoes', leaf: 'leaves', knife: 'knives' };
    function plural(name, lang) {
        if (/\s/.test(name) || /s$/i.test(name)) return name;
        if (lang === 'en' && EN_PLURAL[name.toLowerCase()]) return EN_PLURAL[name.toLowerCase()];
        if (lang === 'es') return /[aeiouáéó]$/i.test(name) ? name + 's' : /z$/i.test(name) ? name.slice(0, -1) + 'ces' : name + 'es';
        return /(sh|ch|x)$/i.test(name) ? name + 'es' : /[^aeiou]y$/i.test(name) ? name.slice(0, -1) + 'ies' : name + 's';
    }

    function singular(name, lang) {
        if (/\s/.test(name) || !/s$/i.test(name) || /ss$/i.test(name)) return name;
        if (lang === 'en') return name.replace(/ies$/i, 'y').replace(/(o|ch|sh|x)es$/i, '$1').replace(/s$/i, '');
        return /[aeiou]s$/i.test(name) ? name.slice(0, -1) : name;
    }

    // "1/2" -> "la mitad de …" / "half of …"
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
        const qt = typeof q === 'number' ? ({ 0.5: '½', 0.25: '¼', 0.75: '¾' }[Math.round(q * 100) / 100] || number(q, lang))
            : range ? q.replace('-', '–') : q;
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

    // Un paso que solo actúa sobre herramientas (precalentar el horno) produce la herramienta en otro estado
    const isToolState = s => !s.ingredients.length && !s.feeders.length;

    function describe(recipe) {
        const lang = recipe.lang === 'es' ? 'es' : 'en';
        const L = textsFor(lang);
        const byId = recipe.byId;
        const toolById = id => recipe.tools.find(t => t.id === id) || { id, name: id };

        // Primer consumidor de cada resultado: a donde lleva el enlace de "→ resultado"
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
        // La preposición que escribió el autor (con, with, on), en el idioma de la receta
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

            // Dónde: las herramientas del paso; si una está en otro estado (horno caliente), ese estado
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

            // "en la sartén y con el colador": se agrupan por preposición
            const places = [...states.map(id => [placePrep(s, id), stepSeg(id, '')]), ...placeTools.map(t => [placePrep(s, t), toolSeg(t)])];
            [...new Set(places.map(p => p[0]))].forEach(prep => {
                const group = places.filter(p => p[0] === prep).map(p => [p[1]]);
                if (group.length) out.push(` ${prep} `, ...joinList(group, L));
            });
            // La temperatura, salvo que ya la diga el nombre del estado ("horno a 180°C")
            const said = places.some(p => p[1].text.replace(/\s/g, '').includes((s.temperature || '-').replace(/\s/g, '')));
            if (s.temperature && !said) out.push(' ', (isToolState(s) ? L.tempTo : L.temp)(s.temperature.replace(/°/, ' °')));
            // El fuego va junto al verbo; el resto de parámetros, al final
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
                out.push(' → ', { ref: 'step', id: next ? next.id : s.id, step: s.id, text: lower(s.output.name), produced: true });
                if (s.keep === 0) out.push(` (${L.cantWait})`);
                else if (s.keep != null) out.push(` (${L.keeps(formatMinutes(s.keep))})`);
            }
            const sentences = [out];
            [...later.entries()].sort((a, b) => a[0] - b[0]).forEach(([at, items]) => {
                sentences.push([`${L.addAt(formatMinutes(at))} `, ...joinList(items, L)]);
            });
            return sentences;
        }

        // Momentos: los pasos que empiezan en el mismo minuto, en el orden del gráfico
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
            // lo que acaba de terminar, la frase se lee como continuación
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

    // Enlaces internos que funcionan también dentro de Shadow DOM, y resaltado cruzado con el gráfico
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
        const servings = recipe.servings ? ` <span class="cc-muted">· ${esc(L.servings(String(recipe.servings).replace('.', d.lang === 'es' ? ',' : '.')))}</span>` : '';
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
                            <span class="cc-when">${m.t}′</span>
                            <p>${m.clauses.map(c => `<span class="cc-clause" id="${p}s-${esc(c.step)}" data-step="${esc(c.step)}">${
                                c.sentences.map(sen => sen.map(seg => segmentHTML(seg, p)).join('') + '.').join(' ')}</span>`).join(' ')}</p>
                        </li>`).join('')}
                        <li class="cc-moment cc-moment-end">
                            <span class="cc-when">${esc(d.total.replace(' min', '′'))}</span>
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
                .filter(Boolean).join(' · ');
            const note = violation
                ? `<span class="cc-plan-bad">⚠ ${esc(L.spoiled(formatMinutes(violation.wait), formatMinutes(violation.keep)))}</span>`
                : s.critical
                    ? `<span class="cc-plan-bad">${L.critical}</span>`
                    : `<span class="cc-plan-ok">${L.window(formatMinutes(s.slack))}</span>`;
            return `
            <li class="cc-plan-row${s.critical ? ' critical' : ''}" data-step="${esc(s.id)}">
                <span class="cc-plan-time">${Math.round(s.start)}′–${Math.round(s.end)}′</span>
                <span class="cc-plan-kind" style="background:${KINDS[s.kind].color}"></span>
                <span class="cc-plan-main">
                    <span class="cc-plan-name">${esc(s.label)}</span>
                    <span class="cc-muted">· ${esc(dur(s))}${s.attention === 'passive' ? ` · ${L.unattended}` : ''}</span>
                    ${details ? `<span class="cc-plan-details">${esc(details)}</span>` : ''}
                    <span class="cc-plan-flow">${uses.length ? esc(uses.join(', ')) + ' ' : ''}→ <em>${esc(gives)}</em></span>
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
})(window);
