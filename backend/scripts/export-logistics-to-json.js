#!/usr/bin/env node
/**
 * Script para exportar todos los datos de logística de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de logística
 * Incluye: dispatch_centers, fleet_drivers, pickup_points_dispensary
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');

async function exportLogistics() {
    try {
        console.log('🚀 Iniciando exportación de datos de logística a JSON...');
        
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSONs vacíos de logística...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString();
            
            // Crear JSONs vacíos
            const emptyFiles = {
                'dispatch-centers.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { centers: [] },
                    total: 0,
                    timestamp
                },
                'fleet-drivers.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { drivers: [] },
                    total: 0,
                    timestamp
                },
                'pickup-points.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { points: [] },
                    total: 0,
                    timestamp
                }
            };
            
            for (const [filename, data] of Object.entries(emptyFiles)) {
                const filePath = path.join(apiDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`✅ JSON vacío creado: ${filename}`);
            }
            
            return emptyFiles;
        }
        
        await initDatabase();
        const db = getDatabase();
        
        // 1. Exportar dispatch_centers
        console.log('📦 Obteniendo centros de despacho...');
        const centers = await db.all(`
            SELECT * FROM dispatch_centers
            ORDER BY created_at DESC
        `);
        console.log(`   ✅ ${centers.length} centros encontrados`);
        
        // 2. Exportar fleet_drivers
        console.log('🚗 Obteniendo conductores...');
        const drivers = await db.all(`
            SELECT fd.*, u.email as user_email
            FROM fleet_drivers fd
            LEFT JOIN users u ON fd.user_id = u.id
            ORDER BY fd.created_at DESC
        `);
        console.log(`   ✅ ${drivers.length} conductores encontrados`);
        
        // 3. Exportar pickup_points_dispensary
        console.log('📍 Obteniendo puntos de retiro...');
        const pickupPoints = await db.all(`
            SELECT * FROM pickup_points_dispensary
            ORDER BY created_at DESC
        `);
        console.log(`   ✅ ${pickupPoints.length} puntos de retiro encontrados`);
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString();
        
        // Exportar dispatch-centers.json
        const centersFile = path.join(apiDir, 'dispatch-centers.json');
        const centersData = {
            success: true,
            message: 'Centros de despacho exportados correctamente',
            data: { centers },
            total: centers.length,
            timestamp
        };
        fs.writeFileSync(centersFile, JSON.stringify(centersData, null, 2));
        console.log(`✅ Centros exportados a: ${centersFile}`);
        
        // Exportar fleet-drivers.json
        const driversFile = path.join(apiDir, 'fleet-drivers.json');
        const driversData = {
            success: true,
            message: 'Conductores exportados correctamente',
            data: { drivers },
            total: drivers.length,
            timestamp
        };
        fs.writeFileSync(driversFile, JSON.stringify(driversData, null, 2));
        console.log(`✅ Conductores exportados a: ${driversFile}`);
        
        // Exportar pickup-points.json
        const pickupPointsFile = path.join(apiDir, 'pickup-points.json');
        const pickupPointsData = {
            success: true,
            message: 'Puntos de retiro exportados correctamente',
            data: { points: pickupPoints },
            total: pickupPoints.length,
            timestamp
        };
        fs.writeFileSync(pickupPointsFile, JSON.stringify(pickupPointsData, null, 2));
        console.log(`✅ Puntos de retiro exportados a: ${pickupPointsFile}`);
        
        console.log(`📊 Resumen de exportación:`);
        console.log(`   - Centros de despacho: ${centers.length}`);
        console.log(`   - Conductores: ${drivers.length}`);
        console.log(`   - Puntos de retiro: ${pickupPoints.length}`);
        
        return {
            centers: centersData,
            drivers: driversData,
            pickupPoints: pickupPointsData
        };
        
    } catch (error) {
        console.error('❌ Error durante la exportación de logística:', error);
        throw error;
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        if (getDatabase()) {
            await getDatabase().disconnect();
            console.log('🔌 Base de datos desconectada.');
        }
    }
}

if (require.main === module) {
    exportLogistics()
        .then(() => {
            console.log('✅ Exportación de logística completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportLogistics;

