const path = require('path');
const SQLiteAdapter = require('../services/database/SQLiteAdapter');
const PostgreSQLAdapter = require('../services/database/PostgreSQLAdapter');
const DatabaseInterface = require('../services/database/DatabaseInterface');

let db = null;

// Crear adaptador de base de datos según configuración
function createDatabaseAdapter(type, config) {
    switch (type.toLowerCase()) {
        case 'sqlite':
            return new SQLiteAdapter(config);
        case 'postgres':
        case 'postgresql':
            return new PostgreSQLAdapter(config);
        default:
            throw new Error(`Tipo de base de datos no soportado: ${type}. Soporta: sqlite, postgres`);
    }
}

// Inicializar base de datos
async function initDatabase() {
    try {
        const dbType = process.env.DB_TYPE || 'sqlite';
        
        let config;
        if (dbType.toLowerCase() === 'postgres' || dbType.toLowerCase() === 'postgresql') {
            config = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'apexremedy',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '',
                ssl: process.env.DB_SSL === 'true'
            };
        } else {
            const dbPath = process.env.DB_PATH || 'database/apexremedy.db';
            config = { path: dbPath };
        }
        
        db = createDatabaseAdapter(dbType, config);
        await db.connect();
        
        // Crear tablas si no existen (ignorar errores de índices si las tablas ya existen)
        try {
            await createTables();
        } catch (error) {
            // Si hay error al crear tablas, podría ser que ya existen
            // Continuar de todas formas para poder leer productos
            console.warn('⚠️ Advertencia al crear tablas (puede ser normal si ya existen):', error.message);
        }
        
        // Mostrar información detallada de la conexión
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`📦 CONFIGURACIÓN DE BASE DE DATOS`);
        console.log(`${'═'.repeat(60)}`);
        console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Tipo: ${dbType}`);
        
        if (dbType.toLowerCase() === 'postgres' || dbType.toLowerCase() === 'postgresql') {
            console.log(`   Host: ${config.host}`);
            console.log(`   Puerto: ${config.port}`);
            console.log(`   Base de datos: ${config.database}`);
            console.log(`   Usuario: ${config.user}`);
            console.log(`   SSL: ${config.ssl ? 'Habilitado' : 'Deshabilitado'}`);
            console.log(`✅ Base de datos ${dbType} conectada: ${config.database}`);
        } else {
            console.log(`   Archivo: ${config.path}`);
            console.log(`✅ Base de datos ${dbType} conectada en: ${config.path}`);
        }
        console.log(`${'═'.repeat(60)}\n`);
        return db;
    } catch (error) {
        console.error('❌ Error al conectar base de datos:', error);
        throw error;
    }
}

// Crear tablas
async function createTables() {
    const tables = [
        // Tabla de usuarios
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            rut TEXT UNIQUE,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de productos
        `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL,
            stock INTEGER DEFAULT 0,
            category TEXT,
            featured BOOLEAN DEFAULT 0,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de pedidos
        `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total INTEGER NOT NULL,
            subtotal INTEGER NOT NULL,
            tax INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // Tabla de items del pedido
        `CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`,
        
        // ============================================
        // TABLAS DEL SISTEMA DE PAGOS
        // ============================================
        
        // Tabla de proveedores de pago
        `CREATE TABLE IF NOT EXISTS payment_providers (
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de métodos de pago
        `CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            provider_id INTEGER,
            channel TEXT DEFAULT 'web',
            fee_config TEXT,
            installments_config TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES payment_providers (id)
        )`,
        
        // Tabla de pagos
        `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            customer_id INTEGER,
            method TEXT NOT NULL,
            provider_id INTEGER,
            status TEXT NOT NULL DEFAULT 'authorized',
            amount_gross INTEGER NOT NULL,
            fee INTEGER DEFAULT 0,
            amount_net INTEGER NOT NULL,
            currency TEXT DEFAULT 'CLP',
            authorized_at DATETIME,
            captured_at DATETIME,
            failure_code TEXT,
            failure_message TEXT,
            risk_score INTEGER,
            metadata TEXT,
            tags TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (customer_id) REFERENCES users (id),
            FOREIGN KEY (provider_id) REFERENCES payment_providers (id)
        )`,
        
        // Tabla de motivos de reembolso
        `CREATE TABLE IF NOT EXISTS refund_reasons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de reembolsos
        `CREATE TABLE IF NOT EXISTS refunds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            reason_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            requested_by INTEGER,
            approved_by INTEGER,
            processed_at DATETIME,
            provider_ref TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_id) REFERENCES payments (id),
            FOREIGN KEY (reason_id) REFERENCES refund_reasons (id),
            FOREIGN KEY (requested_by) REFERENCES users (id),
            FOREIGN KEY (approved_by) REFERENCES users (id)
        )`,
        
        // Tabla de campañas de gift cards
        `CREATE TABLE IF NOT EXISTS gift_card_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            start_at DATETIME,
            end_at DATETIME,
            is_active INTEGER DEFAULT 1,
            terms_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de gift cards
        `CREATE TABLE IF NOT EXISTS gift_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            pin_hash TEXT,
            initial_value INTEGER NOT NULL,
            balance INTEGER NOT NULL,
            currency TEXT DEFAULT 'CLP',
            state TEXT DEFAULT 'active',
            issued_to_customer_id INTEGER,
            issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            campaign_id INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (issued_to_customer_id) REFERENCES users (id),
            FOREIGN KEY (campaign_id) REFERENCES gift_card_campaigns (id)
        )`,
        
        // Tabla de transacciones de gift cards
        `CREATE TABLE IF NOT EXISTS gift_card_transactions (
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (gift_card_id) REFERENCES gift_cards (id),
            FOREIGN KEY (related_payment_id) REFERENCES payments (id),
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (refund_id) REFERENCES refunds (id),
            FOREIGN KEY (operator) REFERENCES users (id)
        )`,
        
        // Tabla de chargebacks/disputas
        `CREATE TABLE IF NOT EXISTS chargebacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id INTEGER NOT NULL,
            case_id TEXT NOT NULL UNIQUE,
            stage TEXT NOT NULL,
            deadline_at DATETIME,
            evidence_links TEXT,
            status TEXT NOT NULL,
            outcome TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_id) REFERENCES payments (id)
        )`,
        
        // Tabla de settlements/conciliaciones
        `CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id INTEGER NOT NULL,
            period TEXT NOT NULL,
            file_name TEXT,
            uploaded_at DATETIME,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES payment_providers (id)
        )`,
        
        // Tabla de líneas de settlement
        `CREATE TABLE IF NOT EXISTS settlement_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_id INTEGER NOT NULL,
            date DATETIME NOT NULL,
            provider_tx_id TEXT,
            amount INTEGER NOT NULL,
            fee INTEGER DEFAULT 0,
            payout_id TEXT,
            matched_payment_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (settlement_id) REFERENCES settlements (id),
            FOREIGN KEY (matched_payment_id) REFERENCES payments (id)
        )`,
        
        // Tabla de entregas de webhooks
        `CREATE TABLE IF NOT EXISTS webhook_deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id INTEGER,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            response_code INTEGER,
            response_body TEXT,
            retry_count INTEGER DEFAULT 0,
            delivered_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES payment_providers (id)
        )`
    ];
    
    // Crear índices para mejor rendimiento
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_rut ON users(rut)',
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
        'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)',
        'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
        // Índices del sistema de pagos
        'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)',
        'CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)',
        'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
        'CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider_id)',
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
    
    // Ejecutar creación de tablas
    for (const table of tables) {
        await db.query(table);
    }
    
    // Crear índices (ignorar errores si las columnas no existen)
    for (const index of indexes) {
        try {
            await db.query(index);
        } catch (error) {
            // Ignorar errores de índices (puede ser que la columna no exista)
            console.warn(`⚠️ No se pudo crear índice (puede ser normal): ${index.split('ON')[0]}`);
        }
    }
    
    // Crear tablas adicionales que pueden no estar en el array principal
    try {
        // Tabla user_documents
        await db.query(`
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
        
        // Crear índice
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
            ON user_documents(user_id)
        `);
        
        // Tabla user_forced_approvals
        await db.query(`
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
        
            // Crear índice
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                ON user_forced_approvals(user_id)
            `);
            
            // Tabla user_medical_info
            await db.query(`
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
            
            // Crear índice
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_user_medical_info_user_id 
                ON user_medical_info(user_id)
            `);
            
            console.log('✅ Tablas user_documents, user_forced_approvals y user_medical_info creadas/verificadas');
    } catch (error) {
        console.warn('⚠️ Error al crear tablas adicionales:', error.message);
    }
    
    console.log('✅ Tablas e índices creados');
}

// Obtener instancia de base de datos
function getDatabase() {
    if (!db) {
        throw new Error('Base de datos no inicializada. Llama initDatabase() primero.');
    }
    return db;
}

module.exports = {
    initDatabase,
    getDatabase,
    createDatabaseAdapter
};

