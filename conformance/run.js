#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Cooking Chart — batería de conformidad
//
//   node conformance/run.js            comprueba la implementación de referencia
//   node conformance/run.js --update   regenera los .json esperados
//   node conformance/run.js 012        solo los casos que contienen "012"
//
// Cada caso es un par cases/NNN-nombre.ccl + cases/NNN-nombre.json. El JSON
// describe el modelo normalizado en un formato neutral (sin detalles de
// JavaScript) para que cualquier otra implementación pueda compararse.
// Ver conformance/README.md.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CASES = path.join(__dirname, 'cases');

globalThis.window = globalThis;
require(path.join(ROOT, 'app/static/js/cooking-lang.js'));
require(path.join(ROOT, 'app/static/js/cooking-packs.js'));
require(path.join(ROOT, 'app/static/js/recipe-model.js'));
const { CookingLang, RecipeModel } = globalThis;

const round = v => (v == null ? v : Math.round(v * 1000) / 1000);

// Modelo normalizado: lo que el estándar fija para una receta
function normalize(source) {
    const { recipe, diagnostics, ok } = CookingLang.parse(source, { locale: 'en' });
    const out = {
        lang: recipe.lang,
        cuisine: recipe.cuisine,
        plan: recipe.plan,
        cooks: recipe.cooks,
        burners: recipe.burners,
        packs: recipe.packs,
        ingredients: recipe.ingredients.map(i => ({ id: i.id, quantity: i.quantity, unit: i.unit || null, ...(i.gram ? { gram: i.gram } : {}) })),
        ...(recipe.tools.some(t => t.gram) ? { toolGram: Object.fromEntries(recipe.tools.filter(t => t.gram).map(t => [t.id, t.gram])) } : {}),
        steps: recipe.steps.map(s => ({
            id: s.id,
            verb: s.verbId,
            kind: s.kind || null,
            attention: s.attention || null,
            duration: round(s.duration),
            durationMin: round(s.durationMin),
            keep: s.keep == null ? null : round(s.keep),
            tools: s.tools,
            inputs: s.uses.map(u => ({ ref: u.ref, at: round(u.at || 0), fraction: u.fraction ? round(u.fraction) : null })),
            output: s.makes,
            ...(s.makesGram ? { gram: s.makesGram } : {})
        })),
        final: recipe.finalStep,
        diagnostics: diagnostics.map(d => ({ severity: d.severity, line: d.line, code: d.code }))
    };
    if (ok) {
        // Sin recursos limitados la planificación es CPM y su resultado es normativo.
        // Con recursos, el SGS es una heurística: el resultado es el de referencia.
        out.schedule = {
            normative: !recipe.cooks && !recipe.burners && !recipe.tools.some(t => t.capacity)
        };
        ['asap', 'alap'].forEach(mode => {
            const r = RecipeModel.prepare(recipe, mode);
            out.schedule[mode] = {
                total: round(r.total),
                starts: Object.fromEntries(r.order.map(s => [s.id, round(s.start)])),
                critical: r.order.filter(s => s.critical).map(s => s.id),
                violations: r.violations.map(v => ({ step: v.step, consumer: v.consumer, wait: round(v.wait), keep: round(v.keep) }))
            };
        });
    }
    return out;
}

function diff(a, b, at = '') {
    if (JSON.stringify(a) === JSON.stringify(b)) return [];
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        return [...keys].flatMap(k => diff(a[k], b[k], `${at}.${k}`));
    }
    return [`${at || '.'}: esperado ${JSON.stringify(a)}, obtenido ${JSON.stringify(b)}`];
}

const update = process.argv.includes('--update');
const filter = process.argv.slice(2).find(a => !a.startsWith('--'));
const files = fs.readdirSync(CASES).filter(f => f.endsWith('.ccl') && (!filter || f.includes(filter))).sort();

let failed = 0;
files.forEach(f => {
    const expectedPath = path.join(CASES, f.replace(/\.ccl$/, '.json'));
    const actual = normalize(fs.readFileSync(path.join(CASES, f), 'utf8'));
    if (update || !fs.existsSync(expectedPath)) {
        fs.writeFileSync(expectedPath, JSON.stringify(actual, null, 2) + '\n');
        console.log(`  escrito  ${f}`);
        return;
    }
    const problems = diff(JSON.parse(fs.readFileSync(expectedPath, 'utf8')), actual);
    if (problems.length) {
        failed++;
        console.log(`✕ ${f}`);
        problems.slice(0, 10).forEach(p => console.log(`    ${p}`));
    } else {
        console.log(`✓ ${f}`);
    }
});

if (!update) {
    console.log(`\n${files.length - failed}/${files.length} casos correctos`);
    process.exitCode = failed ? 1 : 0;
}
