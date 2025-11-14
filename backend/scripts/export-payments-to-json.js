#!/usr/bin/env node
/**
 * Script para exportar pagos (payments) de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de pagos
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');
const Payment = require('../src/models/Payment');

async function exportPayments() {
    try {
        console.log('🚀 Iniciando exportación de pagos a JSON...');
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const paymentsFile = path.join(apiDir, 'payments.json');
            const emptyData = {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    payments: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(paymentsFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', paymentsFile);
            return emptyData;
        }
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        
        // Crear instancia del modelo
        const paymentModel = new Payment();
        
        // Obtener todos los pagos usando findAllWithFilters
        console.log('📦 Obteniendo pagos de la base de datos...');
        const payments = await paymentModel.findAllWithFilters({ limit: 10000 });
        
        console.log(`📦 ${payments.length} pagos encontrados`);
        
        // Normalizar pagos
        console.log('🔄 Normalizando datos de pagos...');
        const normalizedPayments = payments.map(payment => {
            try {
                // Obtener información del cliente desde users si customer_id existe
                let customer_name = payment.customer_name || null;
                let customer_email = payment.customer_email || null;
                
                // Normalizar pago
                const normalizedPayment = {
                    id: payment.id,
                    order_id: payment.order_id || null,
                    customer_id: payment.customer_id || null,
                    provider_id: payment.provider_id || null,
                    method: payment.method || null,
                    status: payment.status || 'pending',
                    amount: parseFloat(payment.amount) || 0,
                    amount_net: parseFloat(payment.amount_net) || 0,
                    amount_gross: parseFloat(payment.amount_gross) || parseFloat(payment.amount) || 0,
                    fee: parseFloat(payment.fee) || 0,
                    currency: payment.currency || 'CLP',
                    transaction_id: payment.transaction_id || null,
                    authorization_code: payment.authorization_code || null,
                    external_id: payment.external_id || null,
                    payment_proof: payment.payment_proof || null,
                    notes: payment.notes || null,
                    metadata: payment.metadata ? (typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata) : null,
                    created_at: payment.created_at,
                    updated_at: payment.updated_at,
                    // Información del cliente
                    customer_name: customer_name || payment.customer_name || null,
                    customer_email: customer_email || payment.customer_email || null,
                    // Información adicional del proveedor
                    provider_name: payment.provider_name || null
                };
                
                return normalizedPayment;
            } catch (error) {
                console.warn(`⚠️ Error al procesar pago ${payment.id}:`, error.message);
                // Retornar pago mínimo si hay error
                return {
                    id: payment.id,
                    order_id: payment.order_id || null,
                    customer_id: payment.customer_id || null,
                    method: payment.method || null,
                    status: payment.status || 'pending',
                    amount: parseFloat(payment.amount) || 0,
                    amount_gross: parseFloat(payment.amount_gross) || parseFloat(payment.amount) || 0,
                    currency: payment.currency || 'CLP',
                    created_at: payment.created_at,
                    updated_at: payment.updated_at,
                    customer_name: payment.customer_name || null,
                    customer_email: payment.customer_email || null
                };
            }
        });
        
        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Pagos exportados correctamente',
            data: {
                payments: normalizedPayments,
                total: normalizedPayments.length,
                timestamp: new Date().toISOString()
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Exportar a JSON
        const paymentsFile = path.join(apiDir, 'payments.json');
        fs.writeFileSync(paymentsFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ ${normalizedPayments.length} pagos exportados a: ${paymentsFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Total pagos: ${normalizedPayments.length}`);
        console.log(`   - Capturados: ${normalizedPayments.filter(p => p.status === 'captured').length}`);
        console.log(`   - Autorizados: ${normalizedPayments.filter(p => p.status === 'authorized').length}`);
        console.log(`   - Pendientes: ${normalizedPayments.filter(p => p.status === 'pending').length}`);
        console.log(`   - Fallidos: ${normalizedPayments.filter(p => p.status === 'failed').length}`);
        console.log(`   - Anulados: ${normalizedPayments.filter(p => p.status === 'voided').length}`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de pagos:', error);
        throw error;
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        if (getDatabase()) {
            await getDatabase().disconnect();
            console.log('🔌 Base de datos desconectada.');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    exportPayments()
        .then(() => {
            console.log('✅ Exportación de pagos completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportPayments;

