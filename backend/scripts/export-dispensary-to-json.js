#!/usr/bin/env node
/**
 * Script para exportar datos del dispensario de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de dispensary
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');

async function exportDispensary() {
    try {
        console.log('🚀 Iniciando exportación de datos del dispensario a JSON...');
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const dispensaryFile = path.join(apiDir, 'dispensary.json');
            const emptyData = {
                success: true,
                message: 'Datos del dispensario exportados correctamente',
                data: null
            };
            
            fs.writeFileSync(dispensaryFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', dispensaryFile);
            return emptyData;
        }
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        
        // Obtener datos del dispensario (solo el primer registro)
        console.log('🏥 Obteniendo datos del dispensario de la base de datos...');
        const dispensary = await db.get('SELECT * FROM dispensary_data LIMIT 1');
        
        if (!dispensary) {
            console.warn('⚠️ No se encontraron datos del dispensario en la base de datos');
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const dispensaryFile = path.join(apiDir, 'dispensary.json');
            const emptyData = {
                success: true,
                message: 'Datos del dispensario exportados correctamente',
                data: null
            };
            
            fs.writeFileSync(dispensaryFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', dispensaryFile);
            return emptyData;
        }
        
        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Datos del dispensario exportados correctamente',
            data: {
                id: dispensary.id,
                name: dispensary.name,
                rut: dispensary.rut,
                address: dispensary.address,
                email: dispensary.email,
                signature: dispensary.signature || null,
                created_at: dispensary.created_at,
                updated_at: dispensary.updated_at
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Exportar a JSON
        const dispensaryFile = path.join(apiDir, 'dispensary.json');
        fs.writeFileSync(dispensaryFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ Datos del dispensario exportados a: ${dispensaryFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Nombre: ${dispensary.name}`);
        console.log(`   - RUT: ${dispensary.rut}`);
        console.log(`   - Email: ${dispensary.email}`);
        console.log(`   - Dirección: ${dispensary.address}`);
        console.log(`   - Tiene firma: ${dispensary.signature ? 'Sí' : 'No'}`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de datos del dispensario:', error);
        throw error;
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        if (getDatabase()) {
            try {
                await getDatabase().disconnect();
                console.log('🔌 Base de datos desconectada.');
            } catch (e) {
                // Ignorar errores al desconectar
            }
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    exportDispensary()
        .then(() => {
            console.log('✅ Exportación completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en la exportación:', error);
            process.exit(1);
        });
}

module.exports = exportDispensary;

