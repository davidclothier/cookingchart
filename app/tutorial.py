# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Pasos del tutorial: cada paso es una receta completa en app/static/tutorial/<lang>/NN.ccl.

Las líneas nuevas o cambiadas respecto al paso anterior se marcan para que
se vea qué aporta cada paso.
"""

import base64
import difflib
from pathlib import Path

from app.ccl_highlight import highlight

TUTORIAL_DIR = Path(__file__).resolve().parent / "static/tutorial"


def _changed_lines(before: list, after: list) -> set:
    if not before:
        return set()
    # Se ignoran los espacios: realinear columnas no cuenta como cambio
    norm = lambda l: " ".join(l.split())
    matcher = difflib.SequenceMatcher(a=[norm(l) for l in before], b=[norm(l) for l in after], autojunk=False)
    changed = set()
    for tag, _, _, j1, j2 in matcher.get_opcodes():
        if tag in ("replace", "insert"):
            changed.update(i for i in range(j1, j2) if after[i].strip())
    return changed


def load_steps(lang: str) -> list:
    steps, previous = [], []
    for path in sorted((TUTORIAL_DIR / lang).glob("*.ccl")):
        source = path.read_text(encoding="utf-8").rstrip("\n")
        lines = source.split("\n")
        changed = _changed_lines(previous, lines)
        steps.append({
            "n": len(steps) + 1,
            "source": source,
            "html": highlight(source, changed),
            "changed": len(changed),
            "b64": base64.urlsafe_b64encode(source.encode()).decode().rstrip("="),
        })
        previous = lines
    return steps
