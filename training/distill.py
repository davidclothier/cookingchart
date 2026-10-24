# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 David Clothier
"""Genera el dataset para enseñar CCL a un modelo pequeño (destilación).

    export OPENAI_API_KEY=...      (o GEMINI_API_KEY para --model gemini-2.5-flash)
    python training/distill.py texts  --limit 10      # 1. recetas en texto (sintéticas)
    python training/distill.py ccl    --limit 10      # 2. el modelo maestro las pasa a CCL
    python training/distill.py split                  # 3. filtro con el parser + train/valid/test
    python training/distill.py cost                   # gasto acumulado

Las tres fases se pueden repetir: solo procesan lo que falta. Todo se guarda
en training/data/ (fuera del control de versiones). `--budget` (dólares)
detiene el proceso antes de superar el gasto indicado, sumando todas las fases.
"""

import argparse
import json
import random
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
TEXTS = DATA / "texts.jsonl"
CCL = DATA / "ccl.jsonl"
SPEND = DATA / "spend.json"
DATASET = DATA / "dataset"

# Precio estimado en dólares por millón de tokens: (entrada, entrada en caché, salida)
PRICES = {
    "gpt-4.1-nano": (0.10, 0.025, 0.40),
    "gpt-4.1-mini": (0.40, 0.10, 1.60),
    "gpt-4o-mini": (0.15, 0.075, 0.60),
    "gpt-5-nano": (0.05, 0.005, 0.40),
    "gpt-5-mini": (0.25, 0.025, 2.00),
    # Gemini con el nivel gratuito de la API (con el de pago, poner aquí sus precios)
    "gemini-2.5-flash": (0.0, 0.0, 0.0),
    "gemini-2.5-flash-lite": (0.0, 0.0, 0.0),
}
ENDPOINTS = {
    "openai": ("https://api.openai.com/v1/chat/completions", "OPENAI_API_KEY"),
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", "GEMINI_API_KEY"),
}
provider = lambda model: "gemini" if model.startswith("gemini") else "openai"

# Lo que verá el modelo pequeño: una instrucción corta, sin la especificación
STUDENT_SYSTEM = "Convert the recipe into CCL (Cooking Chart Language). Reply with the CCL source only."

LANG_NAMES = {"es": "Spanish (Spain)", "en": "English"}
CUISINES = {
    "spanish": ("Española", "Spanish"), "italian": ("Italiana", "Italian"), "french": ("Francesa", "French"),
    "mexican": ("Mexicana", "Mexican"), "latin": ("Latinoamericana", "Latin American"),
    "japanese": ("Japonesa", "Japanese"), "chinese": ("China", "Chinese"), "thai": ("Tailandesa", "Thai"),
    "vietnamese": ("Vietnamita", "Vietnamese"), "korean": ("Coreana", "Korean"), "indian": ("India", "Indian"),
    "middle_eastern": ("Oriente Medio", "Middle Eastern"), "moroccan": ("Marroquí", "Moroccan"),
    "greek": ("Griega", "Greek"), "american": ("Estadounidense", "American"), "british": ("Británica", "British"),
    "central_european": ("Centroeuropea", "Central European"), "baking": ("Panadería y repostería", "Baking"),
    "home": ("Casera", "Home cooking"), "nordic": ("Nórdica", "Nordic"), "african": ("Africana", "African"),
    "hawaiian": ("Hawaiana", "Hawaiian"),
}
# Formas de contar una receta: el modelo pequeño tiene que entenderlas todas
STYLES = [
    "a food blog post: a short intro sentence, an ingredient list with quantities and numbered steps, friendly tone",
    "a note from a grandmother: one or two paragraphs, approximate quantities ('a glass of', 'a handful'), few exact times",
    "a cookbook recipe: ingredient list and a concise method in prose, with exact temperatures and times",
    "a professional kitchen card: terse bullet points, mise en place first, then the service steps",
    "instructions sent to a friend in a chat message: informal, ingredients mentioned inline in the steps",
]

lock = threading.Lock()
REASONING = "low"


class Stop(Exception):
    """Presupuesto agotado o cuenta sin saldo: se para todo."""


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def read_jsonl(path):
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def append_jsonl(path, item):
    with lock, path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")


def load_spend():
    return json.loads(SPEND.read_text()) if SPEND.exists() else {"usd": 0.0, "calls": 0, "by_stage": {}}


def add_spend(stage, model, usage):
    p_in, p_cached, p_out = PRICES[model]
    cached = (usage.get("prompt_tokens_details") or {}).get("cached_tokens", 0)
    fresh = usage.get("prompt_tokens", 0) - cached
    usd = (fresh * p_in + cached * p_cached + usage.get("completion_tokens", 0) * p_out) / 1e6
    with lock:
        s = load_spend()
        s["usd"] += usd
        s["calls"] += 1
        st = s["by_stage"].setdefault(stage, {"usd": 0.0, "calls": 0, "prompt": 0, "cached": 0, "completion": 0})
        st["usd"] += usd
        st["calls"] += 1
        st["prompt"] += usage.get("prompt_tokens", 0)
        st["cached"] += cached
        st["completion"] += usage.get("completion_tokens", 0)
        SPEND.write_text(json.dumps(s, indent=2))
    return usd


def chat(model, messages, temperature, _key, stage, budget):
    url, env = ENDPOINTS[provider(model)]
    key = api_key(env)
    if load_spend()["usd"] >= budget:
        raise Stop(f"presupuesto alcanzado ({budget} $)")
    payload = {"model": model, "messages": messages}
    if model.startswith(("gpt-5", "gemini-2.5")):
        # Modelos de razonamiento: sin temperatura; poco razonamiento basta para traducir
        payload["reasoning_effort"] = REASONING
    else:
        payload["temperature"] = temperature
    body = json.dumps(payload).encode()
    for attempt in range(6):
        req = urllib.request.Request(url, data=body, headers={
            "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            add_spend(stage, model, data.get("usage", {}))
            return data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if "insufficient_quota" in detail or ("RESOURCE_EXHAUSTED" in detail and "quota" in detail.lower() and attempt == 5):
                raise Stop("la cuenta de OpenAI no tiene saldo")
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"HTTP {e.code}: {detail[:200]}")
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 ** attempt)
    raise RuntimeError("demasiados reintentos")


def run_parallel(func, items, workers):
    stopped = []

    def guarded(item):
        if stopped:
            return
        try:
            func(item)
        except Stop as e:
            stopped.append(str(e))
        except Exception as e:  # una receta que falla no detiene el resto
            print(f"  ! {item['id']}: {e}", file=sys.stderr)

    with ThreadPoolExecutor(workers) as pool:
        list(pool.map(guarded, items))
    if stopped:
        print(f"Detenido: {stopped[0]}")


def api_key(env="OPENAI_API_KEY"):
    import os
    key = os.environ.get(env)
    if not key:
        raise Stop(f"falta {env} en el entorno")
    return key


# ---------------------------------------------------------------------------
# 1. Recetas en texto
# ---------------------------------------------------------------------------

def plan_texts(variants):
    """Cada plato, en los dos idiomas, `variants` veces con estilos distintos."""
    rows = [line.split("\t") for line in (HERE / "dishes.tsv").read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.startswith("#")]
    jobs = []
    for i, (es, en, cuisine) in enumerate(rows):
        for lang, dish in (("es", es), ("en", en)):
            for v in range(variants):
                rng = random.Random(f"{i}-{lang}-{v}")
                jobs.append({
                    "id": f"{i:03d}-{lang}-{v}", "dish_index": i, "dish": dish, "lang": lang,
                    "cuisine": CUISINES[cuisine][0 if lang == "es" else 1],
                    "style": rng.choice(STYLES), "servings": rng.choice([None, 2, 4, 4, 6]),
                })
    # Intercalados, para que un --limit pequeño ya sea variado
    random.Random(7).shuffle(jobs)
    return jobs


def stage_texts(args):
    key = None
    done = {t["id"] for t in read_jsonl(TEXTS)}
    jobs = [j for j in plan_texts(args.variants) if j["id"] not in done][: args.limit]
    print(f"Textos: {len(done)} hechos, {len(jobs)} por hacer con {args.text_model}")

    def work(job):
        serves = f" for {job['servings']} people" if job["servings"] else ""
        prompt = (f"Write a home recipe for \"{job['dish']}\"{serves} in {LANG_NAMES[job['lang']]}. "
                  f"Write it as {job['style']}. Between 80 and 280 words. "
                  "Mention the ingredients with quantities (approximate is fine if the style says so) and the cooking "
                  "steps in a natural order, with times or doneness cues where a cook would give them. "
                  "Output only the recipe text, without Markdown headings or bold.")
        text = chat(args.text_model, [{"role": "user", "content": prompt}], 0.9, key, "texts", args.budget)
        append_jsonl(TEXTS, {**job, "text": text, "model": args.text_model})

    run_parallel(work, jobs, args.workers)


# ---------------------------------------------------------------------------
# 2. Texto -> CCL con el modelo maestro
# ---------------------------------------------------------------------------

def teacher_prompt():
    """El mismo prompt que copia el editor ("Convertir con tu IA"); lo genera tools/build_ai.py."""
    return (HERE.parent / "app/static/ai/ccl-prompt.md").read_text(encoding="utf-8")


def clean_ccl(text):
    """Quita las vallas de Markdown si el modelo las pone pese a la instrucción."""
    lines = text.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip() + "\n"


def stage_ccl(args):
    key = None
    system = teacher_prompt()
    tag = f"{args.model}:{REASONING}" if args.model.startswith(("gpt-5", "gemini-2.5")) and REASONING != "low" else args.model
    done = {c["id"] for c in read_jsonl(CCL) if c.get("model") == tag}
    texts = [t for t in read_jsonl(TEXTS) if t["id"] not in done][: args.limit]
    print(f"CCL: {len(done)} hechos, {len(texts)} por hacer con {args.model}")

    def work(t):
        messages = [{"role": "system", "content": system},
                    {"role": "user", "content": f"Recipe language: {LANG_NAMES[t['lang']]}. Write the CCL in {LANG_NAMES[t['lang']]}.\n"
                                                f"Cuisine: {t['cuisine']}\n\n{t['text']}"}]
        ccl = clean_ccl(chat(args.model, messages, 0.2, key, f"ccl:{args.model}", args.budget))
        # Un reintento con los diagnósticos del parser, como haría un autor con el editor
        result = check_all([{"id": t["id"], "text": t["text"], "lang": t["lang"], "ccl": ccl}])[t["id"]]
        retried = False
        first = result["reasons"]
        if not result["ok"] and result.get("messages"):
            retried = True
            messages += [{"role": "assistant", "content": ccl},
                         {"role": "user", "content": "The CCL parser reported these problems:\n" + "\n".join(result["messages"])
                          + "\nReply with the complete corrected CCL only."}]
            ccl = clean_ccl(chat(args.model, messages, 0.2, key, f"ccl:{args.model}", args.budget))
        append_jsonl(CCL, {"id": t["id"], "model": tag, "ccl": ccl, "retried": retried, "first": first,
                           "first_messages": result.get("messages", [])[:6] if retried else []})

    run_parallel(work, texts, args.workers)


# ---------------------------------------------------------------------------
# 3. Filtro con el parser y reparto
# ---------------------------------------------------------------------------

def check_all(items):
    payload = "\n".join(json.dumps(i, ensure_ascii=False) for i in items)
    out = subprocess.run(["node", str(HERE / "ccl_tool.js"), "check"], input=payload,
                         capture_output=True, text=True, check=True).stdout
    return {r["id"]: r for r in map(json.loads, out.splitlines())}


def stage_split(args):
    texts = {t["id"]: t for t in read_jsonl(TEXTS)}
    ccls = [c for c in read_jsonl(CCL) if c["id"] in texts and (not args.model_filter or c["model"] == args.model_filter)]
    items = [{"id": f"{c['id']}|{c['model']}", "text": texts[c["id"]]["text"], "lang": texts[c["id"]]["lang"],
              "ccl": c["ccl"]} for c in ccls]
    results = check_all(items)

    good, reasons = [], {}
    for it in items:
        r = results[it["id"]]
        if r["ok"]:
            good.append(it)
        for reason in r["reasons"]:
            reasons[reason.split(":")[0]] = reasons.get(reason.split(":")[0], 0) + 1
    print(f"Válidos: {len(good)} de {len(items)}")
    for k, v in sorted(reasons.items(), key=lambda kv: -kv[1]):
        print(f"  descartados por {k}: {v}")

    # Reparto por plato: un plato nunca está a la vez en entrenamiento y examen
    dishes = sorted({texts[it["id"].split("|")[0]]["dish_index"] for it in good})
    random.Random(42).shuffle(dishes)
    n_test = max(1, round(len(dishes) * 0.10))
    n_valid = max(1, round(len(dishes) * 0.05))
    test_d, valid_d = set(dishes[:n_test]), set(dishes[n_test:n_test + n_valid])

    DATASET.mkdir(parents=True, exist_ok=True)
    files = {name: (DATASET / f"{name}.jsonl").open("w", encoding="utf-8") for name in ("train", "valid", "test")}
    counts = {name: 0 for name in files}
    for it in good:
        d = texts[it["id"].split("|")[0]]["dish_index"]
        name = "test" if d in test_d else "valid" if d in valid_d else "train"
        files[name].write(json.dumps({"id": it["id"], "messages": [
            {"role": "system", "content": STUDENT_SYSTEM},
            {"role": "user", "content": it["text"]},
            {"role": "assistant", "content": it["ccl"]},
        ]}, ensure_ascii=False) + "\n")
        counts[name] += 1
    for f in files.values():
        f.close()
    (DATA / "rejected.jsonl").write_text("".join(
        json.dumps({**results[it["id"]], "ccl": it["ccl"]}, ensure_ascii=False) + "\n"
        for it in items if not results[it["id"]]["ok"]), encoding="utf-8")
    print(f"Dataset: {counts} → {DATASET.relative_to(HERE.parent)}/  (descartes en data/rejected.jsonl)")


def stage_cost(_args):
    s = load_spend()
    print(f"Gasto estimado: {s['usd']:.4f} $ en {s['calls']} llamadas")
    for stage, st in s["by_stage"].items():
        per = st["usd"] / st["calls"] if st["calls"] else 0
        print(f"  {stage}: {st['usd']:.4f} $ · {st['calls']} llamadas · {per * 1000:.3f} $ por 1000 · "
              f"tokens entrada {st['prompt']} (caché {st['cached']}), salida {st['completion']}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("stage", choices=["texts", "ccl", "split", "cost"])
    p.add_argument("--limit", type=int, default=None, help="como mucho N elementos nuevos")
    p.add_argument("--budget", type=float, default=1.0, help="gasto máximo acumulado en dólares")
    p.add_argument("--workers", type=int, default=6)
    p.add_argument("--variants", type=int, default=2, help="textos por plato e idioma")
    p.add_argument("--text-model", default="gpt-4.1-nano")
    p.add_argument("--model", default="gpt-4.1-mini", help="modelo maestro para el CCL")
    p.add_argument("--model-filter", default=None, help="split: usar solo el CCL de este modelo")
    p.add_argument("--reasoning", default="low", help="esfuerzo de razonamiento para los modelos gpt-5")
    args = p.parse_args()
    for m in (args.text_model, args.model):
        if m not in PRICES:
            sys.exit(f"Sin precio conocido para {m}: añádelo a PRICES")
    DATA.mkdir(parents=True, exist_ok=True)
    global REASONING
    REASONING = args.reasoning
    {"texts": stage_texts, "ccl": stage_ccl, "split": stage_split, "cost": stage_cost}[args.stage](args)


if __name__ == "__main__":
    main()
