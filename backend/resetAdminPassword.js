// resetAdminPassword.js
require('dotenv').config();
const { initDatabase, getDatabase } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    console.log('🔐 Reseteando password del admin...\n');
    
    try {
        await initDatabase();
        const db = getDatabase();
        
        const adminEmail = 'admin@apexremedy.cl';
        const newPassword = 'Admin123!';
        
        // Hashear nuevo password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Nuevo password:', newPassword);
        console.log('🔐 Hash generado:', hashedPassword);
        console.log('');
        
        // Actualizar en la DB
        const result = await db.run(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, adminEmail]
        );
        
        if (result.changes > 0) {
            console.log('✅ Password actualizado exitosamente!');
            console.log(`   ${result.changes} registro(s) actualizado(s)`);
            
            // Verificar
            console.log('\n🔍 Verificando...');
            const user = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
            const isValid = await bcrypt.compare(newPassword, user.password);
            console.log('   Verificación:', isValid ? '✅ OK' : '❌ FAIL');
            
            if (isValid) {
                console.log('\n✅ TODO LISTO! Puedes hacer login con:');
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${newPassword}`);
            }
        } else {
            console.log('⚠️  No se encontró el usuario admin');
        }
        
        await db.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

resetAdminPassword();