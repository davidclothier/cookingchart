# Cooking Chart

🇪🇸 [Leer en español](README.es.md)

**A standard language and chart for recipes.** Write a recipe as text; get a chart where time flows left to right, parallel preparations run in their own lanes, each ingredient drops in at the minute it is used, and everything flows into the dish.

```ccl
recipe "Lasagna bolognese"
cooks 1

ingredients
  beef    500 g
  tomato  800 g
  milk    500 ml
  flour   50 g
  butter  50 g
  sheets  250 g

bolognese = simmer(beef, tomato) 45min
roux      = cook(butter, flour) 5min
bechamel  = cook(roux, milk) 10min until "it thickens" keeps 30min
lasagna   = assemble(bolognese, bechamel, sheets) 15min
baked     = bake(lasagna) @180ºC 40min

serve baked
```

- **CCL (Cooking Chart Language)**: each step is `result = verb(inputs)`. Dependencies, parallelism, lanes and start times are derived, never written. English and Spanish keywords, verbs and units.
- **Scheduling**: critical path, slack, *as soon as possible* / *just in time*, and optional constraints the author declares: cooks, burners, tools with capacity, how long an intermediate keeps.
- **Notation**: deterministic layout with no line crossings by construction, hands-on vs. unattended steps, resource strips, and a *visual signature* to compare recipes.
- **Embeddable**: one script, a `<cooking-chart>` element, Markdown ```` ```ccl ```` blocks, or an iframe.

## Embed it

```html
<script src="https://HOST/static/embed/cooking-chart.js" defer></script>

<cooking-chart src="/recipes/lasagna.ccl" controls></cooking-chart>
```

See [SPEC.md §8](SPEC.md#8-distribution-and-embedding) for every option.

## Run locally

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8011
```

- `http://localhost:8011/` — home (Spanish under `/es/`)
- `/tutorial` — 8-step tutorial · `/gallery` — example recipes · `/editor` — live editor · `/spec` — specification · `/embed` — embedding guide
- `/embed.js` — the embeddable component · `/static/embed/demo.html` — embedding demo

```bash
python tools/build_embed.py   # rebuild app/static/embed/cooking-chart.js
python tools/build_ai.py      # rebuild the AI prompt and /llms.txt (after vocabulary changes)
node conformance/run.js       # run the conformance suite
npm ci && npm run build:css   # rebuild the site CSS (Tailwind) after changing classes
```

## Publish

Everything about recipes runs in the browser, so the site exports to plain files:

```bash
python tools/build_static.py --site-url https://cookingchart.org
```

`dist/` works on any static hosting:

- **Shared hosting (Apache)**: upload the contents of `dist/` to `public_html/`. The included `.htaccess` handles https, clean URLs, CORS for embeds and caching.
- **GitHub Pages**: set the repository variable `CC_SITE_URL` to your domain and choose *GitHub Actions* as the Pages source. The [workflow](.github/workflows/site.yml) checks conformance and deploys on every push to `main`. It needs its own domain, because the site uses root paths (`/es/…`).
- **Cloudflare Pages / Netlify**: build command `pip install -r requirements.txt && python tools/build_static.py`, output directory `dist`.

## Repository

| Path | Contents |
|---|---|
| [SPEC.md](SPEC.md) · [SPEC.es.md](SPEC.es.md) | The specification: metamodel, language, semantics, vocabulary, notation, extensions |
| `app/static/js/cooking-lang.js` | CCL parser |
| `app/static/js/cooking-packs.js` | Built-in vocabulary packs (example of an extension) |
| `app/static/js/recipe-model.js` | Normalization, scheduling, lanes |
| `app/static/js/recipe-chart.js` | Chart renderer (D3) |
| `app/static/js/recipe-text.js` | Text views: work plan, method, schema.org JSON-LD |
| `app/static/js/embed-element.js` | `<cooking-chart>` web component |
| `app/static/recipes/{en,es}/` | Example recipes |
| `conformance/` | Conformance suite for other implementations |
| `prompts/` | Instructions for any AI to write CCL (used by the editor's *Convert with your AI* and by `/llms.txt`) |
| `tools/` | Build of the embeddable bundle, the AI prompt and the static site |
| `training/` | Dataset pipeline to teach CCL to a small model (experimental) |

## Contact

[hello@cookingchart.org](mailto:hello@cookingchart.org)

## License

- Code: [Apache 2.0](LICENSE)
- Specification and conformance cases: [CC BY 4.0](LICENSE-SPEC)
- Names and logo: [trademark policy](TRADEMARKS.md)

Copyright 2025-2026 David Clothier.
