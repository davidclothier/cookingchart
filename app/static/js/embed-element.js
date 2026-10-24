// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — componente incrustable <cooking-chart>
//
// Uso (ver README del embed en SPEC.md §8):
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
// También convierte automáticamente los bloques de código Markdown
// ```ccl ... ``` (<pre><code class="language-ccl">) y <pre class="cooking-chart">.
//
// Atributos:
//   src       URL de un fichero .ccl (si no, se usa el texto del elemento)
//   mode      asap | jit (por defecto, el `plan` que declare la receta)
//   lang      es | en: fuerza el idioma del gráfico (por defecto, el de la receta)
//   controls  muestra el selector "lo antes posible / justo a tiempo"
//   variant   "signature": miniatura sin texto
//   view      qué mostrar: chart (por defecto), plan, method, o varias separadas
//             por espacios ("chart method"), o "all"; con más de una, en pestañas
//   schema    publica la receta como JSON-LD de schema.org/Recipe en la página
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

    // Quita la sangría común (el texto suele venir indentado dentro del HTML)
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
            // Si el script se cargó antes que el contenido, esperar al DOM
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

        // Vistas pedidas con view="…", en ese orden
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
                    <h3 class="cc-title">${esc(recipe.name)} <span class="cc-total">· ${RecipeModel.formatMinutes(recipe.total)}</span></h3>
                    ${controls ? `<div class="cc-modes" role="group">
                        <button data-mode="asap" aria-pressed="${this._mode === 'asap'}">${ui.asap}</button>
                        <button data-mode="alap" aria-pressed="${this._mode === 'alap'}">${ui.alap}</button>
                    </div>` : ''}
                </div>
                ${views.length > 1 ? `<div class="cc-tabs" role="tablist">${views.map(v =>
                    `<button role="tab" data-view="${v}" aria-selected="${v === this._view}">${tl[v]}</button>`).join('')}</div>` : ''}
                ${views.map(v => `<div class="cc-panel" data-panel="${v}" role="tabpanel"${v === this._view ? '' : ' hidden'}></div>`).join('')}
                <div class="cc-foot"><a href="${ORIGIN}${lang === 'es' ? '/es' : ''}/editor#ccl=${b64(this._source)}" target="_blank" rel="noopener" title="${ui.open}">${ui.made} ↗</a></div>`;
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
                // Un gráfico en una pestaña oculta no tiene ancho: se dibuja al mostrarse
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
            if (pre.closest('[data-cooking-chart="off"]')) return;   // la página quiere el código tal cual
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
