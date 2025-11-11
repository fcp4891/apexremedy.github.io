const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Corrigiendo función resizeCanvas para usar el ancho correcto...');

// Corregir la función resizeCanvas para que use el ancho del contenedor correctamente
const oldResize = `    // IMPLEMENTACIÓN EXACTA DE registro_actualizado.html (líneas 593-631)
    // Redimensionar canvas en móviles (igual que registro_actualizado.html)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        [canvas].forEach(c => {
            const parent = c.parentElement || c;
            const w = parent.offsetWidth || c.clientWidth || 600;
            const h = 200;
            c.width = w * ratio;
            c.height = h * ratio;
            c.getContext('2d').scale(ratio, ratio);
        });
    }`;

const newResize = `    // IMPLEMENTACIÓN EXACTA DE registro_actualizado.html (líneas 619-630)
    // Redimensionar canvas (igual que registro_actualizado.html)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.clientWidth || canvas.offsetWidth || 600;
        const h = rect.height || canvas.clientHeight || canvas.offsetHeight || 200;
        
        console.log(\`📏 Redimensionando \${id}: \${w}x\${h} (ratio: \${ratio})\`);
        
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
    }`;

if (content.includes(oldResize)) {
    content = content.replace(oldResize, newResize);
    console.log('✅ Función resizeCanvas corregida');
} else {
    console.log('⚠️ No se encontró el patrón exacto, buscando variación...');
    const pattern = /\/\/ IMPLEMENTACIÓN EXACTA[\s\S]*?function resizeCanvas\(\) \{[\s\S]*?getContext\('2d'\)\.scale\(ratio, ratio\);[\s\S]*?\}/;
    if (pattern.test(content)) {
        content = content.replace(pattern, newResize);
        console.log('✅ Función actualizada con patrón');
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







