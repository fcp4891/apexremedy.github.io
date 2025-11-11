// ============================================================
// SOLUCIÓN FINAL: Reemplazar función setupPoderSignatureCanvas
// ============================================================
// Copiar y pegar este código en lugar de la función actual (líneas 811-876)

function setupPoderSignatureCanvas(id) {
    console.log(`🔧 Inicializando canvas ${id}...`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(`❌ Canvas ${id} no encontrado en el DOM`);
        return;
    }
    
    console.log(`✅ Canvas ${id} encontrado`);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`❌ No se pudo obtener contexto 2D`);
        return;
    }
    
    // Ajuste de tamaño para alta densidad
    function resize() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
    }
    
    resize();
    if (window.ResizeObserver) {
        new ResizeObserver(resize).observe(canvas);
    }

    let drawing = false;
    let prev = null;

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length) {
            return { 
                x: e.touches[0].clientX - r.left, 
                y: e.touches[0].clientY - r.top 
            };
        } else {
            return { 
                x: e.clientX - r.left, 
                y: e.clientY - r.top 
            };
        }
    }

    function start(e) {
        console.log(`🖱️ Start drawing en ${id}`);
        drawing = true;
        prev = pos(e);
        // Dibujar un punto inicial
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
            console.log(`🖱️ End drawing en ${id}`);
            drawing = false;
            prev = null;
        }
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    // Asegurar que el canvas sea interactivo
    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
    canvas.style.pointerEvents = 'auto';
    canvas.style.userSelect = 'none';
    
    // Event listeners
    canvas.addEventListener('mousedown', start, { passive: false });
    canvas.addEventListener('mousemove', move, { passive: false });
    canvas.addEventListener('mouseup', end, { passive: false });
    canvas.addEventListener('mouseleave', end, { passive: false });
    
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
    
    console.log(`✅ Canvas ${id} inicializado correctamente`);
}

// ============================================================
// SOLUCIÓN FINAL: Reemplazar función initPoderCultivoCanvas
// ============================================================
// Copiar y pegar este código en lugar de la función actual (líneas 714-720)

function initPoderCultivoCanvas() {
    console.log('🎨 initPoderCultivoCanvas llamado');
    if (poderCultivoCanvasInitialized) {
        console.log('⚠️ Reinicializando canvas...');
        poderCultivoCanvasInitialized = false;
    }
    
    // Solo inicializar el canvas del cedente (el usuario firma)
    const cedenteCanvas = document.getElementById('sigCedentePoder');
    if (cedenteCanvas) {
        console.log('✅ Canvas sigCedentePoder encontrado');
        setTimeout(() => {
            setupPoderSignatureCanvas('sigCedentePoder');
        }, 300);
    } else {
        console.warn('⚠️ Canvas no encontrado, reintentando...');
        setTimeout(() => {
            const canvas = document.getElementById('sigCedentePoder');
            if (canvas) {
                console.log('✅ Canvas encontrado en segundo intento');
                setupPoderSignatureCanvas('sigCedentePoder');
            } else {
                console.error('❌ Canvas no encontrado después de reintento');
            }
        }, 500);
    }
    
    poderCultivoCanvasInitialized = true;
}







