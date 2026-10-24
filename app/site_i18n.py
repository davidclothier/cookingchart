# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Textos del sitio que se generan en el servidor (navegación, títulos, metadatos).

Los textos de las partes interactivas (galería, editor) viven en
app/static/js/i18n.js; el contenido largo (portada, documentación) en
plantillas por idioma dentro de app/templates/content/.
"""

LANGS = ("es", "en")
DEFAULT_LANG = "en"

STRINGS = {
    "es": {
        "nav.home": "Inicio",
        "nav.tutorial": "Tutorial",
        "nav.gallery": "Galería",
        "nav.editor": "Editor",
        "nav.spec": "Especificación",
        "nav.embed": "Incrustar",
        "nav.about": "Acerca de",
        "footer.tagline": "Un estándar abierto para escribir y dibujar recetas.",
        "footer.code": "Código: Apache 2.0",
        "footer.spec": "Especificación: CC BY 4.0",
        "footer.trademarks": "Marca",
        "nav.legal": "Aviso legal y privacidad",
        "title.home": "Cooking Chart — un estándar abierto para recetas",
        "title.tutorial": "Tutorial · Cooking Chart",
        "title.gallery": "Galería · Cooking Chart",
        "title.editor": "Editor · Cooking Chart",
        "title.spec": "Especificación · Cooking Chart",
        "title.embed": "Incrustar · Cooking Chart",
        "title.about": "Acerca de · Cooking Chart",
        "title.legal": "Aviso legal y privacidad · Cooking Chart",
        "desc.home": "Escribe una receta como texto y obtén un gráfico donde se ve el tiempo, lo que se hace en paralelo y cuándo entra cada ingrediente.",
        "desc.tutorial": "Aprende CCL en 8 pasos: una receta sencilla que crece hasta usar casi todo el lenguaje.",
        "desc.gallery": "Recetas de ejemplo dibujadas con Cooking Chart.",
        "desc.editor": "Editor en vivo del lenguaje CCL: escribe una receta y mira su Cooking Chart.",
        "desc.spec": "Especificación de Cooking Chart: metamodelo, lenguaje CCL, semántica, vocabulario y notación.",
        "desc.embed": "Cómo incrustar un Cooking Chart en cualquier web, blog o documento Markdown.",
        "desc.about": "Por qué existe Cooking Chart: datos, grafos, lenguajes formales y cocina.",
        "desc.legal": "Quién está detrás de Cooking Chart, qué datos se tratan (ninguno a través de la web), cookies técnicas y licencias.",
        "og.alt": "Cooking Chart: una receta dibujada como un río de pasos en paralelo.",
        "spec.toc": "Contenido",
        "spec.chart": "Así se dibuja esta receta",
        "skip": "Saltar al contenido",
    },
    "en": {
        "nav.home": "Home",
        "nav.tutorial": "Tutorial",
        "nav.gallery": "Gallery",
        "nav.editor": "Editor",
        "nav.spec": "Specification",
        "nav.embed": "Embed",
        "nav.about": "About",
        "footer.tagline": "An open standard to write and draw recipes.",
        "footer.code": "Code: Apache 2.0",
        "footer.spec": "Specification: CC BY 4.0",
        "footer.trademarks": "Trademark",
        "nav.legal": "Legal & privacy",
        "title.home": "Cooking Chart — an open standard for recipes",
        "title.tutorial": "Tutorial · Cooking Chart",
        "title.gallery": "Gallery · Cooking Chart",
        "title.editor": "Editor · Cooking Chart",
        "title.spec": "Specification · Cooking Chart",
        "title.embed": "Embed · Cooking Chart",
        "title.about": "About · Cooking Chart",
        "title.legal": "Legal notice and privacy · Cooking Chart",
        "desc.home": "Write a recipe as text and get a chart that shows time, what runs in parallel and when each ingredient goes in.",
        "desc.tutorial": "Learn CCL in 8 steps: a simple recipe that grows until it uses almost the whole language.",
        "desc.gallery": "Example recipes drawn with Cooking Chart.",
        "desc.editor": "Live editor for the CCL language: write a recipe and see its Cooking Chart.",
        "desc.spec": "Cooking Chart specification: metamodel, CCL language, semantics, vocabulary and notation.",
        "desc.embed": "How to embed a Cooking Chart in any website, blog or Markdown document.",
        "desc.about": "Why Cooking Chart exists: data, graphs, formal languages and cooking.",
        "desc.legal": "Who runs Cooking Chart, what data is processed (none through the website), technical cookies and licenses.",
        "og.alt": "Cooking Chart: a recipe drawn as a river of parallel steps.",
        "spec.toc": "Contents",
        "spec.chart": "This is how this recipe is drawn",
        "skip": "Skip to content",
    },
}


def translator(lang: str):
    table = STRINGS.get(lang, STRINGS[DEFAULT_LANG])
    return lambda key: table.get(key, STRINGS[DEFAULT_LANG].get(key, key))


def url_base(lang: str) -> str:
    """Prefijo de las páginas de un idioma: el inglés va en la raíz, el resto en /<idioma>."""
    return "" if lang == DEFAULT_LANG else "/" + lang
