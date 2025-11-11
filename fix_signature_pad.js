const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Reemplazando setupPoderSignatureCanvas con implementación SignaturePad...');

// Reemplazar la función setupPoderSignatureCanvas completa
const oldSetup = `function setupPoderSignatureCanvas(id) {
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

const newSetup = `function setupPoderSignatureCanvas(id) {
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
    
    // Redimensionar canvas para alta densidad
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || 300;
    const h = rect.height || canvas.clientHeight || 220;
    
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    
    // Crear SignaturePad (igual que en registro_actualizado.html)
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    // Manejar redimensionamiento (sin limpiar)
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

if (content.includes(oldSetup)) {
    content = content.replace(oldSetup, newSetup);
    console.log('✅ Función setupPoderSignatureCanvas reemplazada');
} else {
    console.log('⚠️ No se encontró la función exacta, buscando por patrón...');
    // Buscar por patrón más flexible
    const pattern = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?function initializeSignaturePad[\s\S]*?return signaturePad;\n\}/;
    if (pattern.test(content)) {
        content = content.replace(pattern, newSetup);
        console.log('✅ Función reemplazada con patrón flexible');
    } else {
        console.log('❌ No se pudo encontrar la función para reemplazar');
        process.exit(1);
    }
}

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados correctamente!');
console.log('📋 SignaturePad ahora usa la misma implementación que registro_actualizado.html');







