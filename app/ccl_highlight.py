# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Resaltado de sintaxis de CCL para los bloques de código del sitio (filtro Jinja `ccl`).

Es solo presentación: no valida nada. El parser de verdad está en
app/static/js/cooking-lang.js.
"""

import re

from markupsafe import Markup, escape

LINE_KEYWORDS = {
    "receta", "recipe", "descripcion", "descripción", "description", "idioma", "language", "lang",
    "raciones", "servings", "serves", "cocineros", "cooks", "fuegos", "burners", "plan", "schedule",
    "ingredientes", "ingredients", "herramientas", "utensilios", "tools", "equipment",
    "bloque", "block", "fin", "end", "servir", "serve", "usa", "use",
}
MODIFIERS = {
    "en", "con", "in", "with", "on", "hasta", "until", "atendido", "attended", "desatendido",
    "unattended", "aguanta", "keeps", "sin", "espera", "no", "wait", "a", "los", "al", "at",
}

TOKEN = re.compile(
    r'(?P<str>"[^"]*")'
    r'|(?P<com>(?:#|//).*$)'
    r'|(?P<param>@\s*\d+(?:[.,]\d+)?\s*[º°]?\s*[CF]\b|@(?:x-)?[\w-]+(?::\S+)?)'
    r'|(?P<dur>~?\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*(?:h(?:\s*\d+)?|min|seg|sec|s)\b)'
    r'|(?P<word>(?:x-)?[^\W\d][\w-]*)'
    r'|(?P<plus>\+)',
    re.UNICODE,
)


def _line(line: str) -> str:
    out, last, first = [], 0, True
    for m in TOKEN.finditer(line):
        out.append(str(escape(line[last:m.start()])))
        tok, kind = m.group(0), m.lastgroup
        cls = None
        if kind == "str":
            cls = "s"
        elif kind == "com":
            cls = "c"
        elif kind in ("dur", "param"):
            cls = "d"
        elif kind == "plus":
            cls = "v"
        elif kind == "word":
            after = line[m.end():]
            if first and tok.lower() in LINE_KEYWORDS:
                cls = "k"
            elif re.match(r"\s*\(", after):
                cls = "v"
            elif tok.lower() in MODIFIERS:
                cls = "k"
        out.append(f'<span class="{cls}">{escape(tok)}</span>' if cls else str(escape(tok)))
        last = m.end()
        if kind != "com":
            first = False
    out.append(str(escape(line[last:])))
    return "".join(out)


def highlight(source: str, marked=()) -> Markup:
    """`marked`: índices de línea a resaltar como nuevos (el tutorial los usa)."""
    lines = str(source).strip("\n").split("\n")
    indent = min((len(l) - len(l.lstrip()) for l in lines if l.strip()), default=0)
    marked = set(marked)
    return Markup("\n".join(
        f'<span class="ln-new">{_line(l[indent:]) or " "}</span>' if i in marked else _line(l[indent:])
        for i, l in enumerate(lines)))
