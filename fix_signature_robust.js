const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Creando versión robusta de setupPoderSignatureCanvas...');

// Reemplazar toda la función con una versión más robusta
const oldFunction = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?return signaturePad;\n\}/;

const newFunction = `function setupPoderSignatureCanvas(id) {
    console.log(\`🔧 Inicializando SignaturePad para \${id}...\`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(\`❌ Canvas \${id} no encontrado en el DOM\`);
        return null;
    }
    
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
        console.error('❌ SignaturePad no está cargado');
        return null;
    }
    
    // Esperar a que el canvas tenga dimensiones válidas
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || canvas.offsetWidth || 600;
    const h = rect.height || canvas.clientHeight || canvas.offsetHeight || 200;
    
    console.log(\`✅ Canvas \${id} encontrado: \${w}x\${h}\`);
    
    if (w <= 0 || h <= 0) {
        console.warn(\`⚠️ Canvas \${id} tiene dimensiones inválidas, esperando...\`);
        setTimeout(() => setupPoderSignatureCanvas(id), 200);
        return null;
    }
    
    // Redimensionar canvas para alta densidad (igual que registro_actualizado.html)
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const newW = rect.width || canvas.clientWidth || canvas.offsetWidth || 600;
        const newH = rect.height || canvas.clientHeight || canvas.offsetHeight || 200;
        
        if (newW > 0 && newH > 0) {
            canvas.width = newW * ratio;
            canvas.height = newH * ratio;
            const ctx = canvas.getContext('2d');
            ctx.scale(ratio, ratio);
        }
    }
    
    // Redimensionar inmediatamente
    resizeCanvas();
    
    // Crear SignaturePad (EXACTO como registro_actualizado.html línea 597-600)
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    console.log(\`✅ SignaturePad creado para \${id}, canvas: \${canvas.width}x\${canvas.height}\`);
    
    // Agregar listener de resize (igual que registro_actualizado.html línea 630)
    // Usar un solo listener por función
    if (!canvas._resizeHandler) {
        canvas._resizeHandler = resizeCanvas;
        window.addEventListener('resize', canvas._resizeHandler);
    }
    
    // Verificar que SignaturePad esté funcionando
    console.log(\`✅ SignaturePad inicializado: isEmpty=\${signaturePad.isEmpty()}\`);
    
    return signaturePad;
}`;

if (oldFunction.test(content)) {
    content = content.replace(oldFunction, newFunction);
    console.log('✅ Función setupPoderSignatureCanvas reemplazada con versión robusta');
} else {
    console.log('❌ No se encontró la función');
    process.exit(1);
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');
console.log('📋 La función ahora:');
console.log('   1. Verifica dimensiones válidas del canvas');
console.log('   2. Espera si las dimensiones no están listas');
console.log('   3. Evita múltiples listeners de resize');
console.log('   4. Verifica que SignaturePad funcione');







