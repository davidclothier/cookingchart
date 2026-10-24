// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — modelo de receta
// Normaliza la salida del parser, planifica los pasos en el tiempo (CPM) y
// asigna carriles. No sabe nada de SVG: todo lo visual vive en recipe-chart.js.

(function (global) {
    'use strict';

    // ------------------------------------------------------------------
    // Tipos de paso
    // ------------------------------------------------------------------

    const KINDS = {
        prep:     { label: { es: 'Preparación', en: 'Prep' },     color: '#0e7490' },
        heat:     { label: { es: 'Fuego',       en: 'Stovetop' }, color: '#ea580c' },
        oven:     { label: { es: 'Horno',       en: 'Oven' },     color: '#b91c1c' },
        rest:     { label: { es: 'Reposo',      en: 'Rest' },     color: '#64748b' },
        assemble: { label: { es: 'Montaje',     en: 'Assembly' }, color: '#7c3aed' }
    };

    const KIND_RULES = [
        ['rest',     /repos|levad|levar|ferment|enfri|marin|refriger|esperar|templar|hidratar/i],
        ['oven',     /horne|gratin/i],
        ['heat',     /cocin|cocer|cocci|fre[íi]r|saltea|sofr|herv|reduc|tost|dorar|guis|plancha|roux|bechamel|derret|calent|pochar|confit/i],
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

    // ¿Requiere al cocinero durante todo el paso, o puede desatenderlo?
    function inferAttention(step) {
        if (step.attention === 'active' || step.attention === 'passive') return step.attention;
        if (step.kind === 'rest' || step.kind === 'oven') return 'passive';
        if (step.kind === 'heat' && step.duration >= 20) return 'passive';
        return 'active';
    }

    // "PICAR VERDURAS" -> "Picar verduras", "HORNEAR 180°C" -> "Hornear 180°C"
    function prettyName(name) {
        if (!name || name !== name.toUpperCase()) return name;
        const lower = name.toLowerCase().replace(/(\d)\s*°c/g, '$1°C');
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    // ------------------------------------------------------------------
    // Normalización: salida del parser -> modelo común
    // ------------------------------------------------------------------
    //
    // Modelo común:
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

        // "Masa": cuántos ingredientes base lleva acumulados la banda de cada paso
        recipe.order.forEach(s => {
            const upstream = new Set(s.ingredients);
            s.feeders.forEach(f => byId.get(f.from).upstreamIngredients.forEach(i => upstream.add(i)));
            s.upstreamIngredients = upstream;
            s.mass = upstream.size;
        });

        // Recursos: solo restringen si se declaran. Una receta doméstica no
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

        // El plato lo produce el paso final; si no está marcado, el último sumidero
        const sinks = recipe.steps.filter(s => s.consumers.length === 0);
        const marked = recipe.steps.find(s => s.isFinal);
        recipe.finalStep = (marked || sinks[sinks.length - 1] || recipe.order[recipe.order.length - 1]).id;
        if (byId.get(recipe.finalStep).output && !marked) {
            // En el formato compacto el último "makes" es el propio plato
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
    // Planificación
    // ------------------------------------------------------------------
    //
    // Sin recursos limitados es el método de la ruta crítica (CPM). Con
    // cocineros o herramientas limitadas se usa un esquema de generación en
    // serie (serial SGS): los pasos se colocan por prioridad (el que más
    // camino tiene por delante) en el primer hueco con recursos libres.
    //
    // mode 'asap': SGS desde el principio: cada paso, en cuanto puede.
    // mode 'alap': SGS desde el plato hacia atrás: cada paso termina lo más
    //              cerca posible de cuando se necesita (la bechamel no espera
    //              una hora y el risotto no se pasa mientras se hacen las setas).
    //
    // Después se fija el orden en que cada recurso atiende a los pasos del
    // plan y, sobre ese grafo aumentado, se calculan inicio temprano, tardío,
    // holgura y ruta crítica. Mover un paso dentro de su holgura nunca crea
    // solapes nuevos: dos pasos que no se solapaban siguen sin hacerlo.
    //
    // Precedencia con añadidos a mitad de proceso: si c usa lo que produce f
    // en el minuto `at` de c, entonces c.start >= f.end - at.

    const EPS = 1e-6;

    // Aristas genéricas: succ.t >= pred.t + lag
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

    // SGS genérico. Devuelve el instante de inicio de cada paso.
    // urgency(s): número menor = se coloca antes (opcional)
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
    // Cuánto aguanta un intermedio (decisión del autor: `aguanta 30min`,
    // `sin espera`). Restricción de desfase máximo:
    //     c.start + at - p.end <= keep
    // Se repara el plan retrasando el productor (en orden topológico inverso,
    // para que el retraso se propague a sus predecesores) al primer hueco con
    // recursos libres. Si no hay hueco, queda como violación y se avisa.
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
            // Candidatos: justo en el límite, o justo cuando se libera un recurso
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
    // intermedio, y duración total
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

        // 1. Plan. El SGS es una heurística: se prueban varias prioridades y se
        //    elige el plan con menos esperas excesivas (§4.5) y, a igualdad, el
        //    más corto. Las recetas son pequeñas, así que sale barato.
        const keepOf = s => (s.keep == null ? Infinity : s.keep);
        const urgencies = mode === 'alap'
            // hacia atrás, colocar antes = más cerca del consumidor
            ? [() => 0, s => (s.keep === 0 ? 0 : 1), keepOf, s => (s.keep === 0 ? 0 : s.keep == null ? 2 : 1)]
            // hacia delante, colocar después = más cerca del consumidor
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

        // 3. Inicio temprano / tardío sobre el grafo aumentado
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
            // ASAP: el plan tal cual (ya reparado); ALAP: lo más tarde posible
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
    // Partiendo del paso final, la cadena principal sigue hacia atrás por el
    // afluente que llega más tarde (el que marca el ritmo). El resto de
    // afluentes forman sub-bloques que se colocan alternando arriba/abajo,
    // los que desembocan antes más cerca del carril padre.
    //
    // Como cada subárbol ocupa un bloque contiguo de carriles y sus bandas
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
            let next = side > 0 ? 1 : -1;  // primero hacia fuera; la raíz empieza arriba
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
    // Métricas
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

    // Todo lo que alimenta a un paso, y todo lo que sale de él
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
})(window);
