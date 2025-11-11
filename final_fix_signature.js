const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Aplicando correcciones finales...');

// 1. Asegurar que el canvas tenga width y height explícitos (como en registro_actualizado.html)
content = content.replace(
    '<canvas id="sigCedentePoder"></canvas>',
    '<canvas id="sigCedentePoder" width="600" height="200"></canvas>'
);

// 2. Mejorar el CSS del canvas para asegurar que sea interactivo
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
}`;

if (content.includes(oldCss)) {
    content = content.replace(oldCss, newCss);
    console.log('✅ CSS del canvas actualizado');
} else {
    console.log('⚠️ CSS no encontrado exactamente, intentando reemplazo parcial...');
    content = content.replace(
        /\.poder-cultivo-sig-wrap canvas \{[\s\S]*?z-index: 1;\n\}/,
        newCss
    );
    console.log('✅ CSS actualizado con patrón');
}

// 3. Mejorar la función setupPoderSignatureCanvas para esperar a que SignaturePad esté cargado
const setupFunction = `function setupPoderSignatureCanvas(id) {
    console.log(\`🔧 Inicializando SignaturePad para \${id}...\`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(\`❌ Canvas \${id} no encontrado\`);
        return null;
    }
    
    console.log(\`✅ Canvas \${id} encontrado: \${canvas.clientWidth}x\${canvas.clientHeight}\`);
    
    // Verificar que SignaturePad esté disponible
    if (typeof SignaturePad === 'undefined') {
        console.error('❌ SignaturePad no está cargado. Revisa la carga del script.');
        return null;
    }
    
    // Redimensionar canvas para alta densidad (igual que registro_actualizado.html)
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || 300;
    const h = rect.height || canvas.clientHeight || 220;
    
    console.log(\`📏 Redimensionando canvas \${id}: \${w}x\${h} (ratio: \${ratio})\`);
    
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    
    // Crear SignaturePad (igual que en registro_actualizado.html)
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    console.log(\`✅ SignaturePad creado para \${id}\`);
    
    // Manejar redimensionamiento (sin limpiar la firma)
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.clientWidth || 300;
        const h = rect.height || canvas.clientHeight || 220;
        
        // Solo redimensionar si cambió el tamaño
        if (canvas.width !== w * ratio || canvas.height !== h * ratio) {
            const dataURL = signaturePad.toDataURL();
            canvas.width = w * ratio;
            canvas.height = h * ratio;
            const ctx = canvas.getContext('2d');
            ctx.scale(ratio, ratio);
            signaturePad.clear();
            signaturePad.fromDataURL(dataURL);
        }
    }
    
    // Usar ResizeObserver si está disponible
    if (window.ResizeObserver) {
        new ResizeObserver(() => {
            resizeCanvas();
        }).observe(canvas);
    } else {
        window.addEventListener('resize', resizeCanvas);
    }
    
    console.log(\`✅ SignaturePad inicializado correctamente para \${id}\`);
    return signaturePad;
}`;

// Buscar y reemplazar la función
const pattern = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?return signaturePad;\n\}/;
if (pattern.test(content)) {
    content = content.replace(pattern, setupFunction);
    console.log('✅ Función setupPoderSignatureCanvas mejorada');
} else {
    console.log('⚠️ No se encontró la función para reemplazar');
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados correctamente!');
console.log('📋 Resumen:');
console.log('   1. ✅ Canvas con width/height explícitos');
console.log('   2. ✅ CSS mejorado con !important');
console.log('   3. ✅ Función setupPoderSignatureCanvas mejorada');
console.log('\n🔄 Recarga la página y prueba el canvas de firma');







