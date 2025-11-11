const consoleLabel = (msg) => console.log(msg);

async function ensureUsersDomain(dbHelper, helpers = {}) {
    const { addColumnIfNotExists } = helpers;

    consoleLabel('👤 Creando tabla users...');
    await dbHelper.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                name TEXT,
                phone TEXT,
                date_of_birth TEXT,
                rut TEXT UNIQUE,
                role TEXT DEFAULT 'customer',
                is_verified INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                medicinal_blocked INTEGER DEFAULT 0,
                two_factor_enabled INTEGER DEFAULT 0,
                two_factor_secret TEXT,
                email_verified_at TEXT,
                phone_verified_at TEXT,
                last_login_at TEXT,
                login_attempts INTEGER DEFAULT 0,
                locked_until TEXT,
                status TEXT DEFAULT 'active',
                account_status TEXT DEFAULT 'pending',
                rejection_reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
    consoleLabel('  ✅ Tabla users creada');

    if (typeof addColumnIfNotExists !== 'function') {
        consoleLabel('  ⚠️ helper addColumnIfNotExists no disponible, omitiendo migraciones incrementales para users');
        consoleLabel('  ✅ Tabla users lista\n');
        return;
    }

    try {
        await addColumnIfNotExists(dbHelper, 'users', 'password_hash', 'TEXT');
        await addColumnIfNotExists(dbHelper, 'users', 'first_name', 'TEXT');
        await addColumnIfNotExists(dbHelper, 'users', 'last_name', 'TEXT');
        await addColumnIfNotExists(dbHelper, 'users', 'role', "TEXT DEFAULT 'customer'");
        await addColumnIfNotExists(dbHelper, 'users', 'is_active', 'INTEGER DEFAULT 1');
        await addColumnIfNotExists(dbHelper, 'users', 'account_status', "TEXT DEFAULT 'pending'");
        await addColumnIfNotExists(dbHelper, 'users', 'rejection_reason', 'TEXT');

        const cols = await dbHelper.all(`PRAGMA table_info(users)`);
        const hasPassword = cols.some(c => c.name === 'password');
        const hasPasswordHash = cols.some(c => c.name === 'password_hash');

        if (hasPassword && hasPasswordHash) {
            await dbHelper.run(`
                    UPDATE users 
                    SET password_hash = password 
                    WHERE password_hash IS NULL AND password IS NOT NULL
                `);
            consoleLabel('  ✅ Datos de password migrados a password_hash');

            try {
                const unmigrated = await dbHelper.get(`
                        SELECT COUNT(*) as count 
                        FROM users 
                        WHERE password_hash IS NULL AND password IS NOT NULL
                    `);

                if (unmigrated && unmigrated.count === 0) {
                    consoleLabel('  🔄 Recreando tabla users sin columna password...');

                    await dbHelper.run(`
                            CREATE TABLE IF NOT EXISTS users_new (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                email TEXT NOT NULL UNIQUE,
                                password_hash TEXT NOT NULL,
                                first_name TEXT NOT NULL,
                                last_name TEXT NOT NULL,
                                name TEXT,
                                phone TEXT,
                                date_of_birth TEXT,
                                rut TEXT UNIQUE,
                                role TEXT DEFAULT 'customer',
                                is_verified INTEGER DEFAULT 0,
                                is_active INTEGER DEFAULT 1,
                                medicinal_blocked INTEGER DEFAULT 0,
                                two_factor_enabled INTEGER DEFAULT 0,
                                two_factor_secret TEXT,
                                email_verified_at TEXT,
                                phone_verified_at TEXT,
                                last_login_at TEXT,
                                login_attempts INTEGER DEFAULT 0,
                                locked_until TEXT,
                                status TEXT DEFAULT 'active',
                                account_status TEXT DEFAULT 'pending',
                                rejection_reason TEXT,
                                created_at TEXT NOT NULL,
                                updated_at TEXT NOT NULL
                            )
                        `);

                    await dbHelper.run(`
                            INSERT INTO users_new 
                            (id, email, password_hash, first_name, last_name, name, phone, date_of_birth, rut, 
                             role, is_verified, is_active, medicinal_blocked, two_factor_enabled, two_factor_secret,
                             email_verified_at, phone_verified_at, last_login_at, login_attempts, locked_until,
                             status, account_status, rejection_reason, created_at, updated_at)
                            SELECT 
                                id, email, password_hash, 
                                COALESCE(first_name, name, '') as first_name,
                                COALESCE(last_name, '') as last_name,
                                name, phone, date_of_birth, rut,
                                COALESCE(role, 'customer') as role,
                                is_verified, COALESCE(is_active, 1) as is_active,
                                medicinal_blocked, two_factor_enabled, two_factor_secret,
                                email_verified_at, phone_verified_at, last_login_at,
                                login_attempts, locked_until, status,
                                COALESCE(account_status, 'pending') as account_status,
                                rejection_reason, created_at, updated_at
                            FROM users
                        `);

                    try {
                        await dbHelper.run(`DROP VIEW IF EXISTS v_user_has_valid_prescription`);
                        await dbHelper.run(`DROP VIEW IF EXISTS v_user_medicinal_eligibility`);
                        await dbHelper.run(`DROP VIEW IF EXISTS v_product_inventory`);
                        await dbHelper.run(`DROP VIEW IF EXISTS v_order_summary`);
                        consoleLabel('  ✅ Vistas eliminadas temporalmente');
                    } catch (viewError) {
                        console.warn('  ⚠️ Algunas vistas no existen (continuando):', viewError.message);
                    }

                    await dbHelper.run(`DROP TABLE users`);
                    await dbHelper.run(`ALTER TABLE users_new RENAME TO users`);

                    consoleLabel('  ✅ Tabla users recreada sin columna password');
                }
            } catch (error) {
                console.warn('  ⚠️ No se pudo eliminar columna password (continuando):', error.message);
            }
        }

        const hasName = cols.some(c => c.name === 'name');
        if (hasName) {
            await dbHelper.run(`
                    UPDATE users 
                    SET first_name = COALESCE(first_name, name, ''),
                        last_name = COALESCE(last_name, '')
                    WHERE first_name IS NULL OR first_name = ''
                `);
            consoleLabel('  ✅ Datos de name migrados a first_name y last_name');
        }
    } catch (error) {
        console.warn('  ⚠️ Advertencia al migrar tabla users:', error.message);
    }

    consoleLabel('  ✅ Tabla users lista\n');
}

module.exports = {
    ensureUsersDomain,
};




