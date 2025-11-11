// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

const userModel = new User();

/**
 * GET /api/users
 * Obtener todos los usuarios (solo admin)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role, is_active, is_verified } = req.query;
        
        const filters = {};
        if (role) filters.role = role;
        if (is_active !== undefined) filters.is_active = is_active === 'true' ? 1 : 0;
        if (is_verified !== undefined) filters.is_verified = is_verified === 'true' ? 1 : 0;
        
        const users = await userModel.getAll(filters);
        
        // Verificar aprobaciones forzadas
        const db = require('../database/db').getInstance();
        let forcedApprovalsMap = {};
        try {
            const forcedApprovals = await db.all(
                'SELECT DISTINCT user_id FROM user_forced_approvals'
            );
            forcedApprovals.forEach(fa => {
                forcedApprovalsMap[fa.user_id] = true;
            });
        } catch (error) {
            // Si la tabla no existe, intentar crearla
            if (error.code === 'SQLITE_ERROR' && 
                (error.message.includes('user_forced_approvals') || 
                 error.message.includes('no such table'))) {
                try {
                    await db.run(`
                        CREATE TABLE IF NOT EXISTS user_forced_approvals (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            admin_id INTEGER NOT NULL,
                            admin_notes TEXT NOT NULL,
                            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (admin_id) REFERENCES users(id)
                        )
                    `);
                    await db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                        ON user_forced_approvals(user_id)
                    `);
                    // Intentar de nuevo después de crear la tabla
                    const forcedApprovals = await db.all(
                        'SELECT DISTINCT user_id FROM user_forced_approvals'
                    );
                    forcedApprovals.forEach(fa => {
                        forcedApprovalsMap[fa.user_id] = true;
                    });
                } catch (createError) {
                    // Si falla la creación, continuar sin el flag
                    console.warn('⚠️ No se pudo crear user_forced_approvals:', createError.message);
                }
            } else {
                // Si es otro error, mostrar warning
                console.warn('⚠️ No se pudo verificar aprobaciones forzadas:', error.message);
            }
        }
        
        // Obtener documentos de todos los usuarios clientes para verificar si tienen documentos requeridos
        const userDocumentsMap = {};
        try {
            // Verificar si la tabla existe antes de consultar
            const tableCheck = await db.all(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='user_documents'"
            );
            
            if (tableCheck.length > 0) {
                const allDocuments = await db.all(
                    'SELECT user_id, document_type FROM user_documents'
                );
                allDocuments.forEach(doc => {
                    if (!userDocumentsMap[doc.user_id]) {
                        userDocumentsMap[doc.user_id] = [];
                    }
                    userDocumentsMap[doc.user_id].push(doc.document_type);
                });
            } else {
                // Si la tabla no existe, crearla
                await db.run(`
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
                `);
                await db.run(`
                    CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
                    ON user_documents(user_id)
                `);
                console.log('✅ Tabla user_documents creada automáticamente');
            }
        } catch (error) {
            // Si hay error, intentar crear la tabla
            if (error.message && error.message.includes('no such table')) {
                try {
                    await db.run(`
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
                    `);
                    await db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
                        ON user_documents(user_id)
                    `);
                    console.log('✅ Tabla user_documents creada automáticamente después de error');
                } catch (createError) {
                    console.warn('⚠️ No se pudieron verificar documentos:', createError.message);
                }
            } else {
                console.warn('⚠️ No se pudieron verificar documentos:', error.message);
            }
        }
        
        // Primero, identificar y crear registros de aprobación forzada para clientes aprobados sin documentos
        for (const user of users) {
            const isCustomer = user.role === 'customer';
            const isApproved = user.is_verified === 1 || user.is_verified === '1';
            const isForced = forcedApprovalsMap[user.id];
            
            if (isCustomer && isApproved && !isForced) {
                const requiredDocuments = ['receta_medica', 'carnet_identidad', 'certificado_antecedentes', 'poder_cultivo'];
                const userDocuments = userDocumentsMap[user.id] || [];
                const hasAllRequiredDocuments = requiredDocuments.every(docType => 
                    userDocuments.includes(docType)
                );
                
                if (!hasAllRequiredDocuments) {
                    // Crear registro en user_forced_approvals si no existe
                    try {
                        const existingForcedApproval = await db.all(
                            'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                            [user.id]
                        );
                        
                        if (existingForcedApproval.length === 0) {
                            // Crear registro automático de aprobación forzada
                            const adminId = req.user?.id || 1; // Usar el admin actual o 1 por defecto
                            await db.run(`
                                INSERT INTO user_forced_approvals 
                                (user_id, admin_id, admin_notes, created_at)
                                VALUES (?, ?, ?, datetime('now'))
                            `, [
                                user.id, 
                                adminId, 
                                'Aprobación automática detectada: Usuario cliente aprobado sin documentos requeridos completos'
                            ]);
                            console.log(`✅ Registro de aprobación forzada creado automáticamente para usuario ${user.id}`);
                            // Actualizar el mapa
                            forcedApprovalsMap[user.id] = true;
                        }
                    } catch (error) {
                        // Si falla, continuar sin crear el registro
                        console.warn(`⚠️ No se pudo crear registro de aprobación forzada para usuario ${user.id}:`, error.message);
                    }
                }
            }
        }
        
        // No enviar passwords y agregar campos calculados
        const sanitizedUsers = await Promise.all(users.map(async (user) => {
            const { password_hash, verification_token, reset_token, reset_token_expires, ...userData } = user;
            
            // Agregar campo 'name' combinado
            if (!userData.name && (userData.first_name || userData.last_name)) {
                userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            }
            
            if (!userData.name) {
                userData.name = userData.email || 'Usuario sin nombre';
            }
            
            // Verificar aprobación forzada (actualizado después de crear registros automáticos)
            const isForced = forcedApprovalsMap[userData.id];
            
            // Agregar campo 'account_status' calculado
            if (isForced && (userData.is_verified === 1 || userData.is_verified === '1')) {
                userData.account_status = 'forced_approved';
                userData.is_forced_approval = true;
                userData.forced_approval = true;
            } else if (userData.is_verified === 1 || userData.is_verified === '1') {
                userData.account_status = 'approved';
            } else if (userData.is_active === 0 || userData.is_active === '0') {
                userData.account_status = 'rejected';
            } else {
                userData.account_status = 'pending';
            }
            
            return userData;
        }));
        
        res.json({
            success: true,
            data: {
                users: sanitizedUsers,
                count: sanitizedUsers.length
            }
        });
    } catch (error) {
        console.error('❌ Error en GET /users:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

/**
 * POST /api/users/:id/approve
 * Aprobar cuenta de usuario pendiente
 */
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('🔍 POST /users/:id/approve llamado');
        const userId = parseInt(req.params.id);
        const { admin_notes, is_forced } = req.body;
        const adminId = req.user.id; // ID del admin que aprueba
        
        console.log('👤 Aprobando usuario ID:', userId);
        console.log('📝 Datos de aprobación:', { admin_notes, is_forced, adminId });
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Validar que si es forzada, tenga notas
        if (is_forced && (!admin_notes || admin_notes.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Las notas son obligatorias para aprobaciones forzadas'
            });
        }
        
        console.log('📝 Estado actual del usuario:', {
            id: user.id,
            email: user.email,
            is_active: user.is_active,
            is_verified: user.is_verified
        });
        
        // Activar y verificar la cuenta
        await userModel.update(userId, {
            is_active: 1,
            is_verified: 1
        });
        
        // Guardar información de aprobación forzada si aplica
        if (is_forced && admin_notes) {
            const db = require('../database/db').getInstance();
            try {
                // Intentar guardar en tabla de aprobaciones forzadas
                await db.run(`
                    INSERT INTO user_forced_approvals 
                    (user_id, admin_id, admin_notes, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                `, [userId, adminId, admin_notes.trim()]);
                console.log('✅ Nota de aprobación forzada guardada');
            } catch (approvalError) {
                // Si la tabla no existe, crear un registro en una tabla de notas
                if (approvalError.message && approvalError.message.includes('no such table')) {
                    console.warn('⚠️ Tabla user_forced_approvals no existe, creando...');
                    try {
                        await db.run(`
                            CREATE TABLE IF NOT EXISTS user_forced_approvals (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                admin_id INTEGER NOT NULL,
                                admin_notes TEXT NOT NULL,
                                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                FOREIGN KEY (admin_id) REFERENCES users(id)
                            )
                        `);
                        await db.run(`
                            INSERT INTO user_forced_approvals 
                            (user_id, admin_id, admin_notes, created_at)
                            VALUES (?, ?, ?, datetime('now'))
                        `, [userId, adminId, admin_notes.trim()]);
                        console.log('✅ Tabla y nota de aprobación forzada creadas');
                    } catch (createError) {
                        console.warn('⚠️ No se pudo guardar nota de aprobación forzada:', createError.message);
                    }
                } else {
                    console.warn('⚠️ Error al guardar nota de aprobación:', approvalError.message);
                }
            }
        }
        
        console.log('✅ Usuario actualizado en BD');
        
        const updatedUser = await userModel.findByIdWithMedicalInfo(userId);
        delete updatedUser.password_hash;
        
        // Agregar campo 'name' combinado
        if (!updatedUser.name && (updatedUser.first_name || updatedUser.last_name)) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
        }
        if (!updatedUser.name) {
            updatedUser.name = updatedUser.email || 'Usuario sin nombre';
        }
        
        // Agregar campo 'account_status' calculado
        // Si es aprobación forzada, usar estado específico
        if (is_forced) {
            updatedUser.account_status = 'forced_approved';
            updatedUser.is_forced_approval = true;
            updatedUser.forced_approval = true;
        } else {
            updatedUser.account_status = 'approved';
            // Verificar si tiene aprobación forzada previa
            try {
                const forcedApproval = await db.all(
                    'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                    [userId]
                );
                if (forcedApproval.length > 0) {
                    updatedUser.account_status = 'forced_approved';
                    updatedUser.is_forced_approval = true;
                    updatedUser.forced_approval = true;
                }
            } catch (error) {
                // Si la tabla no existe, intentar crearla
                if (error.code === 'SQLITE_ERROR' && 
                    (error.message.includes('user_forced_approvals') || 
                     error.message.includes('no such table'))) {
                    try {
                        await db.run(`
                            CREATE TABLE IF NOT EXISTS user_forced_approvals (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                admin_id INTEGER NOT NULL,
                                admin_notes TEXT NOT NULL,
                                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                FOREIGN KEY (admin_id) REFERENCES users(id)
                            )
                        `);
                        await db.run(`
                            CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                            ON user_forced_approvals(user_id)
                        `);
                        // Intentar de nuevo - usar la variable correcta según el contexto
                        const forcedApproval = await db.all(
                            'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                            [userId]
                        );
                        if (forcedApproval.length > 0) {
                            // Determinar qué variable usar según el contexto
                            if (typeof updatedUser !== 'undefined') {
                                updatedUser.is_forced_approval = true;
                                updatedUser.forced_approval = true;
                            } else if (typeof user !== 'undefined') {
                                user.is_forced_approval = true;
                                user.forced_approval = true;
                            }
                        }
                    } catch (createError) {
                        // Si falla, continuar sin el flag
                    }
                }
            }
        }
        
        console.log('📤 Usuario actualizado:', {
            id: updatedUser.id,
            name: updatedUser.name,
            is_active: updatedUser.is_active,
            is_verified: updatedUser.is_verified,
            account_status: updatedUser.account_status,
            is_forced: is_forced
        });
        
        const message = is_forced ? 
            'Usuario aprobado forzadamente. Nota registrada.' : 
            'Usuario aprobado correctamente';
        
        res.json({
            success: true,
            message: message,
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('❌ Error en POST /users/:id/approve:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar usuario',
            error: error.message
        });
    }
});

/**
 * POST /api/users/:id/reject
 * Rechazar cuenta de usuario pendiente
 */
router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Marcar como rechazado
        await userModel.update(userId, {
            is_active: 0,
            is_verified: 0
        });
        
        const updatedUser = await userModel.findByIdWithMedicalInfo(userId);
        delete updatedUser.password_hash;
        
        // Agregar campo 'name' combinado
        if (!updatedUser.name && (updatedUser.first_name || updatedUser.last_name)) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
        }
        if (!updatedUser.name) {
            updatedUser.name = updatedUser.email || 'Usuario sin nombre';
        }
        
        // Agregar campo 'account_status' calculado
        updatedUser.account_status = 'rejected';
        
        res.json({
            success: true,
            message: 'Usuario rechazado correctamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('❌ Error en POST /users/:id/reject:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar usuario',
            error: error.message
        });
    }
});

/**
 * GET /api/users/:id
 * Obtener un usuario por ID (solo admin)
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        const user = await userModel.findByIdWithMedicalInfo(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // No enviar la contraseña
        delete user.password_hash;
        delete user.verification_token;
        delete user.reset_token;
        delete user.reset_token_expires;

        // Parsear JSON fields
        if (user.medical_conditions) {
            try { user.medical_conditions = JSON.parse(user.medical_conditions); } catch (e) {}
        }
        if (user.current_medications) {
            try { user.current_medications = JSON.parse(user.current_medications); } catch (e) {}
        }
        if (user.allergies) {
            try { user.allergies = JSON.parse(user.allergies); } catch (e) {}
        }
        
        // Agregar campo 'name' combinado
        if (!user.name && (user.first_name || user.last_name)) {
            user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        
        if (!user.name) {
            user.name = user.email || 'Usuario sin nombre';
        }
        
        // Verificar si tiene aprobación forzada
        const db = require('../database/db').getInstance();
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [userId]
            );
            isForced = forcedApproval.length > 0;
        } catch (error) {
            // Si la tabla no existe, intentar crearla
            if (error.code === 'SQLITE_ERROR' && 
                (error.message.includes('user_forced_approvals') || 
                 error.message.includes('no such table'))) {
                try {
                    await db.run(`
                        CREATE TABLE IF NOT EXISTS user_forced_approvals (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            admin_id INTEGER NOT NULL,
                            admin_notes TEXT NOT NULL,
                            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (admin_id) REFERENCES users(id)
                        )
                    `);
                    await db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                        ON user_forced_approvals(user_id)
                    `);
                    // Intentar de nuevo
                    const forcedApproval = await db.all(
                        'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                        [userId]
                    );
                    isForced = forcedApproval.length > 0;
                } catch (createError) {
                    // Si falla, continuar sin el flag
                    console.warn('⚠️ No se pudo crear user_forced_approvals:', createError.message);
                }
            }
        }
        
        // Para usuarios clientes, verificar si tienen todos los documentos requeridos
        const isCustomer = user.role === 'customer';
        if (isCustomer && (user.is_verified === 1 || user.is_verified === '1') && !isForced) {
            // Verificar documentos
            try {
                const tableCheck = await db.all(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='user_documents'"
                );
                
                if (tableCheck.length > 0) {
                    const requiredDocuments = ['receta_medica', 'carnet_identidad', 'certificado_antecedentes', 'poder_cultivo'];
                    const userDocuments = await db.all(
                        'SELECT document_type FROM user_documents WHERE user_id = ?',
                        [userId]
                    );
                    const documentTypes = userDocuments.map(d => d.document_type);
                    const hasAllRequiredDocuments = requiredDocuments.every(docType => 
                        documentTypes.includes(docType)
                    );
                    
                    if (!hasAllRequiredDocuments) {
                        // Crear registro automático si no existe
                        const existingForcedApproval = await db.all(
                            'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                            [userId]
                        );
                        
                        if (existingForcedApproval.length === 0) {
                            const adminId = req.user?.id || 1;
                            await db.run(`
                                INSERT INTO user_forced_approvals 
                                (user_id, admin_id, admin_notes, created_at)
                                VALUES (?, ?, ?, datetime('now'))
                            `, [
                                userId, 
                                adminId, 
                                'Aprobación automática detectada: Usuario cliente aprobado sin documentos requeridos completos'
                            ]);
                            isForced = true;
                            console.log(`✅ Registro de aprobación forzada creado automáticamente para usuario ${userId}`);
                        } else {
                            isForced = true;
                        }
                    }
                }
            } catch (docError) {
                // Si falla, continuar sin verificar documentos
                console.warn('⚠️ No se pudieron verificar documentos:', docError.message);
            }
        }
        
        // Agregar campo 'account_status' calculado (ya tenemos isForced calculado arriba)
        if (isForced && (user.is_verified === 1 || user.is_verified === '1')) {
            user.account_status = 'forced_approved';
            user.is_forced_approval = true;
            user.forced_approval = true;
        } else if (user.is_verified === 1 || user.is_verified === '1') {
            user.account_status = 'approved';
        } else if (user.is_active === 0 || user.is_active === '0') {
            user.account_status = 'rejected';
        } else {
            user.account_status = 'pending';
        }
        
        console.log(`📊 Usuario ${userId} - Estado calculado: ${user.account_status}, isForced: ${isForced}`);
        
        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('❌ Error en GET /users/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario (solo admin)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('🔍 PUT /users/:id llamado con:', { params: req.params, body: req.body });
        
        const userId = parseInt(req.params.id);
        const { 
            name,
            first_name, 
            last_name, 
            email, 
            phone, 
            role, 
            is_active,
            is_verified,
            account_status,
            // Información médica
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
        } = req.body;
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar si el email ya existe (excluyendo el usuario actual)
        if (email && email !== user.email) {
            const existingUser = await userModel.emailExists(email, userId);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }
        }
        
        // Actualizar datos básicos
        const updateData = {};
        
        // Si viene 'name' del frontend, dividirlo en first_name y last_name
        if (name && name.trim() !== '') {
            const nameParts = name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                updateData.first_name = nameParts[0];
                updateData.last_name = nameParts.slice(1).join(' ');
            } else {
                updateData.first_name = nameParts[0];
                updateData.last_name = '';
            }
        } else {
            if (first_name) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
        }
        
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role) updateData.role = role;
        
        // Manejar account_status (incluyendo forced_approved)
        const db = require('../database/db').getInstance();
        if (account_status && ['pending', 'approved', 'rejected', 'forced_approved'].includes(account_status)) {
            if (account_status === 'forced_approved') {
                updateData.is_verified = 1;
                updateData.is_active = 1;
                // El estado forced_approved se maneja con la tabla user_forced_approvals
            } else if (account_status === 'pending') {
                updateData.is_verified = 0;
                updateData.is_active = 1;
                // Si se cambia a pending, eliminar registro de aprobación forzada si existe
                try {
                    await db.run('DELETE FROM user_forced_approvals WHERE user_id = ?', [userId]);
                } catch (error) {
                    // Si la tabla no existe, continuar
                    console.warn('⚠️ No se pudo eliminar aprobación forzada:', error.message);
                }
            } else {
                updateData.is_verified = account_status === 'approved' ? 1 : 0;
                updateData.is_active = account_status === 'rejected' ? 0 : 1;
                // Si se cambia a rejected o approved normal, eliminar registro de aprobación forzada
                if (account_status === 'rejected' || account_status === 'approved') {
                    try {
                        await db.run('DELETE FROM user_forced_approvals WHERE user_id = ?', [userId]);
                    } catch (error) {
                        // Si la tabla no existe, continuar
                        console.warn('⚠️ No se pudo eliminar aprobación forzada:', error.message);
                    }
                }
            }
        } else {
            if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;
            if (is_verified !== undefined) updateData.is_verified = is_verified ? 1 : 0;
        }
        
        console.log('📦 Datos a actualizar:', updateData);
        
        if (Object.keys(updateData).length > 0) {
            await userModel.update(userId, updateData);
        }

        // Actualizar información médica
        const medicalData = {};
        if (rut !== undefined) medicalData.rut = rut;
        if (date_of_birth !== undefined) medicalData.date_of_birth = date_of_birth;
        if (medical_conditions !== undefined) medicalData.medical_conditions = medical_conditions;
        if (current_medications !== undefined) medicalData.current_medications = current_medications;
        if (allergies !== undefined) medicalData.allergies = allergies;
        if (has_medical_cannabis_authorization !== undefined) medicalData.has_medical_cannabis_authorization = has_medical_cannabis_authorization ? 1 : 0;
        if (authorization_number !== undefined) medicalData.authorization_number = authorization_number;
        if (authorization_expires !== undefined) medicalData.authorization_expires = authorization_expires;
        if (prescribing_doctor !== undefined) medicalData.prescribing_doctor = prescribing_doctor;
        if (doctor_license !== undefined) medicalData.doctor_license = doctor_license;
        if (medical_notes !== undefined) medicalData.medical_notes = medical_notes;

        if (Object.keys(medicalData).length > 0) {
            const existingMedicalInfo = await userModel.getMedicalInfo(userId);
            
            if (existingMedicalInfo) {
                await userModel.updateMedicalInfo(userId, medicalData);
            } else {
                await userModel.createMedicalInfo(userId, medicalData);
            }
        }
        
        const updatedUser = await userModel.findByIdWithMedicalInfo(userId);
        delete updatedUser.password_hash;
        delete updatedUser.verification_token;
        delete updatedUser.reset_token;
        delete updatedUser.reset_token_expires;
        
        // Agregar campo 'name' combinado
        if (!updatedUser.name && (updatedUser.first_name || updatedUser.last_name)) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
        }
        if (!updatedUser.name) {
            updatedUser.name = updatedUser.email || 'Usuario sin nombre';
        }
        
        // Verificar si tiene aprobación forzada primero
        // db ya está declarado arriba en la línea 573
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [userId]
            );
            if (forcedApproval.length > 0) {
                isForced = true;
                updatedUser.is_forced_approval = true;
                updatedUser.forced_approval = true;
            }
            } catch (error) {
                // Si la tabla no existe, intentar crearla
                if (error.code === 'SQLITE_ERROR' && 
                    (error.message.includes('user_forced_approvals') || 
                     error.message.includes('no such table'))) {
                    try {
                        await db.run(`
                            CREATE TABLE IF NOT EXISTS user_forced_approvals (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                admin_id INTEGER NOT NULL,
                                admin_notes TEXT NOT NULL,
                                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                FOREIGN KEY (admin_id) REFERENCES users(id)
                            )
                        `);
                        await db.run(`
                            CREATE INDEX IF NOT EXISTS idx_user_forced_approvals_user_id 
                            ON user_forced_approvals(user_id)
                        `);
                        // Intentar de nuevo - usar la variable correcta según el contexto
                        const forcedApproval = await db.all(
                            'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                            [userId]
                        );
                        if (forcedApproval.length > 0) {
                            // Determinar qué variable usar según el contexto
                            if (typeof updatedUser !== 'undefined') {
                                updatedUser.is_forced_approval = true;
                                updatedUser.forced_approval = true;
                            } else if (typeof user !== 'undefined') {
                                user.is_forced_approval = true;
                                user.forced_approval = true;
                            }
                        }
                    } catch (createError) {
                        // Si falla, continuar sin el flag
                    }
            }
        }
        
        // Agregar campo 'account_status' calculado considerando aprobación forzada
        if (isForced && (updatedUser.is_verified === 1 || updatedUser.is_verified === '1')) {
            updatedUser.account_status = 'forced_approved';
        } else if (updatedUser.is_verified === 1 || updatedUser.is_verified === '1') {
            updatedUser.account_status = 'approved';
        } else if (updatedUser.is_active === 0 || updatedUser.is_active === '0') {
            updatedUser.account_status = 'rejected';
        } else {
            updatedUser.account_status = 'pending';
        }
        
        console.log('✅ Usuario actualizado en PUT:', {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            account_status: updatedUser.account_status,
            is_forced_approval: updatedUser.is_forced_approval
        });
        
        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('❌ Error en PUT /users/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
});

/**
 * DELETE /api/users/:id
 * Eliminar usuario (solo admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const adminId = req.user.id;
        
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Intentar eliminar el usuario
        try {
            await userModel.delete(userId);
            console.log(`🗑️ Usuario eliminado: #${userId} por Admin #${adminId}`);
            
            res.json({
                success: true,
                message: 'Usuario eliminado correctamente'
            });
        } catch (deleteError) {
            console.error('❌ Error al eliminar usuario:', deleteError);
            
            // Verificar si es un error de restricción de clave foránea
            if (deleteError.code === 'SQLITE_CONSTRAINT' || deleteError.message.includes('FOREIGN KEY constraint')) {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar el usuario porque tiene registros asociados en otras tablas. Por favor, elimina primero los registros relacionados.',
                    error: 'FOREIGN_KEY_CONSTRAINT',
                    details: deleteError.message
                });
            }
            
            // Si es otro tipo de error, lanzarlo para que se maneje en el catch externo
            throw deleteError;
        }
    } catch (error) {
        console.error('❌ Error en DELETE /users/:id:', error);
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});

/**
 * POST /api/users/:id/activate
 * Activar cuenta de usuario
 */
router.post('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        await userModel.setActive(userId, true);
        
        res.json({
            success: true,
            message: 'Usuario activado correctamente',
            data: { user_id: userId, is_active: true }
        });
    } catch (error) {
        console.error('❌ Error en POST /users/:id/activate:', error);
        res.status(500).json({
            success: false,
            message: 'Error al activar usuario',
            error: error.message
        });
    }
});

/**
 * POST /api/users/:id/deactivate
 * Desactivar cuenta de usuario
 */
router.post('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const adminId = req.user.id;
        
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propia cuenta'
            });
        }
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        await userModel.setActive(userId, false);
        
        res.json({
            success: true,
            message: 'Usuario desactivado correctamente',
            data: { user_id: userId, is_active: false }
        });
    } catch (error) {
        console.error('❌ Error en POST /users/:id/deactivate:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar usuario',
            error: error.message
        });
    }
});

/**
 * GET /api/users/:id/documents
 * Obtener documentos de un usuario (solo admin)
 */
router.get('/:id/documents', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Verificar que el usuario existe
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Obtener documentos del usuario desde user_documents
        const db = require('../database/db').getInstance();
        const { decryptDocument } = require('../utils/encryption');
        
        let documents = [];
        try {
            const rawDocuments = await db.all(
                'SELECT * FROM user_documents WHERE user_id = ? ORDER BY uploaded_at DESC',
                [userId]
            );
            
            // Desencriptar documentos si están encriptados
            documents = rawDocuments.map(doc => {
                if (doc.is_encrypted && doc.file_data) {
                    try {
                        const originalLength = doc.file_data ? doc.file_data.length : 0;
                        doc.file_data = decryptDocument(doc.file_data);
                        const decryptedLength = doc.file_data ? doc.file_data.length : 0;
                        
                        // Log para poder_cultivo específicamente
                        if (doc.document_type === 'poder_cultivo') {
                            console.log('🔓 Desencriptando poder_cultivo:', {
                                doc_id: doc.id,
                                original_length: originalLength,
                                decrypted_length: decryptedLength,
                                mime_type: doc.mime_type,
                                preview: doc.file_data ? doc.file_data.substring(0, 100) : 'null'
                            });
                        }
                    } catch (error) {
                        console.error(`Error desencriptando documento ${doc.id} (${doc.document_type}):`, error);
                        // Si falla la desencriptación, mantener el dato encriptado
                    }
                }
                // No retornar el hash de la clave por seguridad
                delete doc.encryption_key_hash;
                return doc;
            });
        } catch (error) {
            // Si la tabla no existe, intentar crearla
            if (error.message && error.message.includes('no such table')) {
                console.warn('⚠️ Tabla user_documents no encontrada, intentando crearla...');
                try {
                    await db.run(`
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
                    `);
                    await db.run(`
                        CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
                        ON user_documents(user_id)
                    `);
                    console.log('✅ Tabla user_documents creada exitosamente');
                    // Retornar array vacío ya que la tabla acaba de crearse
                    return res.json({
                        success: true,
                        data: { documents: [] }
                    });
                } catch (createError) {
                    console.error('❌ Error al crear tabla user_documents:', createError.message);
                    return res.json({
                        success: true,
                        data: { documents: [] }
                    });
                }
            }
            throw error;
        }
        
        res.json({
            success: true,
            data: { documents }
        });
    } catch (error) {
        console.error('❌ Error en GET /users/:id/documents:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener documentos del usuario',
            error: error.message
        });
    }
});

/**
 * POST /api/users/:id/documents
 * Guardar documentos de un usuario (público para registro, admin para otros)
 */
router.post('/:id/documents', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { documents } = req.body;
        
        // Verificar que el usuario existe
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        if (!documents || !Array.isArray(documents)) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de documentos'
            });
        }
        
        const db = require('../database/db').getInstance();
        const { encryptDocument, hashKey } = require('../utils/encryption');
        const savedDocuments = [];
        
        for (const doc of documents) {
            if (!doc.document_type || !doc.file_data) {
                console.warn(`⚠️ Documento sin tipo o datos:`, { type: doc.document_type, has_data: !!doc.file_data });
                continue;
            }
            
            // Log para poder_cultivo específicamente
            if (doc.document_type === 'poder_cultivo') {
                console.log('💾 Guardando poder_cultivo:', {
                    file_name: doc.file_name,
                    original_length: doc.file_data ? doc.file_data.length : 0,
                    has_data_prefix: doc.file_data ? doc.file_data.startsWith('data:') : false,
                    preview: doc.file_data ? doc.file_data.substring(0, 100) : 'null'
                });
            }
            
            // Extraer base64 puro (sin prefijo data:)
            let base64Data = doc.file_data;
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }
            
            // Verificar que el base64 no esté vacío
            if (!base64Data || base64Data.trim().length === 0) {
                console.error(`❌ Documento ${doc.document_type} tiene base64 vacío después de extraer`);
                continue;
            }
            
            // Encriptar documento
            const encryptedData = encryptDocument(base64Data);
            const encryptionKeyHash = hashKey(process.env.ENCRYPTION_KEY || 'default');
            
            // Calcular tamaño del archivo en bytes (del original)
            const fileSize = Buffer.byteLength(base64Data, 'base64');
            
            // Determinar MIME type basado en el prefijo o extensión
            let mimeType = 'application/pdf';
            if (doc.file_data.startsWith('data:image/')) {
                mimeType = doc.file_data.substring(5, doc.file_data.indexOf(';'));
            } else if (doc.file_data.startsWith('data:application/')) {
                mimeType = doc.file_data.substring(5, doc.file_data.indexOf(';'));
            } else if (doc.file_data.startsWith('data:text/html')) {
                mimeType = 'text/html';
            } else if (doc.mime_type) {
                mimeType = doc.mime_type;
            } else if (doc.file_name) {
                const ext = doc.file_name.split('.').pop().toLowerCase();
                if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                else if (ext === 'png') mimeType = 'image/png';
                else if (ext === 'html') mimeType = 'text/html';
            }
            
            if (doc.document_type === 'poder_cultivo') {
                console.log('💾 Poder_cultivo procesado:', {
                    base64_length: base64Data.length,
                    encrypted_length: encryptedData ? encryptedData.length : 0,
                    file_size: fileSize,
                    mime_type: mimeType
                });
            }
            
            // Insertar documento encriptado
            const result = await db.run(
                `INSERT INTO user_documents 
                (user_id, document_type, file_name, file_data, file_size, mime_type, is_encrypted, encryption_key_hash, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`,
                [
                    userId,
                    doc.document_type,
                    doc.file_name || `${doc.document_type}.pdf`,
                    encryptedData,
                    fileSize,
                    mimeType,
                    encryptionKeyHash
                ]
            );
            
            savedDocuments.push({
                id: result.lastID,
                document_type: doc.document_type,
                file_name: doc.file_name || `${doc.document_type}.pdf`,
                file_size: fileSize,
                mime_type: mimeType,
                is_encrypted: true
            });
        }
        
        console.log(`✅ Guardados ${savedDocuments.length} documentos para usuario ID: ${userId}`);
        
        res.json({
            success: true,
            message: 'Documentos guardados correctamente',
            data: { documents: savedDocuments }
        });
    } catch (error) {
        console.error('❌ Error en POST /users/:id/documents:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar documentos del usuario',
            error: error.message
        });
    }
});

module.exports = router;