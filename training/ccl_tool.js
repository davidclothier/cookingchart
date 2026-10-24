#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — utilidades del parser de referencia para el entrenamiento
//
//   node training/ccl_tool.js verbs            vocabulario de verbos (JSON)
//   node training/ccl_tool.js check < in.jsonl valida cada {id, text, ccl} (JSONL)
//
// `check` devuelve, por línea, si el CCL es aceptable como ejemplo de
// entrenamiento y por qué: errores, avisos que delatan un CCL incompleto,
// cobertura de ingredientes respecto al texto y si se puede planificar.

'use strict';

const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
globalThis.window = globalThis;
require(path.join(ROOT, 'app/static/js/cooking-lang.js'));
require(path.join(ROOT, 'app/static/js/cooking-packs.js'));
require(path.join(ROOT, 'app/static/js/recipe-model.js'));
const { CookingLang, RecipeModel } = globalThis;

// Avisos que indican un CCL mal construido (no solo poco detallado)
const REJECT_WARNINGS = new Set([
    'unusedIngredient', 'unusedResult', 'missingServe', 'partsOver', 'partsUnder',
    'mixedParts', 'unknownVerb', 'unknownUnit', 'addLate', 'noDurationCond', 'keepOnFinal'
]);

const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'en', 'y', 'con', 'of', 'the', 'and', 'with', 'for', 'to', 'a']);

// ¿Aparece el ingrediente en el texto? Basta con una palabra significativa
// de su nombre (o su raíz, para plurales y variantes: tomate/tomates)
function mentioned(name, text) {
    const words = fold(name).split(/[^a-z0-9ñ]+/).filter(w => w.length > 2 && !STOP.has(w));
    if (!words.length) return true;
    return words.some(w => text.includes(w.slice(0, Math.max(4, w.length - 2))));
}

function check(item) {
    const out = { id: item.id, ok: false, reasons: [] };
    const { recipe, diagnostics, ok } = CookingLang.parse(item.ccl || '', { locale: 'en' });
    const errors = diagnostics.filter(d => d.severity === 'error');
    const bad = diagnostics.filter(d => d.severity === 'warning' && REJECT_WARNINGS.has(d.code));
    out.errors = errors.map(d => `L${d.line} ${d.code}`);
    out.warnings = diagnostics.filter(d => d.severity === 'warning').map(d => `L${d.line} ${d.code}`);
    // Mensajes para devolver al modelo: errores y avisos que hacen descartar el ejemplo
    out.messages = [...errors, ...bad].map(d => `line ${d.line}: ${d.message}`);
    if (!ok) out.reasons.push('errors');
    if (bad.length) out.reasons.push('warnings:' + [...new Set(bad.map(d => d.code))].join(','));
    if (ok) {
        try {
            const r = RecipeModel.prepare(recipe, recipe.plan || 'asap');
            out.total = Math.round(r.total);
            out.steps = r.steps.length;
            out.lanes = r.lanes.length;
            if (!(r.total > 0)) out.reasons.push('total0');
        } catch (e) {
            out.reasons.push('schedule');
        }
        if (item.text) {
            const text = fold(item.text);
            const ings = recipe.ingredients;
            const found = ings.filter(i => mentioned(i.name, text) || mentioned(i.id.replace(/_/g, ' '), text));
            out.coverage = ings.length ? Math.round(100 * found.length / ings.length) / 100 : 0;
            out.missing = ings.filter(i => !found.includes(i)).map(i => i.name);
            if (out.coverage < 0.8) {
                out.reasons.push('coverage');
                out.messages.push(`ingredients in the text that are missing or renamed: ${out.missing.join(', ')}`);
            }
        }
        if (item.lang && recipe.lang !== item.lang) out.reasons.push('language');
        // Verbos escritos en el idioma de la receta (no "sazonar" en una receta inglesa)
        const lang = item.lang || recipe.lang;
        const foreign = recipe.steps.filter(s => s.verbId && !s.verbId.includes(':') &&
            !CookingLang.VERBS[s.verbId].names[lang].includes(s.verb));
        if (foreign.length) {
            out.reasons.push('verbLanguage');
            out.messages.push(`use ${lang === 'es' ? 'Spanish' : 'English'} verbs only; replace: ${foreign.map(s => s.verb).join(', ')}`);
        }
        // Un añadido "+ x" que ya es entrada del mismo paso, o que es el propio paso
        const selfAdd = recipe.steps.filter(s => s.uses.some((u, i) => u.ref === s.id || s.uses.findIndex(v => v.ref === u.ref) !== i));
        if (selfAdd.length) {
            out.reasons.push('duplicateInput');
            out.messages.push(`steps that use the same input twice: ${selfAdd.map(s => s.id).join(', ')}`);
        }
        if (recipe.steps.length < 2) out.reasons.push('tooShort');
    }
    out.ok = out.reasons.length === 0;
    return out;
}

async function main() {
    const cmd = process.argv[2];
    if (cmd === 'verbs') {
        const verbs = Object.entries(CookingLang.VERBS).map(([id, v]) => ({ id, kind: v.kind, attention: v.attention, es: v.names.es, en: v.names.en }));
        process.stdout.write(JSON.stringify(verbs));
        return;
    }
    if (cmd === 'check') {
        const rl = readline.createInterface({ input: process.stdin });
        for await (const line of rl) {
            if (!line.trim()) continue;
            process.stdout.write(JSON.stringify(check(JSON.parse(line))) + '\n');
        }
        return;
    }
    console.error('uso: ccl_tool.js verbs | check < entrada.jsonl');
    process.exit(2);
}

main();
