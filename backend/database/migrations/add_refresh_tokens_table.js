// Migración: tabla de refresh tokens rotativos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function resolveDatabasePath() {
    // Usar la misma lógica que Database.getInstance() en backend/src/database/db.js
    // Desde migrations/add_refresh_tokens_table.js, __dirname es backend/database/migrations
    // Entonces ../../database/apexremedy.db es backend/database/apexremedy.db
    
    // Primero intentar la ruta estándar que usa Database
    const standardPath = path.join(__dirname, '../apexremedy.db');
    
    // Si existe, usarla
    if (fs.existsSync(standardPath)) {
        return standardPath;
    }
    
    // Si no, buscar en otras ubicaciones comunes
    const candidates = [
        path.join(__dirname, '../../apexremedy.db'),
        path.join(__dirname, '../../../apexremedy.db'),
        path.join(process.cwd(), 'backend/database/apexremedy.db'),
        path.join(process.cwd(), 'backend/apexremedy.db'),
        path.join(process.cwd(), 'apexremedy.db')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    // Fallback: usar la ruta estándar (la misma que Database)
    return standardPath;
}

async function addRefreshTokensTable() {
    const dbPath = resolveDatabasePath();
    console.log(`📂 Ejecutando migración en: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Habilitar claves foráneas (igual que Database)
            db.run('PRAGMA foreign_keys = ON');
            
            db.run(`
                CREATE TABLE IF NOT EXISTS user_refresh_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token_hash TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TEXT NOT NULL,
                    replaced_by_token_hash TEXT,
                    revoked_at TEXT,
                    revoked_reason TEXT,
                    user_agent TEXT,
                    ip_address TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla user_refresh_tokens:', err);
                    db.close();
                    reject(err);
                    return;
                }

                db.run(`
                    CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_user_id
                    ON user_refresh_tokens(user_id)
                `, (indexErr) => {
                    if (indexErr) {
                        console.warn('⚠️ Error creando índice en user_refresh_tokens:', indexErr.message);
                    }

                    // Verificar que la tabla se creó correctamente
                    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_refresh_tokens'", (verifyErr, row) => {
                        if (verifyErr) {
                            console.warn('⚠️ Error verificando tabla:', verifyErr.message);
                        } else if (!row) {
                            console.error('❌ La tabla user_refresh_tokens no existe después de crearla');
                            db.close();
                            reject(new Error('Tabla no creada correctamente'));
                            return;
                        }

                        db.close((closeErr) => {
                            if (closeErr) {
                                reject(closeErr);
                            } else {
                                console.log(`✅ Tabla user_refresh_tokens verificada en: ${dbPath}`);
                                resolve();
                            }
                        });
                    });
                });
            });
        });
    });
}

if (require.main === module) {
    addRefreshTokensTable()
        .then(() => {
            console.log('✅ Migración user_refresh_tokens completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migración user_refresh_tokens falló:', error);
            process.exit(1);
        });
}

module.exports = addRefreshTokensTable;

