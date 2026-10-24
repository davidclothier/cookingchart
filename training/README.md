# Entrenar un modelo pequeño que escriba CCL

Objetivo: un modelo de 1–3 B parámetros que reciba el texto de una receta y devuelva su `.ccl`, y que pueda funcionar en un servidor sin GPU.

El método es la **destilación**: un modelo grande (el *maestro*) convierte recetas a CCL; el parser de referencia descarta lo que no sea válido; y con lo que queda se ajusta un modelo pequeño (el *alumno*) con LoRA.

## Ficheros

| Fichero | Qué es |
|---|---|
| `dishes.tsv` | ~240 platos de cocinas variadas (es / en / cocina) para generar recetas sintéticas |
| `../prompts/` | Plantilla del prompt (CCL condensado) y dos ejemplos resueltos. `tools/build_ai.py` genera con ellos `app/static/ai/ccl-prompt.md`, que usan a la vez el maestro y el botón "Convertir con tu IA" del editor |
| `distill.py` | Genera textos, los convierte a CCL con reintento y arma el dataset |
| `ccl_tool.js` | Validación con el parser de referencia: errores, avisos, cobertura de ingredientes, idioma de los verbos |
| `data/` | Todo lo generado (fuera de git) |

## 1. Generar el dataset

```bash
export OPENAI_API_KEY=...          # o GEMINI_API_KEY para los modelos gemini-*
python training/distill.py texts --limit 200 --budget 1.0              # recetas en texto (gpt-4.1-nano)
python training/distill.py ccl   --limit 200 --budget 1.0 --model gpt-5-mini
python training/distill.py split                                        # filtro + train/valid/test
python training/distill.py cost                                         # gasto acumulado
```

- Todas las fases se pueden repetir: solo procesan lo que falta.
- `--budget` es el gasto máximo **acumulado** (dólares, estimado con los precios de `PRICES`).
- Si el CCL del maestro tiene errores, se le devuelven los diagnósticos del parser y se le pide una corrección (una vez).
- `split` reparte **por plato**: un mismo plato nunca está a la vez en entrenamiento y en examen.

Resultado del piloto (12 recetas, mismo prompt y filtro):

| Maestro | Válidos | Coste por ejemplo válido |
|---|---|---|
| gpt-4.1-mini | 50 % | ~0,005 $ |
| gpt-5-nano | 17 % | — |
| gpt-5-mini (razonamiento bajo) | 83 % | ~0,005 $ |

## 2. Revisar el examen

`data/dataset/test.jsonl` es el examen: nunca se entrena con él. Revisa cada ejemplo en el editor (pega el CCL) y corrige lo que esté mal. Cuanto más fiable sea el examen, más fiables serán las medidas.

## 3. Entrenar en un Mac (Apple Silicon)

```bash
python -m venv .venv-train && source .venv-train/bin/activate
pip install mlx-lm
mlx_lm.lora --model Qwen/Qwen2.5-1.5B-Instruct --train \
            --data training/data/dataset --iters 1000 --batch-size 2
```

Mientras corre, la pérdida (*loss*) de entrenamiento y la de validación deben bajar. Si la de validación empieza a subir, el modelo está memorizando: para antes (menos `--iters`).

## 4. Evaluar, empaquetar y servir

Estas piezas están pendientes: evaluador sobre `test.jsonl`, fusión del LoRA, conversión a GGUF (llama.cpp) y servicio en el VPS con una gramática GBNF derivada del EBNF de la especificación.
