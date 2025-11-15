#!/usr/bin/env node
/**
 * Script para exportar envíos de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de envíos
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');

async function exportShipments() {
    try {
        console.log('🚀 Iniciando exportación de envíos a JSON...');
        
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío de envíos...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const shipmentsFile = path.join(apiDir, 'shipments.json');
            const emptyData = {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    shipments: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(shipmentsFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío de envíos creado:', shipmentsFile);
            return emptyData;
        }
        
        await initDatabase();
        const db = getDatabase();
        
        // Obtener todos los envíos con sus eventos y items
        console.log('📦 Obteniendo envíos de la base de datos...');
        const shipments = await db.all(`
            SELECT s.*,
                   o.total as order_total,
                   o.customer_name,
                   o.customer_email,
                   o.status as order_status
            FROM shipments s
            LEFT JOIN orders o ON s.order_id = o.id
            ORDER BY s.created_at DESC
        `);
        
        console.log(`📦 ${shipments.length} envíos encontrados`);
        
        // Para cada envío, obtener eventos y items
        const shipmentsWithDetails = await Promise.all(shipments.map(async (shipment) => {
            // Obtener eventos del envío
            const events = await db.all(`
                SELECT * FROM shipment_events
                WHERE shipment_id = ?
                ORDER BY event_at DESC
            `, [shipment.id]);
            
            // Obtener items del envío
            const items = await db.all(`
                SELECT si.*, p.name as product_name
                FROM shipment_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.shipment_id = ?
            `, [shipment.id]);
            
            // Obtener provider_name si hay provider_id
            let provider_name = null;
            if (shipment.provider_id) {
                const provider = await db.get(`
                    SELECT name FROM shipping_providers WHERE id = ?
                `, [shipment.provider_id]);
                if (provider) {
                    provider_name = provider.name;
                }
            }
            
            return {
                ...shipment,
                provider_name: provider_name || shipment.carrier,
                events: events || [],
                items: items || [],
                order_number: shipment.order_id
            };
        }));
        
        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Envíos exportados correctamente',
            data: {
                shipments: shipmentsWithDetails,
                total: shipmentsWithDetails.length,
                timestamp: new Date().toISOString()
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Exportar a JSON
        const shipmentsFile = path.join(apiDir, 'shipments.json');
        fs.writeFileSync(shipmentsFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ ${shipmentsWithDetails.length} envíos exportados a: ${shipmentsFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Total envíos: ${shipmentsWithDetails.length}`);
        console.log(`   - Estados: ${[...new Set(shipmentsWithDetails.map(s => s.status))].join(', ')}`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de envíos:', error);
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
    exportShipments()
        .then(() => {
            console.log('✅ Exportación de envíos completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportShipments;

