const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Aplicando timeout a la segunda llamada...');

// Reemplazar la llamada directa en initPoderCultivoForm
content = content.replace(
    /const header = container\?\.querySelector\('\.poder-cultivo-header'\);\s*if \(header\) header\.style\.display = 'flex';\s*initPoderCultivoCanvas\(\);/,
    `const header = container?.querySelector('.poder-cultivo-header');
            if (header) header.style.display = 'flex';
            // Inicializar canvas después de que el DOM esté completamente renderizado
            setTimeout(() => {
                initPoderCultivoCanvas();
            }, 500);`
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







