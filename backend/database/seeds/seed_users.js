// backend/database/seeds/seed_users.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// helper estilo seed.js (run/all) :contentReference[oaicite:5]{index=5}
const createDbHelper = (db) => ({
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this); // this.lastID disponible acá
        });
    }),
    all: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
    get: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
});

// hash simple SHA-256 solo para dev/demo
// En prod deberías usar bcrypt/argon2.
function hashPassword(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

async function seedUsers() {
    const dbPath = path.join(__dirname, '..', 'apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('👤 Iniciando seed de usuarios (admin + clientes)...\n');

    const now = new Date().toISOString();

    // Definimos los 3 usuarios base
    const usersToInsert = [
        {
            // Admin
            email: 'admin@apexremedy.local',
            password_plain: 'Admin123!',
            first_name: 'Apex',
            last_name: 'Administrator',
            phone: '+56 9 0000 0000',
            role: 'admin',
            is_verified: 1,
            is_active: 1,
            verification_token: null,
            reset_token: null,
            reset_token_expires: null,
            last_login: now,
            created_at: now,
            updated_at: now
        },
        {
            // Cliente 1
            email: 'felipe.cliente@apexremedy.local',
            password_plain: 'Cliente123!',
            first_name: 'Felipe',
            last_name: 'Cliente',
            phone: '+56 9 1234 5678',
            role: 'customer',
            is_verified: 1,
            is_active: 1,
            verification_token: null,
            reset_token: null,
            reset_token_expires: null,
            last_login: null,
            created_at: now,
            updated_at: now
        },
        {
            // Cliente 2 (paciente medicinal)
            email: 'paciente.medicinal@apexremedy.local',
            password_plain: 'Medicinal123!',
            first_name: 'Paciente',
            last_name: 'Medicinal',
            phone: '+56 9 7777 8888',
            role: 'customer',
            is_verified: 0, // este tendrá is_verified=0 para simular pendiente validación médica
            is_active: 1,
            verification_token: 'PENDING-MED-VERIFICATION',
            reset_token: null,
            reset_token_expires: null,
            last_login: null,
            created_at: now,
            updated_at: now
        }
    ];

    try {
        // 1. Insertar / upsert usuarios en tabla users
        console.log('📝 Insertando/actualizando en tabla users...');

        for (const u of usersToInsert) {
            const password_hash = hashPassword(u.password_plain);

            // Hacemos UPSERT por email para que sea idempotente
            // Esto respeta TODOS los campos definidos en create_tables.js para users. :contentReference[oaicite:6]{index=6}
            await dbHelper.run(`
                INSERT INTO users (
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    phone,
                    role,
                    is_verified,
                    is_active,
                    verification_token,
                    reset_token,
                    reset_token_expires,
                    last_login,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    password_hash = excluded.password_hash,
                    first_name = excluded.first_name,
                    last_name = excluded.last_name,
                    phone = excluded.phone,
                    role = excluded.role,
                    is_verified = excluded.is_verified,
                    is_active = excluded.is_active,
                    verification_token = excluded.verification_token,
                    reset_token = excluded.reset_token,
                    reset_token_expires = excluded.reset_token_expires,
                    last_login = excluded.last_login,
                    updated_at = excluded.updated_at
            `, [
                u.email,
                password_hash,
                u.first_name,
                u.last_name,
                u.phone,
                u.role,
                u.is_verified,
                u.is_active,
                u.verification_token,
                u.reset_token,
                u.reset_token_expires,
                u.last_login,
                u.created_at,
                u.updated_at
            ]);

            console.log(`  ✓ Usuario ${u.role.toUpperCase()} => ${u.email}`);
        }

        // 2. Obtener IDs reales desde la BD (porque en UPSERT no siempre hay lastID)
        console.log('\n🔍 Resolviendo IDs de usuarios...');
        const dbUsers = await dbHelper.all(`
            SELECT id, email, role
            FROM users
            WHERE email IN (?, ?, ?)
        `, usersToInsert.map(u => u.email));

        // Mapeo email -> id
        const userIdByEmail = {};
        for (const row of dbUsers) {
            userIdByEmail[row.email] = row.id;
            console.log(`  • ${row.email} => id=${row.id} (${row.role})`);
        }

        // 3. Insertar info médica en user_medical_info
        // Tabla user_medical_info requiere user_id UNIQUE + timestamps. :contentReference[oaicite:7]{index=7}
        console.log('\n🏥 Insertando/actualizando información médica (user_medical_info)...');

        const medicalInfos = [
            {
                email: 'admin@apexremedy.local',
                rut: '11.111.111-1',
                date_of_birth: '1990-01-01',
                medical_conditions: null,
                current_medications: null,
                allergies: null,
                has_medical_cannabis_authorization: 0,
                authorization_number: null,
                authorization_expires: null,
                prescribing_doctor: null,
                doctor_license: null,
                medical_notes: 'Usuario administrador interno, sin perfil clínico.',
            },
            {
                email: 'felipe.cliente@apexremedy.local',
                rut: '22.222.222-2',
                date_of_birth: '1988-05-20',
                medical_conditions: 'Dolor lumbar crónico leve',
                current_medications: 'Ibuprofeno ocasional',
                allergies: 'Ninguna declarada',
                has_medical_cannabis_authorization: 0,
                authorization_number: null,
                authorization_expires: null,
                prescribing_doctor: null,
                doctor_license: null,
                medical_notes: 'Cliente recreativo/no medicinal. No requiere receta.',
            },
            {
                email: 'paciente.medicinal@apexremedy.local',
                rut: '33.333.333-3',
                date_of_birth: '1975-09-12',
                medical_conditions: 'Fibromialgia severa; insomnio resistente',
                current_medications: 'Gabapentina 300mg; Zopiclona 7.5mg',
                allergies: 'AINEs (malestar estomacal severo)',
                has_medical_cannabis_authorization: 1,
                authorization_number: 'RX-CLINIC-2025-0001',
                authorization_expires: '2026-10-25',
                prescribing_doctor: 'Dr. Juan Pérez',
                doctor_license: 'MED-CHILE-123456',
                medical_notes: 'Uso clínico de cannabis con predominancia THC nocturna para manejo del dolor y sueño.',
            }
        ];

        for (const m of medicalInfos) {
            const userId = userIdByEmail[m.email];
            if (!userId) continue; // por seguridad

            await dbHelper.run(`
                INSERT INTO user_medical_info (
                    user_id,
                    rut,
                    date_of_birth,
                    medical_conditions,
                    current_medications,
                    allergies,
                    has_medical_cannabis_authorization,
                    authorization_number,
                    authorization_expires,
                    prescribing_doctor,
                    doctor_license,
                    medical_notes,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    rut = excluded.rut,
                    date_of_birth = excluded.date_of_birth,
                    medical_conditions = excluded.medical_conditions,
                    current_medications = excluded.current_medications,
                    allergies = excluded.allergies,
                    has_medical_cannabis_authorization = excluded.has_medical_cannabis_authorization,
                    authorization_number = excluded.authorization_number,
                    authorization_expires = excluded.authorization_expires,
                    prescribing_doctor = excluded.prescribing_doctor,
                    doctor_license = excluded.doctor_license,
                    medical_notes = excluded.medical_notes,
                    updated_at = excluded.updated_at
            `, [
                userId,
                m.rut,
                m.date_of_birth,
                m.medical_conditions,
                m.current_medications,
                m.allergies,
                m.has_medical_cannabis_authorization,
                m.authorization_number,
                m.authorization_expires,
                m.prescribing_doctor,
                m.doctor_license,
                m.medical_notes,
                now,
                now
            ]);

            console.log(`  ✓ Info médica asociada a ${m.email} (user_id=${userId})`);
        }

        // 4. Insertar direcciones base en addresses (tipo 'shipping' y marcamos is_default)
        // Tabla addresses requiere: user_id, type, address_line1, city, region, created_at, updated_at. :contentReference[oaicite:8]{index=8}
        console.log('\n📦 Insertando/actualizando direcciones (addresses)...');

        const addresses = [
            {
                email: 'admin@apexremedy.local',
                type: 'billing',
                address_line1: 'Oficina Corporativa Apex Remedy',
                address_line2: 'Piso 12',
                city: 'Santiago',
                region: 'RM',
                postal_code: '7500000',
                country: 'Chile',
                is_default: 1
            },
            {
                email: 'felipe.cliente@apexremedy.local',
                type: 'shipping',
                address_line1: 'Av. Siempre Viva 1234',
                address_line2: 'Depto. 504 Torre B',
                city: 'Providencia',
                region: 'RM',
                postal_code: '7510000',
                country: 'Chile',
                is_default: 1
            },
            {
                email: 'paciente.medicinal@apexremedy.local',
                type: 'shipping',
                address_line1: 'Los Aromos 456',
                address_line2: 'Casa interior',
                city: 'Antofagasta',
                region: 'Antofagasta',
                postal_code: '1240000',
                country: 'Chile',
                is_default: 1
            }
        ];

        for (const a of addresses) {
            const userId = userIdByEmail[a.email];
            if (!userId) continue;

            // NOTA: No hay UNIQUE(user_id,type) en addresses, así que podríamos terminar con duplicados si seed corre mil veces.
            // Si quieres idempotencia dura, puedes agregar UNIQUE(user_id, type) al schema en el futuro.
            await dbHelper.run(`
                INSERT INTO addresses (
                    user_id,
                    type,
                    address_line1,
                    address_line2,
                    city,
                    region,
                    postal_code,
                    country,
                    is_default,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                a.type,
                a.address_line1,
                a.address_line2,
                a.city,
                a.region,
                a.postal_code,
                a.country,
                a.is_default,
                now,
                now
            ]);

            console.log(`  ✓ Dirección registrada para ${a.email} (user_id=${userId})`);
        }

        // 5. Resumen final
        console.log('\n📊 Resumen final usuarios:');
        const finalUsers = await dbHelper.all(`
            SELECT id, email, first_name, last_name, role, is_verified, is_active
            FROM users
            WHERE email IN (?, ?, ?)
        `, usersToInsert.map(u => u.email));

        finalUsers.forEach(u => {
            console.log(
                `   • id=${u.id} | ${u.first_name} ${u.last_name} <${u.email}> | role=${u.role} | verificado=${u.is_verified} | activo=${u.is_active}`
            );
        });

        console.log(`\n🎉 TOTAL seed usuarios ejecutado para ${finalUsers.length} cuentas\n`);

    } catch (err) {
        console.error('❌ Error en seedUsers:', err);
        throw err;
    } finally {
        db.close();
    }
}

seedUsers()
    .then(() => {
        console.log('✅ Proceso seed_users completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal en seed_users:', error);
        process.exit(1);
    });
