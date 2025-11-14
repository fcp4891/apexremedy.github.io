#!/usr/bin/env node
/**
 * Script para actualizar todos los archivos HTML para incluir env-config.js
 * Busca archivos HTML que carguen basePath.js o config.js y agrega env-config.js ANTES
 */

const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

/**
 * Determina la ruta relativa correcta para env-config.js desde un archivo HTML
 */
function getEnvConfigPath(htmlFilePath) {
    const relativePath = path.relative(frontendDir, htmlFilePath);
    const depth = relativePath.split(path.sep).length - 1;
    
    if (relativePath.startsWith('admin')) {
        // Desde admin/, env-config.js está en ../js/
        return '../js/env-config.js';
    } else {
        // Desde frontend/, env-config.js está en ./js/
        return './js/env-config.js';
    }
}

/**
 * Actualiza un archivo HTML para incluir env-config.js
 */
function updateHTMLFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    const envConfigPath = getEnvConfigPath(filePath);
    const envConfigScript = `<script src="${envConfigPath}"></script>`;
    
    // Buscar patrones donde se carga basePath.js o config.js
    // Patrón 1: <script src="./js/basePath.js"></script>
    // Patrón 2: <script src="../js/basePath.js"></script>
    // Patrón 3: línea que contenga basePath.js o config.js
    
    // Si ya tiene env-config.js, no hacer nada
    if (content.includes('env-config.js')) {
        console.log(`⏭️  Ya tiene env-config.js: ${filePath}`);
        return false;
    }
    
    // Buscar donde se carga basePath.js o config.js
    const basePathRegex = /<script\s+src=["'][^"']*basePath\.js["'][^>]*><\/script>/i;
    const configRegex = /<script\s+src=["'][^"']*config\.js["'][^>]*><\/script>/i;
    
    let match = content.match(basePathRegex) || content.match(configRegex);
    
    if (match) {
        // Insertar env-config.js ANTES de la primera ocurrencia de basePath.js o config.js
        const insertPosition = match.index;
        const beforeScript = content.substring(0, insertPosition);
        const afterScript = content.substring(insertPosition);
        
        // Agregar comentario y script
        const insertion = `    <!-- env-config.js DEBE cargarse PRIMERO para sistema centralizado de rutas -->\n    ${envConfigScript}\n`;
        
        content = beforeScript + insertion + afterScript;
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Actualizado: ${filePath}`);
            return true;
        }
    } else {
        // Si no encuentra basePath.js ni config.js, buscar cualquier script tag
        // e insertar al inicio de los scripts
        const scriptTagRegex = /<script/i;
        const scriptMatch = content.match(scriptTagRegex);
        
        if (scriptMatch) {
            const insertPosition = scriptMatch.index;
            const beforeScript = content.substring(0, insertPosition);
            const afterScript = content.substring(insertPosition);
            
            const insertion = `    <!-- env-config.js DEBE cargarse PRIMERO para sistema centralizado de rutas -->\n    ${envConfigScript}\n    `;
            
            content = beforeScript + insertion + afterScript;
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Actualizado (insertado al inicio): ${filePath}`);
                return true;
            }
        } else {
            console.log(`⚠️  No se encontraron scripts en: ${filePath}`);
        }
    }
    
    return false;
}

/**
 * Recorre directorios buscando archivos HTML
 */
function findHTMLFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Saltar node_modules y otros directorios especiales
            if (!file.startsWith('.') && file !== 'node_modules') {
                findHTMLFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Ejecutar
console.log('🔧 Buscando archivos HTML en frontend/...\n');

const htmlFiles = findHTMLFiles(frontendDir);
let updatedCount = 0;

htmlFiles.forEach(file => {
    if (updateHTMLFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✅ Proceso completado. ${updatedCount} archivos actualizados de ${htmlFiles.length} encontrados.`);

