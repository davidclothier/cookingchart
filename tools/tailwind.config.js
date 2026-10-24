// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 David Clothier
// Tailwind compilado: npm run build:css (tras cambiar clases en plantillas o JS)
module.exports = {
    content: [
        'app/templates/**/*.html',
        'app/static/js/**/*.js',
        'app/*.py',
    ],
    theme: { extend: {
        // Estilo "recetario": la paleta neutra pasa a papel y tinta, y el blanco a papel claro
        colors: {
            white: '#fbf8f2',
            stone: { 50: '#f4eee3', 100: '#ece4d6', 200: '#ddd2bf', 300: '#c9bba3', 400: '#a8997f', 500: '#857760',
                     600: '#5c5246', 700: '#463e34', 800: '#2e2820', 900: '#221c15', 950: '#140f0a' }
        },
        // Esquinas casi rectas, como un libro; las píldoras siguen siendo redondas
        borderRadius: { md: '2px', lg: '3px', xl: '4px', '2xl': '6px' },
        fontFamily: {
            sans: ['Newsreader', 'Georgia', 'serif'],
            display: ['Fraunces', 'Georgia', 'serif'],
            mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
        }
    } },
    plugins: [require('@tailwindcss/typography')],
};
