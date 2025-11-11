// ============================================
// SCRIPT: Validación de Dashboards
// ============================================
// Valida que todas las tablas, endpoints y datos estén correctos

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    }),
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    })
});

async function validateDashboards() {
    const dbPath = path.join(__dirname, '../database/apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🔍 Validando sistema de dashboards...\n');

    const errors = [];
    const warnings = [];

    try {
        // 1. Validar tablas de analytics
        console.log('📊 Validando tablas de analytics...');
        const analyticsTables = [
            'web_sessions',
            'pageviews',
            'web_events',
            'marketing_campaigns',
            'customer_segments',
            'customer_cohorts',
            'site_searches',
            'cart_abandonment_events'
        ];

        for (const table of analyticsTables) {
            try {
                const result = await dbHelper.get(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  ✅ ${table}: ${result.count} registros`);
                if (result.count === 0) {
                    warnings.push(`${table} está vacía. Ejecuta seed-analytics.js`);
                }
            } catch (error) {
                errors.push(`Tabla ${table} no existe o tiene errores: ${error.message}`);
            }
        }

        // 2. Validar datos relacionados
        console.log('\n🔗 Validando relaciones...');
        
        const users = await dbHelper.get('SELECT COUNT(*) as count FROM users WHERE status = "active"');
        console.log(`  ✅ Usuarios activos: ${users.count}`);
        if (users.count === 0) {
            warnings.push('No hay usuarios activos. Ejecuta seed-users.js');
        }

        const products = await dbHelper.get('SELECT COUNT(*) as count FROM products WHERE status = "active"');
        console.log(`  ✅ Productos activos: ${products.count}`);
        if (products.count === 0) {
            warnings.push('No hay productos activos. Ejecuta seed-products.js');
        }

        const orders = await dbHelper.get('SELECT COUNT(*) as count FROM orders');
        console.log(`  ✅ Órdenes: ${orders.count}`);
        if (orders.count === 0) {
            warnings.push('No hay órdenes. Necesarias para calcular métricas de clientes.');
        }

        // 3. Validar índices
        console.log('\n🔍 Validando índices...');
        const indexes = await dbHelper.all(`
            SELECT name FROM sqlite_master 
            WHERE type = 'index' 
            AND name LIKE 'idx_%'
            ORDER BY name
        `);
        console.log(`  ✅ ${indexes.length} índices encontrados`);

        // 4. Validar vistas
        console.log('\n👁️  Validando vistas...');
        const views = await dbHelper.all(`
            SELECT name FROM sqlite_master 
            WHERE type = 'view' 
            AND name LIKE 'v_%'
        `);
        console.log(`  ✅ ${views.length} vistas encontradas`);

        // 5. Validar datos de analytics
        console.log('\n📈 Validando datos de analytics...');
        
        const sessions = await dbHelper.get('SELECT COUNT(*) as count FROM web_sessions');
        const pageviews = await dbHelper.get('SELECT COUNT(*) as count FROM pageviews');
        const events = await dbHelper.get('SELECT COUNT(*) as count FROM web_events');
        const campaigns = await dbHelper.get('SELECT COUNT(*) as count FROM marketing_campaigns');
        const segments = await dbHelper.get('SELECT COUNT(*) as count FROM customer_segments');
        const cohorts = await dbHelper.get('SELECT COUNT(*) as count FROM customer_cohorts');

        console.log(`  📊 Sesiones: ${sessions.count}`);
        console.log(`  📄 Pageviews: ${pageviews.count}`);
        console.log(`  🎯 Eventos: ${events.count}`);
        console.log(`  📢 Campañas: ${campaigns.count}`);
        console.log(`  👥 Segmentos: ${segments.count}`);
        console.log(`  📊 Cohortes: ${cohorts.count}`);

        // 6. Validar relaciones de sesiones
        if (sessions.count > 0) {
            const sessionsWithUsers = await dbHelper.get(`
                SELECT COUNT(*) as count 
                FROM web_sessions 
                WHERE user_id IS NOT NULL
            `);
            const userRate = (sessionsWithUsers.count / sessions.count * 100).toFixed(1);
            console.log(`  ✅ ${userRate}% de sesiones tienen usuario asociado`);
        }

        // 7. Validar UTM tracking
        if (sessions.count > 0) {
            const sessionsWithUTM = await dbHelper.get(`
                SELECT COUNT(*) as count 
                FROM web_sessions 
                WHERE utm_source IS NOT NULL
            `);
            const utmRate = (sessionsWithUTM.count / sessions.count * 100).toFixed(1);
            console.log(`  ✅ ${utmRate}% de sesiones tienen UTM tracking`);
        }

        // Resumen
        console.log('\n' + '='.repeat(60));
        if (errors.length === 0 && warnings.length === 0) {
            console.log('✅ Validación exitosa: Todo está correcto');
        } else {
            if (errors.length > 0) {
                console.log(`❌ Errores encontrados: ${errors.length}`);
                errors.forEach(e => console.log(`   - ${e}`));
            }
            if (warnings.length > 0) {
                console.log(`\n⚠️  Advertencias: ${warnings.length}`);
                warnings.forEach(w => console.log(`   - ${w}`));
            }
        }
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error en validación:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Ejecutar
if (require.main === module) {
    validateDashboards()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { validateDashboards };

