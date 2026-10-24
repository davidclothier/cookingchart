// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — renderizado D3
// Geometría (computeGeometry) separada del dibujo (RecipeChart.render) para
// poder reutilizarla en las miniaturas de "firma visual".

(function (global) {
    'use strict';

    const { KINDS, lineage, formatMinutes, busyIntervals } = global.RecipeModel;

    // Textos del gráfico. El gráfico se dibuja en el idioma de la receta.
    const I18N = {
        es: {
            ready: t => `listo en ${t}`,
            aria: n => `Gráfico de la receta ${n}`,
            hands: 'Manos', cooks: n => `${n} cocineros`,
            burners: n => `${n} ${n === 1 ? 'fuego' : 'fuegos'}`,
            activeTask: ['tarea activa', 'tareas activas'], burnerUse: ['fuego en uso', 'fuegos en uso'],
            over: (n, what) => `⚠ ${n} ${what} a la vez`,
            of: (cap, over) => (over ? ` — hay ${cap}` : ` de ${cap}`),
            declareCooks: ' (declara "cocineros 1" para planificar con una sola persona)',
            active: 'activo', passive: 'desatendido',
            until: c => `hasta que ${c}`, at: t => ` (a los ${t}′)`, partOf: f => `${f} de `,
            uses: 'Usa', gives: 'Da', block: b => `Bloque: ${b}`,
            critical: 'En la ruta crítica: cualquier retraso retrasa el plato',
            window: (a, b) => `Puede empezar entre el min ${a} y el ${b} sin retrasar el plato`,
            keeps: k => (k === 0 ? 'Sin espera: se usa en cuanto está' : `Aguanta ${k} esperando`),
            spoiled: (w, k) => `⚠ Espera ${w}, pero aguanta ${k}`,
            cursor: (t, n, busy) => `${t}′ · ${n ? `${n} en marcha${busy ? `, ${busy} con manos` : ''}` : 'nada en marcha'}`,
            decimal: ','
        },
        en: {
            ready: t => `ready in ${t}`,
            aria: n => `Cooking chart of ${n}`,
            hands: 'Hands', cooks: n => `${n} cooks`,
            burners: n => `${n} ${n === 1 ? 'burner' : 'burners'}`,
            activeTask: ['active task', 'active tasks'], burnerUse: ['burner in use', 'burners in use'],
            over: (n, what) => `⚠ ${n} ${what} at once`,
            of: (cap, over) => (over ? ` — only ${cap}` : ` of ${cap}`),
            declareCooks: ' (declare "cooks 1" to plan for a single person)',
            active: 'hands-on', passive: 'unattended',
            until: c => `until ${c}`, at: t => ` (at ${t}′)`, partOf: f => `${f} of `,
            uses: 'In', gives: 'Out', block: b => `Block: ${b}`,
            critical: 'On the critical path: any delay delays the dish',
            window: (a, b) => `Can start anywhere between min ${a} and ${b} without delaying the dish`,
            keeps: k => (k === 0 ? 'No wait: used as soon as it is ready' : `Keeps for ${k}`),
            spoiled: (w, k) => `⚠ Waits ${w}, but only keeps for ${k}`,
            cursor: (t, n, busy) => `${t}′ · ${n ? `${n} running${busy ? `, ${busy} hands-on` : ''}` : 'nothing running'}`,
            decimal: '.'
        }
    };
    const textsFor = lang => I18N[lang] || I18N.en;

    // "10 min", "8–10 min", "~10 min"
    function durationLabel(s) {
        const lo = s.durationMin != null ? s.durationMin : s.duration;
        const base = lo < s.duration - 1e-6
            ? `${Math.round(lo)}–${formatMinutes(s.duration)}`
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
        minTimeline: 240,     // px mínimos para el eje de tiempo
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
        else if (fraction && q != null && q !== '') q = `${q} × ${Math.round(fraction * 100) / 100}`;
        if (typeof q === 'number') q = String(q).replace('.', L.decimal);
        const qty = q != null && q !== '' ? `${q}${ing.unit ? ' ' + ing.unit : ''}` : (ing.unit || '');
        return { name: ing.name, qty };
    }

    // Coloca cajas [x0, x1] en filas sin solaparse; devuelve el número de filas
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

    // Grupos de ingredientes: si dos se solapan, el que entra más tarde va
    // encima. Así las líneas que bajan de un grupo nunca atraviesan el texto
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

    // Tramos con n pasos simultáneos de los que cumplen `uses`
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
    // Geometría
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

        // círculo del plato (34 + 16) + texto a su derecha
        const rightNeed = signature ? 50 : 62 + Math.max(
            textWidth(recipe.dish.name, '700 13px Inter, system-ui, sans-serif'),
            textWidth(L.ready(formatMinutes(recipe.total)))) + 12;

        // Margen izquierdo: el texto de cada grupo de ingredientes se extiende a
        // la izquierda de su punto de entrada, también si entra después del
        // minuto 0. La escala depende del margen, así que se ajusta hasta que cabe.
        const groups = signature ? [] : recipe.steps.flatMap(s => groupsOf(s).map(gr => ({
            t: s.start + gr.at, start: s.start, end: s.end, w: groupWidth(gr.ids)
        })));
        let leftNeed = signature ? 20 : 44;
        let pxPerMin;
        for (let i = 0; i < 6; i++) {
            // En pantallas estrechas la línea de tiempo conserva un mínimo legible;
            // si no cabe, el gráfico se desplaza en horizontal
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

        // --- Pasos: posición horizontal y forma de la etiqueta
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
                        const text = `${s.label} · ${g.dur}`;
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

        // --- Ingredientes: posición de cada fila y punto de entrada a la barra
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
        const sideCount = new Map();   // cuántos afluentes entran ya por arriba/abajo de cada barra

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
    // Gráfico completo
    // ------------------------------------------------------------------

    class RecipeChart {
        // lang: fuerza el idioma del gráfico (por defecto, el de la receta)
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
                .text(t => (t === 0 ? '0' : `${Math.round(t)}′`));
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
                .text(d => (d.kind === 'derived' ? `→ ${d.text}` : d.text)), d => [d.s.id]);
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

        // Una franja por recurso. La altura del tramo es la ocupación (n / capacidad);
        // en rojo si se supera, es decir, si hacen falta más manos o fuegos de los que hay.
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
            rows.push(`<div class="tt-kind" style="color:${KINDS[s.kind].color}">${kindLabel} · ${s.attention === 'active' ? L.active : L.passive}</div>`);
            rows.push(`<div class="tt-title">${s.label}</div>`);
            rows.push(`<div class="tt-time">min ${round(s.start)} → ${round(s.end)} · ${durationLabel(s)}</div>`);
            if (s.condition) rows.push(`<div class="tt-meta">${esc(L.until(s.condition))}</div>`);
            const meta = [s.tool, s.temperature && (/^\d+$/.test(s.temperature) ? `${s.temperature}°C` : s.temperature), ...(s.params || [])].filter(Boolean);
            if (meta.length) rows.push(`<div class="tt-meta">${meta.join(' · ')}</div>`);
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
    // Firma visual: el mismo gráfico sin texto, para comparar recetas
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
})(window);
