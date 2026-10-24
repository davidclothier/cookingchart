# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Convierte SPEC.md / SPEC.es.md (y los documentos legales) en HTML para el sitio.

La especificación se escribe para leerse en el repositorio; aquí se reescriben
sus enlaces relativos para que funcionen dentro del sitio.
"""

import os
import re
from functools import lru_cache
from html import unescape
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

from app.ccl_highlight import highlight
from app.site_i18n import url_base

ROOT = Path(__file__).resolve().parent.parent
# Repositorio público: los enlaces a ficheros que no forman parte del sitio
# (conformance/, tools/…) apuntan allí
REPO_URL = os.environ.get("CC_REPO_URL", "").rstrip("/")

SPEC_FILES = {"en": ROOT / "SPEC.md", "es": ROOT / "SPEC.es.md"}
DOCS = {
    "license": ROOT / "LICENSE",
    "license-spec": ROOT / "LICENSE-SPEC",
    "notice": ROOT / "NOTICE",
    "trademarks": ROOT / "TRADEMARKS.md",
}


def _rewrite_links(html: str, lang: str) -> str:
    def repl(m):
        href = m.group(1)
        if href.startswith(("http://", "https://", "#", "/", "mailto:")):
            return m.group(0)
        path, _, anchor = href.partition("#")
        anchor = f"#{anchor}" if anchor else ""
        target = {
            "SPEC.md": f"/spec{anchor}",
            "SPEC.es.md": f"/es/spec{anchor}",
            "LICENSE": f"{url_base(lang)}/docs/license",
            "LICENSE-SPEC": f"{url_base(lang)}/docs/license-spec",
            "NOTICE": f"{url_base(lang)}/docs/notice",
            "TRADEMARKS.md": f"{url_base(lang)}/docs/trademarks",
        }.get(path)
        if target is None and path.startswith("app/static/"):
            target = "/" + path[len("app/"):] + anchor
        if target is None:
            # Ficheros del repositorio que no se sirven en el sitio (conformance/…)
            if REPO_URL:
                kind = "tree" if path.endswith("/") else "blob"
                return f'href="{REPO_URL}/{kind}/main/{path}{anchor}"'
            return f'href="{href}" data-repo-path'
        return f'href="{target}"'

    return re.sub(r'href="([^"]+)"', repl, html)


def _markdown():
    return markdown.Markdown(
        extensions=["tables", "fenced_code", "toc", "sane_lists"],
        extension_configs={"toc": {"slugify": slugify_unicode, "toc_depth": "2-3"}},
    )


@lru_cache(maxsize=8)
def _render_cached(path: str, mtime: float, lang: str):
    md = _markdown()
    text = Path(path).read_text(encoding="utf-8")
    # La primera línea de enlace al otro idioma la pone ya la plantilla
    text = re.sub(r"^(🇬🇧|🇪🇸) \[[^\]]+\]\([^)]+\)\n", "", text, flags=re.M)
    body = md.convert(text)
    # Bloques ```ccl con el mismo resaltado que el resto del sitio
    body = re.sub(
        r'(<code class="language-ccl">)(.*?)(</code>)',
        lambda m: m.group(1) + str(highlight(unescape(m.group(2)))) + m.group(3),
        body, flags=re.S)
    return _rewrite_links(body, lang), md.toc_tokens


def render_spec(lang: str):
    path = SPEC_FILES[lang]
    return _render_cached(str(path), path.stat().st_mtime, lang)


def render_doc(name: str, lang: str):
    path = DOCS[name]
    if path.suffix == ".md":
        body, _ = _render_cached(str(path), path.stat().st_mtime, lang)
        return body
    from html import escape
    return f"<pre class=\"legal\">{escape(path.read_text(encoding='utf-8'))}</pre>"
