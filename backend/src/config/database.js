const path = require('path');
const SQLiteAdapter = require('../services/database/SQLiteAdapter');
const DatabaseInterface = require('../services/database/DatabaseInterface');

let db = null;

// Crear adaptador de base de datos según configuración
function createDatabaseAdapter(type, config) {
    switch (type.toLowerCase()) {
        case 'sqlite':
            return new SQLiteAdapter(config);
        default:
            throw new Error(`Tipo de base de datos no soportado: ${type}`);
    }
}

// Inicializar base de datos
async function initDatabase() {
    try {
        const dbType = process.env.DB_TYPE || 'sqlite';
        const dbPath = process.env.DB_PATH || 'database/apexremedy.db';
        
        const config = {
            path: dbPath
        };
        
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
        
        console.log(`✅ Base de datos ${dbType} conectada en: ${dbPath}`);
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
        'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)'
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

