const fs = require('fs');
const path = require('path');

const safelistPath = path.resolve(__dirname, 'frontend/src/styles/tailwind.safelist.json');

/** @type {string[]} */
let safelist = [];
if (fs.existsSync(safelistPath)) {
  try {
    const raw = fs.readFileSync(safelistPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      safelist = parsed;
    }
  } catch (error) {
    console.warn('[postcss] No se pudo leer tailwind.safelist.json:', error.message);
  }
}

const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './frontend/**/*.html',
    './frontend/**/*.js'
  ],
  defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:\/]+/g) || [],
  safelist: {
    standard: safelist
  }
});

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss,
          require('cssnano')({
            preset: 'default'
          })
        ]
      : [])
  ]
};

