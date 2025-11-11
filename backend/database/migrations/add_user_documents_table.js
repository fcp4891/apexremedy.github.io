// Script para agregar la tabla user_documents si no existe
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addUserDocumentsTable() {
    const dbPath = path.join(__dirname, '../../apexremedy.db');
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.run(`
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
        `, (err) => {
            if (err) {
                console.error('❌ Error creando tabla user_documents:', err);
                reject(err);
            } else {
                console.log('✅ Tabla user_documents creada o ya existe');
                
                // Crear índice para mejorar performance
                db.run(`
                    CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
                    ON user_documents(user_id)
                `, (idxErr) => {
                    if (idxErr) {
                        console.warn('⚠️ Error creando índice:', idxErr.message);
                    } else {
                        console.log('✅ Índice creado en user_documents(user_id)');
                    }
                    db.close((closeErr) => {
                        if (closeErr) {
                            reject(closeErr);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        });
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addUserDocumentsTable()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = addUserDocumentsTable;







