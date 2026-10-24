# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Empaqueta el Cooking Chart en un único fichero incrustable.

    python tools/build_embed.py

Genera app/static/embed/cooking-chart.js con el parser (CCL), el modelo, el
renderizado, las vistas de texto, la hoja de estilos y el componente <cooking-chart>. Los módulos
se cargan en un ámbito propio para no ensuciar el `window` de la página que
lo incrusta; solo se expone `window.CookingChart`. d3 se carga del mismo
sitio que embed.js si la página no lo tiene ya.

El fichero sale solo en ASCII (el resto como \\uXXXX): así funciona aunque la
página que lo incrusta o el servidor no digan que es UTF-8.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "app/static/js"
CSS = ROOT / "app/static/css/recipe-chart.css"
OUT = ROOT / "app/static/embed/cooking-chart.js"

MODULES = ["cooking-lang.js", "cooking-packs.js", "recipe-model.js", "recipe-chart.js", "recipe-text.js", "embed-element.js"]
# Cada módulo termina en `})(window);` (o similar): se redirige al ámbito propio
TAIL = re.compile(r"\}\)\((?:window|scope|typeof window !== 'undefined' \? window : globalThis)\);\s*$")


def module(name: str) -> str:
    src = (JS / name).read_text(encoding="utf-8")
    if not TAIL.search(src):
        raise SystemExit(f"{name}: no termina con la invocación esperada")
    return TAIL.sub("})(scope);\n", src)


def ascii_only(src: str) -> str:
    """Cada carácter no ASCII pasa a \\uXXXX (par sustituto si hace falta); vale igual en cadenas, regex y comentarios."""
    def esc(m):
        data = m.group(0).encode("utf-16-be")
        return "".join(f"\\u{int.from_bytes(data[i:i + 2], 'big'):04x}" for i in range(0, len(data), 2))
    return re.sub(r"[^\x00-\x7f]", esc, src)


def main() -> None:
    css = CSS.read_text(encoding="utf-8")
    parts = [
        "/*! Cooking Chart — embeddable build · Apache-2.0 · Copyright 2025-2026 David Clothier */",
        "(function () {",
        "'use strict';",
        "if (window.customElements && window.customElements.get('cooking-chart')) return;",
        "const scope = { __CSS__: " + json.dumps(css) + " };",
    ]
    parts += [f"// ---- {name}\n" + module(name) for name in MODULES]
    parts.append("})();\n")
    OUT.write_text(ascii_only("\n".join(parts)), encoding="ascii")
    print(f"{OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
