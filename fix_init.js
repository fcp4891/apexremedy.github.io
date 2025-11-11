const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Aplicando cambio a initPoderCultivoCanvas...');

// Reemplazar función initPoderCultivoCanvas
const oldInit = `// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    if (poderCultivoCanvasInitialized) return;
    
    setupPoderSignatureCanvas('sigCedentePoder');
    setupPoderSignatureCanvas('sigCesionarioPoder');
    poderCultivoCanvasInitialized = true;
    
    // Establecer fecha actual como placeholder en los campos de fecha
    const today = new Date().toISOString().split('T')[0];
    const fechaInicioVigencia = document.getElementById('fechaInicioVigencia');
    const fechaInicioPlaceholder = document.getElementById('fechaInicioVigenciaPlaceholder');
    if (fechaInicioVigencia && fechaInicioPlaceholder) {
        const fechaFormateada = new Date().toLocaleDateString('es-CL');
        fechaInicioPlaceholder.textContent = fechaFormateada;
    }
}`;

const newInit = `// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    console.log('🎨 initPoderCultivoCanvas llamado');
    
    function waitForCanvas(id, callback, maxAttempts = 10, attempt = 0) {
        const canvas = document.getElementById(id);
        if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            console.log(\`✅ Canvas \${id} está listo: \${canvas.clientWidth}x\${canvas.clientHeight}\`);
            callback();
        } else if (attempt < maxAttempts) {
            console.log(\`⏳ Esperando canvas \${id}... (intento \${attempt + 1}/\${maxAttempts})\`);
            setTimeout(() => waitForCanvas(id, callback, maxAttempts, attempt + 1), 200);
        } else {
            console.error(\`❌ Canvas \${id} no está disponible después de \${maxAttempts} intentos\`);
        }
    }
    
    // Solo inicializar el canvas del cedente (el usuario firma)
    // La firma del cesionario es fija (imagen del dispensario)
    waitForCanvas('sigCedentePoder', () => {
        console.log('🚀 Inicializando canvas sigCedentePoder...');
        setupPoderSignatureCanvas('sigCedentePoder');
        poderCultivoCanvasInitialized = true;
    });
    
    // Establecer fecha actual como placeholder en los campos de fecha
    const today = new Date().toISOString().split('T')[0];
    const fechaInicioVigencia = document.getElementById('fechaInicioVigencia');
    const fechaInicioPlaceholder = document.getElementById('fechaInicioVigenciaPlaceholder');
    if (fechaInicioVigencia && fechaInicioPlaceholder) {
        const fechaFormateada = new Date().toLocaleDateString('es-CL');
        fechaInicioPlaceholder.textContent = fechaFormateada;
    }
}`;

if (content.includes(oldInit)) {
    content = content.replace(oldInit, newInit);
    console.log('✅ Función initPoderCultivoCanvas actualizada');
} else {
    console.log('⚠️ No se encontró la función exacta, intentando con regex...');
    const regex = /\/\/ Inicializar canvas de firmas[\s\S]*?function initPoderCultivoCanvas\(\) \{[\s\S]*?if \(poderCultivoCanvasInitialized\) return;[\s\S]*?setupPoderSignatureCanvas\('sigCedentePoder'\);[\s\S]*?setupPoderSignatureCanvas\('sigCesionarioPoder'\);[\s\S]*?poderCultivoCanvasInitialized = true;[\s\S]*?\n\}/;
    if (regex.test(content)) {
        content = content.replace(regex, newInit);
        console.log('✅ Función initPoderCultivoCanvas actualizada con regex');
    } else {
        console.log('❌ No se pudo encontrar la función para reemplazar');
    }
}

// También actualizar el timeout
content = content.replace(
    /setTimeout\(\(\) => \{[\s\S]*?initPoderCultivoCanvas\(\);[\s\S]*?\}, 100\);/,
    `setTimeout(() => {
                initPoderCultivoCanvas();
            }, 500);`
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');







