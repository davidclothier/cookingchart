// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — página principal

(function () {
    'use strict';

    const { KINDS, prepare, stats, formatMinutes } = window.RecipeModel;
    const { t, locale, base } = window.CCI18N;

    const state = {
        recipes: [],          // [{slug, raw}]
        slug: null,
        mode: null,           // null = el que declare la receta
        cuisine: null         // filtro de la galería (null = todas)
    };
    const forcedMode = new URLSearchParams(location.search).get('mode');

    const chart = new RecipeChart('#chart', {
        onHoverStep: id => {
            document.querySelectorAll('#plan [data-step], #method .cc-clause').forEach(el => {
                el.classList.toggle('cc-active', el.dataset.step === id);
            });
        }
    });

    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const kindLabel = k => KINDS[k].label[locale] || KINDS[k].label.en;

    async function load() {
        const list = await fetch(`/recipes/${locale}.json`).then(r => r.json());
        state.recipes = await Promise.all(list.map(async slug => {
            const source = await fetch(`/static/recipes/${locale}/${slug}.ccl`).then(r => r.text());
            const { recipe, diagnostics, ok } = CookingLang.parse(source, { locale });
            if (!ok) console.warn(`${slug}.ccl`, diagnostics);
            return { slug, raw: recipe, source };
        }));
        state.recipes.sort((a, b) => prepare(a.raw, 'asap').total - prepare(b.raw, 'asap').total);

        const fromHash = location.hash.slice(1);
        select(state.recipes.some(r => r.slug === fromHash) ? fromHash : state.recipes[0].slug);

        renderLegend();
        renderGallery();
        bindModes();
        update();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { update(); scaleSignatures(); }, 150);
        });
    }

    // Al cambiar de receta, el modo vuelve al que declara su autor
    function select(slug) {
        state.slug = slug;
        const raw = state.recipes.find(r => r.slug === slug).raw;
        state.mode = forcedMode === 'alap' || forcedMode === 'asap' ? forcedMode : (raw.plan || 'asap');
    }

    function current() {
        return prepare(state.recipes.find(r => r.slug === state.slug).raw, state.mode);
    }

    function update() {
        const recipe = current();
        document.getElementById('recipe-name').textContent = recipe.name;
        document.getElementById('recipe-desc').textContent = recipe.description || '';
        document.querySelectorAll('.seg button').forEach(b => {
            const on = b.dataset.mode === state.mode;
            b.setAttribute('aria-pressed', on);
            b.classList.toggle('bg-stone-900', on);
            b.classList.toggle('text-white', on);
            b.classList.toggle('text-stone-700', !on);
            b.classList.toggle('hover:bg-stone-100', !on);
        });
        document.querySelectorAll('.recipe-card').forEach(c => c.setAttribute('aria-pressed', c.dataset.slug === state.slug));
        chart.render(recipe);
        document.getElementById('edit-link').href = `${base}/editor#ejemplo=${state.slug}`;
        renderStats(recipe);
        renderViews(recipe);
    }

    function renderLegend() {
        document.getElementById('legend').innerHTML = Object.keys(KINDS).map(k =>
            `<span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-sm" style="background:${KINDS[k].color}"></span>${kindLabel(k)}</span>`
        ).join('') + `<span class="inline-flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full bg-green-600"></span>${t('legend.ingredient')}</span>`;
    }

    function renderGallery() {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        const sigs = state.recipes.map(({ slug, raw }) => {
            const recipe = prepare(raw);
            const card = document.createElement('button');
            card.className = 'recipe-card text-left bg-white rounded-lg border border-stone-200 p-3 hover:border-stone-400';
            card.dataset.slug = slug;
            card.dataset.cuisine = recipe.cuisine || '';
            card.innerHTML = `
                <div class="flex justify-between items-baseline gap-2">
                    <span class="font-semibold text-stone-900 text-sm truncate">${esc(recipe.name)}</span>
                    <span class="text-xs text-stone-500 tabular-nums whitespace-nowrap">${formatMinutes(recipe.total)}</span>
                </div>
                ${recipe.cuisine ? `<span class="mt-1 inline-block text-[11px] text-stone-500">${esc(recipe.cuisine)}</span>` : ''}
                <div class="mt-3 h-20 flex items-center"><div class="sig-inner"></div></div>`;
            card.addEventListener('click', () => {
                select(slug);
                history.replaceState(null, '', `${location.search}#${slug}`);
                update();
            });
            gallery.appendChild(card);
            const inner = card.querySelector('.sig-inner');
            return { inner, ...renderRecipeSignature(inner, recipe) };
        });
        state.sigs = sigs;
        scaleSignatures();
        renderCuisines();
    }

    // Todas las firmas comparten escala (ancho ∝ tiempo, alto ∝ carriles): un
    // único factor que hace caber la más larga a lo ancho y la más alta a lo alto
    function scaleSignatures() {
        const sigs = state.sigs || [];
        const box = sigs.length && sigs[0].inner.parentElement;
        if (!box) return;
        const k = Math.min(box.clientWidth / Math.max(...sigs.map(s => s.width)),
                           box.clientHeight / Math.max(...sigs.map(s => s.height)));
        sigs.forEach(s => {
            s.inner.style.width = `${s.width * k}px`;
            s.inner.style.height = `${s.height * k}px`;
        });
    }

    // Filtro por cocina (metadato `cocina` / `cuisine` de cada receta)
    function renderCuisines() {
        const counts = new Map();
        state.recipes.forEach(r => { if (r.raw.cuisine) counts.set(r.raw.cuisine, (counts.get(r.raw.cuisine) || 0) + 1); });
        const box = document.getElementById('cuisines');
        box.setAttribute('aria-label', t('gallery.filter'));
        const options = [[null, t('gallery.all'), state.recipes.length],
            ...[...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale)).map(([c, n]) => [c, c, n])];
        box.innerHTML = options.map(([value, label, n]) => {
            const on = value === state.cuisine;
            return `<button data-cuisine="${esc(value || '')}" aria-pressed="${on}"
                class="px-3 py-1 rounded-full border ${on ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-300 hover:border-orange-300'}">
                ${esc(label)} <span class="${on ? 'text-stone-300' : 'text-stone-400'} tabular-nums">${n}</span></button>`;
        }).join('');
        box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            state.cuisine = b.dataset.cuisine || null;
            document.querySelectorAll('.recipe-card').forEach(card => {
                card.hidden = !!state.cuisine && card.dataset.cuisine !== state.cuisine;
            });
            renderCuisines();
        }));
    }

    function bindModes() {
        document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
            state.mode = b.dataset.mode;
            update();
        }));
    }

    function renderStats(recipe) {
        const s = stats(recipe);
        const items = [
            [t('stats.total'), formatMinutes(s.total), t('stats.steps', s.steps)],
            [t('stats.hands'), formatMinutes(s.active), t('stats.handsPct', Math.round(100 * s.active / s.total))],
            [t('stats.free'), formatMinutes(s.hands_free), t('stats.freeSub')],
            [t('stats.saved'), formatMinutes(s.saved), t('stats.savedSub', formatMinutes(s.sequential))],
            [t('stats.parallel'), `${s.parallel}`, t('stats.parallelSub')],
            [t('stats.ingredients'), `${s.ingredients}`, t('stats.critical', s.critical.length)]
        ];
        document.getElementById('stats').innerHTML = items.map(([k, v, sub]) => `
            <div class="bg-white px-5 py-3">
                <dt class="text-xs text-stone-500">${k}</dt>
                <dd class="text-xl font-bold text-stone-900 tabular-nums">${v}</dd>
                <dd class="text-xs text-stone-400">${sub}</dd>
            </div>`).join('');
    }

    // Plan de trabajo y modo de elaboración: las vistas de texto de la misma receta
    function renderViews(recipe) {
        const hover = id => chart.highlight(id);
        RecipeText.renderMethod(document.getElementById('method'), recipe, { onHover: hover });
        RecipeText.renderPlan(document.getElementById('plan'), recipe, { onHover: hover });
    }

    // Pestañas entre las vistas de texto (la elegida se recuerda en este navegador)
    function wireViewTabs() {
        const tabs = [...document.querySelectorAll('[data-views] [role="tab"]')];
        const show = view => {
            tabs.forEach(b => b.setAttribute('aria-selected', b.dataset.view === view));
            document.querySelectorAll('[data-views] [data-panel]').forEach(p => { p.hidden = p.dataset.panel !== view; });
            try { localStorage.setItem('cc-view', view); } catch (e) { /* sin almacenamiento */ }
        };
        tabs.forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
        let saved = null;
        try { saved = localStorage.getItem('cc-view'); } catch (e) { /* sin almacenamiento */ }
        if (tabs.some(b => b.dataset.view === saved)) show(saved);
    }
    wireViewTabs();

    load().catch(err => {
        console.error(err);
        document.getElementById('chart').innerHTML = `<p class="p-6 text-red-700">${t('home.error')}: ${esc(err.message)}</p>`;
    });
})();
