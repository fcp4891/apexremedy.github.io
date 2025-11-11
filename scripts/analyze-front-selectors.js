#!/usr/bin/env node
/**
 * analyze-front-selectors.js
 *
 * Escanea los archivos CSS del frontend público (excluye admin/node_modules/dist)
 * y genera un reporte con el uso real de las clases en HTML/JS.
 *
 * Uso:
 *   node scripts/analyze-front-selectors.js --write
 *
 * Flags:
 *   --write   Guarda reporte en reports/selectors-YYYYMMDD.json (stdout por defecto).
 *   --verbose Muestra progreso detallado en consola.
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const projectRoot = path.resolve(__dirname, '..');
const frontendDir = path.join(projectRoot, 'frontend');
const reportsDir = path.join(projectRoot, 'reports');

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const isVerbose = args.includes('--verbose');

const EXCLUDED_SEGMENTS = ['admin', 'node_modules', 'dist']; // rutas a ignorar
const CSS_EXT = '.css';
const HTML_EXT = '.html';
const JS_EXT = '.js';

function logVerbose(...messages) {
  if (isVerbose) {
    console.log('[analyze-front-selectors]', ...messages);
  }
}

function walkDir(dir, filterFn) {
  const items = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      const relativePath = path.relative(frontendDir, entryPath);

      if (EXCLUDED_SEGMENTS.some((segment) => relativePath.split(path.sep).includes(segment))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (filterFn(entryPath)) {
        items.push(entryPath);
      }
    }
  }

  walk(dir);
  return items;
}

function collectCssFiles() {
  return walkDir(frontendDir, (filePath) => filePath.endsWith(CSS_EXT));
}

function collectHtmlFiles() {
  return walkDir(frontendDir, (filePath) => filePath.endsWith(HTML_EXT));
}

function collectJsFiles() {
  return walkDir(frontendDir, (filePath) => filePath.endsWith(JS_EXT));
}

function extractClassNames(selector) {
  const classRegex = /\.([a-zA-Z0-9_-]+)/g;
  const classes = new Set();
  let match;

  while ((match = classRegex.exec(selector)) !== null) {
    classes.add(match[1]);
  }

  return Array.from(classes);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(content, target) {
  const regex = new RegExp(`\\b${escapeRegex(target)}\\b`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function analyzeSelectors(cssFiles, htmlFiles, jsFiles) {
  const classMap = new Map();

  for (const cssFile of cssFiles) {
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    let root;

    try {
      root = postcss.parse(cssContent, { from: cssFile });
    } catch (err) {
      console.warn(`[warn] No se pudo parsear CSS: ${cssFile}`, err.message);
      continue;
    }

    root.walkRules((rule) => {
      const selectors = rule.selector ? rule.selector.split(',') : [];

      selectors
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((selector) => {
          const classNames = extractClassNames(selector);

          classNames.forEach((className) => {
            if (!classMap.has(className)) {
              classMap.set(className, {
                className,
                selectors: new Set(),
                definedIn: new Set(),
                usageCount: 0,
              });
            }

            const entry = classMap.get(className);
            entry.selectors.add(selector);
            entry.definedIn.add(path.relative(projectRoot, cssFile));
          });
        });
    });
  }

  logVerbose(`Total clases detectadas en CSS: ${classMap.size}`);

  const contentFiles = [...htmlFiles, ...jsFiles];

  for (const filePath of contentFiles) {
    const content = fs.readFileSync(filePath, 'utf8');

    classMap.forEach((entry) => {
      const count = countOccurrences(content, entry.className);
      if (count > 0) {
        entry.usageCount += count;
      }
    });
  }

  const result = Array.from(classMap.values()).map((entry) => ({
    className: entry.className,
    selectors: Array.from(entry.selectors),
    definedIn: Array.from(entry.definedIn),
    usageCount: entry.usageCount,
    isUnused: entry.usageCount === 0,
  }));

  const unusedClasses = result.filter((item) => item.isUnused);

  return {
    generatedAt: new Date().toISOString(),
    analyzed: {
      cssFiles: cssFiles.map((file) => path.relative(projectRoot, file)),
      htmlFiles: htmlFiles.map((file) => path.relative(projectRoot, file)),
      jsFiles: jsFiles.map((file) => path.relative(projectRoot, file)),
    },
    totals: {
      classes: result.length,
      unusedClasses: unusedClasses.length,
    },
    unusedClasses,
    classes: result.sort((a, b) => a.className.localeCompare(b.className)),
    meta: {
      excludeSegments: EXCLUDED_SEGMENTS,
    },
  };
}

function writeReport(data) {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filePath = path.join(reportsDir, `selectors-${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Reporte guardado en ${path.relative(projectRoot, filePath)}`);
}

function main() {
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ Directorio frontend no encontrado');
    process.exit(1);
  }

  const cssFiles = collectCssFiles();
  const htmlFiles = collectHtmlFiles();
  const jsFiles = collectJsFiles();

  logVerbose(`CSS: ${cssFiles.length}, HTML: ${htmlFiles.length}, JS: ${jsFiles.length}`);

  const report = analyzeSelectors(cssFiles, htmlFiles, jsFiles);

  if (shouldWrite) {
    writeReport(report);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

main();


