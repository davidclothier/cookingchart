# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Exporta el sitio entero como ficheros estáticos.

    python tools/build_static.py
    python tools/build_static.py --site-url https://cookingchart.org --repo-url https://github.com/USUARIO/cooking-chart

Todo el trabajo con recetas ocurre en el navegador, así que el sitio no
necesita servidor: cada página se renderiza una vez con la propia aplicación
FastAPI y se guarda como HTML. El resultado (dist/) funciona en cualquier
hosting estático: GitHub Pages, Cloudflare Pages, Netlify o un hosting
compartido con Apache (incluye .htaccess).

URLs: el inglés va en la raíz (/tutorial -> tutorial.html) y el español en
/es (/es/tutorial -> es/tutorial.html). GitHub Pages, Cloudflare y Netlify
sirven la URL sin extensión; en Apache lo hace el .htaccess, que además
redirige las antiguas /en/… a la raíz.
"""

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent

HTACCESS = """\
# Cooking Chart — sitio estático en Apache (hosting compartido)
Options -MultiViews -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Una sola dirección: https y sin www
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} ^www\\. [NC]
  RewriteRule ^ https://{HOST}%{REQUEST_URI} [L,R=301]
  # El inglés estuvo en /en/…; ahora está en la raíz
  RewriteRule ^en/?$ / [L,R=301]
  RewriteRule ^en/(.*)$ /$1 [L,R=301]
  # /es/tutorial -> /es/tutorial.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+)$ $1.html [L]
</IfModule>

<IfModule mod_mime.c>
  AddType text/plain .ccl
  AddType font/woff2 .woff2
  AddCharset utf-8 .ccl .html .json .js .css .txt .md
</IfModule>

<IfModule mod_headers.c>
  # Las webs que incrustan el gráfico cargan embed.js y recetas .ccl desde otro dominio
  <FilesMatch "\\.(ccl|js|json|css)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
  # Páginas y datos: el navegador comprueba si han cambiado antes de usarlos
  <FilesMatch "\\.(html|ccl|json|txt|xml|md)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
  <FilesMatch "\\.woff2$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>

  # Seguridad: solo https, sin adivinar tipos, sin filtrar rutas a otros sitios
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  # Cada página solo carga ficheros del propio sitio (CSS, fuentes, d3): nada de terceros
  Header always set Content-Security-Policy "{CSP}; frame-ancestors 'self'"
  # /e es el visor que otras webs meten en un iframe
  <FilesMatch "^e\\.html$">
    Header always set Content-Security-Policy "{CSP}; frame-ancestors *"
  </FilesMatch>
</IfModule>
"""

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
])

# https://www.rfc-editor.org/rfc/rfc9116 — a quién avisar de un fallo de seguridad
SECURITY_TXT = """\
Contact: mailto:hello@cookingchart.org
Expires: {expires}
Preferred-Languages: es, en
Canonical: {site}/.well-known/security.txt
"""

# Los JS y CSS del sitio se piden siempre con ?v=<versión>: pueden guardarse un año
HTACCESS_VERSIONED = """\
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
"""

NOT_FOUND = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>404 · Cooking Chart</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#292524}a{color:#c2410c}</style>
</head>
<body>
<h1>404</h1>
<p>Esta página no existe. · This page doesn't exist.</p>
<p><a href="/">Go home</a> · <a href="/es/">Ir al inicio</a></p>
</body>
</html>
"""


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", default=str(ROOT / "dist"))
    p.add_argument("--site-url", default=os.environ.get("CC_SITE_URL", "https://cookingchart.org"))
    p.add_argument("--repo-url", default=os.environ.get("CC_REPO_URL", ""))
    args = p.parse_args()

    site = args.site_url.rstrip("/")
    # La aplicación lee estas variables al importarse
    os.environ["CC_SITE_URL"] = site
    os.environ["CC_REPO_URL"] = args.repo_url
    sys.path.insert(0, str(ROOT))
    from fastapi.testclient import TestClient

    from app.main import EMBED_JS, LANGS, PAGES, recipe_slugs, url_base
    from app.main import app as fastapi_app
    from app.spec_render import DOCS

    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    client = TestClient(fastapi_app)

    def save(url, dest):
        r = client.get(url)
        if r.status_code != 200:
            raise SystemExit(f"{url}: HTTP {r.status_code}")
        target = out / dest
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(r.content)

    # Páginas: cada una en todos los idiomas (inglés en la raíz, español en /es)
    rests = ["/" + slug for slug in PAGES] + [f"/docs/{doc}" for doc in DOCS]
    pages = []
    for lang in LANGS:
        for rest in rests:
            url = url_base(lang) + rest
            dest = url.lstrip("/") + ("index.html" if url.endswith("/") else ".html")
            pages.append((url, dest))
    for url, dest in pages + [("/e", "e.html")]:
        save(url, dest)

    # Datos, estáticos y componente incrustable
    for lang in LANGS:
        (out / "recipes").mkdir(exist_ok=True)
        (out / "recipes" / f"{lang}.json").write_text(json.dumps(recipe_slugs(lang)), encoding="utf-8")
    shutil.copytree(ROOT / "app/static", out / "static",
                    ignore=shutil.ignore_patterns("*.py", "__pycache__", ".DS_Store", "mockups"))
    shutil.copy(ROOT / "app/static/img/favicon.ico", out / "favicon.ico")   # los navegadores lo piden en la raíz
    shutil.copy(EMBED_JS, out / "embed.js")
    llms = ROOT / "app/static/llms.txt"
    if llms.exists():
        shutil.copy(llms, out / "llms.txt")

    # Raíz, 404, buscadores y servidores
    (out / "404.html").write_text(NOT_FOUND, encoding="utf-8")
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {site}/sitemap.xml\n", encoding="utf-8")
    (out / "sitemap.xml").write_text(sitemap(site, rests, LANGS, url_base), encoding="utf-8")
    (out / ".htaccess").write_text(HTACCESS.replace("{HOST}", urlparse(site).hostname or "").replace("{CSP}", CSP), encoding="utf-8")
    expires = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%Y-%m-%dT00:00:00Z")
    (out / ".well-known").mkdir()
    (out / ".well-known/security.txt").write_text(SECURITY_TXT.format(expires=expires, site=site), encoding="utf-8")
    for folder in ("static/js", "static/css"):
        (out / folder / ".htaccess").write_text(HTACCESS_VERSIONED, encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")   # GitHub Pages: servir tal cual
    host = urlparse(site).hostname or ""
    if host and not host.endswith("github.io"):
        (out / "CNAME").write_text(host + "\n", encoding="utf-8")   # dominio propio en GitHub Pages

    files = sum(1 for f in out.rglob("*") if f.is_file())
    size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"{out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}: {len(pages)} páginas, {files} ficheros, {size / 1024:.0f} KB")


def sitemap(site, rests, langs, url_base):
    """Cada página en cada idioma, con sus versiones en los otros (hreflang)."""
    entries = []
    for rest in rests:
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{site}{url_base(l)}{rest}"/>' for l in langs)
        alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{site}{rest}"/>'
        for lang in langs:
            entries.append(f"  <url>\n    <loc>{site}{url_base(lang)}{rest}</loc>{alts}\n  </url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(entries) + "\n</urlset>\n")


if __name__ == "__main__":
    main()
