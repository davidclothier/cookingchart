# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Cooking Chart — servidor del sitio.

Todo el trabajo con recetas (parser, planificación, dibujo) ocurre en el
navegador; el servidor entrega las páginas en cada idioma, los estáticos, la
especificación renderizada y el script para incrustar.

El inglés va en la raíz y el español en /es (las antiguas /en/… redirigen):

    /                 portada (/es/ en español)
    /tutorial         una receta que crece paso a paso
    /gallery          galería de recetas
    /editor           editor en vivo
    /spec             especificación
    /embed            cómo incrustar
    /about            por qué existe
    /legal            aviso legal y privacidad
    /docs/...         licencias y política de marca
    /embed.js         componente <cooking-chart>
    /e                gráfico suelto para <iframe>
    /recipes/{lang}.json  recetas de ejemplo de un idioma

El sitio se puede exportar entero como ficheros estáticos con
tools/build_static.py (no necesita este servidor en producción).
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.ccl_highlight import highlight
from app.site_i18n import LANGS, translator, url_base
from app.spec_render import DOCS, render_doc, render_spec
from app.tutorial import load_steps

APP_DIR = Path(__file__).resolve().parent
RECIPES_DIR = APP_DIR / "static/recipes"
EMBED_JS = APP_DIR / "static/embed/cooking-chart.js"
# Dirección pública del sitio, para las URL absolutas (hreflang, canonical, sitemap)
SITE_URL = os.environ.get("CC_SITE_URL", "https://cookingchart.org").rstrip("/")

app = FastAPI(title="Cooking Chart", version="0.2.0", docs_url=None, redoc_url=None)
# Las webs que incrustan el gráfico pueden pedir recetas .ccl de este dominio
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])
app.mount("/static", StaticFiles(directory=APP_DIR / "static"), name="static")
templates = Jinja2Templates(directory=APP_DIR / "templates")
templates.env.filters["ccl"] = highlight


def asset(path: str) -> str:
    """URL de un recurso con su versión (fecha de modificación): al cambiar el
    fichero cambia la URL y el navegador no puede usar una copia antigua."""
    file = EMBED_JS if path == "/embed.js" else APP_DIR / path.lstrip("/")
    try:
        return f"{path}?v={int(file.stat().st_mtime)}"
    except OSError:
        return path


templates.env.globals["asset"] = asset
templates.env.globals["site_url"] = SITE_URL


@app.middleware("http")
async def static_cache(request: Request, call_next):
    """Recursos versionados (?v=): caché larga. El resto de /static (recetas
    .ccl, tutorial): el navegador debe comprobar si han cambiado antes de usarlos."""
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        versioned = "v" in request.query_params
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable" if versioned else "no-cache"
    return response

def render(request: Request, lang: str, page: str, template: str, **ctx):
    path = request.url.path
    rest = path[len(url_base(lang)):] or "/"
    other = {code: url_base(code) + rest for code in LANGS}
    return templates.TemplateResponse(template, {
        "request": request, "lang": lang, "base": url_base(lang), "page": page, "t": translator(lang),
        "alternates": other, **ctx,
    })


def home(request: Request, lang: str):
    return render(request, lang, "home", "home.html")


def tutorial(request: Request, lang: str):
    return render(request, lang, "tutorial", "tutorial.html", steps=load_steps(lang))


def gallery(request: Request, lang: str):
    return render(request, lang, "gallery", "gallery.html")


def editor(request: Request, lang: str):
    return render(request, lang, "editor", "editor.html")


def spec(request: Request, lang: str):
    body, toc = render_spec(lang)
    return render(request, lang, "spec", "spec.html", body=body, toc=toc)


def embed_docs(request: Request, lang: str):
    return render(request, lang, "embed", "embed.html")


def about(request: Request, lang: str):
    return render(request, lang, "about", "about.html")


def legal(request: Request, lang: str):
    return render(request, lang, "legal", "legal.html")


def legal_doc(request: Request, lang: str, name: str):
    if name not in DOCS:
        raise HTTPException(404)
    return render(request, lang, "docs", "doc.html", body=render_doc(name, lang), name=name)


PAGES = {"": home, "tutorial": tutorial, "gallery": gallery, "editor": editor, "spec": spec,
         "embed": embed_docs, "about": about, "legal": legal}


def _page(view, lang):
    def endpoint(request: Request):
        return view(request, lang)
    return endpoint


def _doc(lang):
    def endpoint(request: Request, name: str):
        return legal_doc(request, lang, name)
    return endpoint


# Cada página en cada idioma: /tutorial (inglés) y /es/tutorial (español)
for _lang in LANGS:
    for _slug, _view in PAGES.items():
        app.add_api_route(f"{url_base(_lang)}/{_slug}", _page(_view, _lang),
                          response_class=HTMLResponse, include_in_schema=False)
    app.add_api_route(f"{url_base(_lang)}/docs/{{name}}", _doc(_lang),
                      response_class=HTMLResponse, include_in_schema=False)


@app.get("/en", include_in_schema=False)
@app.get("/en/{rest:path}", include_in_schema=False)
async def old_english(rest: str = ""):
    """Las direcciones antiguas en /en/… pasan a la raíz"""
    return RedirectResponse("/" + rest, status_code=301)


@app.get("/es", include_in_schema=False)
async def spanish_home():
    return RedirectResponse("/es/", status_code=301)


@app.get("/embed.js", include_in_schema=False)
async def embed_js():
    return FileResponse(EMBED_JS, media_type="text/javascript",
                        headers={"Cache-Control": "public, max-age=3600"})


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(APP_DIR / "static/img/favicon.ico", media_type="image/x-icon")


@app.get("/llms.txt", include_in_schema=False)
async def llms_txt():
    """Resumen del estándar para IAs (lo genera tools/build_ai.py)"""
    return FileResponse(APP_DIR / "static/llms.txt", media_type="text/plain; charset=utf-8")


@app.get("/e", response_class=HTMLResponse)
async def embed_frame(request: Request):
    """Gráfico suelto para incrustar con <iframe> (la receta va en el hash: #ccl=...)"""
    return templates.TemplateResponse("embed_frame.html", {"request": request})


def recipe_slugs(lang: str):
    return sorted(p.stem for p in (RECIPES_DIR / lang).glob("*.ccl"))


@app.get("/recipes/{lang}.json")
async def list_recipes(lang: str):
    """Recetas de ejemplo de un idioma (slugs de app/static/recipes/<lang>/*.ccl)"""
    if lang not in LANGS:
        raise HTTPException(404)
    return recipe_slugs(lang)


@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}
