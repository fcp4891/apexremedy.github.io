// backend/database/migrations/create_tables.js
// Script de creación de todas las tablas necesarias para el dispensario

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
    }
});

async function createTables() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🏗️  Creando estructura de base de datos para dispensario...\n');

    try {
        // ============================================
        // 1. TABLA DE CATEGORÍAS DE PRODUCTOS
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
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES product_categories(id)
            )
        `);
        console.log('  ✅ Tabla product_categories creada\n');

        // ============================================
        // 2. TABLA DE MARCAS
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
        // 3. TABLA DE PRODUCTOS (Nueva estructura)
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
                cannabinoid_profile TEXT,
                terpene_profile TEXT,
                strain_info TEXT,
                therapeutic_info TEXT,
                usage_info TEXT,
                safety_info TEXT,
                specifications TEXT,
                attributes TEXT,
                featured INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES product_categories(id),
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);
        console.log('  ✅ Tabla products creada\n');

        // ============================================
        // 4. TABLA DE VARIANTES DE PRECIO
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
                is_default INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_price_variants creada\n');

        // ============================================
        // 5. TABLA DE IMÁGENES DE PRODUCTOS
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
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_images creada\n');

        // ============================================
        // 6. TABLA DE VARIANTES DE PRODUCTOS
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
                stock_quantity REAL NOT NULL DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_variants creada\n');

        // ============================================
        // 7. TABLA DE USUARIOS
        // ============================================
        console.log('👤 Creando tabla users...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                phone TEXT,
                role TEXT NOT NULL DEFAULT 'customer',
                is_verified INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                verification_token TEXT,
                reset_token TEXT,
                reset_token_expires TEXT,
                last_login TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla users creada\n');

        // ============================================
        // 8. TABLA DE INFORMACIÓN MÉDICA DE USUARIOS
        // ============================================
        console.log('🏥 Creando tabla user_medical_info...');
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
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla user_medical_info creada\n');

        // ============================================
        // 9. TABLA DE DOCUMENTOS DE USUARIOS
        // ============================================
        console.log('📄 Creando tabla user_documents...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_data TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                uploaded_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla user_documents creada\n');

        // ============================================
        // 10. TABLA DE DIRECCIONES
        // ============================================
        console.log('📍 Creando tabla addresses...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                address_line1 TEXT NOT NULL,
                address_line2 TEXT,
                city TEXT NOT NULL,
                region TEXT NOT NULL,
                postal_code TEXT,
                country TEXT DEFAULT 'Chile',
                is_default INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla addresses creada\n');

        // ============================================
        // 11. TABLA DE ÓRDENES
        // ============================================
        console.log('🛒 Creando tabla orders...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                payment_status TEXT DEFAULT 'pending',
                payment_method TEXT,
                shipping_address_id INTEGER,
                billing_address_id INTEGER,
                subtotal REAL NOT NULL,
                shipping_cost REAL DEFAULT 0,
                tax REAL DEFAULT 0,
                discount REAL DEFAULT 0,
                total REAL NOT NULL,
                notes TEXT,
                prescription_verified INTEGER DEFAULT 0,
                prescription_file TEXT,
                tracking_number TEXT,
                shipped_at TEXT,
                delivered_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
                FOREIGN KEY (billing_address_id) REFERENCES addresses(id)
            )
        `);
        console.log('  ✅ Tabla orders creada\n');

        // ============================================
        // 12. TABLA DE ITEMS DE ÓRDENES
        // ============================================
        console.log('📝 Creando tabla order_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                quantity REAL NOT NULL,
                unit_price REAL NOT NULL,
                subtotal REAL NOT NULL,
                requires_prescription INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (variant_id) REFERENCES product_variants(id)
            )
        `);
        console.log('  ✅ Tabla order_items creada\n');

        // ============================================
        // 13. TABLA DE CARRITO
        // ============================================
        console.log('🛒 Creando tabla cart_items...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                quantity REAL NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id, variant_id)
            )
        `);
        console.log('  ✅ Tabla cart_items creada\n');

        // ============================================
        // 13. TABLA DE WISHLIST
        // ============================================
        console.log('❤️  Creando tabla wishlist...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id)
            )
        `);
        console.log('  ✅ Tabla wishlist creada\n');

        // ============================================
        // 14. TABLA DE REVIEWS
        // ============================================
        console.log('⭐ Creando tabla product_reviews...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS product_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title TEXT,
                comment TEXT,
                verified_purchase INTEGER DEFAULT 0,
                helpful_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Tabla product_reviews creada\n');

        // ============================================
        // 15. TABLA DE PRESCRIPCIONES
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
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )
        `);
        console.log('  ✅ Tabla prescriptions creada\n');

        // ============================================
        // 16. TABLA DE PROMOCIONES
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
                min_purchase REAL,
                max_discount REAL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                usage_limit INTEGER,
                usage_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        console.log('  ✅ Tabla promotions creada\n');

        // ============================================
        // 17. INSERTAR CATEGORÍAS INICIALES
        // ============================================
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
            console.log(`  ✓ ${cat.name}`);
        }
        console.log('  ✅ Categorías insertadas\n');

        // ============================================
        // 18. INSERTAR MARCAS INICIALES
        // ============================================
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
            console.log(`  ✓ ${brand.name}`);
        }
        console.log('  ✅ Marcas insertadas\n');

        // ============================================
        // 19. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
        // ============================================
        console.log('🚀 Creando índices...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_medicinal ON products(is_medicinal)',
            'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)',
            'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
            'CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
            'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
            'CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON prescriptions(user_id)'
        ];

        for (const index of indexes) {
            await dbHelper.run(index);
        }
        console.log('  ✅ Índices creados\n');

        console.log('🎉 ¡Base de datos creada exitosamente!\n');
        console.log('📊 Estructura completa:');
        console.log('  ✅ 17 tablas creadas');
        console.log('  ✅ 10 categorías insertadas');
        console.log('  ✅ 9 marcas insertadas');
        console.log('  ✅ Índices optimizados\n');
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