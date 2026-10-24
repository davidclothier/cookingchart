// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — paquetes de vocabulario incluidos
//
// Un paquete es una extensión del vocabulario base que una receta activa con
// `usa "pastelería"` / `use "pastry"`. Este fichero es también el ejemplo de
// cómo publicar un paquete propio: basta con llamar a CookingLang.registerPack
// después de cargar cooking-lang.js. Ver SPEC.md §9.

(function (global) {
    'use strict';

    const { registerPack } = global.CookingLang;

    // [id, tipo, atención por defecto, formas en español, formas en inglés]
    registerPack({
        id: 'pastry',
        version: '0.1',
        names: { es: 'pastelería', en: 'pastry' },
        verbs: [
            ['temper', 'heat', 'active', 'atemperar', 'temper'],
            ['laminate', 'prep', 'active', 'laminar hojaldrar', 'laminate'],
            ['pipe', 'assemble', 'active', 'escudillar mangar', 'pipe'],
            ['cream', 'prep', 'active', 'cremar blanquear_mantequilla', 'cream'],
            ['blind_bake', 'oven', 'passive', 'hornear_en_blanco', 'blind_bake'],
            ['set', 'rest', 'passive', 'cuajar gelificar', 'set'],
            ['glaze', 'assemble', 'active', 'glasear abrillantar', 'glaze'],
            ['dock', 'prep', 'active', 'pinchar', 'dock'],
            ['bloom', 'rest', 'passive', 'hidratar_gelatina', 'bloom']
        ]
    });
})(typeof window !== 'undefined' ? window : globalThis);
