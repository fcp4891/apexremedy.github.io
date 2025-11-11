const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Limpiando CSS duplicado...');

// Buscar y eliminar el bloque duplicado
const duplicatePattern = /    display: block;\n    width: 100%;\n    height: 220px;\n    border-radius: var\(--border-radius\);\n    background: var\(--white\);\n    border: 2px solid var\(--light-gray\);\n    cursor: crosshair;\n    transition: var\(--transition\);\n    box-shadow: inset 0 2px 4px rgba\(0, 0, 0, 0\.05\);\n    position: relative;\n    z-index: 1;\n\}/;

if (duplicatePattern.test(content)) {
    content = content.replace(duplicatePattern, '}');
    console.log('✅ CSS duplicado eliminado');
} else {
    // Buscar otro patrón
    const pattern2 = /    display: block;\n[\s\S]*?z-index: 1;\n\}/;
    if (pattern2.test(content)) {
        // Reemplazar solo la parte duplicada
        content = content.replace(
            /    display: block;\n    width: 100%;[\s\S]*?z-index: 1;\n\}/,
            '}'
        );
        console.log('✅ CSS duplicado eliminado con patrón alternativo');
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







