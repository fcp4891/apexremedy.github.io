// backend/database/migrations/create_tables_mejorado.js
// Script de creación de todas las tablas necesarias para el dispensario
// Versión mejorada: combina actual.js + otro.js + best practices

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { ensureUsersDomain } = require('./domains/users');

/**
 * Helper para ejecutar SQL
 */
const createDbHelper = (db) => ({
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    },
    exec: (sql) => {
        return new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
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
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
});

async function addColumnIfNotExists(dbHelper, table, column, typeDef) {
    const cols = await dbHelper.all(`PRAGMA table_info(${table})`);
    const exists = cols.some(c => c.name === column);
    if (!exists) {
        await dbHelper.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
        console.log(`  ✓ Columna ${column} agregada a ${table}`);
    }
}

async function createTables() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🏗️  Creando estructura de base de datos para dispensario...\n');

    try {
        // ============================================
        // 1. TABLA DE USUARIOS (extendida)
        // ============================================
        await ensureUsersDomain(dbHelper, { addColumnIfNotExists });

        // ============================================
        // 2. RBAC - ROLES Y PERMISOS
        // ============================================
        console.log('🔐 Creando sistema RBAC...');
        
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                description TEXT,
                module TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                assigned_at TEXT NOT NULL,
                assigned_by INTEGER,
                PRIMARY KEY (user_id, role_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Sistema RBAC creado\n');

        // ============================================
        // 3. DIRECCIONES
        // ============================================
        console.log('📍 Creando tabla addresses...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                label TEXT,
                full_name TEXT NOT NULL,
                rut TEXT,
                line1 TEXT NOT NULL,
                line2 TEXT,
                commune TEXT NOT NULL,
                city TEXT NOT NULL,
                region TEXT NOT NULL,
                country TEXT DEFAULT 'Chile',
                postal_code TEXT,
                phone TEXT NOT NULL,
                is_default_shipping INTEGER DEFAULT 0,
                is_default_billing INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla addresses creada\n');

        // ============================================
        // 4. TABLA DE CATEGORÍAS DE PRODUCTOS
        // ============================================
        console.log('📁 Creando tabla product_categories...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                parent_id INTEGER,
                is_medicinal INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                icon TEXT,
                image_url TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES product_categories(id)
            )
        `);
        console.log('  ✅ Tabla product_categories creada\n');

        // ============================================
        // 5. TABLA DE MARCAS
        // ============================================
        console.log('🏷️  Creando tabla brands...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                logo_url TEXT,
                website TEXT,
                country TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla brands creada\n');

        // ============================================
        // 5.1 TABLA DE PROVEEDORES
        // ============================================
        console.log('🏭 Creando tabla suppliers...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                code TEXT UNIQUE,
                contact_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                region TEXT,
                country TEXT DEFAULT 'Chile',
                website TEXT,
                notes TEXT,
                rating REAL DEFAULT 0,
                total_orders INTEGER DEFAULT 0,
                total_purchases REAL DEFAULT 0,
                average_delivery_days INTEGER DEFAULT 0,
                last_order_date TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla suppliers creada\n');

        // ============================================
        // 5.2 TABLA DE ÓRDENES DE COMPRA
        // ============================================
        console.log('📋 Creando tabla purchase_orders...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                total_amount REAL NOT NULL DEFAULT 0,
                currency TEXT DEFAULT 'CLP',
                order_date TEXT NOT NULL,
                expected_delivery_date TEXT,
                actual_delivery_date TEXT,
                payment_status TEXT DEFAULT 'pending',
                payment_method TEXT,
                tracking_number TEXT,
                notes TEXT,
                created_by INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla purchase_orders creada\n');

        // ============================================
        // 5.3 TABLA DE ITEMS DE ÓRDENES DE COMPRA
        // ============================================
        console.log('📦 Creando tabla purchase_order_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity REAL NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                received_quantity REAL DEFAULT 0,
                warehouse_id INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
            )
        `);
        console.log('  ✅ Tabla purchase_order_items creada\n');

        // ============================================
        // 6. TABLA DE PRODUCTOS
        // ============================================
        console.log('📦 Creando tabla products...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                sku TEXT UNIQUE,
                description TEXT,
                short_description TEXT,
                category_id INTEGER NOT NULL,
                brand_id INTEGER,
                product_type TEXT NOT NULL,
                is_medicinal INTEGER DEFAULT 0,
                requires_prescription INTEGER DEFAULT 0,
                medical_category TEXT,
                base_price REAL NOT NULL,
                stock_quantity REAL NOT NULL DEFAULT 0,
                stock_unit TEXT NOT NULL DEFAULT 'unidades',
                unit_type TEXT,
                base_unit TEXT,
                unit_size REAL,
                low_stock_threshold REAL DEFAULT 10,
                cannabinoid_profile TEXT,
                terpene_profile TEXT,
                strain_info TEXT,
                therapeutic_info TEXT,
                usage_info TEXT,
                safety_info TEXT,
                specifications TEXT,
                attributes TEXT,
                weight REAL,
                dimensions TEXT,
                featured INTEGER DEFAULT 0,
                supplier_id INTEGER,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES product_categories(id),
                FOREIGN KEY (brand_id) REFERENCES brands(id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla products creada\n');

        // ============================================
        // 7. TABLA DE VARIANTES DE PRECIO
        // ============================================
        console.log('💰 Creando tabla product_price_variants...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_price_variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                variant_name TEXT NOT NULL,
                variant_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                price REAL NOT NULL,
                compare_at_price REAL,
                is_default INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_price_variants creada\n');

        // ============================================
        // 8. TABLA DE IMÁGENES DE PRODUCTOS
        // ============================================
        console.log('🖼️  Creando tabla product_images...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                alt_text TEXT,
                display_order INTEGER DEFAULT 0,
                is_primary INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_images creada\n');

        // ============================================
        // 9. TABLA DE VARIANTES DE PRODUCTOS
        // ============================================
        console.log('📊 Creando tabla product_variants...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sku TEXT UNIQUE,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                price REAL NOT NULL,
                compare_at_price REAL,
                stock_quantity REAL NOT NULL DEFAULT 0,
                weight REAL,
                barcode TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_variants creada\n');

        // ============================================
        // 10. INVENTARIO POR ALMACÉN
        // ============================================
        console.log('📦 Creando tabla inventory_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                address TEXT,
                city TEXT,
                region TEXT,
                is_default INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS inventory_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                warehouse_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                quantity REAL NOT NULL DEFAULT 0,
                reserved_quantity REAL NOT NULL DEFAULT 0,
                available_quantity REAL GENERATED ALWAYS AS (quantity - reserved_quantity) VIRTUAL,
                last_count_at TEXT,
                last_count_by INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (variant_id) REFERENCES product_variants(id),
                FOREIGN KEY (last_count_by) REFERENCES users(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS inventory_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                warehouse_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                movement_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                reference_type TEXT,
                reference_id INTEGER,
                notes TEXT,
                performed_by INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (variant_id) REFERENCES product_variants(id),
                FOREIGN KEY (performed_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Sistema de inventario creado\n');

        // ============================================
        // 11. SEO Y METADATA
        // ============================================
        console.log('🔍 Creando tablas de SEO...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS seo_meta (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                meta_title TEXT,
                meta_description TEXT,
                meta_keywords TEXT,
                canonical_url TEXT,
                og_title TEXT,
                og_description TEXT,
                og_image TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(entity_type, entity_id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS redirects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_path TEXT NOT NULL UNIQUE,
                to_path TEXT NOT NULL,
                code INTEGER DEFAULT 301,
                hits INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tablas de SEO creadas\n');

        // ============================================
        // 12. CARRITO DE COMPRAS
        // ============================================
        console.log('🛒 Creando tabla cart_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_id TEXT,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                price_variant_id INTEGER,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id),
                FOREIGN KEY (price_variant_id) REFERENCES product_price_variants(id)
            )
        `);
        console.log('  ✅ Tabla cart_items creada\n');

        // ============================================
        // 13. CARRITOS ABANDONADOS
        // ============================================
        console.log('🛒 Creando tabla abandoned_carts...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS abandoned_carts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                cart_data TEXT,
                last_seen_at TEXT NOT NULL,
                recovery_sent_at TEXT,
                recovery_email_count INTEGER DEFAULT 0,
                recovered_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla abandoned_carts creada\n');

        // ============================================
        // 14. ÓRDENES
        // ============================================
        console.log('📝 Creando tabla orders...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                payment_status TEXT NOT NULL DEFAULT 'pending',
                fulfillment_status TEXT DEFAULT 'unfulfilled',
                subtotal REAL NOT NULL,
                tax_amount REAL NOT NULL DEFAULT 0,
                shipping_amount REAL NOT NULL DEFAULT 0,
                discount_amount REAL NOT NULL DEFAULT 0,
                total REAL NOT NULL,
                currency TEXT DEFAULT 'CLP',
                notes TEXT,
                customer_notes TEXT,
                ip_address TEXT,
                user_agent TEXT,
                shipping_address_id INTEGER,
                billing_address_id INTEGER,
                shipping_method TEXT,
                tracking_number TEXT,
                shipped_at TEXT,
                delivered_at TEXT,
                cancelled_at TEXT,
                cancellation_reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
                FOREIGN KEY (billing_address_id) REFERENCES addresses(id)
            )
        `);
        console.log('  ✅ Tabla orders creada\n');

        // ============================================
        // 15. ITEMS DE ÓRDENES
        // ============================================
        console.log('📋 Creando tabla order_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                price_variant_id INTEGER,
                product_name TEXT NOT NULL,
                variant_name TEXT,
                quantity REAL NOT NULL,
                unit_price REAL NOT NULL,
                subtotal REAL NOT NULL,
                tax_amount REAL DEFAULT 0,
                discount_amount REAL DEFAULT 0,
                total REAL NOT NULL,
                requires_prescription INTEGER DEFAULT 0,
                prescription_id INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (variant_id) REFERENCES product_variants(id),
                FOREIGN KEY (price_variant_id) REFERENCES product_price_variants(id),
                FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
            )
        `);
        console.log('  ✅ Tabla order_items creada\n');

        // ============================================
        // 16. HISTORIAL DE ESTADO DE ÓRDENES
        // ============================================
        console.log('📊 Creando tabla order_status_history...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS order_status_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                changed_by INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla order_status_history creada\n');

        // ============================================
        // 17. SISTEMA DE PAGOS COMPLETO
        // ============================================
        console.log('💳 Creando sistema de pagos completo...');
        
        // Proveedores de pago
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS payment_providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider_key TEXT NOT NULL UNIQUE,
                channel TEXT DEFAULT 'web',
                fee_config TEXT,
                installments_config TEXT,
                is_active INTEGER DEFAULT 1,
                webhook_url TEXT,
                retries INTEGER DEFAULT 3,
                timeout_ms INTEGER DEFAULT 30000,
                credentials TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla payment_providers creada');

        // Métodos de pago
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider_id INTEGER,
                channel TEXT DEFAULT 'web',
                fee_config TEXT,
                installments_config TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
            )
        `);
        console.log('  ✅ Tabla payment_methods creada');

        // Pagos (estructura completa)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                customer_id INTEGER,
                method TEXT NOT NULL,
                provider_id INTEGER,
                status TEXT NOT NULL DEFAULT 'authorized',
                amount_gross INTEGER NOT NULL,
                fee INTEGER DEFAULT 0,
                amount_net INTEGER NOT NULL,
                currency TEXT DEFAULT 'CLP',
                authorized_at TEXT,
                captured_at TEXT,
                failure_code TEXT,
                failure_message TEXT,
                risk_score INTEGER,
                metadata TEXT,
                tags TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (customer_id) REFERENCES users(id),
                FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
            )
        `);
        console.log('  ✅ Tabla payments creada');
        
        // Migrar tabla payments existente si no tiene todas las columnas
        try {
            await addColumnIfNotExists(dbHelper, 'payments', 'method', 'TEXT NOT NULL DEFAULT \'transfer\'');
            await addColumnIfNotExists(dbHelper, 'payments', 'customer_id', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'payments', 'provider_id', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'payments', 'amount_gross', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'payments', 'fee', 'INTEGER DEFAULT 0');
            await addColumnIfNotExists(dbHelper, 'payments', 'amount_net', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'payments', 'authorized_at', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'captured_at', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'failure_code', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'failure_message', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'risk_score', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'payments', 'metadata', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'tags', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'payments', 'notes', 'TEXT');
            console.log('  ✅ Migración de tabla payments completada');
        } catch (error) {
            console.warn('  ⚠️ Advertencia al migrar payments:', error.message);
        }

        // Motivos de reembolso
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS refund_reasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla refund_reasons creada');

        // Reembolsos (estructura completa)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS refunds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                reason_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                requested_by INTEGER,
                approved_by INTEGER,
                processed_at TEXT,
                provider_ref TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (payment_id) REFERENCES payments(id),
                FOREIGN KEY (reason_id) REFERENCES refund_reasons(id),
                FOREIGN KEY (requested_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla refunds creada');
        
        // Migrar tabla refunds existente si no tiene todas las columnas
        try {
            await addColumnIfNotExists(dbHelper, 'refunds', 'reason_id', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'refunds', 'requested_by', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'refunds', 'approved_by', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'refunds', 'processed_at', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'refunds', 'provider_ref', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'refunds', 'notes', 'TEXT');
            console.log('  ✅ Migración de tabla refunds completada');
        } catch (error) {
            console.warn('  ⚠️ Advertencia al migrar refunds:', error.message);
        }

        // Campañas de gift cards
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS gift_card_campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                start_at TEXT,
                end_at TEXT,
                is_active INTEGER DEFAULT 1,
                terms_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla gift_card_campaigns creada');

        // Gift cards
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS gift_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                pin_hash TEXT,
                initial_value INTEGER NOT NULL,
                balance INTEGER NOT NULL,
                currency TEXT DEFAULT 'CLP',
                state TEXT DEFAULT 'active',
                issued_to_customer_id INTEGER,
                issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT,
                campaign_id INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (issued_to_customer_id) REFERENCES users(id),
                FOREIGN KEY (campaign_id) REFERENCES gift_card_campaigns(id)
            )
        `);
        console.log('  ✅ Tabla gift_cards creada');
        
        // Migrar tabla gift_cards existente si no tiene todas las columnas
        try {
            await addColumnIfNotExists(dbHelper, 'gift_cards', 'issued_to_customer_id', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'gift_cards', 'issued_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
            await addColumnIfNotExists(dbHelper, 'gift_cards', 'expires_at', 'TEXT');
            await addColumnIfNotExists(dbHelper, 'gift_cards', 'campaign_id', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'gift_cards', 'notes', 'TEXT');
            console.log('  ✅ Migración de tabla gift_cards completada');
        } catch (error) {
            console.warn('  ⚠️ Advertencia al migrar gift_cards:', error.message);
        }

        // Transacciones de gift cards
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS gift_card_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gift_card_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                balance_before INTEGER NOT NULL,
                balance_after INTEGER NOT NULL,
                related_payment_id INTEGER,
                order_id INTEGER,
                refund_id INTEGER,
                source TEXT DEFAULT 'api',
                operator INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id),
                FOREIGN KEY (related_payment_id) REFERENCES payments(id),
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (refund_id) REFERENCES refunds(id),
                FOREIGN KEY (operator) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla gift_card_transactions creada');
        
        // Migrar tabla gift_card_transactions existente si no tiene todas las columnas
        try {
            await addColumnIfNotExists(dbHelper, 'gift_card_transactions', 'operator', 'INTEGER');
            await addColumnIfNotExists(dbHelper, 'gift_card_transactions', 'source', 'TEXT DEFAULT \'api\'');
            await addColumnIfNotExists(dbHelper, 'gift_card_transactions', 'notes', 'TEXT');
            console.log('  ✅ Migración de tabla gift_card_transactions completada');
        } catch (error) {
            console.warn('  ⚠️ Advertencia al migrar gift_card_transactions:', error.message);
        }
        
        // Chargebacks/disputas
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS chargebacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_id INTEGER NOT NULL,
                case_id TEXT NOT NULL UNIQUE,
                stage TEXT NOT NULL,
                deadline_at TEXT,
                evidence_links TEXT,
                status TEXT NOT NULL,
                outcome TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (payment_id) REFERENCES payments(id)
            )
        `);
        console.log('  ✅ Tabla chargebacks creada');

        // Settlements/conciliaciones
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS settlements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                period TEXT NOT NULL,
                file_name TEXT,
                uploaded_at TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
            )
        `);
        console.log('  ✅ Tabla settlements creada');

        // Líneas de settlement
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS settlement_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                settlement_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                provider_tx_id TEXT,
                amount INTEGER NOT NULL,
                fee INTEGER DEFAULT 0,
                payout_id TEXT,
                matched_payment_id INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (settlement_id) REFERENCES settlements(id),
                FOREIGN KEY (matched_payment_id) REFERENCES payments(id)
            )
        `);
        console.log('  ✅ Tabla settlement_lines creada');

        // Entregas de webhooks
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                response_code INTEGER,
                response_body TEXT,
                retry_count INTEGER DEFAULT 0,
                delivered_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
            )
        `);
        console.log('  ✅ Tabla webhook_deliveries creada');
        console.log('  ✅ Sistema de pagos completo creado\n');

        // ============================================
        // 19. DEVOLUCIONES
        // ============================================
        console.log('↩️  Creando tabla returns...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS returns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                return_number TEXT NOT NULL UNIQUE,
                order_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'requested',
                reason TEXT NOT NULL,
                customer_notes TEXT,
                admin_notes TEXT,
                refund_amount REAL,
                refund_id INTEGER,
                approved_by INTEGER,
                approved_at TEXT,
                received_at TEXT,
                completed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (refund_id) REFERENCES refunds(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS return_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                return_id INTEGER NOT NULL,
                order_item_id INTEGER NOT NULL,
                quantity REAL NOT NULL,
                reason TEXT,
                condition TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
                FOREIGN KEY (order_item_id) REFERENCES order_items(id)
            )
        `);
        console.log('  ✅ Sistema de devoluciones creado\n');

        // ============================================
        // 20. ENVÍOS
        // ============================================
        console.log('🚚 Creando sistema de envíos...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipping_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                description TEXT,
                carrier TEXT,
                base_cost REAL NOT NULL,
                cost_per_kg REAL DEFAULT 0,
                estimated_days_min INTEGER,
                estimated_days_max INTEGER,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipping_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                regions TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipping_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipping_method_id INTEGER NOT NULL,
                shipping_zone_id INTEGER NOT NULL,
                min_weight REAL,
                max_weight REAL,
                rate REAL NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id),
                FOREIGN KEY (shipping_zone_id) REFERENCES shipping_zones(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                tracking_number TEXT,
                carrier TEXT,
                service_code TEXT,
                weight REAL,
                status TEXT NOT NULL DEFAULT 'pending',
                label_url TEXT,
                shipped_at TEXT,
                estimated_delivery TEXT,
                delivered_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS shipment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                location TEXT,
                description TEXT,
                event_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Sistema de envíos creado\n');

        // ============================================
        // 21. IMPUESTOS
        // ============================================
        console.log('💼 Creando tabla tax_rates...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS tax_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                rate REAL NOT NULL,
                applies_to TEXT NOT NULL DEFAULT 'all',
                regions TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla tax_rates creada\n');

        // ============================================
        // 22. RESEÑAS DE PRODUCTOS
        // ============================================
        console.log('⭐ Creando tabla product_reviews...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                title TEXT,
                body TEXT,
                verified_purchase INTEGER DEFAULT 0,
                helpful_count INTEGER DEFAULT 0,
                approved INTEGER DEFAULT 0,
                approved_by INTEGER,
                approved_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS review_votes (
                review_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                vote_type TEXT NOT NULL CHECK(vote_type IN ('helpful', 'not_helpful')),
                created_at TEXT NOT NULL,
                PRIMARY KEY (review_id, user_id),
                FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) WITHOUT ROWID
        `);
        console.log('  ✅ Tabla product_reviews creada\n');

        // ============================================
        // 23. WISHLIST
        // ============================================
        console.log('❤️  Creando tabla wishlist...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS wishlist (
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) WITHOUT ROWID
        `);
        console.log('  ✅ Tabla wishlist creada\n');

        // ============================================
        // 24. PRESCRIPCIONES
        // ============================================
        console.log('💊 Creando tabla prescriptions...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                doctor_name TEXT NOT NULL,
                doctor_license TEXT NOT NULL,
                prescription_number TEXT UNIQUE,
                diagnosis TEXT,
                prescribed_products TEXT,
                dosage_instructions TEXT,
                issue_date TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                file_url TEXT,
                status TEXT DEFAULT 'active',
                verified_by INTEGER,
                verified_at TEXT,
                rejection_reason TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla prescriptions creada\n');

        // ============================================
        // 25. DOCUMENTOS DE USUARIO (KYC)
        // ============================================
        console.log('📄 Creando sistema de documentos...');
        
        // Crear tabla user_documents (única tabla para documentos)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_data TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS verification_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                doc_id INTEGER,
                kind TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                assigned_to INTEGER,
                reviewed_by INTEGER,
                reviewed_at TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doc_id) REFERENCES user_documents(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id)
            )
        `);
        
        // Crear tabla user_forced_approvals para rastrear aprobaciones forzadas
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_forced_approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                admin_id INTEGER NOT NULL,
                admin_notes TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);

        // Tabla para datos del dispensario (cesionario en documentos de poder de cultivo)
        console.log('🏥 Creando tabla dispensary_data...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS dispensary_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rut TEXT NOT NULL,
                address TEXT NOT NULL,
                email TEXT NOT NULL,
                signature TEXT, -- Base64 de la firma del dispensario
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✅ Tabla dispensary_data creada');
        
        // Insertar datos por defecto del dispensario si no existen
        const existingDispensary = await dbHelper.get('SELECT * FROM dispensary_data LIMIT 1');
        if (!existingDispensary) {
            await dbHelper.run(`
                INSERT INTO dispensary_data (name, rut, address, email, signature, created_at, updated_at)
                VALUES ('Apexremedy', '76.237.243-6', 'Oficina Virtual', 'contacto@apexremedy.cl', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            console.log('  ✅ Datos por defecto del dispensario insertados');
        }
        
        // Crear tabla user_medical_info si no existe
        console.log('💊 Creando tabla user_medical_info...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_medical_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                rut TEXT,
                date_of_birth TEXT,
                medical_conditions TEXT,
                current_medications TEXT,
                allergies TEXT,
                has_medical_cannabis_authorization INTEGER DEFAULT 0,
                authorization_number TEXT,
                authorization_expires TEXT,
                prescribing_doctor TEXT,
                doctor_license TEXT,
                medical_notes TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla user_medical_info creada');
        
        // Crear tabla user_registrations para guardar datos de cesión por receta
        console.log('📋 Creando tabla user_registrations...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                cedente_nombre TEXT NOT NULL,
                cedente_rut TEXT NOT NULL,
                cedente_firma TEXT,
                enfermedad_condicion TEXT NOT NULL,
                fecha_inicio TEXT NOT NULL,
                fecha_termino TEXT,
                es_indefinido INTEGER DEFAULT 0,
                es_revocable INTEGER DEFAULT 1,
                dispensario_nombre TEXT NOT NULL,
                dispensario_rut TEXT NOT NULL,
                dispensario_direccion TEXT NOT NULL,
                dispensario_firma TEXT,
                documento_html TEXT,
                fecha_cesion TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla user_registrations creada');
        
        // Crear tabla user_registration_documents para documentos asociados a registros
        console.log('📄 Creando tabla user_registration_documents...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_registration_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                registration_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_data TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                is_encrypted INTEGER DEFAULT 0,
                encryption_key_hash TEXT,
                uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla user_registration_documents creada');
        
        console.log('  ✅ Sistema de documentos creado\n');

        // ============================================
        // 26. CESIÓN DE DERECHOS DE CULTIVO
        // ============================================
        console.log('📜 Creando tabla cultivation_rights_cessions...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cultivation_rights_cessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                template_version TEXT NOT NULL,
                provider_name TEXT NOT NULL,
                signature_type TEXT NOT NULL,
                signature_hash TEXT NOT NULL,
                signed_at TEXT NOT NULL,
                ip_address TEXT,
                evidence_url TEXT,
                status TEXT DEFAULT 'valid',
                revoked_at TEXT,
                review_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla cultivation_rights_cessions creada\n');

        // ============================================
        // 27. CONSENTIMIENTOS DE PRIVACIDAD
        // ============================================
        console.log('🔒 Creando tabla privacy_consents...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS privacy_consents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                purpose_code TEXT NOT NULL,
                policy_version TEXT NOT NULL,
                consent_given INTEGER NOT NULL,
                consent_at TEXT NOT NULL,
                revoked_at TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS retention_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_domain TEXT NOT NULL UNIQUE,
                keep_for_months INTEGER NOT NULL,
                legal_basis TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Sistema de privacidad creado\n');

        // ============================================
        // 28. PROMOCIONES Y CUPONES
        // ============================================
        console.log('🎁 Creando tabla promotions...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS promotions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                applies_to TEXT DEFAULT 'all',
                product_ids TEXT,
                category_ids TEXT,
                min_purchase REAL,
                max_discount REAL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                usage_limit INTEGER,
                usage_per_customer INTEGER DEFAULT 1,
                usage_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS promotion_usages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                promotion_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                order_id INTEGER NOT NULL,
                discount_amount REAL NOT NULL,
                used_at TEXT NOT NULL,
                FOREIGN KEY (promotion_id) REFERENCES promotions(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        console.log('  ✅ Tabla promotions creada\n');

        // ============================================
        // 29. GIFT CARDS (Ya creado en sistema de pagos - sección 17)
        // ============================================
        // Las tablas gift_cards y gift_card_transactions ya fueron creadas
        // en la sección 17 del sistema de pagos completo
        console.log('🎟️  Gift cards ya creadas en sistema de pagos\n');

        // ============================================
        // 30. NOTIFICACIONES
        // ============================================
        console.log('🔔 Creando sistema de notificaciones...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                channel TEXT NOT NULL,
                topic TEXT NOT NULL,
                subject TEXT,
                message TEXT NOT NULL,
                payload TEXT,
                status TEXT NOT NULL DEFAULT 'queued',
                priority TEXT DEFAULT 'normal',
                scheduled_for TEXT,
                sent_at TEXT,
                opened_at TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS message_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_id INTEGER,
                provider TEXT NOT NULL,
                provider_message_id TEXT,
                status TEXT NOT NULL,
                response TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                channel TEXT NOT NULL,
                topic TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, channel, topic),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Sistema de notificaciones creado\n');

        // ============================================
        // 31. CMS
        // ============================================
        console.log('📰 Creando sistema CMS...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cms_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                excerpt TEXT,
                author_id INTEGER,
                published INTEGER DEFAULT 1,
                published_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (author_id) REFERENCES users(id)
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                excerpt TEXT,
                featured_image TEXT,
                author_id INTEGER,
                category TEXT,
                tags TEXT,
                published INTEGER DEFAULT 1,
                published_at TEXT,
                views INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (author_id) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Sistema CMS creado\n');

        // ============================================
        // 32. RECOMENDACIONES
        // ============================================
        console.log('🎯 Creando tabla recommendations...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER NOT NULL,
                score REAL NOT NULL,
                reason TEXT,
                algorithm TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla recommendations creada\n');

        // ============================================
        // 33. EVENTOS Y AUDITORÍA
        // ============================================
        console.log('📋 Creando sistema de auditoría...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                payload TEXT,
                created_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_user_id INTEGER,
                action TEXT NOT NULL,
                target_table TEXT,
                target_id INTEGER,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (actor_user_id) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Sistema de auditoría creado\n');

        // ============================================
        // 34. TRABAJOS Y CRON
        // ============================================
        console.log('⚙️  Creando sistema de jobs...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                queue TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                run_at TEXT,
                started_at TEXT,
                completed_at TEXT,
                error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cron_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_code TEXT NOT NULL,
                status TEXT NOT NULL,
                duration_ms INTEGER,
                result TEXT,
                ran_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Sistema de jobs creado\n');

        // ============================================
        // 34.1 ANALYTICS & TRACKING - WEB ANALYTICS
        // ============================================
        console.log('📊 Creando sistema de analytics web...');
        
        // Sesiones web
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS web_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL UNIQUE,
                user_id INTEGER,
                device_type TEXT,
                browser TEXT,
                os TEXT,
                screen_resolution TEXT,
                referrer TEXT,
                utm_source TEXT,
                utm_medium TEXT,
                utm_campaign TEXT,
                utm_term TEXT,
                utm_content TEXT,
                landing_page TEXT,
                country TEXT,
                region TEXT,
                city TEXT,
                ip_address TEXT,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                duration_seconds INTEGER,
                page_views INTEGER DEFAULT 0,
                is_bounce INTEGER DEFAULT 0,
                conversion_goal TEXT,
                conversion_value REAL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla web_sessions creada');

        // Pageviews
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS pageviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id INTEGER,
                page_path TEXT NOT NULL,
                page_title TEXT,
                referrer TEXT,
                time_on_page INTEGER,
                scroll_depth REAL,
                exit_page INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla pageviews creada');

        // Eventos de analytics web (más específicos que events genérico)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS web_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                user_id INTEGER,
                event_type TEXT NOT NULL,
                event_category TEXT,
                event_action TEXT,
                event_label TEXT,
                event_value REAL,
                page_path TEXT,
                product_id INTEGER,
                order_id INTEGER,
                metadata TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla web_events creada');

        // Campañas de marketing (para tracking de ROI)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS marketing_campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                campaign_type TEXT NOT NULL,
                channel TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                budget REAL DEFAULT 0,
                spent REAL DEFAULT 0,
                impressions INTEGER DEFAULT 0,
                clicks INTEGER DEFAULT 0,
                conversions INTEGER DEFAULT 0,
                revenue REAL DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_by INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla marketing_campaigns creada');

        // Segmentos de clientes (RFM y otros)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS customer_segments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                segment_type TEXT NOT NULL,
                segment_code TEXT NOT NULL,
                rfm_recency INTEGER,
                rfm_frequency INTEGER,
                rfm_monetary INTEGER,
                rfm_score INTEGER,
                clv_predicted REAL,
                churn_probability REAL,
                last_calculated_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, segment_type)
            )
        `);
        console.log('  ✅ Tabla customer_segments creada');

        // Cohortes de clientes (para cohort analysis)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS customer_cohorts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                cohort_period TEXT NOT NULL,
                cohort_type TEXT NOT NULL DEFAULT 'month',
                first_order_date TEXT NOT NULL,
                last_order_date TEXT,
                total_orders INTEGER DEFAULT 0,
                total_revenue REAL DEFAULT 0,
                lifetime_days INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, cohort_period, cohort_type)
            )
        `);
        console.log('  ✅ Tabla customer_cohorts creada');

        // Búsquedas en el sitio
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS site_searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                user_id INTEGER,
                search_query TEXT NOT NULL,
                results_count INTEGER DEFAULT 0,
                clicked_result INTEGER DEFAULT 0,
                conversion INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla site_searches creada');

        // Abandono de carrito (tracking detallado)
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cart_abandonment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                user_id INTEGER,
                cart_value REAL NOT NULL,
                items_count INTEGER NOT NULL,
                abandoned_at TEXT NOT NULL,
                recovered_at TEXT,
                recovery_email_sent INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Tabla cart_abandonment_events creada');
        console.log('  ✅ Sistema de analytics web creado\n');

        // ============================================
        // 35. BÚSQUEDA FULL-TEXT (FTS5)
        // ============================================
        console.log('🔍 Creando índice de búsqueda...');
        await dbHelper.run(`
            CREATE VIRTUAL TABLE IF NOT EXISTS search_index_fts USING fts5(
                entity_type UNINDEXED,
                entity_id UNINDEXED,
                title,
                body,
                tokenize='porter unicode61'
            )
        `);
        console.log('  ✅ Índice de búsqueda creado\n');

        // ============================================
        // 36. VISTAS
        // ============================================
        console.log('👁️  Creando vistas...');
        
        await dbHelper.run(`
            CREATE VIEW IF NOT EXISTS v_user_has_valid_prescription AS
            SELECT
                u.id AS user_id,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM prescriptions rx
                        WHERE rx.user_id = u.id
                        AND rx.status = 'active'
                        AND date(rx.issue_date) <= date('now')
                        AND date(rx.expiry_date) >= date('now')
                    ) THEN 1 ELSE 0
                END AS has_valid_rx
            FROM users u
        `);

        await dbHelper.run(`DROP VIEW IF EXISTS v_user_medicinal_eligibility`);
        await dbHelper.run(`
            CREATE VIEW IF NOT EXISTS v_user_medicinal_eligibility AS
            SELECT
                u.id AS user_id,
                (SELECT has_valid_rx FROM v_user_has_valid_prescription WHERE user_id = u.id) AS has_valid_rx,
                u.medicinal_blocked AS manual_block,
                CASE
                    WHEN u.medicinal_blocked = 1 THEN 0
                    WHEN (SELECT has_valid_rx FROM v_user_has_valid_prescription WHERE user_id = u.id) = 1 THEN 1
                    ELSE 0
                END AS can_buy_medicinal
            FROM users u
        `);

        await dbHelper.run(`DROP VIEW IF EXISTS v_product_inventory`);
        await dbHelper.run(`
            CREATE VIEW IF NOT EXISTS v_product_inventory AS
            SELECT 
                p.id AS product_id,
                p.name,
                p.sku,
                COALESCE(SUM(inv.available_quantity), 0) AS total_available,
                COALESCE(SUM(inv.reserved_quantity), 0) AS total_reserved,
                p.low_stock_threshold,
                CASE 
                    WHEN COALESCE(SUM(inv.available_quantity), 0) <= p.low_stock_threshold THEN 1 
                    ELSE 0 
                END AS is_low_stock
            FROM products p
            LEFT JOIN inventory_items inv ON p.id = inv.product_id
            GROUP BY p.id
        `);

        await dbHelper.run(`DROP VIEW IF EXISTS v_order_summary`);
        await dbHelper.run(`
            CREATE VIEW IF NOT EXISTS v_order_summary AS
            SELECT
                o.id,
                o.order_number,
                o.user_id,
                u.name AS customer_name,
                u.email AS customer_email,
                o.status,
                o.payment_status,
                o.fulfillment_status,
                o.total,
                o.currency,
                COUNT(oi.id) AS item_count,
                o.created_at,
                o.updated_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
        `);
        console.log('  ✅ Vistas creadas\n');

        // ============================================
        // 37. TRIGGERS
        // ============================================
        console.log('⚡ Creando triggers...');
        
        // Trigger para limpiar carrito cuando se bloquea medicinal
        await dbHelper.run(`
            CREATE TRIGGER IF NOT EXISTS trg_cart_guard_after_update_user
            AFTER UPDATE OF medicinal_blocked ON users
            BEGIN
                DELETE FROM cart_items
                WHERE user_id = NEW.id
                AND product_id IN (
                    SELECT p.id FROM products p 
                    WHERE p.is_medicinal = 1 OR p.requires_prescription = 1
                );
                
                INSERT INTO audit_logs(actor_user_id, action, target_table, target_id, new_values, created_at)
                VALUES (NEW.id, 'AUTO_CART_PURGE', 'users', NEW.id,
                        json_object('reason', 'medicinal_block_change'), datetime('now'));
            END;
        `);

        // Trigger para actualizar timestamps
        await dbHelper.run(`
            CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at
            AFTER UPDATE ON orders
            BEGIN
                UPDATE orders SET updated_at = datetime('now')
                WHERE id = NEW.id;
            END;
        `);

        // Trigger para historial de estado de órdenes
        await dbHelper.run(`
            CREATE TRIGGER IF NOT EXISTS trg_order_status_history
            AFTER UPDATE OF status ON orders
            WHEN OLD.status != NEW.status
            BEGIN
                INSERT INTO order_status_history(order_id, status, created_at)
                VALUES (NEW.id, NEW.status, datetime('now'));
            END;
        `);

        // Trigger para actualizar inventory después de orden
        await dbHelper.run(`
            CREATE TRIGGER IF NOT EXISTS trg_reserve_inventory_on_order
            AFTER INSERT ON order_items
            WHEN (SELECT status FROM orders WHERE id = NEW.order_id) IN ('confirmed', 'processing')
            BEGIN
                UPDATE inventory_items
                SET reserved_quantity = reserved_quantity + NEW.quantity
                WHERE product_id = NEW.product_id
                AND variant_id IS NULL;
            END;
        `);
        console.log('  ✅ Triggers creados\n');

        // ============================================
        // 38. CREAR ÍNDICES
        // ============================================
        console.log('🚀 Creando índices...');
        
        const indexes = [
            // Usuarios
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_rut ON users(rut)',
            'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
            
            // Productos
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_medicinal ON products(is_medicinal)',
            'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)',
            'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
            'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)',
            
            // Variantes
            'CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_price_variants_product ON product_price_variants(product_id)',
            
            // Inventario
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_unique ON inventory_items(warehouse_id, product_id, variant_id)',
            'CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_items(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id)',
            
            // Órdenes
            'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
            'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
            'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
            'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
            
            // Carrito
            'CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id)',
            
            // Reseñas
            'CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(approved)',
            
            // Prescripciones
            'CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON prescriptions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_prescriptions_expiry ON prescriptions(expiry_date)',
            'CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)',
            
            // Documentos
            'CREATE INDEX IF NOT EXISTS idx_user_documents_user ON user_documents(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user ON user_forced_approvals(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_verification_queue_user ON verification_queue(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status)',
            
            // Pagos (sistema completo) - se crean después de forma condicional
            'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)',
            
            // Envíos
            'CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number)',
            
            // Notificaciones
            'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for)',
            
            // Auditoría
            'CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id)',
            'CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_table, target_id)',
            'CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)',
            
            // Jobs
            'CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs(queue)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_run_at ON jobs(run_at)',
            
            // Analytics Web
            'CREATE INDEX IF NOT EXISTS idx_web_sessions_user ON web_sessions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_web_sessions_started ON web_sessions(started_at)',
            'CREATE INDEX IF NOT EXISTS idx_web_sessions_utm ON web_sessions(utm_source, utm_medium, utm_campaign)',
            'CREATE INDEX IF NOT EXISTS idx_pageviews_session ON pageviews(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_pageviews_user ON pageviews(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(page_path)',
            'CREATE INDEX IF NOT EXISTS idx_web_events_session ON web_events(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_web_events_type ON web_events(event_type)',
            'CREATE INDEX IF NOT EXISTS idx_web_events_user ON web_events(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_code ON marketing_campaigns(code)',
            'CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status)',
            'CREATE INDEX IF NOT EXISTS idx_customer_segments_user ON customer_segments(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type)',
            'CREATE INDEX IF NOT EXISTS idx_customer_cohorts_user ON customer_cohorts(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_customer_cohorts_period ON customer_cohorts(cohort_period)',
            'CREATE INDEX IF NOT EXISTS idx_site_searches_query ON site_searches(search_query)',
            'CREATE INDEX IF NOT EXISTS idx_cart_abandonment_user ON cart_abandonment_events(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_cart_abandonment_abandoned ON cart_abandonment_events(abandoned_at)'
        ];

        for (const index of indexes) {
            try {
                await dbHelper.run(index);
            } catch (error) {
                // Si el error es porque la columna no existe, solo mostrar advertencia
                if (error.message && error.message.includes('no such column')) {
                    console.warn(`  ⚠️ No se pudo crear índice (columna no existe): ${index.split('ON')[0].trim()}`);
                } else {
                    console.warn(`  ⚠️ No se pudo crear índice: ${index.split('ON')[0].trim()} - ${error.message}`);
                }
            }
        }
        
        // Crear índices de pagos después de verificar que las columnas existen
        try {
            const paymentCols = await dbHelper.all(`PRAGMA table_info(payments)`);
            const colNames = paymentCols.map(c => c.name);
            
            if (colNames.includes('customer_id')) {
                await dbHelper.run('CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)');
            }
            if (colNames.includes('status')) {
                await dbHelper.run('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
            }
            if (colNames.includes('provider_id')) {
                await dbHelper.run('CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider_id)');
            }
        } catch (error) {
            console.warn('  ⚠️ Error al crear índices de payments:', error.message);
        }
        
        // Crear otros índices del sistema de pagos (ya están en la lista, pero por si acaso)
        const paymentIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id)',
            'CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status)',
            'CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)',
            'CREATE INDEX IF NOT EXISTS idx_gift_cards_customer ON gift_cards(issued_to_customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id)',
            'CREATE INDEX IF NOT EXISTS idx_chargebacks_payment ON chargebacks(payment_id)',
            'CREATE INDEX IF NOT EXISTS idx_settlements_provider ON settlements(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_settlement_lines_settlement ON settlement_lines(settlement_id)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_provider ON webhook_deliveries(provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status)'
        ];
        
        for (const index of paymentIndexes) {
            try {
                await dbHelper.run(index);
            } catch (error) {
                console.warn(`  ⚠️ No se pudo crear índice: ${index.split('ON')[0].trim()} - ${error.message}`);
            }
        }
        
        console.log('  ✅ Índices creados\n');

        // ============================================
        // 39. INSERTAR DATOS INICIALES
        // ============================================
        
        // Roles iniciales
        console.log('👥 Insertando roles iniciales...');
        const roles = [
            { code: 'super_admin', name: 'Super Administrador', description: 'Acceso total al sistema' },
            { code: 'admin', name: 'Administrador', description: 'Gestión general del sistema' },
            { code: 'manager', name: 'Gerente', description: 'Gestión de productos y órdenes' },
            { code: 'pharmacist', name: 'Farmacéutico', description: 'Gestión de prescripciones y productos medicinales' },
            { code: 'customer_service', name: 'Servicio al Cliente', description: 'Atención a clientes y gestión de órdenes' },
            { code: 'customer', name: 'Cliente', description: 'Usuario regular del sistema' }
        ];

        for (const role of roles) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO roles (code, name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `, [role.code, role.name, role.description, new Date().toISOString(), new Date().toISOString()]);
        }
        console.log('  ✅ Roles insertados\n');

        // Permisos iniciales
        console.log('🔐 Insertando permisos iniciales...');
        const permissions = [
            { code: 'manage_products', module: 'Products', description: 'Crear, editar y eliminar productos' },
            { code: 'view_orders', module: 'Orders', description: 'Ver todas las órdenes' },
            { code: 'manage_orders', module: 'Orders', description: 'Gestionar y actualizar estados de órdenes' },
            { code: 'manage_users', module: 'Users', description: 'Gestionar usuarios y cuentas' },
            { code: 'view_reports', module: 'Reports', description: 'Ver reportes y estadísticas' },
            { code: 'manage_roles', module: 'RBAC', description: 'Gestionar roles y permisos' },
            { code: 'manage_inventory', module: 'Inventory', description: 'Gestionar inventario y stock' },
            { code: 'manage_prescriptions', module: 'Prescriptions', description: 'Validar y gestionar prescripciones' },
            { code: 'view_analytics', module: 'Analytics', description: 'Ver análisis de negocio' },
            { code: 'manage_promotions', module: 'Marketing', description: 'Gestionar promociones y cupones' }
        ];

        for (const perm of permissions) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO permissions (code, description, module, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `, [perm.code, perm.description, perm.module, new Date().toISOString(), new Date().toISOString()]);
        }
        console.log('  ✅ Permisos insertados\n');

        // Asignación de permisos a roles
        console.log('🔗 Asignando permisos a roles...');
        
        // Obtener todos los IDs de roles y permisos
        const allRoles = await dbHelper.all('SELECT id, code FROM roles');
        const allPermissions = await dbHelper.all('SELECT id, code FROM permissions');
        
        // Crear mapas para acceso rápido
        const roleMap = {};
        const permissionMap = {};
        allRoles.forEach(r => roleMap[r.code] = r.id);
        allPermissions.forEach(p => permissionMap[p.code] = p.id);
        
        // Definir permisos por rol
        const rolePermissions = {
            'super_admin': ['manage_products', 'view_orders', 'manage_orders', 'manage_users', 'view_reports', 'manage_roles', 'manage_inventory', 'manage_prescriptions', 'view_analytics', 'manage_promotions'],
            'admin': ['manage_products', 'view_orders', 'manage_orders', 'manage_users', 'view_reports', 'manage_inventory', 'manage_prescriptions', 'view_analytics', 'manage_promotions'],
            'manager': ['manage_products', 'view_orders', 'manage_orders', 'view_reports', 'manage_inventory', 'view_analytics', 'manage_promotions'],
            'pharmacist': ['manage_products', 'view_orders', 'manage_inventory', 'manage_prescriptions', 'view_reports'],
            'customer_service': ['view_orders', 'manage_orders', 'view_reports'],
            'customer': ['view_orders']
        };
        
        // Asignar permisos
        for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
            const roleId = roleMap[roleCode];
            if (!roleId) {
                console.log(`  ⚠️  Rol no encontrado: ${roleCode}`);
                continue;
            }
            
            for (const permCode of permCodes) {
                const permId = permissionMap[permCode];
                if (!permId) {
                    console.log(`  ⚠️  Permiso no encontrado: ${permCode}`);
                    continue;
                }
                
                await dbHelper.run(`
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                `, [roleId, permId]);
            }
        }
        console.log('  ✅ Permisos asignados a roles\n');

        // Categorías iniciales
        console.log('📂 Insertando categorías iniciales...');
        const categories = [
            // Categorías Medicinales
            { name: 'Flores Medicinales', slug: 'medicinal-flores', description: 'Cannabis medicinal en flor', is_medicinal: 1, display_order: 1, icon: '🌿' },
            { name: 'Aceites Medicinales', slug: 'medicinal-aceites', description: 'Aceites y tinturas de cannabis medicinal', is_medicinal: 1, display_order: 2, icon: '💧' },
            { name: 'Concentrados Medicinales', slug: 'medicinal-concentrados', description: 'Concentrados de cannabis medicinal', is_medicinal: 1, display_order: 3, icon: '💎' },
            { name: 'Cápsulas Medicinales', slug: 'medicinal-capsulas', description: 'Cápsulas de cannabis medicinal', is_medicinal: 1, display_order: 4, icon: '💊' },
            { name: 'Tópicos Medicinales', slug: 'medicinal-topicos', description: 'Cremas, bálsamos y parches medicinales', is_medicinal: 1, display_order: 5, icon: '🧴' },
            
            // Categorías Públicas
            { name: 'Semillas', slug: 'semillas', description: 'Semillas de cannabis para cultivo', is_medicinal: 0, display_order: 6, icon: '🌱' },
            { name: 'Vaporizadores', slug: 'vaporizadores', description: 'Vaporizadores para hierbas y concentrados', is_medicinal: 0, display_order: 7, icon: '💨' },
            { name: 'Accesorios', slug: 'accesorios', description: 'Accesorios para consumo y cultivo', is_medicinal: 0, display_order: 8, icon: '🔧' },
            { name: 'Ropa', slug: 'ropa', description: 'Merchandising y ropa', is_medicinal: 0, display_order: 9, icon: '👕' },
            { name: 'CBD', slug: 'cbd', description: 'Productos con CBD sin prescripción', is_medicinal: 0, display_order: 10, icon: '🌿' }
        ];

        for (const cat of categories) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO product_categories 
                (name, slug, description, is_medicinal, display_order, icon, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
            `, [
                cat.name, cat.slug, cat.description, cat.is_medicinal, 
                cat.display_order, cat.icon,
                new Date().toISOString(), new Date().toISOString()
            ]);
        }
        console.log('  ✅ Categorías insertadas\n');

        // Marcas iniciales
        console.log('🏷️  Insertando marcas iniciales...');
        const brands = [
            { name: 'Apex Remedy', slug: 'apex-remedy', description: 'Nuestra marca propia de cannabis medicinal', country: 'Chile' },
            { name: 'Aurora Cannabis', slug: 'aurora-cannabis', description: 'Líder canadiense en cannabis medicinal', country: 'Canadá' },
            { name: 'Tilray', slug: 'tilray', description: 'Productos farmacéuticos de cannabis', country: 'Canadá' },
            { name: 'Canopy Growth', slug: 'canopy-growth', description: 'Cannabis medicinal de alta calidad', country: 'Canadá' },
            { name: 'Bedrocan', slug: 'bedrocan', description: 'Cannabis medicinal holandés', country: 'Países Bajos' },
            { name: 'PAX Labs', slug: 'pax-labs', description: 'Vaporizadores premium', country: 'USA' },
            { name: 'Storz & Bickel', slug: 'storz-bickel', description: 'Tecnología alemana de vaporización', country: 'Alemania' },
            { name: 'Sensi Seeds', slug: 'sensi-seeds', description: 'Banco de semillas legendario', country: 'Países Bajos' },
            { name: 'Barney\'s Farm', slug: 'barneys-farm', description: 'Genética de cannabis premium', country: 'Países Bajos' }
        ];

        for (const brand of brands) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO brands 
                (name, slug, description, country, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'active', ?, ?)
            `, [
                brand.name, brand.slug, brand.description, brand.country,
                new Date().toISOString(), new Date().toISOString()
            ]);
        }
        console.log('  ✅ Marcas insertadas\n');

        // Proveedores iniciales
        console.log('🏭 Insertando proveedores iniciales...');
        const suppliers = [
            { code: 'AR-PROD', name: 'Apex Remedy Producciones', contact_name: 'Carlos Mendoza', email: 'compras@apexremedy.cl', phone: '+56 9 1234 5678', city: 'Santiago', region: 'Metropolitana', country: 'Chile', website: 'https://apexremedy.cl', notes: 'Proveedor principal - producción interna' },
            { code: 'AURORA-CA', name: 'Aurora Cannabis Inc.', contact_name: 'John Smith', email: 'sales@auroracannabis.ca', phone: '+1 403 904 6888', city: 'Edmonton', region: 'Alberta', country: 'Canadá', website: 'https://auroracannabis.com', notes: 'Líder mundial en cannabis medicinal - entrega 15-21 días' },
            { code: 'TILRAY-CA', name: 'Tilray Brands Inc.', contact_name: 'Marie Dubois', email: 'sales@tilray.com', phone: '+1 854 888 9652', city: 'Nanaimo', region: 'British Columbia', country: 'Canadá', website: 'https://tilray.com', notes: 'Productos farmacéuticos premium - entrega 20-25 días' },
            { code: 'BEDRO-HL', name: 'Bedrocan Cannabis', contact_name: 'Peter Van Der Berg', email: 'info@bedrocan.nl', phone: '+31 88 234 5678', city: 'Veendam', region: 'Groningen', country: 'Países Bajos', website: 'https://bedrocan.nl', notes: 'Estándares farmacéuticos europeos - entrega 25-30 días' },
            { code: 'SENSI-NL', name: 'Sensi Seeds Bank', contact_name: 'Ben Dronkers', email: 'sales@sensiseeds.com', phone: '+31 20 530 4567', city: 'Amsterdam', region: 'Noord-Holland', country: 'Países Bajos', website: 'https://sensiseeds.com', notes: 'Banco de semillas premium - entrega 30-40 días' },
            { code: 'BARNEY-NL', name: 'Barney\'s Farm', contact_name: 'Derry Derringer', email: 'info@barneysfarm.com', phone: '+31 20 427 1888', city: 'Amsterdam', region: 'Noord-Holland', country: 'Países Bajos', website: 'https://barneysfarm.com', notes: 'Genética premium de cannabis - entrega 30-40 días' },
            { code: 'PAX-USA', name: 'PAX Labs', contact_name: 'James H. Monsees', email: 'sales@pax.com', phone: '+1 415 676 2639', city: 'San Francisco', region: 'California', country: 'USA', website: 'https://pax.com', notes: 'Vaporizadores premium - entrega 10-15 días' },
            { code: 'STORZ-DE', name: 'Storz & Bickel', contact_name: 'Andreas König', email: 'info@storz-bickel.com', phone: '+49 7531 8179 100', city: 'Tuttlingen', region: 'Baden-Württemberg', country: 'Alemania', website: 'https://storz-bickel.com', notes: 'Tecnología alemana de vaporización - entrega 20-25 días' },
            { code: 'DUTCH-NL', name: 'Dutch Passion', contact_name: 'Henk Van Dalen', email: 'sales@dutch-passion.nl', phone: '+31 182 586 001', city: 'Enkhuizen', region: 'Noord-Holland', country: 'Países Bajos', website: 'https://dutch-passion.com', notes: 'Semillas autoflorecientes - entrega 30-40 días' },
            { code: 'HEMPCO-CL', name: 'HempCo Chile', contact_name: 'María González', email: 'ventas@hempco.cl', phone: '+56 9 9876 5432', city: 'Valparaíso', region: 'Valparaíso', country: 'Chile', website: 'https://hempco.cl', notes: 'Proveedor local - CBD y accesorios - entrega 3-5 días' },
            { code: 'GROW-CL', name: 'Grow Chile', contact_name: 'Roberto Silva', email: 'info@growchile.cl', phone: '+56 2 2345 6789', city: 'Santiago', region: 'Metropolitana', country: 'Chile', website: 'https://growchile.cl', notes: 'Equipos de cultivo y nutrientes - entrega 2-3 días' },
            { code: 'PURECBD-CL', name: 'Pure CBD Chile', contact_name: 'Andrea López', email: 'ventas@purecbd.cl', phone: '+56 9 8765 4321', city: 'Concepción', region: 'Bio Bío', country: 'Chile', website: 'https://purecbd.cl', notes: 'Productos CBD locales - entrega 5-7 días' }
        ];

        for (const supplier of suppliers) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO suppliers 
                (code, name, contact_name, email, phone, city, region, country, website, notes, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
            `, [
                supplier.code, supplier.name, supplier.contact_name, supplier.email, 
                supplier.phone, supplier.city, supplier.region, supplier.country,
                supplier.website, supplier.notes,
                new Date().toISOString(), new Date().toISOString()
            ]);
        }
        console.log('  ✅ Proveedores insertados\n');

        // Almacén por defecto
        console.log('🏢 Insertando almacén por defecto...');
        await dbHelper.run(`
            INSERT OR IGNORE INTO warehouses 
            (name, code, address, city, region, is_default, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 'active', ?, ?)
        `, [
            'Almacén Principal',
            'MAIN',
            'Dirección del almacén',
            'Santiago',
            'Metropolitana',
            new Date().toISOString(),
            new Date().toISOString()
        ]);
        console.log('  ✅ Almacén creado\n');

        // Métodos de envío por defecto
        console.log('🚚 Insertando métodos de envío...');
        const shippingMethods = [
            { name: 'Retiro en Tienda', code: 'PICKUP', carrier: 'Propio', base_cost: 0, min: 0, max: 0 },
            { name: 'Envío Express', code: 'EXPRESS', carrier: 'Chilexpress', base_cost: 5000, min: 1, max: 2 },
            { name: 'Envío Estándar', code: 'STANDARD', carrier: 'Correos Chile', base_cost: 3000, min: 3, max: 7 }
        ];

        for (const method of shippingMethods) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO shipping_methods 
                (name, code, carrier, base_cost, estimated_days_min, estimated_days_max, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
            `, [
                method.name, method.code, method.carrier, method.base_cost,
                method.min, method.max,
                new Date().toISOString(), new Date().toISOString()
            ]);
        }
        console.log('  ✅ Métodos de envío insertados\n');

        // Tasa de impuesto (IVA Chile)
        console.log('💼 Insertando tasa de impuesto...');
        await dbHelper.run(`
            INSERT OR IGNORE INTO tax_rates 
            (name, code, rate, applies_to, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?)
        `, [
            'IVA Chile',
            'IVA',
            0.19,
            'all',
            new Date().toISOString(),
            new Date().toISOString()
        ]);
        console.log('  ✅ Tasa de impuesto insertada\n');

        // Políticas de retención
        console.log('🔒 Insertando políticas de retención...');
        const retentionPolicies = [
            { domain: 'USER_ACCOUNT', months: 60, basis: 'Ley de Protección de Datos Personales' },
            { domain: 'ORDER_DATA', months: 84, basis: 'Código Tributario - conservación de documentos' },
            { domain: 'MEDICAL_RECORDS', months: 120, basis: 'Ley 20.584 - Derechos y Deberes de los Pacientes' },
            { domain: 'AUDIT_LOGS', months: 36, basis: 'Política interna de auditoría' }
        ];

        for (const policy of retentionPolicies) {
            await dbHelper.run(`
                INSERT OR IGNORE INTO retention_policies 
                (data_domain, keep_for_months, legal_basis, status, created_at, updated_at)
                VALUES (?, ?, ?, 'active', ?, ?)
            `, [
                policy.domain,
                policy.months,
                policy.basis,
                new Date().toISOString(),
                new Date().toISOString()
            ]);
        }
        console.log('  ✅ Políticas de retención insertadas\n');

        console.log('🎉 ¡Base de datos mejorada creada exitosamente!\n');
        console.log('📊 Estructura completa:');
        console.log('  ✅ 70+ tablas creadas');
        console.log('  ✅ Sistema RBAC completo');
        console.log('  ✅ Gestión de inventario por almacén');
        console.log('  ✅ Sistema de pagos robusto completo:');
        console.log('     - Pagos con múltiples proveedores');
        console.log('     - Reembolsos con motivos y flujo completo');
        console.log('     - Gift Cards con campañas y transacciones');
        console.log('     - Chargebacks y disputas');
        console.log('     - Conciliaciones y settlements');
        console.log('     - Webhook deliveries');
        console.log('  ✅ Sistema de envíos completo');
        console.log('  ✅ Devoluciones');
        console.log('  ✅ Sistema de notificaciones');
        console.log('  ✅ CMS y SEO');
        console.log('  ✅ Auditoría completa');
        console.log('  ✅ Vistas y triggers');
        console.log('  ✅ Índices optimizados');
        console.log('  ✅ Datos iniciales insertados\n');
        console.log('👉 Ahora puedes ejecutar el seed de productos\n');

    } catch (error) {
        console.error('❌ Error creando tablas:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar
createTables()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });