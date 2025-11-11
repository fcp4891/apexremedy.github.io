#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir el canvas de firma en poder-cultivo-form.html
"""

import re
import os

file_path = 'frontend/components/poder-cultivo-form.html'

if not os.path.exists(file_path):
    print(f'❌ Archivo no encontrado: {file_path}')
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f'📝 Procesando archivo: {file_path}')

# 1. Eliminar ID duplicado (línea ~160)
content = content.replace(
    '<input type="hidden" id="poderFinalidad" name="finalidad" value="medicinal" required>',
    '<input type="hidden" name="finalidad" value="medicinal" required>',
    1  # Solo reemplazar la segunda ocurrencia
)

# 2. Reemplazar función setupPoderSignatureCanvas
old_func_pattern = r'function setupPoderSignatureCanvas\(id\) \{[^}]*\{[^}]*\}[^}]*\}[^}]*\}'
new_func = '''function setupPoderSignatureCanvas(id) {
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
    
    let drawing = false;
    let prev = null;
    
    // Ajuste de tamaño para alta densidad
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
            console.log(`📏 Canvas ${id} redimensionado: ${w}x${h} (ratio: ${ratio})`);
        }
    }
    
    resize();
    if (window.ResizeObserver) {
        new ResizeObserver(() => {
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
        console.log(`🖱️ Start drawing en ${id}`, { x: prev?.x, y: prev?.y });
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
    
    // Limpiar listeners anteriores (si existen)
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const freshCanvas = document.getElementById(id);
    const freshCtx = freshCanvas.getContext('2d');
    
    // Re-aplicar resize
    resize();
    
    // Agregar todos los event listeners necesarios
    freshCanvas.addEventListener('mousedown', start, { passive: false });
    freshCanvas.addEventListener('mousemove', move, { passive: false });
    freshCanvas.addEventListener('mouseup', end, { passive: false });
    freshCanvas.addEventListener('mouseleave', end, { passive: false });
    freshCanvas.addEventListener('mouseout', end, { passive: false });
    
    freshCanvas.addEventListener('touchstart', start, { passive: false });
    freshCanvas.addEventListener('touchmove', move, { passive: false });
    freshCanvas.addEventListener('touchend', end, { passive: false });
    freshCanvas.addEventListener('touchcancel', end, { passive: false });
    
    console.log(`✅ Canvas ${id} inicializado correctamente`);
}'''

# Buscar y reemplazar la función completa usando un patrón más específico
pattern = r'function setupPoderSignatureCanvas\(id\) \{[\s\S]*?\n\}'
matches = re.findall(pattern, content)
if matches:
    content = re.sub(pattern, new_func, content, flags=re.DOTALL)
    print('✅ Función setupPoderSignatureCanvas reemplazada')
else:
    print('⚠️ No se encontró la función setupPoderSignatureCanvas para reemplazar')

# 3. Reemplazar initPoderCultivoCanvas
old_init = '''// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    if (poderCultivoCanvasInitialized) return;
    
    setupPoderSignatureCanvas('sigCedentePoder');
    setupPoderSignatureCanvas('sigCesionarioPoder');
    poderCultivoCanvasInitialized = true;'''
    
new_init = '''// Inicializar canvas de firmas
function initPoderCultivoCanvas() {
    console.log('🎨 initPoderCultivoCanvas llamado');
    
    // Función helper para verificar si el canvas está listo
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
    });'''

if old_init in content:
    content = content.replace(old_init, new_init)
    print('✅ Función initPoderCultivoCanvas reemplazada')
else:
    print('⚠️ No se encontró la función initPoderCultivoCanvas para reemplazar')

# 4. Actualizar CSS del canvas
old_css = '''.poder-cultivo-sig-wrap canvas {
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
}'''

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

if old_css in content:
    content = content.replace(old_css, new_css)
    print('✅ CSS del canvas actualizado')
else:
    print('⚠️ No se encontró el CSS del canvas para reemplazar')

# 5. Actualizar la llamada a initPoderCultivoCanvas con timeout
old_call = '''            const header = container?.querySelector('.poder-cultivo-header');
            if (header) header.style.display = 'flex';
            initPoderCultivoCanvas();'''
            
new_call = '''            const header = container?.querySelector('.poder-cultivo-header');
            if (header) header.style.display = 'flex';
            // Inicializar canvas después de que el DOM esté completamente renderizado
            setTimeout(() => {
                initPoderCultivoCanvas();
            }, 500);'''

if old_call in content:
    content = content.replace(old_call, new_call)
    print('✅ Llamada a initPoderCultivoCanvas actualizada con timeout')
else:
    print('⚠️ No se encontró la llamada a initPoderCultivoCanvas para actualizar')

# Guardar archivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\n✅ Archivo actualizado: {file_path}')
print('📋 Cambios aplicados:')
print('   1. ID duplicado eliminado')
print('   2. Función setupPoderSignatureCanvas mejorada con logs y punto inicial')
print('   3. Función initPoderCultivoCanvas con espera inteligente')
print('   4. CSS del canvas con !important')
print('   5. Timeout agregado para inicialización')
print('\n🔄 Recarga la página y verifica los logs en la consola')







