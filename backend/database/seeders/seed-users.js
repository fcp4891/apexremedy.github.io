// backend/database/seeders/seed-users.js
// Seed de usuarios - Respeta usuarios existentes
// Uso: node seed-users.js [--list-only] [--add-demo]

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// ============================================
// UTILIDADES
// ============================================

const createDbHelper = (db) => ({
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
});

// Hash de contraseña simple (en producción usar bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Procesar argumentos
const args = process.argv.slice(2);
const options = {
  listOnly: args.includes('--list-only'),
  addDemo: args.includes('--add-demo')
};

// ============================================
// USUARIOS DEMO (SOLO SI SE SOLICITA)
// ============================================

const DEMO_USERS = [
  {
    email: 'admin@apexremedy.local',
    password: 'Admin123!',
    first_name: 'Felipe',
    last_name: 'Céspedes',
    name: 'Felipe Céspedes',
    phone: '+56912345678',
    date_of_birth: '1990-01-01',
    rut: '16234567-3',
    is_verified: 1,
    medicinal_blocked: 0,
    role_code: 'admin',
    status: 'active'
  },
  {
    email: 'admin@apexremedy.cl',
    password: 'Admin123!',
    first_name: 'Antonia',
    last_name: 'González',
    name: 'Antonia González',
    phone: '+56992345678',
    date_of_birth: '1990-01-01',
    rut: '15789456-K',
    is_verified: 1,
    medicinal_blocked: 0,
    role_code: 'admin',
    status: 'active'
  },
  {
    email: 'cliente1@demo.cl',
    password: 'Cliente123!',
    first_name: 'Juan',
    last_name: 'Pérez',
    name: 'Juan Pérez',
    phone: '+56911111111',
    date_of_birth: '1995-08-20',
    rut: '13579246-7',
    is_verified: 1,
    medicinal_blocked: 0,
    role_code: 'customer',
    role: 'customer',
    status: 'active'
  },
  {
    email: 'cliente2@demo.cl',
    password: 'Cliente123!',
    first_name: 'María',
    last_name: 'González',
    name: 'María González',
    phone: '+56922222222',
    date_of_birth: '1990-03-15',
    rut: '12345678-5',
    is_verified: 1,
    medicinal_blocked: 0,
    role_code: 'customer',
    role: 'customer',
    status: 'active'
  }
];

// ============================================
// FUNCIÓN PARA LISTAR USUARIOS
// ============================================

async function listUsers(dbHelper) {
  console.log('\n👥 USUARIOS EXISTENTES:\n');
  console.log('='.repeat(80));

  const users = await dbHelper.all(`
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.name,
      u.phone,
      u.is_verified,
      u.medicinal_blocked,
      u.status,
      u.created_at,
      GROUP_CONCAT(r.code) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
    ORDER BY u.id ASC
  `);

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios registrados en el sistema');
    console.log('\n💡 Sugerencia: Ejecuta con --add-demo para agregar usuarios de prueba');
  } else {
    console.log(`📊 Total: ${users.length} usuarios\n`);
    
    users.forEach((user, index) => {
      const fullName = user.name || 
        (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 
         user.first_name || user.last_name || 'Sin nombre');
      console.log(`${index + 1}. ${fullName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Teléfono: ${user.phone || 'N/A'}`);
      console.log(`   👤 Roles: ${user.roles || 'Sin rol asignado'}`);
      console.log(`   ✓ Verificado: ${user.is_verified ? 'Sí' : 'No'}`);
      console.log(`   🚫 Medicinal bloqueado: ${user.medicinal_blocked ? 'Sí' : 'No'}`);
      console.log(`   📅 Creado: ${new Date(user.created_at).toLocaleDateString('es-CL')}`);
      console.log(`   🟢 Estado: ${user.status}`);
      console.log('   ' + '-'.repeat(76));
    });
  }

  console.log('='.repeat(80) + '\n');

  // Estadísticas
  const stats = await dbHelper.all(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN medicinal_blocked = 1 THEN 1 ELSE 0 END) as blocked
    FROM users
  `);

  if (stats[0].total > 0) {
    console.log('📈 ESTADÍSTICAS:');
    console.log(`   Total usuarios: ${stats[0].total}`);
    console.log(`   Verificados: ${stats[0].verified} (${Math.round(stats[0].verified / stats[0].total * 100)}%)`);
    console.log(`   Bloqueados: ${stats[0].blocked}`);
    console.log();
  }

  return users.length;
}

// ============================================
// FUNCIÓN PARA AGREGAR USUARIOS DEMO
// ============================================

async function addDemoUsers(dbHelper) {
  console.log('\n🎭 AGREGANDO USUARIOS DE DEMOSTRACIÓN:\n');
  console.log('='.repeat(80));

  let added = 0;
  let skipped = 0;

  for (const demoUser of DEMO_USERS) {
    try {
      // Verificar si el usuario ya existe
      const existing = await dbHelper.all('SELECT id FROM users WHERE email = ?', [demoUser.email]);
      
      if (existing.length > 0) {
        console.log(`  ⚠️  Usuario ya existe: ${demoUser.email}`);
        skipped++;
        continue;
      }

      // Insertar usuario
      const hashedPassword = hashPassword(demoUser.password);
      
      // Determinar el rol a usar (priorizar role_code sobre role)
      const userRole = demoUser.role_code || demoUser.role || 'customer';
      
      const result = await dbHelper.run(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, name, phone, date_of_birth, rut,
          role, is_verified, is_active, medicinal_blocked, status, account_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        demoUser.email, 
        hashedPassword, 
        demoUser.first_name || '', 
        demoUser.last_name || '',
        demoUser.name || `${demoUser.first_name || ''} ${demoUser.last_name || ''}`.trim(),
        demoUser.phone,
        demoUser.date_of_birth, 
        demoUser.rut, 
        userRole, // Usar el rol correcto desde el inicio
        demoUser.is_verified || 0,
        1, // is_active
        demoUser.medicinal_blocked || 0,
        demoUser.status || 'active',
        'approved', // account_status (usuarios demo aprobados)
        new Date().toISOString(), 
        new Date().toISOString()
      ]);

      const userId = result.lastID;

      // Asignar rol si existe
      if (demoUser.role_code) {
        const role = await dbHelper.all('SELECT id FROM roles WHERE code = ?', [demoUser.role_code]);
        if (role.length > 0) {
          await dbHelper.run(`
            INSERT INTO user_roles (user_id, role_id, assigned_at)
            VALUES (?, ?, ?)
          `, [userId, role[0].id, new Date().toISOString()]);
        }
      }

      console.log(`  ✓ Usuario creado: ${demoUser.email}`);
      console.log(`     Nombre: ${demoUser.name}`);
      console.log(`     Contraseña: ${demoUser.password}`);
      console.log(`     Rol: ${demoUser.role_code}`);
      console.log();
      added++;

    } catch (error) {
      console.error(`  ✗ Error creando ${demoUser.email}:`, error.message);
      skipped++;
    }
  }

  console.log('='.repeat(80));
  console.log(`\n✅ Usuarios creados: ${added}`);
  console.log(`⚠️  Usuarios saltados: ${skipped}`);
  console.log(`📊 Total procesado: ${added + skipped}\n`);

  if (added > 0) {
    console.log('⚠️  IMPORTANTE: Estas son credenciales de DEMOSTRACIÓN');
    console.log('   Cámbialas antes de usar en producción!\n');
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedUsers() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         👤 APEX REMEDY - GESTIÓN DE USUARIOS 👤            ║
║                                                            ║
║  Respeta usuarios existentes - No modifica datos          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    const userCount = await listUsers(dbHelper);

    if (!options.listOnly) {
      if (options.addDemo) {
        await addDemoUsers(dbHelper);
        
        // Mostrar lista actualizada
        console.log('\n📋 Lista actualizada de usuarios:');
        await listUsers(dbHelper);
      } else {
        if (userCount === 0) {
          console.log('💡 SUGERENCIAS:');
          console.log('   • Usa --add-demo para agregar usuarios de prueba');
          console.log('   • O crea usuarios a través de tu sistema de registro\n');
        }
      }
    }

    console.log('✅ Proceso completado\n');

  } catch (error) {
    console.error('\n❌ Error durante el proceso:', error);
    throw error;
  } finally {
    db.close();
  }
}

// ============================================
// EJECUTAR
// ============================================

console.log('Opciones disponibles:');
console.log('  --list-only          Solo mostrar usuarios existentes');
console.log('  --add-demo           Agregar usuarios de demostración\n');

seedUsers()
  .then(() => {
    console.log('✅ Script finalizado con éxito');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });