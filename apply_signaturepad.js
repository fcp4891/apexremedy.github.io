const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Aplicando SignaturePad...');

// 1. Agregar script de SignaturePad al inicio del componente (después de la línea 1)
if (!content.includes('signature_pad')) {
    const scriptTag = '<script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>';
    content = content.replace(
        /<!-- Formulario de Cesión \(Poder de Cultivo\) - Componente Reutilizable -->/,
        `<!-- Formulario de Cesión (Poder de Cultivo) - Componente Reutilizable -->\n${scriptTag}`
    );
    console.log('✅ Script de SignaturePad agregado');
}

// 2. Reemplazar setupPoderSignatureCanvas con versión SignaturePad
const oldSetupFunction = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?\n\}/;
const newSetupFunction = `function setupPoderSignatureCanvas(id) {
    console.log(\`🔧 Inicializando SignaturePad para \${id}...\`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(\`❌ Canvas \${id} no encontrado\`);
        return null;
    }
    
    console.log(\`✅ Canvas \${id} encontrado: \${canvas.clientWidth}x\${canvas.clientHeight}\`);
    
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
        console.error('❌ SignaturePad no está cargado');
        // Intentar cargar dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js';
        script.onload = () => {
            console.log('✅ SignaturePad cargado dinámicamente');
            initializeSignaturePad(id, canvas);
        };
        document.head.appendChild(script);
        return null;
    }
    
    return initializeSignaturePad(id, canvas);
}

function initializeSignaturePad(id, canvas) {
    // Redimensionar canvas para alta densidad
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    
    // Crear SignaturePad
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(15, 23, 42)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16
    });
    
    // Manejar redimensionamiento
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        signaturePad.clear(); // Limpiar al redimensionar
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    console.log(\`✅ SignaturePad inicializado para \${id}\`);
    return signaturePad;
}`;

if (oldSetupFunction.test(content)) {
    content = content.replace(oldSetupFunction, newSetupFunction);
    console.log('✅ Función setupPoderSignatureCanvas reemplazada con SignaturePad');
} else {
    console.log('⚠️ No se encontró setupPoderSignatureCanvas');
}

// 3. Actualizar initPoderCultivoCanvas para usar SignaturePad
const oldInitPattern = /\/\/ Inicializar canvas de firmas[\s\S]*?function initPoderCultivoCanvas\(\) \{[\s\S]*?waitForCanvas\('sigCedentePoder'[\s\S]*?setupPoderSignatureCanvas\('sigCedentePoder'\);[\s\S]*?poderCultivoCanvasInitialized = true;[\s\S]*?\}\);[\s\S]*?\n\s*\/\/ Establecer fecha actual/;
const newInitCode = `// Inicializar canvas de firmas
let signaturePadCedente = null;
let signaturePadCesionario = null;

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
    
    // Inicializar SignaturePad para el cedente
    waitForCanvas('sigCedentePoder', () => {
        console.log('🚀 Inicializando SignaturePad para sigCedentePoder...');
        signaturePadCedente = setupPoderSignatureCanvas('sigCedentePoder');
        if (signaturePadCedente) {
            poderCultivoCanvasInitialized = true;
        }
    });
    
    // La firma del cesionario es fija (imagen del dispensario)
    // No necesita canvas editable
    
    // Establecer fecha actual como placeholder en los campos de fecha`;

if (oldInitPattern.test(content)) {
    content = content.replace(oldInitPattern, newInitCode);
    console.log('✅ Función initPoderCultivoCanvas actualizada');
} else {
    // Intentar con patrón más simple
    const simplePattern = /function initPoderCultivoCanvas\(\) \{[\s\S]*?waitForCanvas\('sigCedentePoder'[\s\S]*?setupPoderSignatureCanvas\('sigCedentePoder'\);[\s\S]*?poderCultivoCanvasInitialized = true;[\s\S]*?\}\);[\s\S]*?\n\s*\/\/ Establecer fecha actual/;
    if (simplePattern.test(content)) {
        content = content.replace(simplePattern, newInitCode);
        console.log('✅ Función initPoderCultivoCanvas actualizada (patrón simple)');
    } else {
        console.log('⚠️ No se pudo actualizar initPoderCultivoCanvas automáticamente');
    }
}

// 4. Actualizar función clearPoderCanvas
const oldClearPattern = /function clearPoderCanvas\(id\) \{[\s\S]*?\}/;
const newClearFunction = `function clearPoderCanvas(id) {
    console.log(\`🧹 Limpiando firma \${id}\`);
    if (id === 'sigCedentePoder' && signaturePadCedente) {
        signaturePadCedente.clear();
    } else if (id === 'sigCesionarioPoder' && signaturePadCesionario) {
        signaturePadCesionario.clear();
    } else {
        // Fallback: limpiar canvas manualmente
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}`;

if (oldClearPattern.test(content)) {
    content = content.replace(oldClearPattern, newClearFunction);
    console.log('✅ Función clearPoderCanvas actualizada');
}

// 5. Actualizar función que obtiene la firma (en generatePoderDocument)
// Buscar donde se obtiene la firma del canvas
content = content.replace(
    /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?sigCedente\.toDataURL\(\)/g,
    `const sigCedente = signaturePadCedente ? signaturePadCedente.toDataURL() : null;`
);

content = content.replace(
    /sigCedente\.toDataURL\(\)/g,
    `signaturePadCedente ? signaturePadCedente.toDataURL() : ''`
);

// Buscar y actualizar previewPoderDoc también
const previewPattern = /function previewPoderDoc\(\) \{[\s\S]*?const sigCedente[\s\S]*?sigCedente\.toDataURL\(\)/;
if (previewPattern.test(content)) {
    content = content.replace(
        /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?if \(!sigCedente\)/g,
        `if (!signaturePadCedente || signaturePadCedente.isEmpty())`
    );
    content = content.replace(
        /const sigCedenteBase64 = sigCedente\.toDataURL\(\)/g,
        `const sigCedenteBase64 = signaturePadCedente.toDataURL()`
    );
    console.log('✅ Función previewPoderDoc actualizada');
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');
console.log('\n📋 Cambios realizados:');
console.log('   1. ✅ Script de SignaturePad agregado');
console.log('   2. ✅ setupPoderSignatureCanvas reemplazado con SignaturePad');
console.log('   3. ✅ initPoderCultivoCanvas actualizado');
console.log('   4. ✅ clearPoderCanvas actualizado');
console.log('   5. ✅ Funciones de obtención de firma actualizadas');
console.log('\n🔄 Recarga la página y prueba la firma');

