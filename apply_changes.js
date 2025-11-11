const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Aplicando cambios...');

// 1. Eliminar ID duplicado (línea 160)
content = content.replace(
    /<input type="hidden" id="poderFinalidad" name="finalidad" value="medicinal" required>/g,
    '<input type="hidden" name="finalidad" value="medicinal" required>'
);

// 2. Reemplazar función setupPoderSignatureCanvas completa
const oldSetupFunction = /function setupPoderSignatureCanvas\(id\) \{[\s\S]*?\n\}/;
const newSetupFunction = `function setupPoderSignatureCanvas(id) {
    console.log(\`🔧 Inicializando canvas \${id}...\`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(\`❌ Canvas \${id} no encontrado\`);
        return;
    }
    
    console.log(\`✅ Canvas \${id} encontrado: \${canvas.clientWidth}x\${canvas.clientHeight}\`);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(\`❌ No se pudo obtener contexto 2D\`);
        return;
    }
    
    function resize() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.clientWidth || 300;
        const h = rect.height || canvas.clientHeight || 220;
        
        if (w > 0 && h > 0) {
            canvas.width = w * ratio;
            canvas.height = h * ratio;
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#0f172a';
            ctx.fillStyle = '#0f172a';
        }
    }
    
    resize();
    if (window.ResizeObserver) {
        new ResizeObserver(resize).observe(canvas);
    }

    let drawing = false;
    let prev = null;

    function pos(e) {
        if (e.touches && e.touches.length) {
            const r = canvas.getBoundingClientRect();
            return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        } else {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }
    }

    function start(e) {
        console.log(\`🖱️ Start drawing en \${id}\`);
        drawing = true;
        prev = pos(e);
        // Dibujar punto inicial
        ctx.beginPath();
        ctx.arc(prev.x, prev.y, 1, 0, 2 * Math.PI);
        ctx.fill();
        e.preventDefault();
        e.stopPropagation();
    }
    
    function move(e) {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        prev = p;
        e.preventDefault();
        e.stopPropagation();
    }
    
    function end(e) {
        if (drawing) {
            console.log(\`🖱️ End drawing en \${id}\`);
            drawing = false;
            prev = null;
        }
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
    canvas.style.pointerEvents = 'auto';
    canvas.style.userSelect = 'none';
    
    canvas.addEventListener('mousedown', start, { passive: false });
    canvas.addEventListener('mousemove', move, { passive: false });
    canvas.addEventListener('mouseup', end, { passive: false });
    canvas.addEventListener('mouseleave', end, { passive: false });
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
}`;

content = content.replace(oldSetupFunction, newSetupFunction);

// 3. Reemplazar función initPoderCultivoCanvas
const oldInitFunction = /\/\/ Inicializar canvas de firmas\nfunction initPoderCultivoCanvas\(\) \{\n    if \(poderCultivoCanvasInitialized\) return;\n    \n    setupPoderSignatureCanvas\('sigCedentePoder'\);\n    setupPoderSignatureCanvas\('sigCesionarioPoder'\);\n    poderCultivoCanvasInitialized = true;\n    \n    \/\/ Establecer fecha actual como placeholder en los campos de fecha\n    const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];/;

const newInitFunction = `// Inicializar canvas de firmas
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
    const today = new Date().toISOString().split('T')[0];`;

content = content.replace(oldInitFunction, newInitFunction);

// 4. Agregar timeout en initPoderCultivoForm
content = content.replace(
    /if \(header\) header\.style\.display = 'flex';\n            initPoderCultivoCanvas\(\);/,
    `if (header) header.style.display = 'flex';
            // Inicializar canvas después de que el DOM esté completamente renderizado
            setTimeout(() => {
                initPoderCultivoCanvas();
            }, 500);`
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados correctamente!');
console.log('\n📋 Cambios aplicados:');
console.log('   1. ✅ ID duplicado eliminado');
console.log('   2. ✅ Función setupPoderSignatureCanvas mejorada');
console.log('   3. ✅ Función initPoderCultivoCanvas con espera inteligente');
console.log('   4. ✅ Timeout agregado para inicialización');
console.log('\n🔄 Recarga la página y verifica los logs en la consola');







