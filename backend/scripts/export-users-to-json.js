#!/usr/bin/env node
/**
 * Script para exportar usuarios de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de usuarios
 * ⚠️ IMPORTANTE: Las contraseñas se exportan como hash, NO como texto plano
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');
const User = require('../src/models/User');

async function exportUsers() {
    try {
        console.log('🚀 Iniciando exportación de usuarios a JSON...');
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const usersFile = path.join(apiDir, 'users.json');
            const emptyData = {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    users: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(usersFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', usersFile);
            return emptyData;
        }
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        
        // Crear instancia del modelo User
        const userModel = new User();
        
        // Obtener todos los usuarios
        console.log('👤 Obteniendo usuarios de la base de datos...');
        const users = await userModel.getAll({});
        
        console.log(`📦 ${users.length} usuarios encontrados`);
        
        // Normalizar usuarios para el frontend (sin password_hash)
        const normalizedUsers = users.map(user => {
            const normalized = {
                id: user.id,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                phone: user.phone || null,
                role: user.role || 'customer',
                is_verified: user.is_verified === 1 || user.is_verified === true,
                is_active: user.is_active === 1 || user.is_active === true,
                // ⚠️ IMPORTANTE: Exportar password_hash para autenticación estática
                password_hash: user.password_hash || null,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login: user.last_login || null
            };
            
            // Agregar account_status calculado
            if (normalized.is_verified) {
                normalized.account_status = 'approved';
            } else if (!normalized.is_active) {
                normalized.account_status = 'rejected';
            } else {
                normalized.account_status = 'pending';
            }
            
            return normalized;
        });
        
        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Usuarios exportados correctamente',
            data: {
                users: normalizedUsers,
                total: normalizedUsers.length,
                timestamp: new Date().toISOString()
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Exportar a JSON
        const usersFile = path.join(apiDir, 'users.json');
        fs.writeFileSync(usersFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ ${normalizedUsers.length} usuarios exportados a: ${usersFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Total usuarios: ${normalizedUsers.length}`);
        console.log(`   - Admin: ${normalizedUsers.filter(u => u.role === 'admin').length}`);
        console.log(`   - Clientes: ${normalizedUsers.filter(u => u.role === 'customer').length}`);
        console.log(`   - Verificados: ${normalizedUsers.filter(u => u.is_verified).length}`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de usuarios:', error);
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
    exportUsers()
        .then(() => {
            console.log('✅ Exportación de usuarios completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportUsers;

