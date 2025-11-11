// backend/database/seeders/check-relations.js
// Verificar que existan todos los registros relacionados antes de ejecutar seed de pagos

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
});

async function checkRelations() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n🔍 Verificando registros relacionados...\n');

    // 1. Verificar usuarios
    const userCount = await dbHelper.get('SELECT COUNT(*) as count FROM users');
    console.log(`   👤 Usuarios: ${userCount.count}`);
    if (userCount.count === 0) {
      throw new Error('❌ No hay usuarios en la base de datos. Ejecuta seed-users.js primero.');
    }

    // 2. Verificar órdenes
    const orderCount = await dbHelper.get('SELECT COUNT(*) as count FROM orders');
    console.log(`   📦 Órdenes: ${orderCount.count}`);
    // Órdenes son opcionales, pero advertir si no hay

    // 3. Verificar proveedores de pago
    const providerCount = await dbHelper.get('SELECT COUNT(*) as count FROM payment_providers');
    console.log(`   💳 Proveedores de pago: ${providerCount.count}`);
    if (providerCount.count === 0) {
      throw new Error('❌ No hay proveedores de pago. Ejecuta seed-parametricas.js primero.');
    }

    // 4. Verificar métodos de pago
    const methodCount = await dbHelper.get('SELECT COUNT(*) as count FROM payment_methods');
    console.log(`   💳 Métodos de pago: ${methodCount.count}`);
    if (methodCount.count === 0) {
      throw new Error('❌ No hay métodos de pago. Ejecuta seed-parametricas.js primero.');
    }

    // 5. Verificar pagos existentes sin relaciones válidas
    const orphanPayments = await dbHelper.all(`
      SELECT p.id, p.order_id, p.customer_id, p.provider_id
      FROM payments p
      LEFT JOIN users u ON p.customer_id = u.id
      WHERE p.customer_id IS NOT NULL AND u.id IS NULL
    `);

    if (orphanPayments.length > 0) {
      console.log(`\n   ⚠️  Pagos huérfanos encontrados: ${orphanPayments.length}`);
      console.log('   ❌ Hay pagos sin customer_id válido. Corrige estos registros primero.');
      console.log('   Ejemplo de IDs afectados:', orphanPayments.slice(0, 5).map(p => p.id).join(', '));
      throw new Error(`Existen ${orphanPayments.length} pagos con customer_id inválido.`);
    }

    // Verificar pagos con order_id inválido
    const orphanOrderPayments = await dbHelper.all(`
      SELECT p.id, p.order_id
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.order_id IS NOT NULL AND o.id IS NULL
    `);

    if (orphanOrderPayments.length > 0) {
      console.log(`\n   ⚠️  Pagos con order_id inválido encontrados: ${orphanOrderPayments.length}`);
      console.log('   Estos pagos no tienen una orden válida asociada.');
      // No es crítico, solo advertir
      console.log('   ⚠️  Advertencia: Se continuará, pero algunos pagos no tendrán order_id válido.');
    }

    // Verificar pagos con provider_id inválido
    const orphanProviderPayments = await dbHelper.all(`
      SELECT p.id, p.provider_id
      FROM payments p
      LEFT JOIN payment_providers pp ON p.provider_id = pp.id
      WHERE p.provider_id IS NOT NULL AND pp.id IS NULL
    `);

    if (orphanProviderPayments.length > 0) {
      console.log(`\n   ⚠️  Pagos con provider_id inválido encontrados: ${orphanProviderPayments.length}`);
      console.log('   Estos pagos no tienen un proveedor válido asociado.');
      // No es crítico, solo advertir
      console.log('   ⚠️  Advertencia: Se continuará, pero algunos pagos no tendrán provider_id válido.');
    }

    console.log('\n✅ Todos los registros relacionados están correctos.');
    console.log('✅ No hay pagos huérfanos sin relaciones válidas.\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ Error en verificación:', error.message);
    return false;
  } finally {
    db.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  checkRelations()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkRelations };









