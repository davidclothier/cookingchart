# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Genera los textos para que cualquier IA escriba CCL.

    python tools/build_ai.py

A partir de prompts/ccl-prompt.md (plantilla), prompts/examples/ y el
vocabulario de verbos del parser de referencia, escribe:

- app/static/ai/ccl-prompt.md  el prompt completo que el editor copia en
                               "Convertir con tu IA" (y que usa training/)
- app/static/llms.txt          resumen del estándar para IAs que leen la web
                               (formato llms.txt), con el mismo prompt

Ejecutar después de cambiar el vocabulario o la plantilla; la integración
continua comprueba que están al día.
"""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "prompts"
OUT_PROMPT = ROOT / "app/static/ai/ccl-prompt.md"
OUT_LLMS = ROOT / "app/static/llms.txt"
SITE = "https://cookingchart.org"

KINDS = ["prep", "assemble", "heat", "oven", "rest"]


def verbs():
    script = ("globalThis.window = globalThis; require('./app/static/js/cooking-lang.js');"
              "process.stdout.write(JSON.stringify(Object.entries(CookingLang.VERBS)"
              ".map(([id, v]) => ({ id, kind: v.kind, attention: v.attention, es: v.names.es, en: v.names.en }))));")
    out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def verb_lists():
    vs = verbs()
    lines = []
    for lang, title in (("es", "Spanish verbs"), ("en", "English verbs")):
        lines.append(f"## {title}")
        for kind in KINDS:
            forms = [f + ("*" if v["attention"] == "passive" else "") for v in vs if v["kind"] == kind for f in v[lang]]
            lines.append(f"- {kind}: {', '.join(forms)}")
        lines.append("")
    return "\n".join(lines).strip()


def prompt():
    ex = PROMPTS / "examples"
    read = lambda name: (ex / name).read_text(encoding="utf-8").strip()
    return ((PROMPTS / "ccl-prompt.md").read_text(encoding="utf-8")
            .replace("{VERBS}", verb_lists())
            .replace("{EXAMPLE_ES_TEXT}", read("es_tortilla.txt"))
            .replace("{EXAMPLE_ES_CCL}", read("es_tortilla.ccl"))
            .replace("{EXAMPLE_EN_TEXT}", read("en_pancakes.txt"))
            .replace("{EXAMPLE_EN_CCL}", read("en_pancakes.ccl")))


def llms(full_prompt):
    return f"""# Cooking Chart

> Cooking Chart is an open standard for recipes: CCL (Cooking Chart Language), a bilingual (English/Spanish) text language where each step is `result = verb(inputs) duration`, and a deterministic chart that draws the recipe over time, with parallel lanes and each ingredient entering at its minute. Code: Apache 2.0. Specification: CC BY 4.0.

To turn a recipe into CCL, follow the instructions in the section "Converting a recipe to CCL" below. Users can paste the result into the editor ({SITE}/editor), which validates it and draws the chart.

## Docs

- [Specification (English)]({SITE}/spec): metamodel, CCL syntax and grammar, semantics, scheduling, verb vocabulary, notation, embedding, extensions and conformance
- [Especificación (español)]({SITE}/es/spec)
- [Tutorial]({SITE}/tutorial): a recipe that grows step by step
- [Embedding]({SITE}/embed): `<cooking-chart>` web component, Markdown and iframe
- [Conversion prompt]({SITE}/static/ai/ccl-prompt.md): the instructions below as a standalone file

## Examples

- [Example recipes in English]({SITE}/recipes/en.json): slugs; each file is at {SITE}/static/recipes/en/<slug>.ccl
- [Recetas de ejemplo en español]({SITE}/recipes/es.json): cada fichero está en {SITE}/static/recipes/es/<slug>.ccl

## Converting a recipe to CCL

{demote(full_prompt).strip()}
"""


def demote(markdown):
    """Los títulos del prompt quedan por debajo de la sección que lo contiene."""
    out, fence = [], False
    for line in markdown.splitlines():
        if line.startswith("```"):
            fence = not fence
        out.append("##" + line if line.startswith("#") and not fence else line)
    return "\n".join(out)


def main():
    text = prompt()
    OUT_PROMPT.parent.mkdir(parents=True, exist_ok=True)
    OUT_PROMPT.write_text(text, encoding="utf-8")
    OUT_LLMS.write_text(llms(text), encoding="utf-8")
    for path in (OUT_PROMPT, OUT_LLMS):
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
