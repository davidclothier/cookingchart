# Conformance suite · Batería de conformidad

🇬🇧 Each case is a pair `cases/NNN-name.ccl` + `cases/NNN-name.json`. The JSON is the **normalized model** the recipe must produce (SPEC.md §9.4), in a language-neutral format, so any implementation of CCL — in Python, Swift, Rust… — can check itself against it.

🇪🇸 Cada caso es un par `cases/NNN-nombre.ccl` + `cases/NNN-nombre.json`. El JSON es el **modelo normalizado** que debe producir la receta (SPEC.es.md §9.4), en un formato neutral, para que cualquier implementación de CCL —en Python, Swift, Rust…— pueda comprobarse.

```bash
node conformance/run.js            # check the reference implementation · comprobar
node conformance/run.js 012        # only cases matching "012" · solo los que contienen "012"
node conformance/run.js --update   # regenerate expectations · regenerar los esperados
```

## Normalized model · Modelo normalizado

| Field | Meaning |
|---|---|
| `lang`, `cuisine`, `plan`, `cooks`, `burners`, `packs` | Recipe header |
| `ingredients[]` | `id`, `quantity`, `unit` as displayed in the recipe language; `gram` only when declared (`m`, `f`, `mp`, `fp`) |
| `toolGram` | Declared grammatical gender of tools, only when any is declared |
| `steps[]` | `id`, canonical `verb`, `kind`, `attention`, `duration` (max), `durationMin`, `keep`, `tools`, `inputs[]` (`ref`, `at`, `fraction`), `output`; `gram` only when declared |
| `final` | Step that produces the dish |
| `diagnostics[]` | `severity`, `line`, `code` — messages are not normative |
| `schedule.asap` / `schedule.alap` | `total`, `starts`, `critical`, `violations` (only when the recipe has no errors) |
| `schedule.normative` | `true` when no resources are declared: the CPM result is unique and must match. When `false`, the result is informative: another feasible plan that honors wait tolerances is acceptable. |

Times are in minutes, rounded to 3 decimals.

## Cases · Casos

| # | Covers |
|---|---|
| 001–002 | Minimal recipe in Spanish and English |
| 003 | Mixed languages, majority detection |
| 004 | Durations: seconds, hours, ranges, approximate, `until` |
| 005 | Units: canonical forms and display, special quantities, unknown unit |
| 006 | Additions halfway through a step (`+ … at`) |
| 007 | Fractions and the "parts don't add up" warning |
| 008 | Tool state (`preheat(oven)` → `in hot_oven`) |
| 009 | Line order independence |
| 010–011 | Limited cooks and burners |
| 012 | `keeps`: the producer is delayed to honor it |
| 013 | `no wait`: violation in ASAP, satisfied in just-in-time |
| 014 | Declared `plan` |
| 015 | Vocabulary pack, `x-` verb and parameter, `@kind` |
| 016 | Errors |
| 017 | Warnings |
| 018 | Optional grammatical gender `(f)`, `(m pl)`… on ingredients, tools and results |
| 019 | Quantity ranges (`3-4 tbsp`) and plural units |
