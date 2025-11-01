// ============================================
// DATABASE: Conexión SQLite
// ============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    static instance = null;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        const dbPath = path.join(__dirname, '../../database/apexremedy.db');
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error al conectar a la base de datos:', err);
            } else {
                console.log('✅ Conectado a la base de datos SQLite');
            }
        });

        // Habilitar claves foráneas
        this.db.run('PRAGMA foreign_keys = ON');

        Database.instance = this;
    }

    static getInstance() {
        if (!Database.instance) {
            new Database();
        }
        return Database.instance;
    }

    // Métodos helper
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    exec(sql) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = Database;