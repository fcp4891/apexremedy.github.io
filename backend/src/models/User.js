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
        return await this.db.get(query, [id]);
    }

    /**
     * Buscar usuario por email
     */
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        return await this.db.get(query, [email]);
    }

    /**
     * Buscar usuario con información médica
     */
    async findByIdWithMedicalInfo(id) {
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
        return await this.db.get(query, [id]);
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

        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(filters.is_verified);
        }

        query += ' ORDER BY created_at DESC';

        return await this.db.all(query, params);
    }

    /**
     * Actualizar última fecha de login
     */
    async updateLastLogin(userId) {
        const query = `
            UPDATE users 
            SET last_login = datetime('now'),
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
        const query = 'DELETE FROM users WHERE id = ?';
        await this.db.run(query, [id]);
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