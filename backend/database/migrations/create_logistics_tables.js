// backend/database/migrations/create_logistics_tables.js
// Script para crear todas las tablas faltantes de logística según logistica_mantenedores.md

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
});

async function createLogisticsTables() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🚚 Creando tablas de logística completas...\n');

    try {
        // ============================================
        // 1. PROVEEDORES DE ENVÍO (Carriers externos y Logística interna)
        // ============================================
        console.log('📦 Creando tablas de proveedores de envío...');
        
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipping_providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                provider_type TEXT NOT NULL DEFAULT 'external',
                description TEXT,
                website TEXT,
                phone TEXT,
                email TEXT,
                is_active INTEGER DEFAULT 1,
                supports_tracking INTEGER DEFAULT 1,
                supports_labels INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla shipping_providers creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS provider_service_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                service_code TEXT NOT NULL,
                service_name TEXT NOT NULL,
                description TEXT,
                estimated_days_min INTEGER,
                estimated_days_max INTEGER,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE CASCADE,
                UNIQUE(provider_id, service_code)
            )
        `);
        console.log('  ✅ Tabla provider_service_types creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS provider_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                zone_name TEXT NOT NULL,
                coverage_type TEXT NOT NULL DEFAULT 'region',
                coverage_data TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla provider_zones creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS provider_credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                credential_type TEXT NOT NULL,
                credential_key TEXT NOT NULL,
                credential_value TEXT NOT NULL,
                is_encrypted INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE CASCADE,
                UNIQUE(provider_id, credential_key)
            )
        `);
        console.log('  ✅ Tabla provider_credentials creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS provider_pickup_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                point_code TEXT NOT NULL,
                point_name TEXT NOT NULL,
                address TEXT NOT NULL,
                commune TEXT NOT NULL,
                city TEXT NOT NULL,
                region TEXT NOT NULL,
                postal_code TEXT,
                phone TEXT,
                operating_hours TEXT,
                latitude REAL,
                longitude REAL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE CASCADE,
                UNIQUE(provider_id, point_code)
            )
        `);
        console.log('  ✅ Tabla provider_pickup_points creada');

        // ============================================
        // 2. OPERATIVA DEL DISPENSARIO (Logística propia)
        // ============================================
        console.log('\n🏢 Creando tablas de operativa del dispensario...');

        // dispatch_centers puede usar warehouses, pero creamos una tabla específica si es necesario
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS dispatch_centers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                warehouse_id INTEGER,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                address TEXT NOT NULL,
                commune TEXT NOT NULL,
                city TEXT NOT NULL,
                region TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                manager_name TEXT,
                operating_hours TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
            )
        `);
        console.log('  ✅ Tabla dispatch_centers creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS internal_delivery_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_name TEXT NOT NULL,
                description TEXT,
                coverage_data TEXT NOT NULL,
                max_distance_km REAL,
                delivery_fee REAL DEFAULT 0,
                estimated_days_min INTEGER DEFAULT 1,
                estimated_days_max INTEGER DEFAULT 3,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla internal_delivery_zones creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS fleet_drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                license_number TEXT,
                vehicle_type TEXT,
                vehicle_plate TEXT,
                vehicle_capacity_kg REAL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla fleet_drivers creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS pickup_points_dispensary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                address TEXT NOT NULL,
                commune TEXT NOT NULL,
                city TEXT NOT NULL,
                region TEXT NOT NULL,
                phone TEXT,
                operating_hours TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla pickup_points_dispensary creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS packing_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_code TEXT NOT NULL UNIQUE,
                material_name TEXT NOT NULL,
                material_type TEXT NOT NULL,
                unit TEXT DEFAULT 'unidad',
                stock_quantity INTEGER DEFAULT 0,
                min_stock_level INTEGER DEFAULT 10,
                cost_per_unit REAL DEFAULT 0,
                supplier TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla packing_materials creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS delivery_time_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_name TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                day_of_week INTEGER,
                is_active INTEGER DEFAULT 1,
                max_orders INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla delivery_time_slots creada');

        // ============================================
        // 3. TARIFAS Y REGLAS DE COSTOS
        // ============================================
        console.log('\n💰 Creando tablas de tarifas y reglas...');

        // shipping_zones ya existe, pero podemos crear una tabla adicional si necesitamos más detalle
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS free_shipping_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_name TEXT NOT NULL,
                min_order_amount REAL NOT NULL,
                applies_to_regions TEXT,
                applies_to_zones TEXT,
                start_date TEXT,
                end_date TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla free_shipping_rules creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS restricted_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_name TEXT NOT NULL,
                restriction_type TEXT NOT NULL DEFAULT 'complete',
                coverage_data TEXT NOT NULL,
                reason TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla restricted_zones creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS package_dimensions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                package_code TEXT NOT NULL UNIQUE,
                package_name TEXT NOT NULL,
                weight_kg REAL NOT NULL,
                length_cm REAL,
                width_cm REAL,
                height_cm REAL,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla package_dimensions creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS insurance_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_name TEXT NOT NULL,
                min_order_value REAL,
                max_order_value REAL,
                insurance_rate REAL DEFAULT 0,
                fixed_insurance_amount REAL,
                applies_to_providers TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla insurance_rules creada');

        // ============================================
        // 4. GESTIÓN OPERATIVA DE ENVÍOS
        // ============================================
        console.log('\n📦 Creando tablas de gestión operativa...');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipment_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                order_item_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity REAL NOT NULL,
                weight_kg REAL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
                FOREIGN KEY (order_item_id) REFERENCES order_items(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        console.log('  ✅ Tabla shipment_items creada');

        // shipment_events ya existe, pero podemos mejorarlo
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS delivery_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                attempt_number INTEGER NOT NULL DEFAULT 1,
                attempt_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'failed',
                reason TEXT,
                notes TEXT,
                attempted_by TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla delivery_attempts creada');

        // returns ya existe, pero podemos crear una tabla específica para shipment_returns
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipment_returns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                return_number TEXT NOT NULL UNIQUE,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'requested',
                requested_at TEXT NOT NULL,
                received_at TEXT,
                processed_at TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla shipment_returns creada');

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS lost_or_damaged_shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                incident_type TEXT NOT NULL,
                incident_date TEXT NOT NULL,
                description TEXT NOT NULL,
                reported_by INTEGER,
                status TEXT NOT NULL DEFAULT 'pending',
                resolution TEXT,
                compensation_amount REAL,
                resolved_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
                FOREIGN KEY (reported_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla lost_or_damaged_shipments creada');

        // Mejorar tabla shipments existente agregando campos faltantes
        try {
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN provider_id INTEGER`);
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN shipping_cost REAL DEFAULT 0`);
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN insurance_amount REAL DEFAULT 0`);
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN packaging_type TEXT`);
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN dispatch_center_id INTEGER`);
            await dbHelper.run(`ALTER TABLE shipments ADD COLUMN driver_id INTEGER`);
            console.log('  ✅ Tabla shipments mejorada con campos adicionales');
        } catch (error) {
            // Si las columnas ya existen, ignorar el error
            if (!error.message.includes('duplicate column name')) {
                console.warn('  ⚠️ Advertencia al mejorar shipments:', error.message);
            }
        }

        // ============================================
        // ÍNDICES
        // ============================================
        console.log('\n🚀 Creando índices...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_shipping_providers_code ON shipping_providers(code)',
            'CREATE INDEX IF NOT EXISTS idx_provider_service_types_provider ON provider_service_types(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_provider_zones_provider ON provider_zones(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_provider_credentials_provider ON provider_credentials(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_provider_pickup_points_provider ON provider_pickup_points(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_dispatch_centers_warehouse ON dispatch_centers(warehouse_id)',
            'CREATE INDEX IF NOT EXISTS idx_fleet_drivers_user ON fleet_drivers(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item ON shipment_items(order_item_id)',
            'CREATE INDEX IF NOT EXISTS idx_delivery_attempts_shipment ON delivery_attempts(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipment_returns_shipment ON shipment_returns(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_lost_damaged_shipment ON lost_or_damaged_shipments(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_provider ON shipments(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_dispatch ON shipments(dispatch_center_id)'
        ];

        for (const index of indexes) {
            try {
                await dbHelper.run(index);
            } catch (error) {
                console.warn(`  ⚠️ No se pudo crear índice: ${error.message}`);
            }
        }
        console.log('  ✅ Índices creados\n');

        console.log('✅ Tablas de logística completas creadas exitosamente!\n');
        console.log('📊 Resumen:');
        console.log('  ✅ 19 tablas nuevas creadas');
        console.log('  ✅ Tabla shipments mejorada');
        console.log('  ✅ Índices optimizados\n');

    } catch (error) {
        console.error('❌ Error creando tablas de logística:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar
if (require.main === module) {
    createLogisticsTables()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { createLogisticsTables };








