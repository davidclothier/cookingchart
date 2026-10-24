# Cooking Chart — Especificación v0.2

🇬🇧 [English version](SPEC.md)

> Un modelo formal de receta, un lenguaje textual para escribirlo (**CCL**, *Cooking Chart Language*) y una notación visual estándar para dibujarlo (**Cooking Chart**).

El estándar tiene tres capas, como BPMN o UML:

| Capa | Qué es | Dónde vive |
|---|---|---|
| **Metamodelo** | Qué es una receta: entidades, relaciones y reglas | §1 |
| **Lenguaje (CCL)** | Cómo se escribe una receta sin ambigüedad, en español o en inglés | §2–§5 |
| **Notación (Cooking Chart)** | Cómo se dibuja, de forma determinista, a partir del modelo, y cómo se lee como texto (plan de trabajo y modo de elaboración) | §6 |

Además: validación (§7), distribución e incrustación (§8), extensiones y conformidad (§9), decisiones abiertas (§10) y trabajo relacionado (§11).

Implementación de referencia: [cooking-lang.js](app/static/js/cooking-lang.js) (parser), [recipe-model.js](app/static/js/recipe-model.js) (semántica y planificación), [recipe-chart.js](app/static/js/recipe-chart.js) (notación), [recipe-text.js](app/static/js/recipe-text.js) (vistas de texto), [embed-element.js](app/static/js/embed-element.js) (componente incrustable).

---

## 0. Principios

1. **La receta la decide su autor.** El lenguaje no impone decisiones culinarias: cuánto aguanta un intermedio, cuántos cocineros hay o cómo se planifica se declara, no se deduce.
2. **Formalización progresiva.** Todo lo que va más allá de *ingredientes → procesos → plato* es opcional. Una receta doméstica no dice nada de cocineros ni de fuegos; una cocina profesional los declara y el mismo texto pasa a ser un plan de producción factible.
3. **El dibujo no se decide a mano.** El gráfico se deriva del modelo sin coordenadas, carriles ni horas de inicio escritas por nadie.
4. **Bilingüe desde el núcleo.** Cada palabra clave, verbo y unidad tiene una forma canónica y sus formas en español y en inglés.

---

## 1. Metamodelo

### 1.1 Entidades

| Entidad | Definición | Atributos |
|---|---|---|
| **Ingrediente** | Materia inicial; no la produce ningún proceso de la receta | nombre, cantidad, unidad |
| **Herramienta** | Recurso con el que se aplica un proceso. No se consume. | nombre, capacidad |
| **Proceso** | Aplicación de un **verbo** a una o varias materias, con unas herramientas, durante un tiempo | verbo, entradas, herramientas, parámetros, duración, condición de fin, atención, tolerancia a la espera |
| **Intermedio** | Materia producida por un proceso y consumida por otro ("verduras pochadas") | nombre, proceso que lo produce, cuánto aguanta |
| **Plato** | El intermedio final que se sirve | nombre |
| **Cocinero** *(opcional)* | Recurso humano. Los procesos *atendidos* lo ocupan; los *desatendidos*, no. | número |
| **Fuego** *(opcional)* | Recurso de la cocina. Todo proceso de tipo Fuego ocupa uno, atendido o no. | número |

### 1.2 Reglas

1. **Cada proceso produce exactamente un resultado**, con nombre.
2. **Una materia se consume entera** salvo que se indique una fracción (`salsa[1/2]`). Las fracciones de una materia deberían sumar 1.
3. **El grafo de procesos es acíclico.**
4. **Todo converge en el plato.**
5. **Las herramientas tienen estado.** Un proceso aplicado solo a herramientas (`precalentar(horno)`) produce la herramienta en otro estado. Usarla después crea una dependencia y ocupa la herramienta base.
6. **Una entrada puede incorporarse a mitad de un proceso** (`+ vino a los 5min`).
7. **El paralelismo no se declara: se deduce** de las dependencias y de los recursos disponibles.
8. **Un recurso solo restringe si se declara** (principio 2).
9. **Un intermedio puede esperar indefinidamente** salvo que el autor diga cuánto aguanta (`aguanta 30min`, `sin espera`).

### 1.3 Semántica formal

Una receta es una **red de Petri temporizada con recursos**: lugares = ingredientes, intermedios y estados de herramienta; transiciones = procesos con duración; recursos = cocineros, fuegos y herramientas con capacidad. Planificarla es un problema RCPSP con desfases máximos (RCPSP/max): `aguanta` es un desfase máximo entre el fin de un proceso y el inicio de su consumidor. El Cooking Chart es una vista de una solución concreta.

---

## 2. CCL por ejemplo

```ccl
receta "Lasaña boloñesa"
raciones 6
cocineros 1

ingredientes
  cebolla      1 ud
  carne        500 g    "Carne picada"
  tomate       800 g    "Tomate triturado"
  vino         100 ml   "Vino tinto"
  mantequilla  50 g
  harina       50 g
  leche        500 ml
  placas       250 g    "Placas de lasaña"
  queso        200 g    "Queso rallado"

herramientas
  sartén, cazo, fuente, horno

bloque "Boloñesa"
  sofrito       = pochar(cebolla) en sartén @fuego:bajo 10min
  carne_dorada  = dorar(sofrito, carne) en sartén @fuego:alto 15min
  boloñesa      "Salsa boloñesa" = guisar(carne_dorada, tomate) en sartén 45min
    + vino a los 5min
fin

bloque "Bechamel"
  roux     = cocinar(mantequilla, harina) en cazo 5min
  bechamel = cocinar(roux, leche) en cazo 8-10min hasta "espese" aguanta 30min
fin

horno_caliente = precalentar(horno) @180ºC 15min
lasaña_cruda   = montar(boloñesa, bechamel, placas, queso) en fuente 15min
lasaña         = hornear(lasaña_cruda) en horno_caliente @180ºC 40min

servir lasaña "Lasaña boloñesa"
```

La misma receta en inglés usa `recipe`, `ingredients`, `tools`, `block`/`end`, `in`, `until`, `keeps`, `at`, `serve` y verbos como `sweat`, `brown`, `simmer`, `bake`. Las dos versiones producen exactamente el mismo modelo.

- **Cada paso es una asignación**: `resultado = verbo(entradas)`. Las dependencias salen de los nombres.
- **El orden de las líneas no importa** para la semántica.

---

## 3. Sintaxis

### 3.1 Léxico

- **Identificadores**: letras Unicode, dígitos y `_`; no empiezan por dígito. Nombre visible por defecto: `_` → espacio y mayúscula inicial. Un `"texto"` tras el identificador lo sustituye.
- **Género gramatical** (opcional): `(m)`, `(f)`, `(m pl)` o `(f pl)` tras el nombre de un ingrediente, una herramienta o un resultado. Solo lo usa el modo de elaboración para poner bien los artículos (§6.1); no cambia el modelo ni el plan.
- **Comentarios**: `#`, `//` o `%%` hasta el final de la línea.
- **Números**: `500`, `1,5`, `1.5`, `1/2`. Una cantidad de ingrediente puede ser un rango: `3-4 cda`, `2-3 dientes`.
- Palabras clave y verbos **no distinguen mayúsculas**. La **sangría** es libre.

### 3.2 Palabras clave

| Canónica | Español | English |
|---|---|---|
| recipe | `receta` | `recipe` |
| description | `descripcion`, `descripción` | `description` |
| cuisine | `cocina` | `cuisine` |
| language | `idioma` | `language`, `lang` |
| servings | `raciones` | `servings`, `serves` |
| cooks | `cocineros` | `cooks` |
| burners | `fuegos` | `burners` |
| plan | `plan`, `planificación` | `schedule` |
| ingredients | `ingredientes` | `ingredients` |
| tools | `herramientas`, `utensilios` | `tools`, `equipment` |
| block / end | `bloque` / `fin` | `block` / `end` |
| serve | `servir` | `serve` |
| in | `en`, `con` | `in`, `with`, `on` |
| until | `hasta` | `until` |
| attended / unattended | `atendido` / `desatendido` | `attended` / `unattended` |
| keeps | `aguanta` | `keeps` |
| use (paquetes) | `usa`, `usar` | `use` |
| no wait | `sin espera`, `inmediato` | `no wait`, `immediately` |
| at (añadidos) | `a los`, `al`, `a las` | `at`, `after` |
| plan: asap | `lo_antes_posible` | `asap`, `as_soon_as_possible` |
| plan: alap | `justo_a_tiempo` | `just_in_time`, `jit`, `alap` |

**Idioma de la receta**: el declarado con `idioma es|en` o, si no, el de la mayoría de sus palabras clave y verbos. Determina cómo se muestran las unidades y los textos del gráfico. Mezclar idiomas es válido.

### 3.3 Gramática (EBNF)

```ebnf
receta        = { linea } ;
linea         = ( cabecera | seccion | entrada_seccion | paso | añadido
                | bloque | fin | servir ) , [ comentario ] , NL
              | [ comentario ] , NL ;

cabecera      = RECIPE , cadena
              | DESCRIPTION , cadena
              | CUISINE , cadena                                (* metadato, no afecta a la planificación *)
              | LANGUAGE , ( "es" | "en" )
              | SERVINGS , numero
              | COOKS , ( entero | "ilimitados" | "unlimited" )
              | BURNERS , entero
              | PLAN , ( ASAP | ALAP )
              | USE , cadena ;                                  (* paquete de vocabulario, §9.2 *)

seccion       = INGREDIENTS | TOOLS , [ lista_herr ] ;
entrada_seccion = ingrediente | lista_herr ;          (* según la sección abierta *)
ingrediente   = ident , [ cantidad , [ unidad ] ] , [ AL_GUSTO | CS ] , [ cadena ] , [ genero ] ;
lista_herr    = herramienta , { "," , herramienta } ;
herramienta   = ident , [ genero ] , [ ( "x" | "×" ) , entero ] ;

paso          = ident , [ cadena ] , [ genero ] , "=" , ( verbo | "x-" , ident ) , "(" , [ entradas ] , ")" , { modificador } ;
entradas      = entrada , { "," , entrada } ;
entrada       = ident , [ "[" , ( fraccion | porcentaje ) , "]" ] ;
modificador   = IN , ident , { "," , ident }                    (* herramientas *)
              | "@" , numero , [ "º" | "°" ] , ( "C" | "F" )    (* temperatura *)
              | "@" , [ "x-" ] , ident , [ ":" , valor ]       (* parámetro; @tipo:… fija el tipo *)
              | duracion
              | UNTIL , cadena                                  (* condición de fin *)
              | ATTENDED | UNATTENDED
              | KEEPS , duracion                                (* tolerancia a la espera *)
              | NO_WAIT ;

añadido       = "+" , entrada , { "," , entrada } , AT , duracion ;
bloque        = BLOCK , cadena ;
fin           = END ;
servir        = SERVE , ident , [ cadena ] ;

duracion      = [ "~" ] , numero , [ "-" , numero ] , unidad_t ;
unidad_t      = "h" , [ entero , [ "min" ] ] | "min" | "m" | "s" | "seg" | "sec" ;
cantidad      = numero | fraccion | numero , "-" , numero ;      (* 3-4 cda *)
fraccion      = entero , "/" , entero ;
porcentaje    = numero , "%" ;
cadena        = '"' , { caracter - '"' } , '"' ;
genero        = "(" , ( "m" | "f" ) , [ "pl" ] , ")" ;          (* §6.1 *)
```

Las palabras en MAYÚSCULAS son las palabras clave de §3.2, en cualquiera de sus formas.

### 3.4 Unidades

Cada unidad tiene una forma canónica y se muestra según el idioma de la receta, en plural si la cantidad es un número distinto de 1 (`2 dientes`, `1/2 taza`):

| Canónica | Se muestra (es / en) | Acepta |
|---|---|---|
| `g` `kg` `mg` `oz` `lb` | igual | gr, gramo(s), gram(s), kilo(s), onza(s), ounce(s), libra(s), pound(s) |
| `ml` `cl` `dl` `l` | igual | mililitro(s), milliliter(s), lt, litro(s), liter(s), litre(s) |
| `unit` | ud / pc | un, unidad(es), pieza(s), unit(s), pc(s), piece(s) |
| `tbsp` / `tsp` | cda / tbsp · cdta / tsp | cucharada(s), cdas, cd, tablespoon(s), tbsps · cucharadita(s), cdtas, ct, teaspoon(s), tsps |
| `cup` `glass` `pinch` `splash` `handful` `bunch` `clove` `leaf` `sprig` `stalk` `can` `sachet` `slice` `rasher` | taza / cup, vaso / glass, pizca / pinch, chorrito / splash, puñado / handful, manojo / bunch, diente / clove, rebanada / slice, loncha / slice… | singular y plural en ambos idiomas |
| *especiales* | al gusto / to taste · c.s. / as needed | |

---

## 4. Semántica

### 4.1 Resolución de nombres

Cada identificador de las entradas se resuelve como: 1) **ingrediente** declarado; 2) **resultado** de otro paso (dependencia); 3) **herramienta** declarada (si el paso solo tiene herramientas como entradas, su resultado es la herramienta en otro estado). En `en X`, `X` puede ser una herramienta o un estado de herramienta. Si no se resuelve, es un error.

### 4.2 Duración

| Forma | Significado | Para planificar |
|---|---|---|
| `10min`, `1h30`, `90s` | fija | el valor |
| `8-10min` | rango | el máximo |
| `~10min` | aproximada | el valor |
| `hasta "espese"` | condición de fin | la duración estimada que la acompaña |

### 4.3 Atención

Cada verbo trae un modo por defecto (§5); `atendido` / `desatendido` lo sustituyen. Atendido = el cocinero está ocupado todo el paso.

### 4.4 Añadidos a mitad de proceso

`+ x a los t` en el paso `p`: si `x` es un resultado, `p.inicio ≥ x.fin − t`.

### 4.5 Tolerancia a la espera (opcional)

Por defecto un intermedio puede esperar lo que haga falta. El autor puede limitarlo:

- `aguanta D`: entre el fin del paso y su uso pasan como mucho `D`.
- `sin espera`: equivale a `aguanta 0`; se usa en cuanto está.

Restricción: `consumidor.inicio + at − productor.fin ≤ D`. El planificador retrasa el productor hasta cumplirla si hay recursos libres; si no es posible, **no cambia la receta**: lo informa como violación (aviso en el editor y espera en rojo en el gráfico). Que el autor decida qué hacer forma parte del principio 1.

### 4.6 Planificación

Recursos (solo si se declaran): `cocineros N` (lo ocupan los pasos atendidos), `fuegos N` (los pasos de tipo Fuego), y cada herramienta declarada con su capacidad (`horno x2`; 1 por defecto).

1. **Plan** por generación en serie (*serial SGS*), por prioridad de camino restante. Como el SGS es una heurística, se prueban varias prioridades (por ejemplo, colocar lo que no puede esperar junto a quien lo usa) y se elige el plan con menos espera excesiva (§4.5) y, a igualdad, el más corto:
   - *lo antes posible*: desde el inicio;
   - *justo a tiempo*: desde el plato hacia atrás, en tiempo invertido.
2. **Reparación** de las tolerancias a la espera (§4.5).
3. **Análisis**: se fija el orden en que cada recurso atiende a los pasos del plan y, sobre ese grafo aumentado, se calculan inicio temprano y tardío, holgura (ventana `[temprano, tardío]`) y ruta crítica. Mover un paso dentro de su ventana nunca crea solapes nuevos (propiedad de Helly en intervalos).

Sin recursos limitados ni tolerancias, todo se reduce al método de la ruta crítica (CPM).

**Modo por defecto**: el que declare la receta con `plan` (si no, *lo antes posible*). Un visor puede ofrecer el otro modo, pero un gráfico incrustado siempre usa el declarado salvo que la página indique otro.

---

## 5. Vocabulario controlado de verbos

Cada verbo tiene un **identificador canónico** (en inglés, para ser estable entre idiomas), un **tipo** que fija su color y un **modo de atención** por defecto. Un verbo fuera del vocabulario se admite con un aviso. El nombre que se muestra es el que escribió el autor; en el modo de elaboración va en imperativo (§6.1).

| Id canónico | Tipo | Atención | Español | English |
|---|---|---|---|---|
| `chop` | Preparación | atendido | picar | chop, mince |
| `cut` | Preparación | atendido | cortar, trocear | cut, dice, cube |
| `slice` | Preparación | atendido | laminar, filetear | slice, fillet |
| `grate` | Preparación | atendido | rallar | grate |
| `peel` | Preparación | atendido | pelar | peel |
| `beat` | Preparación | atendido | batir | beat, whisk, whip |
| `blend` | Preparación | atendido | triturar | blend, purée, puree |
| `mash` | Preparación | atendido | majar, aplastar | mash, crush |
| `knead` | Preparación | atendido | amasar | knead |
| `sift` | Preparación | atendido | tamizar | sift |
| `drain` | Preparación | atendido | escurrir, colar | drain, strain |
| `wash` | Preparación | atendido | lavar | wash, rinse |
| `weigh` | Preparación | atendido | pesar | weigh, measure |
| `squeeze` | Preparación | atendido | exprimir | squeeze, juice |
| `crumble` | Preparación | atendido | desmigar | crumble, shred |
| `debone` | Preparación | atendido | deshuesar | debone, pit |
| `dry` | Preparación | atendido | secar | dry, pat_dry |
| `stir` | Preparación | atendido | remover | stir |
| `divide` | Preparación | atendido | dividir, porcionar | divide, portion |
| `mix` | Montaje | atendido | mezclar, combinar | mix, combine |
| `add` | Montaje | atendido | añadir, incorporar | add, fold, incorporate |
| `assemble` | Montaje | atendido | montar | assemble, layer |
| `plate` | Montaje | atendido | emplatar, servir | plate |
| `fill` | Montaje | atendido | rellenar | fill, stuff |
| `shape` | Montaje | atendido | formar, bolear | shape, form |
| `wrap` | Montaje | atendido | envolver | wrap |
| `coat` | Montaje | atendido | rebozar, empanar | coat, bread, dredge |
| `glaze` | Montaje | atendido | napar | glaze, nap |
| `roll` | Montaje | atendido | estirar | roll |
| `garnish` | Montaje | atendido | decorar | garnish, decorate |
| `finish` | Montaje | atendido | mantecar | finish |
| `bind` | Montaje | atendido | ligar | bind, thicken |
| `emulsify` | Montaje | atendido | emulsionar | emulsify |
| `season` | Montaje | atendido | sazonar, salpimentar, salar | season |
| `dissolve` | Montaje | atendido | disolver, diluir | dissolve, dilute |
| `pour` | Montaje | atendido | verter | pour |
| `sprinkle` | Montaje | atendido | espolvorear | sprinkle, dust |
| `brush` | Montaje | atendido | pincelar, pintar | brush |
| `arrange` | Montaje | atendido | colocar, disponer | arrange, place |
| `saute` | Fuego | atendido | saltear | sauté, saute, stir_fry |
| `sweat` | Fuego | atendido | pochar, rehogar, sofreír | sweat, soften |
| `brown` | Fuego | atendido | dorar, marcar | brown, sear |
| `fry` | Fuego | atendido | freír | fry, deep_fry |
| `toast` | Fuego | atendido | tostar, nacarar | toast |
| `caramelize` | Fuego | atendido | caramelizar | caramelize, caramelise |
| `melt` | Fuego | atendido | fundir, derretir | melt |
| `cook` | Fuego | atendido | cocinar | cook |
| `flambe` | Fuego | atendido | flambear | flambé, flambe |
| `heat` | Fuego | atendido | calentar | heat, warm |
| `blanch` | Fuego | atendido | escaldar, blanquear | blanch, scald |
| `grill` | Fuego | atendido | asar_a_la_plancha, asar_a_la_parrilla, planchear | grill, griddle |
| `boil` | Fuego | desatendido | cocer, hervir | boil |
| `simmer` | Fuego | desatendido | guisar, estofar | simmer, stew |
| `reduce` | Fuego | desatendido | reducir | reduce |
| `confit` | Fuego | desatendido | confitar | confit |
| `poach` | Fuego | desatendido | escalfar | poach |
| `braise` | Fuego | desatendido | brasear | braise |
| `steam` | Fuego | desatendido | cocer_al_vapor | steam |
| `bake` | Horno | desatendido | hornear | bake |
| `gratin` | Horno | desatendido | gratinar | gratin, gratinate, broil |
| `roast` | Horno | desatendido | asar | roast |
| `preheat` | Horno | desatendido | precalentar | preheat |
| `rest` | Reposo | desatendido | reposar | rest |
| `proof` | Reposo | desatendido | levar, fermentar | proof, prove, rise, ferment |
| `cool` | Reposo | desatendido | enfriar, templar | cool |
| `chill` | Reposo | desatendido | refrigerar | chill, refrigerate |
| `freeze` | Reposo | desatendido | congelar | freeze |
| `marinate` | Reposo | desatendido | marinar, macerar | marinate, macerate |
| `soak` | Reposo | desatendido | hidratar, remojar | soak, hydrate |
| `thaw` | Reposo | desatendido | descongelar | thaw, defrost |
| `infuse` | Reposo | desatendido | infusionar | infuse, steep |

**Parámetros recomendados** (se acepta cualquiera): Fuego `@fuego:bajo|medio|alto` / `@heat:low|medium|high`, `@tapado` / `@covered`; Horno `@180ºC`, `@modo:ventilador|grill`; Preparación `@intensidad:…`, `@velocidad:N`; Reposo `@4ºC`.

---

## 6. Notación visual: el Cooking Chart

| Elemento | Codificación |
|---|---|
| Tiempo | Eje X lineal y proporcional |
| Proceso | Barra de inicio a fin. Color = tipo de verbo. **Rayado** = desatendido. Línea blanca inferior = ruta crítica. |
| Ingrediente | Punto verde con nombre y cantidad, encima del proceso que lo consume, en el minuto en que entra |
| Intermedio | Banda que sale del proceso; nombre en cursiva (`→ Sofrito`) |
| Cantidad de materia | Grosor de banda ∝ √(ingredientes acumulados) |
| Dependencia en el carril | La banda continúa |
| Dependencia entre carriles | Afluente que desemboca por arriba o abajo en la barra consumidora, en el minuto `at` |
| Espera | Banda discontinua atenuada; **en rojo** la parte que excede lo que aguanta |
| Plato | Círculo dorado con el tiempo total |
| Recursos | Una franja por recurso bajo el gráfico ("Manos" siempre; "Fuegos" si se declaran). Altura = ocupación; rojo = exceso |
| Idioma | Los textos del gráfico usan el idioma de la receta |

**Carriles.** Desde el plato hacia atrás, el carril sigue por el afluente que llega más tarde. El resto forma sub-bloques alternando arriba y abajo, los que desembocan antes más cerca. Cada subárbol ocupa un bloque contiguo, así que **no hay cruces por construcción**.

**Firma visual.** El mismo gráfico sin texto y a escala común, para comparar recetas.

### 6.1 Vistas de texto (informativo)

La misma receta planificada se lee también como texto. Junto al gráfico forman una tríada:

| Vista | Para qué | Contenido |
|---|---|---|
| **Gráfico** | Ver el tiempo y el paralelismo | §6 |
| **Plan de trabajo** | Organizarse | Una fila por paso, por orden de inicio: minutos de inicio y fin, tipo, duración, atención, herramientas, parámetros, condición, tolerancia, entradas → salida y margen (o "crítico", o la espera que excede lo que aguanta) |
| **Modo de elaboración** | Cocinar leyendo | Ingredientes con cantidad, utensilios y frases en el orden en que se cocina, con enlaces |

Las tres salen del mismo modelo y del mismo plan: si cambia la planificación (`plan justo_a_tiempo` o el selector), cambian las tres. Nadie las escribe a mano.

**Modo de elaboración.**

- **Momentos.** Los pasos se agrupan por su minuto de inicio. Cada momento empieza con ese minuto (`0′`, `5′`…) y el último dice el tiempo total y el plato.
- **Una frase por paso**: verbo en imperativo, entradas, lugar, temperatura, fuego, duración, condición y resto de parámetros, "(sin vigilar)" si es desatendido, `→ resultado` y su tolerancia. Por ejemplo: *Pocha las verduras picadas en la sartén a fuego bajo durante 10 min → sofrito.*
- **Verbo.** El imperativo (tú) de la forma que escribió el autor; si la escribió en otro idioma, el de la forma principal en el idioma de la receta. Los verbos de reposo (`rest`, `proof`, `cool`, `marinate`, `soak`, `infuse`, `thaw`) se leen *deja reposar…*. `add` con varias entradas se lee *añade X a Y*, donde Y es la primera entrada.
- **Entradas.** Los ingredientes con su cantidad (*120 g de azúcar*, *½ cdta de esencia*), proporcional si se usa una parte; los intermedios con artículo (*los huevos batidos*); las partes de un intermedio en palabras (*la mitad de la cebolla picada*). Lo que entra a mitad de paso va en una frase aparte: *A los 5 min, añade 100 ml de vino tinto.*
- **Lugar.** Las herramientas con la preposición que escribió el autor (`en`, `con`). Si una herramienta está en otro estado (`horno_caliente`), se nombra el estado: *hornea … en el horno caliente*.
- **Conectores.** *Mientras tanto* cuando se cambia de tarea con otro paso aún en marcha; *A la vez* para los siguientes pasos de un mismo momento.
- **Enlaces.** Cada intermedio citado enlaza con la frase que lo produce; cada `→ resultado`, con la frase que lo usa; cada ingrediente, con la lista. Al pasar por encima de una frase se resalta su paso en el gráfico, y al revés.

**Artículos en español.** Para escribir *el* horno o *las* tortillas hace falta el género y el número. El autor puede declararlos tras el nombre (§3.1):

```
herramientas
  sartén (f), wok
masa "Masa de bizcocho" (f) = añadir(mezcla, harina) 5min
```

Si no los declara, se deducen del primer sustantivo con un léxico de cocina y las terminaciones habituales; si no hay certeza, la frase va sin artículo. En inglés no hacen falta.

**Buscadores.** Una implementación puede publicar la receta como [schema.org/Recipe](https://schema.org/Recipe): `recipeIngredient` es la lista de ingredientes; `recipeInstructions`, una `HowToStep` por frase; `totalTime`, el tiempo total del plan; `prepTime`, el tiempo con las manos; además `tool`, `recipeCuisine` y `recipeYield`.

La redacción exacta no es normativa. Otra implementación puede escribir las frases a su manera, siempre que salgan del mismo plan y conserven el orden, las cantidades y los tiempos.

---

## 7. Validación

Cada diagnóstico tiene un **código** estable (`undefinedName`, `cycle`, `unknownVerb`…), que es lo normativo, y un mensaje en el idioma de la interfaz.

| Severidad | Casos |
|---|---|
| **Error** | nombre no definido · resultado producido dos veces · resultado con nombre de ingrediente · dependencia circular · falta la duración · sintaxis no reconocida · idioma o plan desconocidos · receta sin pasos |
| **Aviso** | paquete desconocido · tipo desconocido en `@tipo` · ingrediente sin usar · intermedio que ni se usa ni se sirve · verbo fuera del vocabulario · herramienta sin declarar · unidad desconocida · fracciones que no suman el total · condición sin duración · añadido tras el final del paso · falta `servir` · `aguanta` en el plato final |
| **Aviso del plan** | un intermedio espera más de lo que aguanta (§4.5) |

---

## 8. Distribución e incrustación

Un único fichero, `cooking-chart.js` (generado con `python tools/build_embed.py`), contiene el parser, el planificador, el dibujo y sus estilos. Si la página no tiene d3, lo carga del mismo sitio que sirve `cooking-chart.js`, con comprobación de integridad (SRI). Expone el componente `<cooking-chart>` (Shadow DOM: los estilos de la web anfitriona no le afectan) y `window.CookingChart`.

```html
<script src="https://HOST/static/embed/cooking-chart.js" defer></script>

<!-- 1. Receta en línea -->
<cooking-chart controls>
  receta "Tortilla francesa"
  ...
</cooking-chart>

<!-- 2. Desde un fichero -->
<cooking-chart src="/recetas/lasaña.ccl" mode="jit"></cooking-chart>

<!-- 3. Markdown: cualquier bloque ```ccl se convierte solo -->
```

| Atributo | Valores |
|---|---|
| `src` | URL de un `.ccl` |
| `mode` | `asap` \| `jit` (por defecto, el `plan` de la receta) |
| `lang` | `es` \| `en` (por defecto, el idioma de la receta) |
| `controls` | muestra el selector de planificación |
| `variant` | `signature`: miniatura sin texto |
| `view` | `chart` (por defecto), `method` (modo de elaboración), `plan` (plan de trabajo); varias separadas por espacios, en el orden de sus pestañas, o `all` |
| `schema` | publica la receta como JSON-LD de `schema.org/Recipe` junto al elemento (§6.1) |

`window.CookingChart` ofrece `parse`, `prepare`, `method` (el modo de elaboración como datos) y `schema` (el JSON-LD) para quien quiera montar su propia vista.

Para plataformas sin scripts: `<iframe src="https://HOST/e#ccl=…">` (la receta viaja en el *hash* y nunca llega al servidor) o exportar el SVG desde el editor.

---

## 9. Extensiones y conformidad

El estándar crece de tres formas, de más privada a más oficial.

### 9.1 Extensiones privadas: prefijo `x-`

Cualquiera puede usar parámetros y verbos propios con el prefijo `x-`, sin avisos y sin riesgo de chocar con versiones futuras del estándar:

```ccl
crema   = fundir(chocolate) @x-termometro:31ºC 15min
relleno = x-zarandear(crema) @tipo:montaje 2min
```

Un verbo `x-` (o cualquier verbo fuera del vocabulario) puede clasificarse con `@tipo:` / `@kind:` (`preparación`, `montaje`, `fuego`, `horno`, `reposo`). Así lo decide el autor y no el sistema por aproximación.

### 9.2 Paquetes de vocabulario

Un **paquete** amplía el vocabulario para un dominio: pastelería, cocina asiática, un robot de cocina concreto… La receta lo activa con `usa "pastelería"` / `use "pastry"`.

- Los verbos de un paquete tienen identificadores con su prefijo (`pastry:temper`) y formas en cada idioma.
- Dentro de una receta que lo usa, el paquete **tiene prioridad** sobre el vocabulario base: en pastelería, `laminar` es hojaldrar (`pastry:laminate`), no cortar en láminas.
- Un paquete desconocido produce un aviso, no un error: la receta sigue siendo legible.

Un tercero publica un paquete registrándolo en la implementación de referencia:

```js
CookingLang.registerPack({
    id: 'pastry', version: '0.1',
    names: { es: 'pastelería', en: 'pastry' },
    verbs: [
        // [id, tipo, atención, formas en español, formas en inglés]
        ['temper', 'heat', 'active', 'atemperar', 'temper'],
        ['laminate', 'prep', 'active', 'laminar hojaldrar', 'laminate']
    ]
});
```

[cooking-packs.js](app/static/js/cooking-packs.js) contiene el paquete `pastry` como ejemplo.

### 9.3 Propuestas a la especificación

Los cambios al núcleo (palabras clave, vocabulario base, semántica, notación) se proponen como **CEP** (*CCL Enhancement Proposal*), numeradas y discutidas en público. Una CEP aceptada entra en la siguiente versión menor de la especificación. Un paquete muy usado puede promocionarse al vocabulario base mediante una CEP.

### 9.4 Conformidad

Una implementación es **conforme** con CCL v0.2 si, para cada caso de [conformance/cases/](conformance/cases/), produce el mismo **modelo normalizado** que el `.json` esperado: idioma, plan, recursos, ingredientes con unidad canónica mostrada, pasos (verbo canónico, tipo, atención, duraciones, tolerancia, herramientas, entradas con `at` y fracción, salida), género gramatical si se declara, plato final y diagnósticos (severidad, línea y **código**).

- La planificación es **normativa** cuando no hay recursos limitados (CPM: el resultado es único). Con recursos, el resultado de referencia es **informativo**: otra implementación puede usar otra heurística siempre que su plan sea factible y respete las tolerancias.
- Los **mensajes** de los diagnósticos no son normativos; sus **códigos** sí.

```bash
node conformance/run.js          # comprobar
node conformance/run.js --update # regenerar los esperados tras un cambio aprobado
```

### 9.5 Licencias

La especificación y los casos de conformidad: **CC BY 4.0** ([LICENSE-SPEC](LICENSE-SPEC)). La implementación de referencia: **Apache 2.0** ([LICENSE](LICENSE)). Los nombres "Cooking Chart" y "CCL": [política de marca](TRADEMARKS.md).

---

## 10. Decisiones abiertas (v0.3)

- **Excepciones al fuego** (microondas, Thermomix): marcarlo en la herramienta o en el paso.
- **Ocupación de la herramienta durante la espera**: un intermedio que espera en el cazo lo sigue ocupando.
- **Atención parcial**: "remover de vez en cuando" (`atendido:20%`).
- **Escalado de raciones**: cantidades proporcionales; duraciones que no escalan o escalan por tramos.
- **Más idiomas**: italiano y francés sobre los mismos identificadores canónicos.
- **Salidas múltiples**: `yemas, claras = separar(huevos)`.
- **Recursos con nombre** para cocina profesional: partidas, roles, asignación de pasos a personas.

## 11. Trabajo relacionado

- **Cooklang**: marcado de recetas sobre prosa (`@ingrediente{cantidad}`, `#utensilio`, `~{tiempo}`). Es lineal: no modela intermedios, dependencias, paralelismo ni recursos.
- **Recipe flow graphs** (Mori et al., LREC 2014): corpus de recetas anotadas como grafos de flujo. Valida la idea del grafo, pero no propone lenguaje ni notación.
- **schema.org/Recipe**: metadatos; las instrucciones son texto libre.
- **Mermaid / PlantUML**: el modelo de distribución (texto → diagrama incrustable).
- **Gantt, Sankey, BPMN, redes de Petri, RCPSP/max**: eje temporal y carriles; grosor de flujo; separación entre modelo y notación; semántica; planificación con recursos y desfases máximos.

Lo que aporta este trabajo: **modelo, lenguaje bilingüe y notación forman un único estándar**, el dibujo se obtiene sin intervención manual y se incrusta en cualquier web.
