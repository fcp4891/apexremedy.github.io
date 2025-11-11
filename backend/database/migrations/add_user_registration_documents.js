// backend/database/migrations/add_user_registration_documents.js
// Script para crear tabla que asocia documentos a registros de receta (user_registrations)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addUserRegistrationDocuments() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);

    const dbHelper = {
        run: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve(this);
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
    };

    console.log('🔄 Creando tabla user_registration_documents...\n');

    try {
        // Crear tabla para asociar documentos a registros de receta
        console.log('📋 Creando tabla user_registration_documents...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_registration_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                registration_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_data TEXT NOT NULL, -- Encriptado
                file_size INTEGER,
                mime_type TEXT,
                is_encrypted INTEGER DEFAULT 1,
                encryption_key_hash TEXT,
                uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ Tabla user_registration_documents creada');

        // Crear índices
        await dbHelper.run(`
            CREATE INDEX IF NOT EXISTS idx_user_registration_documents_registration_id 
            ON user_registration_documents(registration_id)
        `);
        console.log('  ✓ Índice creado en user_registration_documents(registration_id)');

        await dbHelper.run(`
            CREATE INDEX IF NOT EXISTS idx_user_registration_documents_user_id 
            ON user_registration_documents(user_id)
        `);
        console.log('  ✓ Índice creado en user_registration_documents(user_id)');

        // Agregar campo receta_id a user_registrations para identificar la receta
        console.log('\n📝 Verificando campos en user_registrations...');
        const regColumns = await dbHelper.all(`PRAGMA table_info(user_registrations)`);
        const regColumnNames = regColumns.map(c => c.name);

        if (!regColumnNames.includes('receta_id')) {
            await dbHelper.run(`ALTER TABLE user_registrations ADD COLUMN receta_id TEXT`);
            console.log('  ✓ Columna receta_id agregada a user_registrations');
        } else {
            console.log('  - Columna receta_id ya existe en user_registrations');
        }

        if (!regColumnNames.includes('receta_fecha')) {
            await dbHelper.run(`ALTER TABLE user_registrations ADD COLUMN receta_fecha TEXT`);
            console.log('  ✓ Columna receta_fecha agregada a user_registrations');
        } else {
            console.log('  - Columna receta_fecha ya existe en user_registrations');
        }

        if (!regColumnNames.includes('medico_nombre')) {
            await dbHelper.run(`ALTER TABLE user_registrations ADD COLUMN medico_nombre TEXT`);
            console.log('  ✓ Columna medico_nombre agregada a user_registrations');
        } else {
            console.log('  - Columna medico_nombre ya existe en user_registrations');
        }

        if (!regColumnNames.includes('medico_licencia')) {
            await dbHelper.run(`ALTER TABLE user_registrations ADD COLUMN medico_licencia TEXT`);
            console.log('  ✓ Columna medico_licencia agregada a user_registrations');
        } else {
            console.log('  - Columna medico_licencia ya existe en user_registrations');
        }

        console.log('\n✅ Tabla user_registration_documents y campos adicionales creados correctamente\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addUserRegistrationDocuments()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = addUserRegistrationDocuments;






