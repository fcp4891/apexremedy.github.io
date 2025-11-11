const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Reemplazando CSS completo del canvas...');

// Reemplazar todo el bloque CSS del canvas
const oldBlock = `.poder-cultivo-sig-wrap canvas {
    width: 100%;
    height: 220px;
    border-radius: var(--border-radius);
    background: var(--white);
    border: 2px solid var(--light-gray);
    cursor: crosshair;
    transition: var(--transition);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
}`;

const newBlock = `.poder-cultivo-sig-wrap canvas {
    width: 100% !important;
    height: 220px !important;
    min-height: 220px !important;
    border-radius: var(--border-radius);
    background: var(--white) !important;
    border: 2px solid var(--light-gray);
    cursor: crosshair !important;
    transition: var(--transition);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
    pointer-events: auto !important;
    touch-action: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -ms-user-select: none !important;
    max-width: 100%;
    display: block;
}`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    console.log('✅ CSS del canvas reemplazado completamente');
} else {
    // Intentar con espacios diferentes
    const oldBlock2 = oldBlock.replace(/    /g, ' ');
    const newBlock2 = newBlock.replace(/    /g, ' ');
    if (content.includes(oldBlock2)) {
        content = content.replace(oldBlock2, newBlock2);
        console.log('✅ CSS reemplazado con formato diferente');
    } else {
        // Último intento: buscar línea por línea
        content = content.replace(
            /\.poder-cultivo-sig-wrap canvas \{/,
            `.poder-cultivo-sig-wrap canvas {
    width: 100% !important;
    height: 220px !important;
    min-height: 220px !important;
    border-radius: var(--border-radius);
    background: var(--white) !important;
    border: 2px solid var(--light-gray);
    cursor: crosshair !important;
    transition: var(--transition);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
    pointer-events: auto !important;
    touch-action: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -ms-user-select: none !important;
    max-width: 100%;
    display: block;`
        );
        // Eliminar las líneas viejas
        content = content.replace(/    width: 100%;\n    height: 220px;\n    border-radius: var\(--border-radius\);\n    background: var\(--white\);\n    border: 2px solid var\(--light-gray\);\n    cursor: crosshair;\n    transition: var\(--transition\);\n    box-shadow: inset 0 2px 4px rgba\(0, 0, 0, 0\.05\);\n    position: relative;\n    z-index: 1;\n\}/g, '');
        console.log('✅ CSS reemplazado con método alternativo');
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







