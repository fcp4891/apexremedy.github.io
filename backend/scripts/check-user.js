// Script para verificar usuario en la BD
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/apexremedy.db');
const db = new sqlite3.Database(dbPath);

const email = process.argv[2] || 'admin@apexremedy.local';

db.get(
    'SELECT email, password, is_verified, status FROM users WHERE email = ?',
    [email],
    (err, row) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        if (row) {
            console.log('\n✅ Usuario encontrado:');
            console.log('   Email:', row.email);
            console.log('   Hash (primeros 40 chars):', row.password ? row.password.substring(0, 40) + '...' : 'null');
            console.log('   Hash tipo:', row.password ? (row.password.startsWith('$2') ? 'bcrypt' : 'SHA-256') : 'null');
            console.log('   Verificado:', row.is_verified);
            console.log('   Estado:', row.status);
        } else {
            console.log(`\n❌ Usuario ${email} NO existe en la BD`);
            console.log('\n💡 Crear usuario con:');
            console.log('   node backend/database/seeders/seed-users.js --add-demo');
        }
        
        db.close();
    }
);

