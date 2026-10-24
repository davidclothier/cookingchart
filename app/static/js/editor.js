// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — editor en vivo de CCL

(function () {
    'use strict';

    const { KINDS, prepare, stats, formatMinutes } = window.RecipeModel;
    const { parse, VERBS, PACKS, KEYWORDS, resolveVerb } = window.CookingLang;
    const { t, locale, base } = window.CCI18N;

    const $ = id => document.getElementById(id);
    const source = $('source');
    const highlight = $('highlight');
    const gutter = $('gutter');
    // Un borrador por idioma: al cambiar de idioma no aparece la receta escrita en el otro
    const DRAFT_KEY = `ccl-draft-${locale}`;

    // mode null = el que declare la receta (`plan`); el selector lo sobrescribe
    const state = { mode: null, lastGood: null, examples: [], embedTab: 'script' };
    const chart = new RecipeChart('#chart', {
        onHoverStep: id => document.querySelectorAll('#plan [data-step], #method .cc-clause').forEach(el => {
            el.classList.toggle('cc-active', el.dataset.step === id);
        })
    });

    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const kw = (word, ...keys) => keys.some(k => KEYWORDS[k].includes(word.toLowerCase()));
    const kindLabel = k => KINDS[k].label[locale] || KINDS[k].label.en;

    // ------------------------------------------------------------------
    // Resaltado de sintaxis
    // ------------------------------------------------------------------

    const TOKEN = /("[^"]*"?)|((?:#|\/\/|%%).*$)|(@\s*\d+(?:[.,]\d+)?\s*[º°]?\s*[CF](?![\p{L}])|@(?:x-)?[\p{L}_][\p{L}\p{N}_-]*(?::\S+)?)|(~?\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*(?:h(?:\s*\d+)?|min|seg|sec|s|m)(?![\p{L}\p{N}]))|(x-[\p{L}_][\p{L}\p{N}_-]*|[\p{L}_][\p{L}\p{N}_]*)|(\d+(?:[.,]\d+)?(?:\/\d+)?)|(\+)/gu;
    const LINE_KW = ['recipe', 'description', 'language', 'servings', 'cooks', 'burners', 'plan', 'use', 'ingredients', 'tools', 'block', 'end', 'serve'];
    const MOD_KW = ['in', 'until', 'attended', 'unattended', 'keeps'];
    const MOD_WORDS = /^(a|los|las|al|at|after|sin|espera|no|wait|inmediato|immediately)$/i;

    function highlightLine(line, names, isError) {
        let html = '';
        let last = 0;
        let first = true;
        let m;
        TOKEN.lastIndex = 0;
        while ((m = TOKEN.exec(line))) {
            html += esc(line.slice(last, m.index));
            const [tok, str, comment, param, dur, ident, number, plus] = m;
            let cls = '';
            if (str) cls = 'tk-string';
            else if (comment) cls = 'tk-comment';
            else if (param) cls = 'tk-param';
            else if (dur) cls = 'tk-dur';
            else if (plus) cls = 'tk-plus';
            else if (number) cls = 'tk-num';
            else if (ident) {
                const after = line.slice(m.index + tok.length);
                if (first && kw(ident, ...LINE_KW)) cls = 'tk-kw';
                else if (/^\s*\(/.test(after)) cls = /^x-/i.test(ident) || resolveVerb(ident, names.packs) ? 'tk-verb' : 'tk-verb-unknown';
                else if (first && /^\s*(?:"[^"]*"\s*)?=/.test(after)) cls = 'tk-out';
                else if (kw(ident, ...MOD_KW) || MOD_WORDS.test(ident)) cls = 'tk-mod';
                else if (names.ingredients.has(ident)) cls = 'tk-ing';
                else if (names.steps.has(ident)) cls = 'tk-mid';
                else if (names.tools.has(ident)) cls = 'tk-tool';
            }
            html += cls ? `<span class="${cls}">${esc(tok)}</span>` : esc(tok);
            last = m.index + tok.length;
            if (!comment && tok.trim()) first = false;
        }
        html += esc(line.slice(last));
        return isError ? `<span class="tk-errline">${html}</span>` : html;
    }

    function renderEditor(diagnostics, recipe) {
        const names = {
            ingredients: new Set(recipe.ingredients.map(i => i.id)),
            steps: new Set(recipe.steps.map(s => s.id)),
            tools: new Set(recipe.tools.map(tl => tl.id)),
            packs: (recipe.packs || []).map(id => PACKS[id])
        };
        // Los ingredientes declarados pero sin usar también se colorean
        source.value.split('\n').forEach(l => {
            const m = /^\s+([\p{L}_][\p{L}\p{N}_]*)\s+(?:\d|al gusto|to taste|c\.s\.|as needed|")/u.exec(l);
            if (m) names.ingredients.add(m[1]);
        });
        const byLine = new Map();
        diagnostics.forEach(d => {
            if (byLine.get(d.line) !== 'error') byLine.set(d.line, d.severity);
        });
        const lines = source.value.split('\n');
        highlight.innerHTML = lines.map((l, i) => highlightLine(l, names, byLine.get(i + 1) === 'error')).join('\n') + '\n';
        gutter.innerHTML = lines.map((_, i) => {
            const sev = byLine.get(i + 1);
            return `<div class="${sev === 'error' ? 'err' : sev === 'warning' ? 'warn' : ''}">${i + 1}</div>`;
        }).join('');
        syncScroll();
    }

    function syncScroll() {
        highlight.scrollTop = source.scrollTop;
        highlight.scrollLeft = source.scrollLeft;
        gutter.scrollTop = source.scrollTop;
    }

    // ------------------------------------------------------------------
    // Compilar y dibujar
    // ------------------------------------------------------------------

    function compile() {
        const { recipe, diagnostics, ok } = parse(source.value, { locale });
        renderEditor(diagnostics, recipe);
        try { localStorage.setItem(DRAFT_KEY, source.value); } catch (e) { /* sin almacenamiento */ }

        if (ok) {
            try {
                prepare(recipe, state.mode);  // valida que se puede planificar
                state.lastGood = recipe;
            } catch (err) {
                diagnostics.push({ severity: 'error', line: 1, message: err.message });
            }
        }
        state.diagnostics = diagnostics;
        $('stale').classList.toggle('hidden', ok && state.lastGood === recipe);
        draw();
    }

    function draw() {
        if (!state.lastGood) {
            $('stale').classList.add('hidden');
            $('chart').innerHTML = `<p class="p-6 text-stone-400">${t(source.value.trim() ? 'editor.fix' : 'editor.empty')}</p>`;
            renderDiagnostics(state.diagnostics || [], null);
            return;
        }
        const recipe = prepare(state.lastGood, state.mode);
        $('recipe-name').textContent = recipe.name;
        const meta = [
            state.lastGood.servings && t('editor.servings', state.lastGood.servings),
            state.lastGood.cooks && t('editor.cooks', state.lastGood.cooks),
            recipe.description
        ].filter(Boolean);
        $('recipe-meta').textContent = meta.join(' · ');
        document.querySelectorAll('.seg button').forEach(b => {
            const on = b.dataset.mode === recipe.mode;
            b.setAttribute('aria-pressed', on);
            b.classList.toggle('bg-stone-900', on);
            b.classList.toggle('text-white', on);
            b.classList.toggle('text-stone-700', !on);
        });
        chart.render(recipe);
        renderStats(recipe);
        renderViews(recipe);
        renderDiagnostics(state.diagnostics || [], recipe);
    }

    // Plan de trabajo y modo de elaboración, con resaltado cruzado con el gráfico
    function renderViews(recipe) {
        const hover = id => chart.highlight(id);
        RecipeText.renderMethod($('method'), recipe, { onHover: hover });
        RecipeText.renderPlan($('plan'), recipe, { onHover: hover });
    }

    (function wireViewTabs() {
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
    })();

    function renderStats(recipe) {
        const s = stats(recipe);
        const items = [
            [t('stats.total'), formatMinutes(s.total)],
            [t('stats.hands'), formatMinutes(s.active)],
            [t('stats.free'), formatMinutes(s.hands_free)],
            [t('stats.savedShort'), formatMinutes(s.saved)],
            [t('stats.stepsShort'), `${s.steps}`],
            [t('stats.ingredients'), `${s.ingredients}`]
        ];
        $('stats').innerHTML = items.map(([k, v]) => `
            <div class="bg-white px-4 py-2">
                <dt class="text-xs text-stone-500">${k}</dt>
                <dd class="text-lg font-bold text-stone-900 tabular-nums">${v}</dd>
            </div>`).join('');
    }

    // Diagnósticos del parser + avisos del plan (lo que espera más de lo que aguanta)
    function renderDiagnostics(diagnostics, recipe) {
        const all = [...diagnostics];
        if (recipe) {
            (recipe.violations || []).forEach(v => {
                const s = recipe.byId.get(v.step);
                all.push({
                    severity: 'warning', line: s.line || 1,
                    message: t('editor.violation', s.output ? s.output.name : s.label, formatMinutes(v.wait), formatMinutes(v.keep))
                });
            });
        }
        all.sort((a, b) => a.line - b.line);
        const ul = $('diagnostics');
        if (!all.length) {
            ul.innerHTML = `<li class="text-green-700">${t('editor.valid')}</li>`;
            return;
        }
        ul.innerHTML = all.map(d => `
            <li data-line="${d.line}" class="flex gap-2 ${d.severity === 'error' ? 'text-red-700' : 'text-amber-700'}">
                <span class="font-mono text-xs mt-0.5 w-12 shrink-0">L${d.line}</span>
                <span>${d.severity === 'error' ? '✕' : '⚠'} ${esc(d.message)}</span>
            </li>`).join('') + `
            <li class="pt-1"><button id="ai-fix" class="text-xs px-2 py-1 rounded-md border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100">${t('ai.fix')}</button></li>`;
        ul.querySelectorAll('li[data-line]').forEach(li => li.addEventListener('click', () => goToLine(+li.dataset.line)));
        // El mismo bucle que haría un autor: devolver los diagnósticos a la IA que escribió el CCL
        $('ai-fix').addEventListener('click', async () => {
            const list = all.map(d => `- ${t('ai.line', d.line)}: ${d.message}`).join('\n');
            await copyText(t('ai.fixPrompt', list));
            flash($('ai-fix'), t('editor.copied'), t('ai.fix'));
        });
    }

    function goToLine(n) {
        const lines = source.value.split('\n');
        const pos = lines.slice(0, n - 1).reduce((a, l) => a + l.length + 1, 0);
        source.focus();
        source.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
        source.scrollTop = Math.max(0, (n - 5) * 20);
        syncScroll();
    }

    // ------------------------------------------------------------------
    // Chuleta
    // ------------------------------------------------------------------

    function renderHelp() {
        const byKind = {};
        Object.values(VERBS).forEach(v => {
            const name = v.names[locale][0] + (v.attention === 'passive' ? '*' : '');
            (byKind[v.kind] = byKind[v.kind] || []).push(name);
        });
        $('help').innerHTML = `
            <h3 class="font-bold text-stone-900 mb-2">${t('help.syntax')}</h3>
            <pre>${esc(t('help.example'))}</pre>
            <ul class="mt-3 space-y-1">${t('help.items').map(i => `<li>${i}</li>`).join('')}</ul>
            <h3 class="font-bold text-stone-900 mt-4 mb-2">${t('help.vocab')} <span class="font-normal text-stone-500">${t('help.passive')}</span></h3>
            <p class="mb-2 text-stone-600">${t('help.packs')} ${Object.values(PACKS).map(p => `<code>${esc(p.names[locale] || p.id)}</code>`).join(', ')}</p>
            ${Object.entries(byKind).map(([k, list]) => `
                <p class="mb-1"><span class="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style="background:${KINDS[k].color}"></span>
                <strong>${kindLabel(k)}</strong>: ${list.join(', ')}</p>`).join('')}`;
    }

    // ------------------------------------------------------------------
    // Compartir, descargar, incrustar
    // ------------------------------------------------------------------

    const b64encode = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const b64decode = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
    const fileName = ext => `${(state.lastGood ? state.lastGood.name : 'recipe').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_')}.${ext}`;

    function download(name, blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // SVG autónomo: estilos dentro, sin cursor ni interacción
    let chartCss = null;
    async function exportSvg() {
        const svg = document.querySelector('#chart svg.cc-svg');
        if (!svg) return;
        if (chartCss === null) chartCss = await fetch('/static/css/recipe-chart.css').then(r => r.text()).catch(() => '');
        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.cc-cursor').forEach(n => n.remove());
        clone.querySelectorAll('.dim').forEach(n => n.classList.remove('dim'));
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = chartCss + '.cc-svg{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}';
        clone.insertBefore(style, clone.firstChild);
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#fff');
        clone.insertBefore(bg, style.nextSibling);
        download(fileName('svg'), new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    }

    function embedCode(tab) {
        const origin = location.origin;
        const ccl = source.value.replace(/\s+$/, '');
        const mode = state.mode ? ` mode="${state.mode === 'alap' ? 'jit' : 'asap'}"` : '';
        const script = `<script src="${origin}/embed.js" defer></script>`;
        if (tab === 'markdown') {
            return `<!-- ${locale === 'es' ? 'Una vez en la plantilla del blog' : 'Once, in your blog template'}: -->\n${script}\n\n` +
                '```ccl\n' + ccl + '\n```';
        }
        if (tab === 'iframe') {
            const svg = document.querySelector('#chart svg.cc-svg');
            const h = Math.round((svg ? +svg.getAttribute('height') : 400) + 90);
            const name = state.lastGood ? state.lastGood.name : 'Cooking Chart';
            return `<iframe src="${origin}/e#ccl=${b64encode(ccl)}" width="100%" height="${h}" ` +
                `style="border:0" loading="lazy" title="${esc(name)}"></iframe>`;
        }
        const body = ccl.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return `${script}\n\n<cooking-chart controls${mode}>\n${body}\n</cooking-chart>`;
    }

    function showEmbed(tab = state.embedTab) {
        state.embedTab = tab;
        document.querySelectorAll('.embed-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
        $('embed-code').value = embedCode(tab);
    }

    async function loadExample(slug) {
        source.value = await fetch(`/static/recipes/${locale}/${slug}.ccl`).then(r => r.text());
        $('examples').value = slug;
        state.mode = null;
        compile();
    }

    async function init() {
        state.examples = await fetch(`/recipes/${locale}.json`).then(r => r.json());
        $('examples').innerHTML = '<option value="">—</option>' +
            state.examples.map(s => `<option value="${s}">${s.replace(/_/g, ' ')}</option>`).join('');

        const hash = new URLSearchParams(location.hash.slice(1));
        let draft = null;
        try {
            localStorage.removeItem('ccl-draft');   // borrador antiguo, común a los dos idiomas
            draft = localStorage.getItem(DRAFT_KEY);
        } catch (e) { /* sin almacenamiento */ }

        if (hash.get('ccl')) {
            try { source.value = b64decode(hash.get('ccl')); compile(); } catch (e) { await loadExample(state.examples[0]); }
        } else if (hash.get('ejemplo') && state.examples.includes(hash.get('ejemplo'))) {
            await loadExample(hash.get('ejemplo'));
        } else if (draft) {
            source.value = draft;
            compile();
        } else {
            const preferred = state.examples.find(s => /lasa/.test(s)) || state.examples[0];
            await loadExample(preferred);
        }
        renderHelp();
    }

    let timer;
    source.addEventListener('input', () => {
        $('examples').value = '';
        const { recipe, diagnostics } = parse(source.value, { locale });
        renderEditor(diagnostics, recipe);   // resaltado inmediato
        clearTimeout(timer);
        timer = setTimeout(compile, 250);    // gráfico con un respiro
    });
    source.addEventListener('scroll', syncScroll);
    source.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const { selectionStart: a, selectionEnd: b } = source;
        source.setRangeText('  ', a, b, 'end');
        source.dispatchEvent(new Event('input'));
    });

    $('examples').addEventListener('change', e => { if (e.target.value) loadExample(e.target.value); });
    document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
        state.mode = b.dataset.mode;
        draw();
    }));
    $('btn-share').addEventListener('click', async () => {
        const url = `${location.origin}${base}/editor#ccl=${b64encode(source.value)}`;
        history.replaceState(null, '', url);
        try { await navigator.clipboard.writeText(url); $('btn-share').textContent = t('editor.copied'); } catch (e) { $('btn-share').textContent = t('editor.inBar'); }
        setTimeout(() => { $('btn-share').textContent = t('editor.share'); }, 1600);
    });
    $('btn-download').addEventListener('click', () => {
        download(fileName('ccl'), new Blob([source.value], { type: 'text/plain;charset=utf-8' }));
    });
    $('btn-svg').addEventListener('click', exportSvg);
    $('btn-embed').addEventListener('click', () => { showEmbed(); $('embed-dialog').showModal(); });

    // ------------------------------------------------------------------
    // Convertir con tu IA: el sitio no usa una IA propia; prepara las
    // instrucciones (prompts/ccl-prompt.md) para la del usuario
    // ------------------------------------------------------------------

    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
    }
    function flash(button, text, back) {
        button.textContent = text;
        setTimeout(() => { button.textContent = back; }, 1800);
    }
    let aiPrompt = null;
    $('ai-lang').value = locale;
    $('ai-recipe').placeholder = t('ai.placeholder');
    $('btn-ai').addEventListener('click', () => $('ai-dialog').showModal());
    $('ai-close').addEventListener('click', () => $('ai-dialog').close());
    $('ai-copy').addEventListener('click', async () => {
        if (!aiPrompt) aiPrompt = await fetch($('ai-dialog').dataset.prompt).then(r => r.text());
        const lang = $('ai-lang').value === 'es' ? 'Spanish (Spain)' : 'English';
        const recipe = $('ai-recipe').value.trim() || '[…]';
        const ok = await copyText(`${aiPrompt.trim()}\n\n${t('ai.recipeHeader', lang)}\n\n${recipe}\n`);
        flash($('ai-copy'), ok ? t('ai.copied') : t('ai.copyFail'), t('ai.copy'));
    });
    $('ai-load').addEventListener('click', () => {
        // Las IAs suelen envolver el código en ``` aunque se les pida que no
        const answer = $('ai-answer').value.trim().replace(/^```[\w-]*\s*\n/, '').replace(/\n```\s*$/, '');
        if (!answer) { flash($('ai-load'), t('ai.empty'), t('ai.load')); return; }
        source.value = answer + '\n';
        $('examples').value = '';
        compile();
        $('ai-dialog').close();
        source.focus();
    });
    $('embed-close').addEventListener('click', () => $('embed-dialog').close());
    document.querySelectorAll('.embed-tabs button').forEach(b => b.addEventListener('click', () => showEmbed(b.dataset.tab)));
    $('embed-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText($('embed-code').value); } catch (e) { $('embed-code').select(); }
        $('embed-copy').textContent = t('editor.copied');
        setTimeout(() => { $('embed-copy').textContent = t('editor.copy'); }, 1600);
    });
    $('btn-help').addEventListener('click', () => {
        const open = $('help').classList.toggle('hidden') === false;
        $('btn-help').setAttribute('aria-expanded', open);
    });

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 150); });

    init().catch(err => {
        console.error(err);
        $('diagnostics').innerHTML = `<li class="text-red-700">${esc(err.message)}</li>`;
    });
})();
