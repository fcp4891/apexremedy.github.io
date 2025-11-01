#!/usr/bin/env node
/**
 * Script para convertir el password_hash de Pilar de bcrypt a SHA-256
 * Esto permite que funcione con el login estático en frontend
 */

const path = require('path');
const crypto = require('crypto');
const { initDatabase, getDatabase } = require('../src/config/database');

// Hash simple SHA-256 (compatible con seed_users.js)
function hashPassword(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

async function fixPilarPassword() {
    try {
        console.log('🔧 Convirtiendo password de Pilar a SHA-256...');
        
        await initDatabase();
        const db = getDatabase();
        
        // Contraseña conocida para Pilar
        const pilarEmail = 'pila@123.com';
        const pilarPassword = '123456789'; // Contraseña proporcionada por el usuario
        
        // Generar hash SHA-256
        const sha256Hash = hashPassword(pilarPassword);
        
        console.log(`📧 Email: ${pilarEmail}`);
        console.log(`🔑 Password: ${pilarPassword}`);
        console.log(`🔐 Hash SHA-256: ${sha256Hash}`);
        
        // Actualizar en la base de datos
        const result = await db.run(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [sha256Hash, pilarEmail]
        );
        
        if (result.changes > 0) {
            console.log('✅ Password actualizado exitosamente!');
            console.log(`   ${result.changes} registro(s) actualizado(s)`);
        } else {
            console.log('⚠️ No se encontró el usuario con ese email');
        }
        
        await db.disconnect();
        console.log('✅ Proceso completado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixPilarPassword()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = fixPilarPassword;
