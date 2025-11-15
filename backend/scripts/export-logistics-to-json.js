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
                },
                'internal-delivery-zones.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { zones: [] },
                    total: 0,
                    timestamp
                },
                'packing-materials.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { materials: [] },
                    total: 0,
                    timestamp
                },
                'shipping-providers.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { providers: [] },
                    total: 0,
                    timestamp
                },
                'free-shipping-rules.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { rules: [] },
                    total: 0,
                    timestamp
                },
                'restricted-zones.json': {
                    success: true,
                    message: 'JSON vacío - base de datos no disponible',
                    data: { zones: [] },
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
        
        // 4. Exportar internal_delivery_zones
        console.log('🗺️ Obteniendo zonas de entrega interna...');
        let zones = [];
        try {
            zones = await db.all(`
                SELECT * FROM internal_delivery_zones
                ORDER BY created_at DESC
            `);
            console.log(`   ✅ ${zones.length} zonas de entrega encontradas`);
        } catch (zonesError) {
            console.warn('   ⚠️ No se pudieron obtener zonas de entrega:', zonesError.message);
        }
        
        // 5. Exportar packing_materials
        console.log('📦 Obteniendo materiales de empaque...');
        let materials = [];
        try {
            materials = await db.all(`
                SELECT * FROM packing_materials
                ORDER BY created_at DESC
            `);
            console.log(`   ✅ ${materials.length} materiales de empaque encontrados`);
        } catch (materialsError) {
            console.warn('   ⚠️ No se pudieron obtener materiales de empaque:', materialsError.message);
        }
        
        // 6. Exportar shipping_providers
        console.log('🚚 Obteniendo proveedores de envío...');
        let providers = [];
        try {
            providers = await db.all(`
                SELECT * FROM shipping_providers
                ORDER BY created_at DESC
            `);
            console.log(`   ✅ ${providers.length} proveedores de envío encontrados`);
        } catch (providersError) {
            console.warn('   ⚠️ No se pudieron obtener proveedores de envío:', providersError.message);
        }
        
        // 7. Exportar free_shipping_rules
        console.log('🆓 Obteniendo reglas de envío gratis...');
        let freeShippingRules = [];
        try {
            freeShippingRules = await db.all(`
                SELECT * FROM free_shipping_rules
                ORDER BY created_at DESC
            `);
            console.log(`   ✅ ${freeShippingRules.length} reglas de envío gratis encontradas`);
        } catch (rulesError) {
            console.warn('   ⚠️ No se pudieron obtener reglas de envío gratis:', rulesError.message);
        }
        
        // 8. Exportar restricted_zones
        console.log('🚫 Obteniendo zonas restringidas...');
        let restrictedZones = [];
        try {
            restrictedZones = await db.all(`
                SELECT * FROM restricted_zones
                ORDER BY created_at DESC
            `);
            console.log(`   ✅ ${restrictedZones.length} zonas restringidas encontradas`);
        } catch (zonesError) {
            console.warn('   ⚠️ No se pudieron obtener zonas restringidas:', zonesError.message);
        }
        
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
        
        // Exportar internal-delivery-zones.json
        const zonesFile = path.join(apiDir, 'internal-delivery-zones.json');
        const zonesData = {
            success: true,
            message: 'Zonas de entrega interna exportadas correctamente',
            data: { zones },
            total: zones.length,
            timestamp
        };
        fs.writeFileSync(zonesFile, JSON.stringify(zonesData, null, 2));
        console.log(`✅ Zonas de entrega exportadas a: ${zonesFile}`);
        
        // Exportar packing-materials.json
        const materialsFile = path.join(apiDir, 'packing-materials.json');
        const materialsData = {
            success: true,
            message: 'Materiales de empaque exportados correctamente',
            data: { materials },
            total: materials.length,
            timestamp
        };
        fs.writeFileSync(materialsFile, JSON.stringify(materialsData, null, 2));
        console.log(`✅ Materiales de empaque exportados a: ${materialsFile}`);
        
        // Exportar shipping-providers.json
        const providersFile = path.join(apiDir, 'shipping-providers.json');
        const providersData = {
            success: true,
            message: 'Proveedores de envío exportados correctamente',
            data: { providers },
            total: providers.length,
            timestamp
        };
        fs.writeFileSync(providersFile, JSON.stringify(providersData, null, 2));
        console.log(`✅ Proveedores de envío exportados a: ${providersFile}`);
        
        // Exportar free-shipping-rules.json
        const freeShippingRulesFile = path.join(apiDir, 'free-shipping-rules.json');
        const freeShippingRulesData = {
            success: true,
            message: 'Reglas de envío gratis exportadas correctamente',
            data: { rules: freeShippingRules },
            total: freeShippingRules.length,
            timestamp
        };
        fs.writeFileSync(freeShippingRulesFile, JSON.stringify(freeShippingRulesData, null, 2));
        console.log(`✅ Reglas de envío gratis exportadas a: ${freeShippingRulesFile}`);
        
        // Exportar restricted-zones.json
        const restrictedZonesFile = path.join(apiDir, 'restricted-zones.json');
        const restrictedZonesData = {
            success: true,
            message: 'Zonas restringidas exportadas correctamente',
            data: { zones: restrictedZones },
            total: restrictedZones.length,
            timestamp
        };
        fs.writeFileSync(restrictedZonesFile, JSON.stringify(restrictedZonesData, null, 2));
        console.log(`✅ Zonas restringidas exportadas a: ${restrictedZonesFile}`);
        
        console.log(`📊 Resumen de exportación:`);
        console.log(`   - Centros de despacho: ${centers.length}`);
        console.log(`   - Conductores: ${drivers.length}`);
        console.log(`   - Puntos de retiro: ${pickupPoints.length}`);
        console.log(`   - Zonas de entrega: ${zones.length}`);
        console.log(`   - Materiales de empaque: ${materials.length}`);
        console.log(`   - Proveedores de envío: ${providers.length}`);
        console.log(`   - Reglas de envío gratis: ${freeShippingRules.length}`);
        console.log(`   - Zonas restringidas: ${restrictedZones.length}`);
        
        return {
            centers: centersData,
            drivers: driversData,
            pickupPoints: pickupPointsData,
            zones: zonesData,
            materials: materialsData,
            providers: providersData,
            freeShippingRules: freeShippingRulesData,
            restrictedZones: restrictedZonesData
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

