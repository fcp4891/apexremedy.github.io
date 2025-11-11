// backend/database/migrations/add_user_registrations_table.js
// Script para crear tabla user_registrations para guardar datos de cesión por receta

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addUserRegistrationsTable() {
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

    console.log('🔄 Creando tabla user_registrations...\n');

    try {
        // Crear tabla user_registrations para guardar datos de cesión por receta
        console.log('📋 Creando tabla user_registrations...');
        await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS user_registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                -- Datos del cedente (de información personal)
                cedente_nombre TEXT NOT NULL,
                cedente_rut TEXT NOT NULL,
                cedente_firma TEXT, -- Base64 de la firma
                -- Datos médicos (encriptados)
                enfermedad_condicion TEXT NOT NULL, -- Encriptado
                fecha_inicio TEXT NOT NULL,
                fecha_termino TEXT,
                es_indefinido INTEGER DEFAULT 0,
                es_revocable INTEGER DEFAULT 1,
                -- Datos del dispensario (del mantenedor)
                dispensario_nombre TEXT NOT NULL,
                dispensario_rut TEXT NOT NULL,
                dispensario_direccion TEXT NOT NULL,
                dispensario_firma TEXT, -- Base64 de la firma
                -- Documento generado
                documento_html TEXT, -- HTML completo del documento
                fecha_cesion TEXT NOT NULL, -- Fecha actual cuando se crea
                -- Metadata
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ Tabla user_registrations creada');

        // Crear índices
        await dbHelper.run(`
            CREATE INDEX IF NOT EXISTS idx_user_registrations_user_id 
            ON user_registrations(user_id)
        `);
        console.log('  ✓ Índice creado en user_registrations(user_id)');

        // Agregar columna is_encrypted a user_documents si no existe
        console.log('\n🔒 Verificando encriptación en user_documents...');
        const docColumns = await dbHelper.all(`PRAGMA table_info(user_documents)`);
        const docColumnNames = docColumns.map(c => c.name);

        if (!docColumnNames.includes('is_encrypted')) {
            await dbHelper.run(`ALTER TABLE user_documents ADD COLUMN is_encrypted INTEGER DEFAULT 0`);
            console.log('  ✓ Columna is_encrypted agregada a user_documents');
        } else {
            console.log('  - Columna is_encrypted ya existe en user_documents');
        }

        if (!docColumnNames.includes('encryption_key_hash')) {
            await dbHelper.run(`ALTER TABLE user_documents ADD COLUMN encryption_key_hash TEXT`);
            console.log('  ✓ Columna encryption_key_hash agregada a user_documents');
        } else {
            console.log('  - Columna encryption_key_hash ya existe en user_documents');
        }

        console.log('\n✅ Tabla user_registrations y campos de encriptación creados correctamente\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addUserRegistrationsTable()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = addUserRegistrationsTable;






