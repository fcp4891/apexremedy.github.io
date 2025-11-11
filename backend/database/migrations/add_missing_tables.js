// Script para agregar tablas faltantes: user_documents, user_forced_approvals y user_medical_info
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addMissingTables() {
    // Intentar diferentes rutas posibles para la base de datos
    const possiblePaths = [
        path.join(__dirname, '../../apexremedy.db'),
        path.join(__dirname, '../../../apexremedy.db'),
        path.join(process.cwd(), 'apexremedy.db'),
        path.join(process.cwd(), 'backend/apexremedy.db')
    ];
    
    let dbPath = null;
    for (const possiblePath of possiblePaths) {
        const fs = require('fs');
        if (fs.existsSync(possiblePath)) {
            dbPath = possiblePath;
            console.log(`✅ Base de datos encontrada en: ${dbPath}`);
            break;
        }
    }
    
    // Si no se encuentra, usar la ruta por defecto
    if (!dbPath) {
        dbPath = path.join(process.cwd(), 'backend/apexremedy.db');
        console.log(`📁 Usando ruta por defecto: ${dbPath}`);
    }
    
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Crear tabla user_documents
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
                    
                    // Crear índice
                    db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
                        ON user_documents(user_id)
                    `, (idxErr) => {
                        if (idxErr) {
                            console.warn('⚠️ Error creando índice:', idxErr.message);
                        } else {
                            console.log('✅ Índice creado en user_documents(user_id)');
                        }
                    });
                }
            });
            
            // Crear tabla user_forced_approvals
            db.run(`
                CREATE TABLE IF NOT EXISTS user_forced_approvals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    admin_id INTEGER NOT NULL,
                    admin_notes TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (admin_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla user_forced_approvals:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabla user_forced_approvals creada o ya existe');
                    
                    // Crear índice
                    db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                        ON user_forced_approvals(user_id)
                    `, (idxErr) => {
                        if (idxErr) {
                            console.warn('⚠️ Error creando índice:', idxErr.message);
                        } else {
                            console.log('✅ Índice creado en user_forced_approvals(user_id)');
                        }
                    });
                }
            });
            
            // Crear tabla user_medical_info
            db.run(`
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
            `, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla user_medical_info:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabla user_medical_info creada o ya existe');
                    
                    // Crear índice
                    db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_medical_info_user_id 
                        ON user_medical_info(user_id)
                    `, (idxErr) => {
                        if (idxErr) {
                            console.warn('⚠️ Error creando índice:', idxErr.message);
                        } else {
                            console.log('✅ Índice creado en user_medical_info(user_id)');
                        }
                        
                        db.close((closeErr) => {
                            if (closeErr) {
                                reject(closeErr);
                            } else {
                                console.log('✅ Proceso completado');
                                resolve();
                            }
                        });
                    });
                }
            });
        });
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addMissingTables()
        .then(() => {
            console.log('✅ Todas las tablas creadas exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = addMissingTables;

