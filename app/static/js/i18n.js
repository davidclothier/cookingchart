// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — textos de la interfaz (es / en)
// El idioma de la interfaz es independiente del de cada receta: el gráfico
// siempre se dibuja en el idioma en que está escrita la receta.

(function (global) {
    'use strict';

    const STRINGS = {
        es: {
            'nav.home': 'Inicio',
            'nav.editor': 'Editor',
            'nav.spec': 'Especificación',
            'footer': 'Cooking Chart — un lenguaje y un gráfico estándar para recetas',

            'home.title': 'Cooking Chart',
            'home.lead': 'Una receta dibujada como un río: cada ingrediente cae en el momento en que se usa, las preparaciones paralelas corren en su propio carril y todo desemboca en el plato.',
            'home.gallery': 'Firma visual · misma escala de tiempo',
            'home.note': 'Pasa el ratón por un paso para ver de dónde viene y a dónde va. Rayado = desatendido · línea blanca = ruta crítica · discontinuo = algo ya preparado que espera (en rojo, si espera más de lo que aguanta).',
            'views.method': 'Modo de elaboración',
            'views.plan': 'Plan de trabajo',
            'gallery.all': 'Todas',
            'gallery.filter': 'Filtrar por cocina',
            'home.footer': 'Cada receta está escrita en <strong>CCL</strong>, el lenguaje del Cooking Chart.',
            'home.edit': 'Abrir esta receta en el editor',
            'home.error': 'No se pudo cargar la receta',

            'mode.asap': 'Lo antes posible',
            'mode.asap.title': 'Cada paso empieza en cuanto puede',
            'mode.alap': 'Justo a tiempo',
            'mode.alap.title': 'Cada paso termina justo cuando se necesita',
            'mode.group': 'Planificación',
            'legend.ingredient': 'Ingrediente',

            'stats.total': 'Tiempo total',
            'stats.steps': n => `${n} pasos`,
            'stats.hands': 'Con las manos',
            'stats.handsPct': p => `${p} % del total`,
            'stats.free': 'Libre',
            'stats.freeSub': 'horno, reposos, cocciones',
            'stats.saved': 'Ahorro en paralelo',
            'stats.savedSub': t => `vs. ${t} en serie`,
            'stats.parallel': 'Simultáneos',
            'stats.parallelSub': 'pasos a la vez como máximo',
            'stats.ingredients': 'Ingredientes',
            'stats.critical': n => `${n} pasos críticos`,
            'stats.stepsShort': 'Pasos',
            'stats.savedShort': 'Ahorro paralelo',

            'editor.title': 'Editor CCL',
            'editor.lead': 'Escribe la receta a la izquierda; el Cooking Chart se dibuja a la derecha.',
            'editor.example': 'Ejemplo',
            'editor.share': 'Copiar enlace',
            'editor.copied': '¡Copiado!',
            'editor.inBar': 'Enlace en la barra',
            'editor.download': 'Descargar .ccl',
            'editor.svg': 'Descargar SVG',
            'editor.embed': 'Incrustar',
            'editor.help': 'Chuleta',
            'editor.valid': '✓ Receta válida',
            'editor.stale': 'Hay errores: se muestra la última versión válida',
            'editor.empty': 'Escribe una receta para ver el gráfico.',
            'editor.fix': 'Corrige los errores marcados en rojo para ver el gráfico.',
            'editor.aria': 'Receta en CCL',
            'editor.servings': n => `${n} raciones`,
            'editor.cooks': n => `${n} ${n === 1 ? 'cocinero' : 'cocineros'}`,
            'editor.violation': (step, w, k) => `"${step}" espera ${w}, pero aguanta ${k}. Prueba "justo a tiempo" o cambia la receta.`,
            'editor.embedTitle': 'Incrustar en tu web',
            'editor.embedHelp': 'Pega esto en tu página. El gráfico se dibuja en el navegador del lector, en el idioma de la receta.',
            'editor.copy': 'Copiar',
            'editor.ai': 'Convertir con tu IA',
            'ai.title': 'Convertir una receta con tu IA',
            'ai.intro': 'Cooking Chart no usa una IA propia: usa la tuya (ChatGPT, Gemini, Claude…). Copia las instrucciones junto con tu receta, pégalas en tu IA y trae aquí su respuesta. El editor la valida y la dibuja.',
            'ai.step1': '1. Pega la receta (el texto o un enlace)',
            'ai.placeholder': 'Ingredientes y pasos, tal como los tengas…',
            'ai.lang': 'Escribir el CCL en',
            'ai.copy': 'Copiar instrucciones',
            'ai.copied': 'Copiado: pégalo en tu IA',
            'ai.copyFail': 'No se ha podido copiar',
            'ai.step2': '2. Pega aquí la respuesta de tu IA',
            'ai.load': 'Cargar en el editor',
            'ai.empty': 'Pega primero la respuesta de tu IA',
            'ai.fix': 'Copiar corrección para tu IA',
            'ai.fixPrompt': list => `El validador de CCL (editor de Cooking Chart) ha encontrado estos problemas en tu respuesta:\n${list}\n\nCorrígelos y responde solo con el CCL completo corregido.`,
            'ai.line': n => `línea ${n}`,
            'ai.recipeHeader': lang => `# Receta que hay que convertir\n\nRecipe language: ${lang}. Write the CCL in ${lang}.`,

            'help.syntax': 'Sintaxis',
            'help.packs': 'Paquetes disponibles (<code>usa "…"</code>):',
            'help.vocab': 'Vocabulario de verbos',
            'help.passive': '(* desatendido por defecto)',
            'help.example': `receta "Nombre"
raciones 4
cocineros 1                 # opcional: manos disponibles
fuegos 4                    # opcional: fuegos de la cocina
plan justo_a_tiempo         # opcional: cómo se dibuja

ingredientes
  harina   500 g   "Harina de fuerza"
  sal      al gusto

herramientas
  sartén, horno

resultado "Nombre" = verbo(entradas) en herramienta @parámetros duración
  + ingrediente a los 5min  # se añade a mitad del paso

servir resultado`,
            'help.items': [
                '<code>10min</code> <code>1h30</code> <code>8-10min</code> <code>~5min</code> duración fija, rango o aproximada',
                '<code>hasta "dore"</code> condición de fin (con duración estimada)',
                '<code>@180ºC</code> <code>@fuego:bajo</code> <code>@tapado</code> parámetros',
                '<code>atendido</code> / <code>desatendido</code> fuerza el modo del verbo',
                '<code>aguanta 30min</code> / <code>sin espera</code> cuánto puede esperar el resultado',
                '<code>salsa[1/2]</code> <code>aceite[25%]</code> usar una parte',
                '<code>en horno_caliente</code> herramienta preparada en un paso anterior',
                '<code>bloque "Salsa"</code> … <code>fin</code> agrupa una sub-receta',
                '<code>masa "Masa" (f)</code> <code>(m pl)</code> género del nombre, para los artículos del modo de elaboración',
                'Todo tiene alias en inglés: <code>recipe</code>, <code>ingredients</code>, <code>keeps</code>, <code>no wait</code>…'
            ]
        },
        en: {
            'nav.home': 'Home',
            'nav.editor': 'Editor',
            'nav.spec': 'Specification',
            'footer': 'Cooking Chart — a standard language and chart for recipes',

            'home.title': 'Cooking Chart',
            'home.lead': 'A recipe drawn as a river: each ingredient drops in when it is used, parallel preparations run in their own lane, and everything flows into the dish.',
            'home.gallery': 'Visual signature · same time scale',
            'home.note': 'Hover a step to see where it comes from and where it goes. Hatched = unattended · white line = critical path · dashed = something ready and waiting (red if it waits longer than it keeps).',
            'views.method': 'Method',
            'views.plan': 'Work plan',
            'gallery.all': 'All',
            'gallery.filter': 'Filter by cuisine',
            'home.footer': 'Every recipe is written in <strong>CCL</strong>, the Cooking Chart Language.',
            'home.edit': 'Open this recipe in the editor',
            'home.error': 'Could not load the recipe',

            'mode.asap': 'As soon as possible',
            'mode.asap.title': 'Each step starts as soon as it can',
            'mode.alap': 'Just in time',
            'mode.alap.title': 'Each step finishes right when it is needed',
            'mode.group': 'Schedule',
            'legend.ingredient': 'Ingredient',

            'stats.total': 'Total time',
            'stats.steps': n => `${n} steps`,
            'stats.hands': 'Hands-on',
            'stats.handsPct': p => `${p} % of total`,
            'stats.free': 'Hands-free',
            'stats.freeSub': 'oven, resting, simmering',
            'stats.saved': 'Saved in parallel',
            'stats.savedSub': t => `vs. ${t} one by one`,
            'stats.parallel': 'Simultaneous',
            'stats.parallelSub': 'steps at once, at most',
            'stats.ingredients': 'Ingredients',
            'stats.critical': n => `${n} critical steps`,
            'stats.stepsShort': 'Steps',
            'stats.savedShort': 'Saved',

            'editor.title': 'CCL editor',
            'editor.lead': 'Write the recipe on the left; the Cooking Chart is drawn on the right.',
            'editor.example': 'Example',
            'editor.share': 'Copy link',
            'editor.copied': 'Copied!',
            'editor.inBar': 'Link in the address bar',
            'editor.download': 'Download .ccl',
            'editor.svg': 'Download SVG',
            'editor.embed': 'Embed',
            'editor.help': 'Cheat sheet',
            'editor.valid': '✓ Valid recipe',
            'editor.stale': 'There are errors: showing the last valid version',
            'editor.empty': 'Write a recipe to see the chart.',
            'editor.fix': 'Fix the errors marked in red to see the chart.',
            'editor.aria': 'Recipe in CCL',
            'editor.servings': n => `serves ${n}`,
            'editor.cooks': n => `${n} ${n === 1 ? 'cook' : 'cooks'}`,
            'editor.violation': (step, w, k) => `"${step}" waits ${w} but only keeps for ${k}. Try "just in time" or change the recipe.`,
            'editor.embedTitle': 'Embed on your site',
            'editor.embedHelp': 'Paste this into your page. The chart is drawn in the reader\'s browser, in the recipe\'s language.',
            'editor.copy': 'Copy',
            'editor.ai': 'Convert with your AI',
            'ai.title': 'Convert a recipe with your AI',
            'ai.intro': 'Cooking Chart has no AI of its own: it uses yours (ChatGPT, Gemini, Claude…). Copy the instructions together with your recipe, paste them into your AI and bring its answer back here. The editor validates it and draws it.',
            'ai.step1': '1. Paste the recipe (the text or a link)',
            'ai.placeholder': 'Ingredients and steps, however you have them…',
            'ai.lang': 'Write the CCL in',
            'ai.copy': 'Copy instructions',
            'ai.copied': 'Copied: paste it into your AI',
            'ai.copyFail': "Couldn't copy",
            'ai.step2': '2. Paste your AI\'s answer here',
            'ai.load': 'Load into the editor',
            'ai.empty': 'Paste your AI\'s answer first',
            'ai.fix': 'Copy a fix request for your AI',
            'ai.fixPrompt': list => `The CCL validator (Cooking Chart editor) found these problems in your answer:\n${list}\n\nFix them and reply with the complete corrected CCL only.`,
            'ai.line': n => `line ${n}`,
            'ai.recipeHeader': lang => `# Recipe to convert\n\nRecipe language: ${lang}. Write the CCL in ${lang}.`,

            'help.syntax': 'Syntax',
            'help.packs': 'Available packs (<code>use "…"</code>):',
            'help.vocab': 'Verb vocabulary',
            'help.passive': '(* unattended by default)',
            'help.example': `recipe "Name"
servings 4
cooks 1                     # optional: available hands
burners 4                   # optional: kitchen burners
schedule just_in_time       # optional: how it is drawn

ingredients
  flour    500 g   "Bread flour"
  salt     to taste

tools
  pan, oven

result "Name" = verb(inputs) in tool @parameters duration
  + ingredient at 5min      # added halfway through the step

serve result`,
            'help.items': [
                '<code>10min</code> <code>1h30</code> <code>8-10min</code> <code>~5min</code> fixed, range or approximate duration',
                '<code>until "golden"</code> end condition (with an estimated duration)',
                '<code>@180ºC</code> <code>@heat:low</code> <code>@covered</code> parameters',
                '<code>attended</code> / <code>unattended</code> overrides the verb\'s default',
                '<code>keeps 30min</code> / <code>no wait</code> how long the result can wait',
                '<code>sauce[1/2]</code> <code>oil[25%]</code> use a part',
                '<code>in hot_oven</code> a tool prepared in an earlier step',
                '<code>block "Sauce"</code> … <code>end</code> groups a sub-recipe',
                '<code>masa "Masa" (f)</code> <code>(m pl)</code> grammatical gender, for Spanish articles in the method view',
                'Everything has Spanish aliases too: <code>receta</code>, <code>ingredientes</code>, <code>aguanta</code>, <code>sin espera</code>…'
            ]
        }
    };

    // El idioma lo decide la URL (inglés en la raíz, /es/… en español) y el servidor lo pone en <html lang>
    function detect() {
        const l = (document.documentElement.lang || '').slice(0, 2);
        return STRINGS[l] ? l : 'en';
    }

    const locale = detect();
    // Prefijo de las páginas del idioma: '' para inglés, '/es' para español
    const base = locale === 'en' ? '' : '/' + locale;

    function t(key, ...args) {
        const v = STRINGS[locale][key] ?? STRINGS.en[key] ?? key;
        return typeof v === 'function' ? v(...args) : v;
    }

    // Rellena los elementos marcados con data-i18n / data-i18n-html / data-i18n-title
    function apply(root = document) {
        root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
        root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
        root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
        root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    }

    global.CCI18N = { locale, base, t, apply, STRINGS };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply());
    else apply();
})(window);
