const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Reemplazando setupPoderSignatureCanvas con implementación exacta de registro_actualizado.html...');

// Reemplazar la función completa con la implementación exacta de registro_actualizado.html
const oldFunction = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?return signaturePad;\n\}/;

const newFunction = `function setupPoderSignatureCanvas(id) {
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
        return null;
    }
    
    // IMPLEMENTACIÓN EXACTA DE registro_actualizado.html (líneas 593-631)
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
    }
    
    // Redimensionar inmediatamente
    resizeCanvas();
    
    // Crear SignaturePad (EXACTO como registro_actualizado.html línea 597-600)
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    console.log(\`✅ SignaturePad creado para \${id}\`);
    
    // Agregar listener de resize (igual que registro_actualizado.html línea 630)
    window.addEventListener('resize', resizeCanvas);
    
    console.log(\`✅ SignaturePad inicializado correctamente para \${id}\`);
    return signaturePad;
}`;

if (oldFunction.test(content)) {
    content = content.replace(oldFunction, newFunction);
    console.log('✅ Función setupPoderSignatureCanvas reemplazada');
} else {
    console.log('❌ No se encontró la función para reemplazar');
    process.exit(1);
}

// También actualizar el CSS para asegurar que el canvas sea interactivo
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
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados correctamente!');
console.log('📋 La implementación ahora es EXACTA a registro_actualizado.html');







