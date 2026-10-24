# Cooking Chart — Specification v0.2

🇪🇸 [Versión en español](SPEC.es.md)

> A formal model of a recipe, a text language to write it (**CCL**, *Cooking Chart Language*) and a standard visual notation to draw it (**Cooking Chart**).

The standard has three layers, like BPMN or UML:

| Layer | What it is | Where |
|---|---|---|
| **Metamodel** | What a recipe is: entities, relations and rules | §1 |
| **Language (CCL)** | How to write a recipe unambiguously, in English or Spanish | §2–§5 |
| **Notation (Cooking Chart)** | How it is drawn, deterministically, from the model, and how it reads as text (work plan and method) | §6 |

Plus: validation (§7), distribution and embedding (§8), extensions and conformance (§9), open decisions (§10) and related work (§11).

Reference implementation: [cooking-lang.js](app/static/js/cooking-lang.js) (parser), [recipe-model.js](app/static/js/recipe-model.js) (semantics and scheduling), [recipe-chart.js](app/static/js/recipe-chart.js) (notation), [recipe-text.js](app/static/js/recipe-text.js) (text views), [embed-element.js](app/static/js/embed-element.js) (embeddable component).

---

## 0. Principles

1. **The author decides.** The language does not make culinary decisions: how long an intermediate keeps, how many cooks there are, or how the recipe is scheduled is declared, not inferred.
2. **Progressive formalization.** Everything beyond *ingredients → processes → dish* is optional. A home recipe says nothing about cooks or burners; a professional kitchen declares them and the same text becomes a feasible production plan.
3. **Nobody draws by hand.** The chart is derived from the model; no coordinates, lanes or start times are written by anyone.
4. **Bilingual at the core.** Every keyword, verb and unit has a canonical form plus its English and Spanish forms.

---

## 1. Metamodel

### 1.1 Entities

| Entity | Definition | Attributes |
|---|---|---|
| **Ingredient** | Initial matter; not produced by any process of the recipe | name, quantity, unit |
| **Tool** | Resource used to apply a process. Not consumed. | name, capacity |
| **Process** | Applying a **verb** to one or more inputs, with some tools, for some time | verb, inputs, tools, parameters, duration, end condition, attention, wait tolerance |
| **Intermediate** | Matter produced by one process and consumed by another ("sweated vegetables") | name, producing process, how long it keeps |
| **Dish** | The final intermediate that is served | name |
| **Cook** *(optional)* | Human resource. *Attended* processes take one; *unattended* ones don't. | count |
| **Burner** *(optional)* | Kitchen resource. Every stovetop process takes one, attended or not. | count |

### 1.2 Rules

1. **Each process produces exactly one named result.**
2. **Matter is consumed whole** unless a fraction is given (`sauce[1/2]`). Fractions of the same matter should add up to 1.
3. **The process graph is acyclic.**
4. **Everything converges on the dish.**
5. **Tools have state.** A process applied only to tools (`preheat(oven)`) produces the tool in another state. Using it later creates a dependency and takes the base tool.
6. **An input can be added halfway through a process** (`+ wine at 5min`).
7. **Parallelism is not declared: it is inferred** from dependencies and available resources.
8. **A resource only constrains if it is declared** (principle 2).
9. **An intermediate can wait indefinitely** unless the author says how long it keeps (`keeps 30min`, `no wait`).

### 1.3 Formal semantics

A recipe is a **timed Petri net with resources**: places = ingredients, intermediates and tool states; transitions = processes with duration; resources = cooks, burners and tools with capacity. Scheduling it is an RCPSP with maximal time lags (RCPSP/max): `keeps` is a maximal lag between the end of a process and the start of its consumer. A Cooking Chart is a view of one concrete solution.

---

## 2. CCL by example

```ccl
recipe "Lasagna bolognese"
servings 6
cooks 1

ingredients
  onion    1 pc
  beef     500 g    "Ground beef"
  tomato   800 g    "Crushed tomato"
  wine     100 ml   "Red wine"
  butter   50 g
  flour    50 g
  milk     500 ml
  sheets   250 g    "Lasagna sheets"
  cheese   200 g    "Grated cheese"

tools
  pan, saucepan, dish, oven

block "Bolognese"
  soffritto    = sweat(onion) in pan @heat:low 10min
  browned_beef = brown(soffritto, beef) in pan @heat:high 15min
  bolognese    "Bolognese sauce" = simmer(browned_beef, tomato) in pan 45min
    + wine at 5min
end

block "Béchamel"
  roux     = cook(butter, flour) in saucepan 5min
  bechamel = cook(roux, milk) in saucepan 8-10min until "it thickens" keeps 30min
end

hot_oven    = preheat(oven) @180ºC 15min
raw_lasagna = assemble(bolognese, bechamel, sheets, cheese) in dish 15min
lasagna     = bake(raw_lasagna) in hot_oven @180ºC 40min

serve lasagna "Lasagna bolognese"
```

The same recipe in Spanish uses `receta`, `ingredientes`, `herramientas`, `bloque`/`fin`, `en`, `hasta`, `aguanta`, `a los`, `servir` and verbs such as `pochar`, `dorar`, `guisar`, `hornear`. Both versions produce exactly the same model.

- **Each step is an assignment**: `result = verb(inputs)`. Dependencies come from the names.
- **Line order does not matter** for the semantics.

---

## 3. Syntax

### 3.1 Lexical rules

- **Identifiers**: Unicode letters, digits and `_`; they don't start with a digit. Default display name: `_` → space, first letter capitalized. A `"text"` after the identifier overrides it.
- **Grammatical gender** (optional): `(m)`, `(f)`, `(m pl)` or `(f pl)` after the name of an ingredient, a tool or a result. Only the method view uses it, to get Spanish articles right (§6.1); it doesn't change the model or the schedule.
- **Comments**: `#`, `//` or `%%` to end of line.
- **Numbers**: `500`, `1.5`, `1,5`, `1/2`. An ingredient quantity can be a range: `3-4 tbsp`, `2-3 cloves`.
- Keywords and verbs are **case-insensitive**. **Indentation** is free.

### 3.2 Keywords

| Canonical | English | Español |
|---|---|---|
| recipe | `recipe` | `receta` |
| description | `description` | `descripcion`, `descripción` |
| cuisine | `cuisine` | `cocina` |
| language | `language`, `lang` | `idioma` |
| servings | `servings`, `serves` | `raciones` |
| cooks | `cooks` | `cocineros` |
| burners | `burners` | `fuegos` |
| plan | `schedule` | `plan`, `planificación` |
| ingredients | `ingredients` | `ingredientes` |
| tools | `tools`, `equipment` | `herramientas`, `utensilios` |
| block / end | `block` / `end` | `bloque` / `fin` |
| serve | `serve` | `servir` |
| in | `in`, `with`, `on` | `en`, `con` |
| until | `until` | `hasta` |
| attended / unattended | `attended` / `unattended` | `atendido` / `desatendido` |
| keeps | `keeps` | `aguanta` |
| use (packs) | `use` | `usa`, `usar` |
| no wait | `no wait`, `immediately` | `sin espera`, `inmediato` |
| at (additions) | `at`, `after` | `a los`, `al`, `a las` |
| plan: asap | `asap`, `as_soon_as_possible` | `lo_antes_posible` |
| plan: alap | `just_in_time`, `jit`, `alap` | `justo_a_tiempo` |

**Recipe language**: the one declared with `language en|es` or, otherwise, the one used by most of its keywords and verbs. It decides how units and chart labels are shown. Mixing languages is valid.

### 3.3 Grammar (EBNF)

```ebnf
recipe        = { line } ;
line          = ( header | section | section_entry | step | addition
                | block | end | serve ) , [ comment ] , NL
              | [ comment ] , NL ;

header        = RECIPE , string
              | DESCRIPTION , string
              | CUISINE , string                                (* metadata, no effect on scheduling *)
              | LANGUAGE , ( "en" | "es" )
              | SERVINGS , number
              | COOKS , ( integer | "unlimited" | "ilimitados" )
              | BURNERS , integer
              | PLAN , ( ASAP | ALAP )
              | USE , string ;                                  (* vocabulary pack, §9.2 *)

section       = INGREDIENTS | TOOLS , [ tool_list ] ;
section_entry = ingredient | tool_list ;              (* depending on the open section *)
ingredient    = ident , [ quantity , [ unit ] ] , [ TO_TASTE | AS_NEEDED ] , [ string ] , [ gender ] ;
tool_list     = tool , { "," , tool } ;
tool          = ident , [ gender ] , [ ( "x" | "×" ) , integer ] ;

step          = ident , [ string ] , [ gender ] , "=" , ( verb | "x-" , ident ) , "(" , [ inputs ] , ")" , { modifier } ;
inputs        = input , { "," , input } ;
input         = ident , [ "[" , ( fraction | percent ) , "]" ] ;
modifier      = IN , ident , { "," , ident }                    (* tools *)
              | "@" , number , [ "º" | "°" ] , ( "C" | "F" )    (* temperature *)
              | "@" , [ "x-" ] , ident , [ ":" , value ]       (* parameter; @kind:… sets the kind *)
              | duration
              | UNTIL , string                                  (* end condition *)
              | ATTENDED | UNATTENDED
              | KEEPS , duration                                (* wait tolerance *)
              | NO_WAIT ;

addition      = "+" , input , { "," , input } , AT , duration ;
block         = BLOCK , string ;
end           = END ;
serve         = SERVE , ident , [ string ] ;

duration      = [ "~" ] , number , [ "-" , number ] , time_unit ;
time_unit     = "h" , [ integer , [ "min" ] ] | "min" | "m" | "s" | "sec" | "seg" ;
quantity      = number | fraction | number , "-" , number ;        (* 3-4 tbsp *)
fraction      = integer , "/" , integer ;
percent       = number , "%" ;
string        = '"' , { char - '"' } , '"' ;
gender        = "(" , ( "m" | "f" ) , [ "pl" ] , ")" ;          (* §6.1 *)
```

UPPERCASE words are the keywords of §3.2, in any of their forms.

### 3.4 Units

Each unit has a canonical form and is displayed in the recipe's language, in plural when the quantity is a number other than 1 (`2 cloves`, `1/2 cup`):

| Canonical | Shown (en / es) | Accepts |
|---|---|---|
| `g` `kg` `mg` `oz` `lb` | same | gram(s), gramo(s), gr, kilo(s), ounce(s), onza(s), pound(s), libra(s) |
| `ml` `cl` `dl` `l` | same | milliliter(s), mililitro(s), lt, liter(s), litre(s), litro(s) |
| `unit` | pc / ud | unit(s), pc(s), piece(s), un, unidad(es), pieza(s) |
| `tbsp` / `tsp` | tbsp / cda · tsp / cdta | tablespoon(s), tbsps, cucharada(s), cdas, cd · teaspoon(s), tsps, cucharadita(s), cdtas, ct |
| `cup` `glass` `pinch` `splash` `handful` `bunch` `clove` `leaf` `sprig` `stalk` `can` `sachet` `slice` `rasher` | cup / taza, glass / vaso, pinch / pizca, splash / chorrito, handful / puñado, bunch / manojo, clove / diente, slice / rebanada, slice / loncha… | singular and plural in both languages |
| *special* | to taste / al gusto · as needed / c.s. | |

---

## 4. Semantics

### 4.1 Name resolution

Each identifier in a step's inputs resolves as: 1) a declared **ingredient**; 2) the **result** of another step (dependency); 3) a declared **tool** (if a step has only tools as inputs, its result is the tool in another state). In `in X`, `X` can be a tool or a tool state. Unresolved names are errors.

### 4.2 Duration

| Form | Meaning | Used for scheduling |
|---|---|---|
| `10min`, `1h30`, `90s` | fixed | the value |
| `8-10min` | range | the maximum |
| `~10min` | approximate | the value |
| `until "it thickens"` | end condition | the estimated duration that comes with it |

### 4.3 Attention

Each verb has a default mode (§5); `attended` / `unattended` overrides it. Attended = the cook is busy for the whole step.

### 4.4 Additions halfway through

`+ x at t` in step `p`: if `x` is a result, `p.start ≥ x.end − t`.

### 4.5 Wait tolerance (optional)

By default an intermediate can wait as long as needed. The author can limit it:

- `keeps D`: at most `D` between the end of the step and its use.
- `no wait`: same as `keeps 0`; used as soon as it is ready.

Constraint: `consumer.start + at − producer.end ≤ D`. The scheduler delays the producer to satisfy it when resources allow; when it can't, it **does not change the recipe**: it reports a violation (a warning in the editor, the waiting band in red on the chart). Letting the author decide is principle 1.

### 4.6 Scheduling

Resources (only if declared): `cooks N` (taken by attended steps), `burners N` (stovetop steps) and every declared tool with its capacity (`oven x2`; 1 by default).

1. **Plan** with a serial schedule generation scheme (*serial SGS*), prioritized by remaining path. Since SGS is a heuristic, a few priority variants are tried (e.g. placing steps that can't wait closest to their consumer) and the plan with the least excess waiting (§4.5) and then the shortest total is kept:
   - *as soon as possible*: forward from the start;
   - *just in time*: backward from the dish, in reversed time.
2. **Repair** of wait tolerances (§4.5).
3. **Analysis**: the order in which each resource serves the steps of the plan is fixed and, on that augmented graph, earliest and latest starts, slack (window `[earliest, latest]`) and critical path are computed. Moving a step within its window never creates new overlaps (Helly property of intervals).

Without limited resources or tolerances, this is exactly the critical path method (CPM).

**Default mode**: the one declared with `schedule` (otherwise *as soon as possible*). A viewer may offer the other mode, but an embedded chart always uses the declared one unless the page says otherwise.

---

## 5. Controlled verb vocabulary

Each verb has a **canonical id** (in English, stable across languages), a **kind** that sets its color, and a default **attention** mode. Verbs outside the vocabulary are accepted with a warning. The displayed name is the one the author wrote; in the method view it is in the imperative (§6.1).

| Canonical id | Kind | Attention | English | Español |
|---|---|---|---|---|
| `chop` | Prep | attended | chop, mince | picar |
| `cut` | Prep | attended | cut, dice, cube | cortar, trocear |
| `slice` | Prep | attended | slice, fillet | laminar, filetear |
| `grate` | Prep | attended | grate | rallar |
| `peel` | Prep | attended | peel | pelar |
| `beat` | Prep | attended | beat, whisk, whip | batir |
| `blend` | Prep | attended | blend, purée, puree | triturar |
| `mash` | Prep | attended | mash, crush | majar, aplastar |
| `knead` | Prep | attended | knead | amasar |
| `sift` | Prep | attended | sift | tamizar |
| `drain` | Prep | attended | drain, strain | escurrir, colar |
| `wash` | Prep | attended | wash, rinse | lavar |
| `weigh` | Prep | attended | weigh, measure | pesar |
| `squeeze` | Prep | attended | squeeze, juice | exprimir |
| `crumble` | Prep | attended | crumble, shred | desmigar |
| `debone` | Prep | attended | debone, pit | deshuesar |
| `dry` | Prep | attended | dry, pat_dry | secar |
| `stir` | Prep | attended | stir | remover |
| `divide` | Prep | attended | divide, portion | dividir, porcionar |
| `mix` | Assembly | attended | mix, combine | mezclar, combinar |
| `add` | Assembly | attended | add, fold, incorporate | añadir, incorporar |
| `assemble` | Assembly | attended | assemble, layer | montar |
| `plate` | Assembly | attended | plate | emplatar, servir |
| `fill` | Assembly | attended | fill, stuff | rellenar |
| `shape` | Assembly | attended | shape, form | formar, bolear |
| `wrap` | Assembly | attended | wrap | envolver |
| `coat` | Assembly | attended | coat, bread, dredge | rebozar, empanar |
| `glaze` | Assembly | attended | glaze, nap | napar |
| `roll` | Assembly | attended | roll | estirar |
| `garnish` | Assembly | attended | garnish, decorate | decorar |
| `finish` | Assembly | attended | finish | mantecar |
| `bind` | Assembly | attended | bind, thicken | ligar |
| `emulsify` | Assembly | attended | emulsify | emulsionar |
| `season` | Assembly | attended | season | sazonar, salpimentar, salar |
| `dissolve` | Assembly | attended | dissolve, dilute | disolver, diluir |
| `pour` | Assembly | attended | pour | verter |
| `sprinkle` | Assembly | attended | sprinkle, dust | espolvorear |
| `brush` | Assembly | attended | brush | pincelar, pintar |
| `arrange` | Assembly | attended | arrange, place | colocar, disponer |
| `saute` | Stovetop | attended | sauté, saute, stir_fry | saltear |
| `sweat` | Stovetop | attended | sweat, soften | pochar, rehogar, sofreír |
| `brown` | Stovetop | attended | brown, sear | dorar, marcar |
| `fry` | Stovetop | attended | fry, deep_fry | freír |
| `toast` | Stovetop | attended | toast | tostar, nacarar |
| `caramelize` | Stovetop | attended | caramelize, caramelise | caramelizar |
| `melt` | Stovetop | attended | melt | fundir, derretir |
| `cook` | Stovetop | attended | cook | cocinar |
| `flambe` | Stovetop | attended | flambé, flambe | flambear |
| `heat` | Stovetop | attended | heat, warm | calentar |
| `blanch` | Stovetop | attended | blanch, scald | escaldar, blanquear |
| `grill` | Stovetop | attended | grill, griddle | asar_a_la_plancha, asar_a_la_parrilla, planchear |
| `boil` | Stovetop | unattended | boil | cocer, hervir |
| `simmer` | Stovetop | unattended | simmer, stew | guisar, estofar |
| `reduce` | Stovetop | unattended | reduce | reducir |
| `confit` | Stovetop | unattended | confit | confitar |
| `poach` | Stovetop | unattended | poach | escalfar |
| `braise` | Stovetop | unattended | braise | brasear |
| `steam` | Stovetop | unattended | steam | cocer_al_vapor |
| `bake` | Oven | unattended | bake | hornear |
| `gratin` | Oven | unattended | gratin, gratinate, broil | gratinar |
| `roast` | Oven | unattended | roast | asar |
| `preheat` | Oven | unattended | preheat | precalentar |
| `rest` | Rest | unattended | rest | reposar |
| `proof` | Rest | unattended | proof, prove, rise, ferment | levar, fermentar |
| `cool` | Rest | unattended | cool | enfriar, templar |
| `chill` | Rest | unattended | chill, refrigerate | refrigerar |
| `freeze` | Rest | unattended | freeze | congelar |
| `marinate` | Rest | unattended | marinate, macerate | marinar, macerar |
| `soak` | Rest | unattended | soak, hydrate | hidratar, remojar |
| `thaw` | Rest | unattended | thaw, defrost | descongelar |
| `infuse` | Rest | unattended | infuse, steep | infusionar |

**Recommended parameters** (any is accepted): stovetop `@heat:low|medium|high` / `@fuego:bajo|medio|alto`, `@covered` / `@tapado`; oven `@180ºC`, `@mode:fan|grill`; prep `@intensity:…`, `@speed:N`; rest `@4ºC`.

---

## 6. Visual notation: the Cooking Chart

| Element | Encoding |
|---|---|
| Time | Linear, proportional X axis |
| Process | Bar from start to end. Color = verb kind. **Hatched** = unattended. Bottom white line = critical path. |
| Ingredient | Green dot with name and quantity, above the process that consumes it, at the minute it goes in |
| Intermediate | Band leaving the process; name in italics (`→ Soffritto`) |
| Amount of matter | Band thickness ∝ √(accumulated ingredients) |
| Dependency within a lane | The band continues |
| Dependency across lanes | A tributary flowing into the top or bottom of the consuming bar, at minute `at` |
| Waiting | Dashed, faded band; **in red** the part that exceeds what it keeps |
| Dish | Gold circle with the total time |
| Resources | One strip per resource below the chart ("Hands" always; "Burners" if declared). Height = occupancy; red = overload |
| Language | Chart labels use the recipe's language |

**Lanes.** Going back from the dish, the lane follows the tributary that arrives last. The rest form sub-blocks alternating above and below, earlier ones closer. Each subtree takes a contiguous block of lanes, so **there are no crossings by construction**.

**Visual signature.** The same chart without text and on a common scale, to compare recipes.

### 6.1 Text views (informative)

The same scheduled recipe also reads as text. Together with the chart they form a triad:

| View | What for | Content |
|---|---|---|
| **Chart** | Seeing time and parallelism | §6 |
| **Work plan** | Getting organized | One row per step, by start time: start and end minutes, kind, duration, attention, tools, parameters, condition, tolerance, inputs → output and slack (or "critical", or the wait beyond what it keeps) |
| **Method** | Cooking while reading | Ingredients with quantities, equipment and sentences in the order you cook, with links |

All three come from the same model and the same schedule: if the scheduling changes (`schedule just_in_time` or the switch), all three change. Nobody writes them by hand.

**Method.**

- **Moments.** Steps are grouped by their start minute. Each moment starts with that minute (`0′`, `5′`…) and the last one gives the total time and the dish.
- **One sentence per step**: imperative verb, inputs, place, temperature, heat, duration, condition and other parameters, "(hands-off)" if unattended, `→ result` and its tolerance. For example: *Sweat the chopped vegetables in the pan over low heat for 10 min → soffritto.*
- **Verb.** The imperative of the form the author wrote; if it was written in another language, the main form in the recipe's language. Resting verbs (`rest`, `proof`, `cool`, `marinate`, `soak`, `infuse`, `thaw`) read *let … rest*. `add` with several inputs reads *add X to Y*, where Y is the first input.
- **Inputs.** Ingredients with their quantity (*120 g sugar*, *½ tsp almond extract*), proportional when only a part is used; intermediates with an article (*the beaten eggs*); parts of an intermediate in words (*half of the chopped onion*). What goes in halfway through a step gets its own sentence: *After 5 min, add 100 ml red wine.*
- **Place.** Tools with the preposition the author wrote (`in`, `with`, `on`). If a tool is in another state (`hot_oven`), the state is named: *bake … in the hot oven*.
- **Connectors.** *Meanwhile* when switching tasks while another step is still running; *At the same time* for the following steps in the same moment.
- **Links.** Each intermediate mentioned links to the sentence that produces it; each `→ result`, to the sentence that uses it; each ingredient, to the list. Hovering a sentence highlights its step in the chart, and the other way round.

**Articles in Spanish.** Writing *el* horno or *las* tortillas needs grammatical gender and number. Authors may declare them after the name (§3.1):

```
herramientas
  sartén (f), wok
masa "Masa de bizcocho" (f) = añadir(mezcla, harina) 5min
```

When they don't, they are inferred from the first noun with a cooking lexicon and the usual endings; when unsure, the sentence goes without an article. English doesn't need them.

**Search engines.** An implementation may publish the recipe as [schema.org/Recipe](https://schema.org/Recipe): `recipeIngredient` is the ingredient list; `recipeInstructions`, one `HowToStep` per sentence; `totalTime`, the schedule's total time; `prepTime`, the hands-on time; plus `tool`, `recipeCuisine` and `recipeYield`.

The exact wording is not normative. Another implementation may phrase the sentences its own way, as long as they come from the same schedule and keep the order, quantities and times.

---

## 7. Validation

Every diagnostic has a stable **code** (`undefinedName`, `cycle`, `unknownVerb`…), which is normative, and a message in the interface language.

| Severity | Cases |
|---|---|
| **Error** | undefined name · result produced twice · result named like an ingredient · circular dependency · missing duration · unrecognized syntax · unknown language or schedule · recipe without steps |
| **Warning** | unknown pack · unknown kind in `@kind` · unused ingredient · intermediate neither used nor served · verb outside the vocabulary · undeclared tool · unknown unit · fractions not adding up · condition without duration · addition after the step ends · missing `serve` · `keeps` on the final dish |
| **Plan warning** | an intermediate waits longer than it keeps (§4.5) |

---

## 8. Distribution and embedding

A single file, `cooking-chart.js` (built with `python tools/build_embed.py`), contains the parser, the scheduler, the renderer and its styles. When the page doesn't have d3, it loads it from the same site that serves `cooking-chart.js`, with an integrity check (SRI). It exposes the `<cooking-chart>` element (Shadow DOM: host page styles don't leak in) and `window.CookingChart`.

```html
<script src="https://HOST/static/embed/cooking-chart.js" defer></script>

<!-- 1. Inline recipe -->
<cooking-chart controls>
  recipe "French omelette"
  ...
</cooking-chart>

<!-- 2. From a file -->
<cooking-chart src="/recipes/lasagna.ccl" mode="jit"></cooking-chart>

<!-- 3. Markdown: any ```ccl code block is upgraded automatically -->
```

| Attribute | Values |
|---|---|
| `src` | URL of a `.ccl` file |
| `mode` | `asap` \| `jit` (default: the recipe's `schedule`) |
| `lang` | `en` \| `es` (default: the recipe's language) |
| `controls` | shows the schedule switch |
| `variant` | `signature`: thumbnail without text |
| `view` | `chart` (default), `method`, `plan` (work plan); several separated by spaces, in tab order, or `all` |
| `schema` | publishes the recipe as `schema.org/Recipe` JSON-LD next to the element (§6.1) |

`window.CookingChart` offers `parse`, `prepare`, `method` (the method as data) and `schema` (the JSON-LD) for building your own view.

For platforms without scripts: `<iframe src="https://HOST/e#ccl=…">` (the recipe travels in the URL *hash* and never reaches the server), or export the SVG from the editor.

---

## 9. Extensions and conformance

The standard grows in three ways, from most private to most official.

### 9.1 Private extensions: the `x-` prefix

Anyone can use their own parameters and verbs with the `x-` prefix, without warnings and without clashing with future versions of the standard:

```ccl
ganache = melt(chocolate) @x-thermometer:31ºC 15min
filling = x-shake(ganache) @kind:assembly 2min
```

An `x-` verb (or any verb outside the vocabulary) can be classified with `@kind:` / `@tipo:` (`prep`, `assembly`, `stovetop`, `oven`, `rest`), so the author decides instead of the system guessing.

### 9.2 Vocabulary packs

A **pack** extends the vocabulary for a domain: pastry, Asian cooking, a specific kitchen robot… A recipe enables it with `use "pastry"` / `usa "pastelería"`.

- Pack verbs have prefixed ids (`pastry:temper`) and forms in each language.
- Within a recipe that uses it, the pack **takes precedence** over the base vocabulary: in pastry, `laminar` means laminating dough (`pastry:laminate`), not slicing.
- An unknown pack is a warning, not an error: the recipe stays readable.

A third party publishes a pack by registering it with the reference implementation:

```js
CookingLang.registerPack({
    id: 'pastry', version: '0.1',
    names: { es: 'pastelería', en: 'pastry' },
    verbs: [
        // [id, kind, attention, Spanish forms, English forms]
        ['temper', 'heat', 'active', 'atemperar', 'temper'],
        ['laminate', 'prep', 'active', 'laminar hojaldrar', 'laminate']
    ]
});
```

[cooking-packs.js](app/static/js/cooking-packs.js) ships the `pastry` pack as an example.

### 9.3 Proposals to the specification

Changes to the core (keywords, base vocabulary, semantics, notation) are proposed as **CEPs** (*CCL Enhancement Proposals*), numbered and discussed in public. An accepted CEP goes into the next minor version of the specification. A widely used pack can be promoted to the base vocabulary through a CEP.

### 9.4 Conformance

An implementation **conforms** to CCL v0.2 if, for every case in [conformance/cases/](conformance/cases/), it produces the same **normalized model** as the expected `.json`: language, schedule, resources, ingredients with the displayed canonical unit, steps (canonical verb, kind, attention, durations, wait tolerance, tools, inputs with `at` and fraction, output), grammatical gender when declared, final dish and diagnostics (severity, line and **code**).

- Scheduling is **normative** when there are no limited resources (CPM: the result is unique). With resources, the reference result is **informative**: another implementation may use another heuristic as long as its plan is feasible and honors wait tolerances.
- Diagnostic **messages** are not normative; their **codes** are.

```bash
node conformance/run.js          # check
node conformance/run.js --update # regenerate expectations after an approved change
```

### 9.5 Licenses

Specification and conformance cases: **CC BY 4.0** ([LICENSE-SPEC](LICENSE-SPEC)). Reference implementation: **Apache 2.0** ([LICENSE](LICENSE)). The names "Cooking Chart" and "CCL": [trademark policy](TRADEMARKS.md).

---

## 10. Open decisions (v0.3)

- **Burner exceptions** (microwave, Thermomix): mark it on the tool or on the step.
- **Tool occupancy while waiting**: an intermediate waiting in the saucepan still occupies it.
- **Partial attention**: "stir occasionally" (`attended:20%`).
- **Scaling servings**: proportional quantities; durations that don't scale or scale by steps.
- **More languages**: Italian and French on top of the same canonical ids.
- **Multiple outputs**: `yolks, whites = separate(eggs)`.
- **Named resources** for professional kitchens: stations, roles, assigning steps to people.

## 11. Related work

- **Cooklang**: recipe markup over prose (`@ingredient{qty}`, `#tool`, `~{time}`). It is linear: no intermediates, dependencies, parallelism or resources.
- **Recipe flow graphs** (Mori et al., LREC 2014): a corpus of recipes annotated as flow graphs. Validates the graph idea, but proposes neither a language nor a notation.
- **schema.org/Recipe**: metadata; instructions are free text.
- **Mermaid / PlantUML**: the distribution model (text → embeddable diagram).
- **Gantt, Sankey, BPMN, Petri nets, RCPSP/max**: time axis and lanes; flow thickness; model/notation split; semantics; scheduling with resources and maximal lags.

What this work contributes: **model, bilingual language and notation form a single standard**, the drawing is obtained without manual intervention, and it embeds in any website.
