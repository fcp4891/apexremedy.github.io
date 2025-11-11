// backend/src/models/User.js
const Database = require('../database/db');

class User {
    constructor() {
        this.db = Database.getInstance();
    }

    /**
     * Crear nuevo usuario
     */
    async create(userData) {
        const {
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role
        } = userData;

        const query = `
            INSERT INTO users (
                email, password_hash, first_name, last_name, phone, role,
                is_verified, is_active,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'), datetime('now'))
        `;

        const result = await this.db.run(query, [
            email,
            password_hash,
            first_name,
            last_name,
            phone || null,
            role || 'customer'
        ]);

        return result.lastID;
    }

    /**
     * Crear información médica del usuario
     */
    async createMedicalInfo(userId, medicalData) {
        const {
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
            medical_notes
        } = medicalData;

        const query = `
            INSERT INTO user_medical_info (
                user_id, rut, date_of_birth,
                medical_conditions, current_medications, allergies,
                has_medical_cannabis_authorization, authorization_number, authorization_expires,
                prescribing_doctor, doctor_license, medical_notes,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        const result = await this.db.run(query, [
            userId,
            rut || null,
            date_of_birth || null,
            medical_conditions ? JSON.stringify(medical_conditions) : null,
            current_medications ? JSON.stringify(current_medications) : null,
            allergies ? JSON.stringify(allergies) : null,
            has_medical_cannabis_authorization || 0,
            authorization_number || null,
            authorization_expires || null,
            prescribing_doctor || null,
            doctor_license || null,
            medical_notes || null
        ]);

        return result.lastID;
    }

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        const user = await this.db.get(query, [id]);
        
        if (!user) {
            return null;
        }
        
        // Mapear campos: 'password' en BD → 'password_hash' para el código
        if (user.password && !user.password_hash) {
            user.password_hash = user.password;
        }
        
        // Mapear status → is_active (compatibilidad con esquemas antiguos)
        if (user.status !== undefined && user.is_active === undefined) {
            user.is_active = (user.status === 'active') ? 1 : 0;
        }
        // Si no hay status ni is_active, asumir activo
        if (user.is_active === undefined) {
            user.is_active = 1;
        }
        
        // Mapear rol si no existe
        if (!user.role) {
            // Intentar obtener rol desde user_roles si existe
            try {
                const roleQuery = `
                    SELECT r.code FROM roles r
                    INNER JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                    LIMIT 1
                `;
                const roleRow = await this.db.get(roleQuery, [user.id]);
                if (roleRow) {
                    user.role = roleRow.code;
                } else {
                    // Default: admin si email contiene 'admin', sino customer
                    user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
                }
            } catch (err) {
                // Si no existe tabla roles, usar lógica simple
                user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
            }
        }
        
        return user;
    }

    /**
     * Buscar usuario por RUT (desde user_medical_info)
     */
    async findByRUT(rut) {
        if (!rut || rut.trim() === '') return null;
        
        try {
            // Buscar en user_medical_info primero
            const query = `
                SELECT u.*, m.rut 
                FROM users u
                INNER JOIN user_medical_info m ON u.id = m.user_id
                WHERE m.rut = ?
                LIMIT 1
            `;
            const user = await this.db.get(query, [rut.trim()]);
            
            if (user) {
                return this._mapUserFields(user);
            }
            
            // Si no se encuentra en user_medical_info, buscar en users.rut (para compatibilidad)
            const fallbackQuery = 'SELECT * FROM users WHERE rut = ? LIMIT 1';
            const fallbackUser = await this.db.get(fallbackQuery, [rut.trim()]);
            
            if (fallbackUser) {
                return this._mapUserFields(fallbackUser);
            }
            
            return null;
        } catch (error) {
            // Si la tabla user_medical_info no existe, buscar solo en users
            if (error.code === 'SQLITE_ERROR' && error.message.includes('user_medical_info')) {
                const query = 'SELECT * FROM users WHERE rut = ? LIMIT 1';
                const user = await this.db.get(query, [rut.trim()]);
                return user ? this._mapUserFields(user) : null;
            }
            throw error;
        }
    }
    
    /**
     * Verificar si un RUT ya existe
     */
    async rutExists(rut, excludeUserId = null) {
        if (!rut || rut.trim() === '') return false;
        
        try {
            // Buscar en user_medical_info
            let query = `
                SELECT COUNT(*) as count 
                FROM user_medical_info 
                WHERE rut = ?
            `;
            let params = [rut.trim()];
            
            if (excludeUserId) {
                query += ' AND user_id != ?';
                params.push(excludeUserId);
            }
            
            const result = await this.db.get(query, params);
            if (result && result.count > 0) return true;
            
            // Buscar en users.rut (compatibilidad)
            query = 'SELECT COUNT(*) as count FROM users WHERE rut = ?';
            params = [rut.trim()];
            
            if (excludeUserId) {
                query += ' AND id != ?';
                params.push(excludeUserId);
            }
            
            const fallbackResult = await this.db.get(query, params);
            return fallbackResult && fallbackResult.count > 0;
        } catch (error) {
            // Si la tabla user_medical_info no existe, buscar solo en users
            if (error.code === 'SQLITE_ERROR' && error.message.includes('user_medical_info')) {
                let query = 'SELECT COUNT(*) as count FROM users WHERE rut = ?';
                let params = [rut.trim()];
                
                if (excludeUserId) {
                    query += ' AND id != ?';
                    params.push(excludeUserId);
                }
                
                const result = await this.db.get(query, params);
                return result && result.count > 0;
            }
            throw error;
        }
    }

    /**
     * Buscar usuario por email
     */
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const user = await this.db.get(query, [email]);
        
        if (!user) {
            return null;
        }
        
        // Mapear campos: 'password' en BD → 'password_hash' para el código
        if (user.password && !user.password_hash) {
            user.password_hash = user.password;
        }
        
        // Mapear status → is_active (compatibilidad con esquemas antiguos)
        if (user.status !== undefined && user.is_active === undefined) {
            user.is_active = (user.status === 'active') ? 1 : 0;
        }
        // Si no hay status ni is_active, asumir activo
        if (user.is_active === undefined) {
            user.is_active = 1;
        }
        
        // Mapear rol si no existe (buscarlo en user_roles o usar default)
        if (!user.role) {
            // Intentar obtener rol desde user_roles si existe
            try {
                const roleQuery = `
                    SELECT r.code FROM roles r
                    INNER JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                    LIMIT 1
                `;
                const roleRow = await this.db.get(roleQuery, [user.id]);
                if (roleRow) {
                    user.role = roleRow.code;
                } else {
                    // Default: admin si email contiene 'admin', sino customer
                    user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
                }
            } catch (err) {
                // Si no existe tabla roles, usar lógica simple
                user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
            }
        }
        
        return user;
    }

    /**
     * Buscar usuario con información médica
     */
    async findByIdWithMedicalInfo(id) {
        try {
            // Intentar obtener usuario con información médica
            const query = `
                SELECT 
                    u.*,
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
                    m.medical_notes
                FROM users u
                LEFT JOIN user_medical_info m ON u.id = m.user_id
                WHERE u.id = ?
            `;
            const user = await this.db.get(query, [id]);
            
            // Si el usuario existe, mapear campos
            if (user) {
                return this._mapUserFields(user);
            }
            return null;
        } catch (error) {
            // Si la tabla user_medical_info no existe, usar findById como fallback
            if (error.code === 'SQLITE_ERROR' && 
                (error.message.includes('user_medical_info') || 
                 error.message.includes('no such table'))) {
                // Intentar crear la tabla si no existe
                try {
                    await this.db.run(`
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
                    `);
                    // Intentar de nuevo después de crear la tabla (usar la query directamente para evitar recursión)
                    const retryQuery = `
                        SELECT 
                            u.*,
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
                            m.medical_notes
                        FROM users u
                        LEFT JOIN user_medical_info m ON u.id = m.user_id
                        WHERE u.id = ?
                    `;
                    const retryUser = await this.db.get(retryQuery, [id]);
                    if (retryUser) {
                        return this._mapUserFields(retryUser);
                    }
                    return await this.findById(id);
                } catch (createError) {
                    // Si falla la creación, usar findById como fallback
                    console.warn('⚠️ No se pudo crear user_medical_info, usando findById como fallback');
                    return await this.findById(id);
                }
            }
            // Si es otro error, relanzarlo
            throw error;
        }
    }
    
    /**
     * Mapear campos del usuario (helper interno)
     */
    _mapUserFields(user) {
        // Mapear campos: 'password' en BD → 'password_hash' para el código
        if (user.password && !user.password_hash) {
            user.password_hash = user.password;
        }
        
        // Mapear status → is_active
        if (user.status !== undefined && user.is_active === undefined) {
            user.is_active = (user.status === 'active') ? 1 : 0;
        }
        if (user.is_active === undefined) {
            user.is_active = 1;
        }
        
        // Mapear rol si no existe
        if (!user.role) {
            user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
        }
        
        return user;
    }

    /**
     * Verificar si email existe (excluyendo un usuario específico)
     */
    async emailExists(email, excludeUserId = null) {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];

        if (excludeUserId) {
            query += ' AND id != ?';
            params.push(excludeUserId);
        }

        const user = await this.db.get(query, params);
        return !!user;
    }

    /**
     * Actualizar usuario
     */
    async update(id, userData) {
        console.log('📝 User.update llamado con:', { id, userData });
        
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(userData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }

        fields.push('updated_at = datetime(\'now\')');
        values.push(id);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        console.log('🔧 Query SQL:', query);
        console.log('📦 Valores:', values);
        
        await this.db.run(query, values);
        console.log('✅ Usuario actualizado en base de datos');
    }

    /**
     * Actualizar información médica
     */
    async updateMedicalInfo(userId, medicalData) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(medicalData)) {
            if (typeof value === 'object' && value !== null) {
                fields.push(`${key} = ?`);
                values.push(JSON.stringify(value));
            } else {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        fields.push('updated_at = datetime(\'now\')');
        values.push(userId);

        const query = `UPDATE user_medical_info SET ${fields.join(', ')} WHERE user_id = ?`;
        await this.db.run(query, values);
    }

    /**
     * Obtener todos los usuarios
     */
    async getAll(filters = {}) {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];

        // No filtrar por role directamente (la tabla no tiene columna role)
        // Lo mapearemos después

        // Filtrar por is_active usando status si no existe is_active
        if (filters.is_active !== undefined) {
            // Intentar filtrar por is_active, si no existe, usar status
            query += ' AND (is_active = ? OR (is_active IS NULL AND status = ?))';
            const statusValue = filters.is_active ? 'active' : 'inactive';
            params.push(filters.is_active ? 1 : 0);
            params.push(statusValue);
        }

        if (filters.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(filters.is_verified ? 1 : 0);
        }

        query += ' ORDER BY created_at DESC';

        let users = await this.db.all(query, params);
        
        // Mapear campos para todos los usuarios
        users = users.map(user => this._mapUserFields(user));
        
        // Filtrar por role después del mapeo
        if (filters.role) {
            users = users.filter(user => user.role === filters.role);
        }
        
        // Aplicar filtro de is_active después del mapeo (por si acaso)
        if (filters.is_active !== undefined) {
            const expectedActive = filters.is_active ? 1 : 0;
            users = users.filter(user => {
                const isActive = user.is_active !== undefined ? user.is_active : 
                               (user.status === 'active' ? 1 : 0);
                return isActive === expectedActive;
            });
        }

        return users;
    }

    /**
     * Actualizar última fecha de login
     */
    async updateLastLogin(userId) {
        const query = `
            UPDATE users 
            SET last_login_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [userId]);
    }

    /**
     * Verificar cuenta de usuario
     */
    async verifyAccount(userId) {
        const query = `
            UPDATE users 
            SET is_verified = 1,
                verification_token = NULL,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [userId]);
    }

    /**
     * Establecer token de verificación
     */
    async setVerificationToken(userId, token) {
        const query = `
            UPDATE users 
            SET verification_token = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [token, userId]);
    }

    /**
     * Establecer token de reset de password
     */
    async setResetToken(userId, token, expiresAt) {
        const query = `
            UPDATE users 
            SET reset_token = ?,
                reset_token_expires = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [token, expiresAt, userId]);
    }

    /**
     * Limpiar token de reset
     */
    async clearResetToken(userId) {
        const query = `
            UPDATE users 
            SET reset_token = NULL,
                reset_token_expires = NULL,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [userId]);
    }

    /**
     * Buscar usuario por token de reset
     */
    async findByResetToken(token) {
        const query = `
            SELECT * FROM users 
            WHERE reset_token = ? 
            AND reset_token_expires > datetime('now')
        `;
        return await this.db.get(query, [token]);
    }

    /**
     * Buscar usuario por token de verificación
     */
    async findByVerificationToken(token) {
        const query = `
            SELECT * FROM users 
            WHERE verification_token = ?
        `;
        return await this.db.get(query, [token]);
    }

    /**
     * Activar/Desactivar usuario
     */
    async setActive(userId, isActive) {
        const query = `
            UPDATE users 
            SET is_active = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        await this.db.run(query, [isActive ? 1 : 0, userId]);
    }

    /**
     * Eliminar usuario
     */
    async delete(id) {
        try {
            // Primero, eliminar registros relacionados manualmente
            // Esto es necesario porque algunas tablas no tienen ON DELETE CASCADE
            const db = this.db;
            
            // Deshabilitar temporalmente las restricciones de claves foráneas
            await db.run('PRAGMA foreign_keys = OFF');
            
            try {
                // Obtener IDs de orders y payments del usuario
                let orderIds = [];
                let paymentIds = [];
                try {
                    const orders = await db.all('SELECT id FROM orders WHERE user_id = ?', [id]);
                    orderIds = orders.map(o => o.id);
                } catch (err) {
                    // Tabla no existe, continuar
                }
                
                try {
                    const payments = await db.all('SELECT id FROM payments WHERE customer_id = ?', [id]);
                    paymentIds = payments.map(p => p.id);
                } catch (err) {
                    // Tabla no existe, continuar
                }
                
                // También obtener payments relacionados con orders del usuario
                if (orderIds.length > 0) {
                    try {
                        const paymentsFromOrders = await db.all('SELECT id FROM payments WHERE order_id IN (' + orderIds.map(() => '?').join(',') + ')', orderIds);
                        const additionalPaymentIds = paymentsFromOrders.map(p => p.id);
                        paymentIds = [...new Set([...paymentIds, ...additionalPaymentIds])];
                    } catch (err) {
                        // Tabla no existe o columna no existe, continuar
                    }
                }
                
                // Obtener IDs de returns relacionados
                let returnIds = [];
                if (orderIds.length > 0) {
                    try {
                        const returns = await db.all('SELECT id FROM returns WHERE order_id IN (' + orderIds.map(() => '?').join(',') + ')', orderIds);
                        returnIds = returns.map(r => r.id);
                    } catch (err) {
                        // Tabla no existe, continuar
                    }
                }
                
                // Lista de tablas a limpiar (en orden de dependencias)
                const cleanupQueries = [
                // 1. Primero eliminar tablas que referencian a payments y orders
                ...(paymentIds.length > 0 ? [
                    { table: 'chargebacks', where: 'payment_id IN (' + paymentIds.map(() => '?').join(',') + ')', params: paymentIds },
                    { table: 'payment_transactions', where: 'payment_id IN (' + paymentIds.map(() => '?').join(',') + ')', params: paymentIds },
                ] : []),
                ...(paymentIds.length > 0 || id ? [
                    { table: 'refunds', where: (paymentIds.length > 0 ? 'payment_id IN (' + paymentIds.map(() => '?').join(',') + ') OR ' : '') + 'requested_by = ? OR approved_by = ?', params: paymentIds.length > 0 ? [...paymentIds, id, id] : [id, id] },
                ] : []),
                ...(orderIds.length > 0 || id ? [
                    { table: 'gift_card_transactions', where: (orderIds.length > 0 ? 'order_id IN (' + orderIds.map(() => '?').join(',') + ') OR ' : '') + 'operator = ?', params: orderIds.length > 0 ? [...orderIds, id] : [id] },
                ] : []),
                ...(returnIds.length > 0 ? [
                    { table: 'return_items', where: 'return_id IN (' + returnIds.map(() => '?').join(',') + ')', params: returnIds },
                ] : []),
                ...(orderIds.length > 0 ? [
                    { table: 'order_items', where: 'order_id IN (' + orderIds.map(() => '?').join(',') + ')', params: orderIds },
                    { table: 'shipments', where: 'order_id IN (' + orderIds.map(() => '?').join(',') + ')', params: orderIds },
                    { table: 'order_notes', where: 'order_id IN (' + orderIds.map(() => '?').join(',') + ')', params: orderIds },
                    { table: 'order_status_history', where: 'order_id IN (' + orderIds.map(() => '?').join(',') + ') OR changed_by = ?', params: [...orderIds, id] },
                ] : [
                    { table: 'order_status_history', where: 'changed_by = ?', params: [id] },
                ]),
                ...(orderIds.length > 0 || id ? [
                    { table: 'returns', where: (orderIds.length > 0 ? 'order_id IN (' + orderIds.map(() => '?').join(',') + ') OR ' : '') + 'user_id = ? OR approved_by = ?', params: orderIds.length > 0 ? [...orderIds, id, id] : [id, id] },
                ] : []),
                
                // 2. Luego eliminar payments (tanto los del customer_id como los relacionados con orders del usuario)
                ...(orderIds.length > 0 ? [
                    { table: 'payments', where: 'order_id IN (' + orderIds.map(() => '?').join(',') + ')', params: orderIds },
                ] : []),
                { table: 'payments', where: 'customer_id = ?' },
                
                // 3. Finalmente eliminar orders
                { table: 'orders', where: 'user_id = ?' },
                
                // 4. Tablas con user_id directo (ordenadas por dependencias)
                { table: 'user_registration_documents', where: 'user_id = ?' },
                { table: 'user_registrations', where: 'user_id = ?' },
                { table: 'user_documents', where: 'user_id = ?' },
                { table: 'user_medical_info', where: 'user_id = ?' },
                { table: 'user_roles', where: 'user_id = ?' },
                { table: 'addresses', where: 'user_id = ?' },
                { table: 'prescriptions', where: 'user_id = ?' },
                { table: 'wishlist', where: 'user_id = ?' },
                { table: 'product_reviews', where: 'user_id = ? OR approved_by = ?', params: [id, id] },
                { table: 'cultivation_rights_cessions', where: 'user_id = ?' },
                { table: 'privacy_consents', where: 'user_id = ?' },
                
                // 5. Tablas con referencias indirectas (admin_id, etc.)
                { table: 'user_forced_approvals', where: 'user_id = ? OR admin_id = ?', params: [id, id] },
                ];
                
                // Ejecutar limpieza
                for (const queryInfo of cleanupQueries) {
                    try {
                        const whereClause = queryInfo.where;
                        const params = queryInfo.params || [id];
                        const sql = `DELETE FROM ${queryInfo.table} WHERE ${whereClause}`;
                        await db.run(sql, params);
                        console.log(`  ✅ Limpiado ${queryInfo.table} para usuario ${id}`);
                    } catch (err) {
                        // Si la tabla no existe o hay error, continuar
                        if (err.message && err.message.includes('no such table')) {
                            // Tabla no existe, continuar
                        } else {
                            console.warn(`  ⚠️ No se pudo limpiar ${queryInfo.table}:`, err.message);
                        }
                    }
                }
            
                // Finalmente, eliminar el usuario
                const query = 'DELETE FROM users WHERE id = ?';
                await db.run(query, [id]);
                
                console.log(`✅ Usuario ${id} eliminado correctamente`);
            } finally {
                // Rehabilitar las restricciones de claves foráneas
                await db.run('PRAGMA foreign_keys = ON');
            }
        } catch (error) {
            console.error(`❌ Error al eliminar usuario ${id}:`, error);
            console.error('   Código:', error.code);
            console.error('   Mensaje:', error.message);
            
            // Asegurarse de rehabilitar las restricciones incluso si hay error
            try {
                await this.db.run('PRAGMA foreign_keys = ON');
            } catch (pragmaError) {
                console.warn('⚠️ No se pudo rehabilitar foreign_keys:', pragmaError.message);
            }
            
            throw error;
        }
    }

    /**
     * Obtener información médica de un usuario
     */
    async getMedicalInfo(userId) {
        const query = 'SELECT * FROM user_medical_info WHERE user_id = ?';
        return await this.db.get(query, [userId]);
    }

    /**
     * Verificar si usuario tiene autorización médica válida
     */
    async hasValidMedicalAuthorization(userId) {
        const query = `
            SELECT has_medical_cannabis_authorization, authorization_expires
            FROM user_medical_info
            WHERE user_id = ?
        `;
        const medicalInfo = await this.db.get(query, [userId]);

        if (!medicalInfo || !medicalInfo.has_medical_cannabis_authorization) {
            return false;
        }

        if (medicalInfo.authorization_expires) {
            const expiryDate = new Date(medicalInfo.authorization_expires);
            return expiryDate > new Date();
        }

        return true;
    }
}

module.exports = User;