# Cooking Chart

🇬🇧 [Read in English](README.md)

**Un lenguaje y un gráfico estándar para recetas.** Escribes la receta como texto y obtienes un gráfico donde el tiempo avanza de izquierda a derecha, las preparaciones paralelas corren en su propio carril, cada ingrediente cae en el minuto en que se usa y todo desemboca en el plato.

```ccl
receta "Lasaña boloñesa"
cocineros 1

ingredientes
  carne        500 g
  tomate       800 g
  leche        500 ml
  harina       50 g
  mantequilla  50 g
  placas       250 g

boloñesa = guisar(carne, tomate) 45min
roux     = cocinar(mantequilla, harina) 5min
bechamel = cocinar(roux, leche) 10min hasta "espese" aguanta 30min
lasaña   = montar(boloñesa, bechamel, placas) 15min
horneada = hornear(lasaña) @180ºC 40min

servir horneada
```

- **CCL (Cooking Chart Language)**: cada paso es `resultado = verbo(entradas)`. Dependencias, paralelismo, carriles y horas de inicio se deducen; nunca se escriben. Palabras clave, verbos y unidades en español e inglés.
- **Planificación**: ruta crítica, holgura, *lo antes posible* / *justo a tiempo* y restricciones opcionales que declara el autor: cocineros, fuegos, herramientas con capacidad, cuánto aguanta un intermedio.
- **Notación**: disposición determinista sin cruces por construcción, pasos atendidos y desatendidos, franjas de recursos y una *firma visual* para comparar recetas.
- **Incrustable**: un script, el elemento `<cooking-chart>`, bloques Markdown ```` ```ccl ```` o un iframe.

## Incrustar

```html
<script src="https://HOST/static/embed/cooking-chart.js" defer></script>

<cooking-chart src="/recetas/lasaña.ccl" controls></cooking-chart>
```

Todas las opciones en [SPEC.es.md §8](SPEC.es.md#8-distribución-e-incrustación).

## Ejecutar en local

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8011
```

- `http://localhost:8011/es/` (en inglés, `/`) — portada
- `/es/tutorial` — tutorial en 8 pasos · `/es/gallery` — recetas de ejemplo · `/es/editor` — editor en vivo · `/es/spec` — especificación · `/es/embed` — guía para incrustar
- `/embed.js` — el componente incrustable · `/static/embed/demo.html` — demo de incrustación

```bash
python tools/build_embed.py   # regenera app/static/embed/cooking-chart.js
python tools/build_ai.py      # regenera el prompt para IAs y /llms.txt (tras cambiar el vocabulario)
node conformance/run.js       # ejecuta la batería de conformidad
npm ci && npm run build:css   # regenera el CSS del sitio (Tailwind) tras cambiar clases
```

## Publicar

Todo lo que tiene que ver con recetas ocurre en el navegador, así que el sitio se exporta a ficheros normales:

```bash
python tools/build_static.py --site-url https://cookingchart.org
```

`dist/` funciona en cualquier hosting estático:

- **Hosting compartido (Apache)**: sube el contenido de `dist/` a `public_html/`. El `.htaccess` incluido se ocupa de https, de las URL sin `.html`, del CORS para incrustar y de la caché.
- **GitHub Pages**: define la variable del repositorio `CC_SITE_URL` con tu dominio y elige *GitHub Actions* como origen de Pages. El [flujo](.github/workflows/site.yml) comprueba la conformidad y publica en cada push a `main`. Necesita dominio propio, porque el sitio usa rutas desde la raíz (`/es/…`).
- **Cloudflare Pages / Netlify**: comando de build `pip install -r requirements.txt && python tools/build_static.py`, carpeta de salida `dist`.

## Contacto

[hello@cookingchart.org](mailto:hello@cookingchart.org)

## Licencia

- Código: [Apache 2.0](LICENSE)
- Especificación y casos de conformidad: [CC BY 4.0](LICENSE-SPEC)
- Nombres y logotipo: [política de marca](TRADEMARKS.md)

Copyright 2025-2026 David Clothier.
