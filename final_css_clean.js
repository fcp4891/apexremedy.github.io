const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Limpiando CSS duplicado completamente...');

// Encontrar el bloque completo del CSS del canvas y reemplazarlo
const pattern = /\.poder-cultivo-sig-wrap canvas \{[\s\S]*?\n\}/;

const cleanCss = `.poder-cultivo-sig-wrap canvas {
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

if (pattern.test(content)) {
    content = content.replace(pattern, cleanCss);
    console.log('✅ CSS del canvas limpiado y corregido');
} else {
    console.log('❌ No se encontró el patrón');
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







