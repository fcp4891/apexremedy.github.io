const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Actualizando CSS del canvas...');

const oldCss = `.poder-cultivo-sig-wrap canvas {
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

const newCss = `.poder-cultivo-sig-wrap canvas {
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

if (content.includes(oldCss)) {
    content = content.replace(oldCss, newCss);
    console.log('✅ CSS actualizado');
} else {
    // Buscar por patrón
    const pattern = /\.poder-cultivo-sig-wrap canvas \{[\s\S]*?z-index: 1;\n\}/;
    if (pattern.test(content)) {
        content = content.replace(pattern, newCss);
        console.log('✅ CSS actualizado con patrón');
    } else {
        console.log('⚠️ CSS no encontrado exactamente');
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');
console.log('📋 CSS del canvas ahora tiene:');
console.log('   - pointer-events: auto !important');
console.log('   - touch-action: none !important');
console.log('   - user-select: none !important');







