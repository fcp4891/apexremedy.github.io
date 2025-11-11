const { Pool } = require('pg');
const DatabaseInterface = require('./DatabaseInterface');

/**
 * Adaptador PostgreSQL que implementa DatabaseInterface
 */
class PostgreSQLAdapter extends DatabaseInterface {
    constructor(config) {
        super();
        this.config = config;
        this.pool = null;
        this.client = null;
    }
    
    /**
     * Conectar a la base de datos PostgreSQL
     */
    async connect() {
        try {
            this.pool = new Pool({
                host: this.config.host || process.env.DB_HOST || 'localhost',
                port: this.config.port || process.env.DB_PORT || 5432,
                database: this.config.database || process.env.DB_NAME,
                user: this.config.user || process.env.DB_USER,
                password: this.config.password || process.env.DB_PASSWORD,
                ssl: this.config.ssl || (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false),
                max: this.config.maxConnections || 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Probar conexión
            this.client = await this.pool.connect();
            await this.client.query('SELECT NOW()');
            this.client.release();
            
            console.log('✅ Conectado a PostgreSQL:', this.config.database);
        } catch (error) {
            console.error('❌ Error al conectar a PostgreSQL:', error.message);
            throw error;
        }
    }
    
    /**
     * Desconectar de la base de datos
     */
    async disconnect() {
        try {
            if (this.client) {
                this.client.release();
                this.client = null;
            }
            if (this.pool) {
                await this.pool.end();
                this.pool = null;
            }
            console.log('✅ Desconectado de PostgreSQL');
        } catch (error) {
            console.error('❌ Error al desconectar de PostgreSQL:', error.message);
            throw error;
        }
    }
    
    /**
     * Ejecutar query SQL
     */
    async query(sql, params = []) {
        if (!this.pool) {
            throw new Error('Base de datos no conectada');
        }
        
        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error('Error en query SQL:', error);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }
    
    /**
     * Obtener una fila
     */
    async get(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    /**
     * Obtener todas las filas
     */
    async all(sql, params = []) {
        return this.query(sql, params);
    }
    
    /**
     * Ejecutar query y obtener el último ID insertado
     */
    async run(sql, params = []) {
        if (!this.pool) {
            throw new Error('Base de datos no conectada');
        }
        
        try {
            const result = await this.pool.query(sql, params);
            return {
                lastID: result.rows[0]?.id || null,
                changes: result.rowCount || 0
            };
        } catch (error) {
            console.error('Error en query SQL:', error);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }
    
    /**
     * Insertar y retornar el ID
     */
    async insert(sql, params = []) {
        const result = await this.pool.query(sql + ' RETURNING id', params);
        return {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount || 0
        };
    }
    
    /**
     * Iniciar transacción
     */
    async beginTransaction() {
        if (!this.client) {
            this.client = await this.pool.connect();
        }
        await this.client.query('BEGIN');
    }
    
    /**
     * Confirmar transacción
     */
    async commit() {
        if (!this.client) {
            throw new Error('No hay transacción en progreso');
        }
        await this.client.query('COMMIT');
        this.client.release();
        this.client = null;
    }
    
    /**
     * Revertir transacción
     */
    async rollback() {
        if (!this.client) {
            throw new Error('No hay transacción en progreso');
        }
        await this.client.query('ROLLBACK');
        this.client.release();
        this.client = null;
    }
    
    /**
     * Verificar si la conexión está activa
     */
    async isConnected() {
        try {
            if (!this.pool) {
                return false;
            }
            const result = await this.pool.query('SELECT 1');
            return result.rows.length > 0;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Obtener información de la base de datos
     */
    async getInfo() {
        const tables = await this.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        return {
            type: 'PostgreSQL',
            database: this.config.database,
            tables: tables.map(t => t.table_name),
            connected: await this.isConnected()
        };
    }
    
    /**
     * Convertir SQL de SQLite a PostgreSQL
     */
    static convertSQLiteToPostgreSQL(sql) {
        // Reemplazar AUTOINCREMENT por SERIAL
        sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
        sql = sql.replace(/INTEGER PRIMARY KEY/g, 'SERIAL PRIMARY KEY');
        
        // Reemplazar TEXT por VARCHAR o TEXT (PostgreSQL soporta ambos)
        // Mantener TEXT para campos largos
        
        // Reemplazar INTEGER por INT (PostgreSQL prefiere INT)
        sql = sql.replace(/INTEGER(?![^\s]+)/g, 'INTEGER');
        
        // Reemplazar REAL por NUMERIC o DOUBLE PRECISION
        sql = sql.replace(/REAL/g, 'DOUBLE PRECISION');
        
        // Reemplazar DATETIME por TIMESTAMP
        sql = sql.replace(/DATETIME/g, 'TIMESTAMP');
        
        // Reemplazar sinónimos de SQLite
        sql = sql.replace(/CREATE TABLE IF NOT EXISTS/g, 'CREATE TABLE IF NOT EXISTS');
        
        // Eliminar WITHOUT ROWID (no existe en PostgreSQL)
        sql = sql.replace(/WITHOUT ROWID/g, '');
        
        return sql;
    }
}

module.exports = PostgreSQLAdapter;









