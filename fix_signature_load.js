const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Agregando verificación de carga de SignaturePad...');

// Mejorar initPoderCultivoCanvas para esperar SignaturePad
const oldInit = `    // Inicializar SignaturePad para el cedente
    waitForCanvas('sigCedentePoder', () => {
        console.log('🚀 Inicializando SignaturePad para sigCedentePoder...');
        signaturePadCedente = setupPoderSignatureCanvas('sigCedentePoder');
        if (signaturePadCedente) {
            poderCultivoCanvasInitialized = true;
        }
    });`;

const newInit = `    // Función para esperar a que SignaturePad esté cargado
    function waitForSignaturePad(callback, maxAttempts = 20, attempt = 0) {
        if (typeof SignaturePad !== 'undefined') {
            console.log('✅ SignaturePad está disponible');
            callback();
        } else if (attempt < maxAttempts) {
            console.log(\`⏳ Esperando SignaturePad... (intento \${attempt + 1}/\${maxAttempts})\`);
            setTimeout(() => waitForSignaturePad(callback, maxAttempts, attempt + 1), 100);
        } else {
            console.error('❌ SignaturePad no está disponible después de intentos');
            // Intentar cargar el script manualmente
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js';
            script.onload = () => {
                console.log('✅ SignaturePad cargado manualmente');
                callback();
            };
            script.onerror = () => {
                console.error('❌ Error al cargar SignaturePad');
            };
            document.head.appendChild(script);
        }
    }
    
    // Inicializar SignaturePad para el cedente
    waitForCanvas('sigCedentePoder', () => {
        waitForSignaturePad(() => {
            console.log('🚀 Inicializando SignaturePad para sigCedentePoder...');
            signaturePadCedente = setupPoderSignatureCanvas('sigCedentePoder');
            if (signaturePadCedente) {
                console.log('✅ SignaturePad del cedente inicializado correctamente');
                poderCultivoCanvasInitialized = true;
            } else {
                console.error('❌ Error al inicializar SignaturePad del cedente');
            }
        });
    });`;

if (content.includes(oldInit)) {
    content = content.replace(oldInit, newInit);
    console.log('✅ Función initPoderCultivoCanvas mejorada');
} else {
    console.log('⚠️ No se encontró el patrón exacto, buscando variación...');
    // Buscar patrón más flexible
    const pattern = /\/\/ Inicializar SignaturePad para el cedente[\s\S]*?poderCultivoCanvasInitialized = true;[\s\S]*?\}\);[\s\S]*?\n\s*\/\//;
    if (pattern.test(content)) {
        content = content.replace(pattern, newInit + '\n    //');
        console.log('✅ Función actualizada con patrón flexible');
    } else {
        console.log('❌ No se pudo encontrar la función para actualizar');
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados correctamente!');
console.log('📋 Ahora el código espera a que SignaturePad esté cargado antes de inicializar');







