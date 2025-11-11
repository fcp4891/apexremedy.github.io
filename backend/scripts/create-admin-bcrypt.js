#!/usr/bin/env node
// Script para crear usuario admin con bcrypt (para local/producción)
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/apexremedy.db');
const email = 'admin@apexremedy.local';
const password = 'Admin123!';
const name = 'Administrador';

async function createAdmin() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        // Verificar si existe
        db.get('SELECT id, email FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                db.close();
                return reject(err);
            }
            
            if (row) {
                console.log(`\n⚠️  Usuario ${email} ya existe (ID: ${row.id})`);
                console.log('💡 Si necesitas actualizar la contraseña, elimina el usuario primero');
                db.close();
                return resolve(false);
            }
            
            // Crear hash con bcrypt
            try {
                const password_hash = await bcrypt.hash(password, 10);
                const now = new Date().toISOString();
                
                // Verificar estructura de la tabla
                db.run(`
                    INSERT INTO users (
                        email, password, name, 
                        is_verified, status, role,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    email,
                    password_hash, // Guardar como 'password' en la tabla
                    name,
                    1, // is_verified
                    'active', // status
                    'admin', // role (si existe la columna, sino será null)
                    now,
                    now
                ], function(err) {
                    if (err) {
                        console.error('❌ Error insertando usuario:', err.message);
                        
                        // Intentar sin columna role
                        db.run(`
                            INSERT INTO users (
                                email, password, name, 
                                is_verified, status,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [
                            email,
                            password_hash,
                            name,
                            1,
                            'active',
                            now,
                            now
                        ], function(err2) {
                            if (err2) {
                                console.error('❌ Error en segundo intento:', err2.message);
                                db.close();
                                return reject(err2);
                            }
                            
                            console.log(`\n✅ Usuario admin creado exitosamente!`);
                            console.log(`   Email: ${email}`);
                            console.log(`   Password: ${password}`);
                            console.log(`   Hash tipo: bcrypt`);
                            console.log(`   ID: ${this.lastID}`);
                            db.close();
                            resolve(true);
                        });
                    } else {
                        console.log(`\n✅ Usuario admin creado exitosamente!`);
                        console.log(`   Email: ${email}`);
                        console.log(`   Password: ${password}`);
                        console.log(`   Hash tipo: bcrypt`);
                        console.log(`   ID: ${this.lastID}`);
                        db.close();
                        resolve(true);
                    }
                });
            } catch (error) {
                console.error('❌ Error generando hash:', error.message);
                db.close();
                reject(error);
            }
        });
    });
}

createAdmin()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });









