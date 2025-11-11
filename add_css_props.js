const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Agregando propiedades CSS críticas...');

// Agregar propiedades después de z-index: 1;
content = content.replace(
    '    z-index: 1;\n}',
    `    z-index: 1;
    pointer-events: auto !important;
    touch-action: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -ms-user-select: none !important;
}`
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Propiedades CSS agregadas!');







