# CAMBIOS EXACTOS PARA APLICAR EN poder-cultivo-form.html

## ⚠️ IMPORTANTE: Aplica estos cambios en orden

### 1. Línea 160: Eliminar ID duplicado

**BUSCAR:**
```html
                    <span>Finalidad permitida (art. 8 Ley 20.000) </span>
                    <input type="hidden" id="poderFinalidad" name="finalidad" value="medicinal" required>
```

**REEMPLAZAR CON:**
```html
                    <span>Finalidad permitida (art. 8 Ley 20.000) </span>
                    <input type="hidden" name="finalidad" value="medicinal" required>
```

---

### 2. Línea 811: Agregar logs al inicio de setupPoderSignatureCanvas

**BUSCAR:**
```javascript
function setupPoderSignatureCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
```

**REEMPLAZAR CON:**
```javascript
function setupPoderSignatureCanvas(id) {
    console.log(`🔧 Inicializando canvas ${id}...`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(`❌ Canvas ${id} no encontrado`);
        return;
    }
    
    console.log(`✅ Canvas ${id} encontrado: ${canvas.clientWidth}x${canvas.clientHeight}`);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`❌ No se pudo obtener contexto 2D`);
        return;
    }
```

---

### 3. Línea 817: Mejorar función resize

**BUSCAR:**
```javascript
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
```

**REEMPLAZAR CON:**
```javascript
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
```

---

### 4. Línea 848: Mejorar función start

**BUSCAR:**
```javascript
    function start(e) {
        drawing = true;
        prev = pos(e);
        e.preventDefault();
    }
```

**REEMPLAZAR CON:**
```javascript
    function start(e) {
        console.log(`🖱️ Start drawing en ${id}`);
        drawing = true;
        prev = pos(e);
        // Dibujar punto inicial
        ctx.beginPath();
        ctx.arc(prev.x, prev.y, 1, 0, 2 * Math.PI);
        ctx.fill();
        e.preventDefault();
        e.stopPropagation();
    }
```

---

### 5. Línea 854: Mejorar función move

**BUSCAR:**
```javascript
    function move(e) {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        prev = p;
        e.preventDefault();
    }
```

**REEMPLAZAR CON:**
```javascript
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
```

---

### 6. Línea 865: Mejorar función end

**BUSCAR:**
```javascript
    function end() {
        drawing = false;
        prev = null;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
}
```

**REEMPLAZAR CON:**
```javascript
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
}
```

---

### 7. Línea 714: Reemplazar initPoderCultivoCanvas completa

**BUSCAR:**
```javascript
// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    if (poderCultivoCanvasInitialized) return;
    
    setupPoderSignatureCanvas('sigCedentePoder');
    setupPoderSignatureCanvas('sigCesionarioPoder');
    poderCultivoCanvasInitialized = true;
    
    // Establecer fecha actual como placeholder en los campos de fecha
```

**REEMPLAZAR CON:**
```javascript
// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    console.log('🎨 initPoderCultivoCanvas llamado');
    
    function waitForCanvas(id, callback, maxAttempts = 10, attempt = 0) {
        const canvas = document.getElementById(id);
        if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            console.log(`✅ Canvas ${id} está listo: ${canvas.clientWidth}x${canvas.clientHeight}`);
            callback();
        } else if (attempt < maxAttempts) {
            console.log(`⏳ Esperando canvas ${id}... (intento ${attempt + 1}/${maxAttempts})`);
            setTimeout(() => waitForCanvas(id, callback, maxAttempts, attempt + 1), 200);
        } else {
            console.error(`❌ Canvas ${id} no está disponible después de ${maxAttempts} intentos`);
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
```

---

### 8. Línea 1179: Agregar timeout

**BUSCAR:**
```javascript
            const header = container?.querySelector('.poder-cultivo-header');
            if (header) header.style.display = 'flex';
            initPoderCultivoCanvas();
```

**REEMPLAZAR CON:**
```javascript
            const header = container?.querySelector('.poder-cultivo-header');
            if (header) header.style.display = 'flex';
            // Inicializar canvas después de que el DOM esté completamente renderizado
            setTimeout(() => {
                initPoderCultivoCanvas();
            }, 500);
```

---

## ✅ DESPUÉS DE APLICAR LOS CAMBIOS:

1. Guarda el archivo (Ctrl+S)
2. Recarga la página en el navegador
3. Abre la consola (F12)
4. Ve al paso 2 del registro
5. Deberías ver logs como:
   - `🎨 initPoderCultivoCanvas llamado`
   - `⏳ Esperando canvas...`
   - `✅ Canvas sigCedentePoder está listo`
   - `🔧 Inicializando canvas sigCedentePoder...`
   - `🖱️ Start drawing` (cuando hagas clic en el canvas)

Si ves estos logs, el canvas debería funcionar correctamente.







