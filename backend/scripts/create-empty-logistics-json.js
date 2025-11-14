#!/usr/bin/env node
/**
 * Script para crear archivos JSON vacíos de logística si no existen
 * Esto evita errores 404 en GitHub Pages cuando las tablas no existen
 */

const path = require('path');
const fs = require('fs');

function createEmptyLogisticsJson() {
    const apiDir = path.join(__dirname, '../../frontend/api');
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true });
    }
    
    const jsonFiles = [
        {
            file: 'shipping-providers.json',
            data: {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    providers: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            }
        },
        {
            file: 'shipments.json',
            data: {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    shipments: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            }
        },
        {
            file: 'internal-delivery-zones.json',
            data: {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    zones: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            }
        },
        {
            file: 'packing-materials.json',
            data: {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    materials: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            }
        }
    ];
    
    console.log('📦 Creando archivos JSON vacíos de logística...\n');
    
    jsonFiles.forEach(item => {
        const filePath = path.join(apiDir, item.file);
        
        // Solo crear si no existe
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(item.data, null, 2));
            console.log(`✅ Creado: ${item.file}`);
        } else {
            console.log(`⚠️  Ya existe: ${item.file} (no sobrescrito)`);
        }
    });
    
    console.log('\n✅ Archivos JSON de logística verificados/creados');
}

if (require.main === module) {
    createEmptyLogisticsJson();
}

module.exports = createEmptyLogisticsJson;

