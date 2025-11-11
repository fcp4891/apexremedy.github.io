// backend/database/migrations/add_cession_fields.js
// Script para agregar campos de cesión de cultivo a las tablas necesarias

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addCessionFields() {
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

    console.log('🔄 Agregando campos de cesión de cultivo...\n');

    try {
        // Agregar campos a cultivation_rights_cessions si no existen
        console.log('📜 Actualizando tabla cultivation_rights_cessions...');
        
        const cessionColumns = await dbHelper.all(`PRAGMA table_info(cultivation_rights_cessions)`);
        const cessionColumnNames = cessionColumns.map(c => c.name);

        // Campos a agregar
        const fieldsToAdd = [
            { name: 'cedente_nombre', type: 'TEXT' },
            { name: 'cedente_rut', type: 'TEXT' },
            { name: 'cedente_firma', type: 'TEXT' }, // Base64 de la firma
            { name: 'enfermedad_condicion', type: 'TEXT' }, // Encriptado
            { name: 'fecha_inicio', type: 'TEXT' },
            { name: 'fecha_termino', type: 'TEXT' },
            { name: 'es_indefinido', type: 'INTEGER DEFAULT 0' },
            { name: 'es_revocable', type: 'INTEGER DEFAULT 1' },
            { name: 'dispensario_nombre', type: 'TEXT' },
            { name: 'dispensario_rut', type: 'TEXT' },
            { name: 'dispensario_direccion', type: 'TEXT' },
            { name: 'dispensario_firma', type: 'TEXT' }, // Base64 de la firma
            { name: 'documento_html', type: 'TEXT' }, // HTML completo del documento generado
            { name: 'fecha_cesion', type: 'TEXT' } // Fecha actual cuando se crea la cesión
        ];

        for (const field of fieldsToAdd) {
            if (!cessionColumnNames.includes(field.name)) {
                await dbHelper.run(`ALTER TABLE cultivation_rights_cessions ADD COLUMN ${field.name} ${field.type}`);
                console.log(`  ✓ Columna ${field.name} agregada`);
            } else {
                console.log(`  - Columna ${field.name} ya existe`);
            }
        }

        // Verificar/actualizar tabla dispensary_data
        console.log('\n🏥 Verificando tabla dispensary_data...');
        
        // Crear tabla si no existe
        const tableExists = await dbHelper.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='dispensary_data'"
        );
        
        if (!tableExists) {
            console.log('  📝 Creando tabla dispensary_data...');
            await dbHelper.run(`
                CREATE TABLE IF NOT EXISTS dispensary_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    rut TEXT NOT NULL,
                    address TEXT NOT NULL,
                    email TEXT NOT NULL,
                    signature TEXT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('  ✓ Tabla dispensary_data creada');
            
            // Insertar datos por defecto
            await dbHelper.run(`
                INSERT INTO dispensary_data (name, rut, address, email, signature, created_at, updated_at)
                VALUES ('Apexremedy', '76.237.243-6', 'Oficina Virtual', 'contacto@apexremedy.cl', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            console.log('  ✓ Datos por defecto del dispensario insertados');
        }
        
        const dispensaryColumns = await dbHelper.all(`PRAGMA table_info(dispensary_data)`);
        const dispensaryColumnNames = dispensaryColumns.map(c => c.name);

        // Asegurar que tenga todos los campos necesarios
        const dispensaryFields = [
            { name: 'signature', type: 'TEXT' } // Firma del dispensario
        ];

        for (const field of dispensaryFields) {
            if (!dispensaryColumnNames.includes(field.name)) {
                await dbHelper.run(`ALTER TABLE dispensary_data ADD COLUMN ${field.name} ${field.type}`);
                console.log(`  ✓ Columna ${field.name} agregada a dispensary_data`);
            } else {
                console.log(`  - Columna ${field.name} ya existe en dispensary_data`);
            }
        }

        // Actualizar datos por defecto del dispensario si no tiene RUT correcto
        const existingDispensary = await dbHelper.get('SELECT * FROM dispensary_data LIMIT 1');
        if (existingDispensary && (!existingDispensary.rut || existingDispensary.rut !== '76.237.243-6')) {
            await dbHelper.run(`
                UPDATE dispensary_data 
                SET rut = '76.237.243-6',
                    address = 'Oficina Virtual',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [existingDispensary.id]);
            console.log('  ✓ Datos del dispensario actualizados');
        }

        console.log('\n✅ Campos de cesión agregados correctamente\n');

    } catch (error) {
        console.error('❌ Error agregando campos:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addCessionFields()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = addCessionFields;

