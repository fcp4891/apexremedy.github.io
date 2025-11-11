#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir el formulario de poder cultivo
"""

import re

file_path = 'frontend/components/poder-cultivo-form.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Eliminar ID duplicado (línea 160)
content = re.sub(
    r'(<span>Finalidad permitida \(art\. 8 Ley 20\.000\) </span>\s*<input type="hidden" )id="poderFinalidad"( name="finalidad" value="medicinal" required>)',
    r'\1\2',
    content
)

# 2. Reemplazar función setupPoderSignatureCanvas completa
old_function = r'function setupPoderSignatureCanvas\(id\) \{[^}]*(?:\{[^}]*\}[^}]*)*\}'
new_function = '''function setupPoderSignatureCanvas(id) {
    console.log(`🔧 Inicializando canvas ${id}...`);
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error(`❌ Canvas ${id} no encontrado en el DOM`);
        return;
    }
    
    console.log(`✅ Canvas ${id} encontrado:`, canvas);
    console.log(`📐 Dimensiones del canvas: ${canvas.clientWidth}x${canvas.clientHeight}`);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`❌ No se pudo obtener el contexto 2D para ${id}`);
        return;
    }
    
    let drawing = false;
    let prev = null;
    
    // Ajuste de tamaño para alta densidad
    function resize() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.clientWidth || 300;
        const h = rect.height || canvas.clientHeight || 220;
        
        console.log(`📏 Resize canvas ${id}: ${w}x${h} (ratio: ${ratio})`);
        
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
        ctx.fillStyle = '#0f172a';
    }
    
    resize();
    if (window.ResizeObserver) {
        new ResizeObserver(() => {
            console.log(`🔄 ResizeObserver detectado para ${id}`);
            resize();
        }).observe(canvas);
    }

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
        // Dibujar un punto inicial para asegurar que se vea algo
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

    // Asegurar que el canvas sea completamente interactivo
    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
    canvas.style.pointerEvents = 'auto';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
    canvas.style.msUserSelect = 'none';
    
    // Agregar todos los event listeners necesarios
    canvas.addEventListener('mousedown', start, { passive: false });
    canvas.addEventListener('mousemove', move, { passive: false });
    canvas.addEventListener('mouseup', end, { passive: false });
    canvas.addEventListener('mouseleave', end, { passive: false });
    canvas.addEventListener('mouseout', end, { passive: false });
    
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
    
    console.log(`✅ Canvas de firma ${id} inicializado correctamente con ${canvas.width}x${canvas.height} píxeles`);
}'''

# Buscar y reemplazar la función completa
pattern = r'function setupPoderSignatureCanvas\(id\) \{.*?\n\}'
content = re.sub(pattern, new_function, content, flags=re.DOTALL)

# 3. Actualizar initPoderCultivoCanvas
old_init = r'function initPoderCultivoCanvas\(\) \{\s*if \(poderCultivoCanvasInitialized\) return;\s*setupPoderSignatureCanvas\(\'sigCedentePoder\'\);\s*setupPoderSignatureCanvas\(\'sigCesionarioPoder\'\);\s*poderCultivoCanvasInitialized = true;'
new_init = '''function initPoderCultivoCanvas() {
    console.log('🎨 initPoderCultivoCanvas llamado');
    if (poderCultivoCanvasInitialized) {
        console.log('⚠️ Canvas ya inicializado, reinicializando...');
        poderCultivoCanvasInitialized = false;
    }
    
    // Solo inicializar el canvas del cedente (el usuario firma)
    const cedenteCanvas = document.getElementById('sigCedentePoder');
    if (cedenteCanvas) {
        console.log('✅ Canvas sigCedentePoder encontrado en el DOM');
        setTimeout(() => {
            console.log('⏱️ Inicializando canvas después de timeout...');
            setupPoderSignatureCanvas('sigCedentePoder');
        }, 300);
    } else {
        console.warn('⚠️ Canvas sigCedentePoder no encontrado, intentando de nuevo...');
        setTimeout(() => {
            const canvas = document.getElementById('sigCedentePoder');
            if (canvas) {
                console.log('✅ Canvas encontrado en segundo intento');
                setupPoderSignatureCanvas('sigCedentePoder');
            } else {
                console.error('❌ Canvas sigCedentePoder no encontrado después de reintento');
            }
        }, 500);
    }
    
    // La firma del cesionario es fija (imagen del dispensario)
    // No necesita canvas
    
    poderCultivoCanvasInitialized = true;'''

content = re.sub(old_init, new_init, content, flags=re.DOTALL)

# 4. Actualizar CSS del canvas
old_css = r'\.poder-cultivo-sig-wrap canvas \{[^}]*\}'
new_css = '''.poder-cultivo-sig-wrap canvas {
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
}'''

content = re.sub(old_css, new_css, content, flags=re.DOTALL)

# Guardar cambios
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Cambios aplicados correctamente')
print('📝 Archivo actualizado: frontend/components/poder-cultivo-form.html')







