const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DatabaseInterface = require('./DatabaseInterface');

/**
 * Adaptador SQLite que implementa DatabaseInterface
 */
class SQLiteAdapter extends DatabaseInterface {
    constructor(config) {
        super();
        this.config = config;
        this.db = null;
        this.inTransaction = false;
    }
    
    /**
     * Conectar a la base de datos SQLite
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Crear directorio de base de datos si no existe
                const dbDir = path.dirname(this.config.path);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }
                
                this.db = new sqlite3.Database(this.config.path, (err) => {
                    if (err) {
                        console.error('Error al conectar SQLite:', err);
                        reject(err);
                    } else {
                        console.log('✅ Conectado a SQLite:', this.config.path);
                        
                        // Habilitar foreign keys
                        this.db.run('PRAGMA foreign_keys = ON', (err) => {
                            if (err) {
                                console.warn('Advertencia: No se pudieron habilitar foreign keys:', err);
                            }
                        });
                        
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Desconectar de la base de datos
     */
    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Ejecutar query SQL
     */
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no conectada'));
                return;
            }
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error en query SQL:', err);
                    console.error('SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    /**
     * Obtener una fila
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no conectada'));
                return;
            }
            
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error en query SQL:', err);
                    console.error('SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
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
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no conectada'));
                return;
            }
            
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error en query SQL:', err);
                    console.error('SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }
    
    /**
     * Iniciar transacción
     */
    async beginTransaction() {
        if (this.inTransaction) {
            throw new Error('Ya hay una transacción en progreso');
        }
        
        await this.run('BEGIN TRANSACTION');
        this.inTransaction = true;
    }
    
    /**
     * Confirmar transacción
     */
    async commit() {
        if (!this.inTransaction) {
            throw new Error('No hay transacción en progreso');
        }
        
        await this.run('COMMIT');
        this.inTransaction = false;
    }
    
    /**
     * Revertir transacción
     */
    async rollback() {
        if (!this.inTransaction) {
            throw new Error('No hay transacción en progreso');
        }
        
        await this.run('ROLLBACK');
        this.inTransaction = false;
    }
    
    /**
     * Verificar si la conexión está activa
     */
    async isConnected() {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            
            this.db.get('SELECT 1', (err) => {
                resolve(!err);
            });
        });
    }
    
    /**
     * Obtener información de la base de datos
     */
    async getInfo() {
        const tables = await this.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);
        
        return {
            type: 'SQLite',
            path: this.config.path,
            tables: tables.map(t => t.name),
            connected: await this.isConnected()
        };
    }
}

module.exports = SQLiteAdapter;

