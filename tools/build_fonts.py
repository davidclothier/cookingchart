# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Descarga las fuentes del sitio para servirlas desde el propio dominio.

    python tools/build_fonts.py

Así ninguna visita llega a Google: la web no hace peticiones a terceros.
Solo se guardan los alfabetos latino y latino extendido (español, inglés y
el resto de lenguas europeas occidentales). Todas las fuentes son SIL Open
Font License 1.1, que permite redistribuirlas (ver app/static/fonts/OFL.md).
"""

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app/static/fonts"

# Fraunces (títulos), Newsreader (texto), IBM Plex Mono (código y rótulos), Inter (textos del gráfico)
URL = ("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..700"
       "&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400"
       "&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap")
SUBSETS = ("latin", "latin-ext")
# Aviso de copyright y licencia de cada familia (la OFL exige acompañar las fuentes con ellos)
LICENSES = ("fraunces", "newsreader", "ibmplexmono", "inter")
OFL_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/{}/OFL.txt"
# Con un navegador moderno Google sirve woff2 con ejes variables
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})) as r:
        return r.read()


def main():
    css = get(URL).decode()
    # Cada bloque @font-face va precedido de un comentario con su alfabeto: /* latin */
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    kept, seen = [], {}
    for subset, block in blocks:
        if subset not in SUBSETS:
            continue
        family = re.search(r"font-family: '([^']+)'", block).group(1)
        style = re.search(r"font-style: (\w+)", block).group(1)
        weight = re.search(r"font-weight: ([\d ]+);", block).group(1).replace(" ", "-")
        src = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        name = f"{family.lower().replace(' ', '-')}-{style}-{weight}-{subset}.woff2"
        if src not in seen:   # las fuentes variables repiten el mismo fichero para cada peso pedido
            (OUT / name).write_bytes(get(src))
            seen[src] = name
        kept.append(block.replace(src, seen[src]))
    header = "/* Generado por tools/build_fonts.py. Fuentes SIL OFL 1.1 (ver OFL.md) */\n"
    (OUT / "fonts.css").write_text(header + "\n".join(kept) + "\n", encoding="utf-8")
    texts = [get(OFL_URL.format(f)).decode().strip() for f in LICENSES]
    copyrights = [t.split("\n\n", 1)[0] for t in texts]
    license_text = texts[0].split("\n\n", 1)[1]   # el texto de la OFL 1.1 es el mismo en todas
    (OUT / "OFL.md").write_text("# Fuentes · Fonts\n\nFraunces, Newsreader, IBM Plex Mono e Inter, sin modificar.\n\n"
                                + "\n\n".join(copyrights) + "\n\n```\n" + license_text + "\n```\n", encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.glob("*.woff2"))
    print(f"{OUT.relative_to(ROOT)}: {len(kept)} @font-face, {len(seen)} ficheros, {size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
