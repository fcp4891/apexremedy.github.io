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
        
        // No enviar passwords y agregar campos calculados
        const sanitizedUsers = users.map(user => {
            const { password_hash, verification_token, reset_token, reset_token_expires, ...userData } = user;
            
            // Agregar campo 'name' combinado
            if (!userData.name && (userData.first_name || userData.last_name)) {
                userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            }
            
            if (!userData.name) {
                userData.name = userData.email || 'Usuario sin nombre';
            }
            
            // Agregar campo 'account_status' calculado
            if (userData.is_verified === 1 || userData.is_verified === '1') {
                userData.account_status = 'approved';
            } else if (userData.is_active === 0 || userData.is_active === '0') {
                userData.account_status = 'rejected';
            } else {
                userData.account_status = 'pending';
            }
            
            return userData;
        });
        
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
        console.log('👤 Aprobando usuario ID:', userId);
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
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
        updatedUser.account_status = 'approved';
        
        console.log('📤 Usuario actualizado:', {
            id: updatedUser.id,
            name: updatedUser.name,
            is_active: updatedUser.is_active,
            is_verified: updatedUser.is_verified,
            account_status: updatedUser.account_status
        });
        
        res.json({
            success: true,
            message: 'Usuario aprobado correctamente',
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
        
        // Agregar campo 'account_status' calculado
        if (user.is_verified === 1 || user.is_verified === '1') {
            user.account_status = 'approved';
        } else if (user.is_active === 0 || user.is_active === '0') {
            user.account_status = 'rejected';
        } else {
            user.account_status = 'pending';
        }
        
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
        
        // Manejar account_status
        if (account_status && ['pending', 'approved', 'rejected'].includes(account_status)) {
            updateData.is_verified = account_status === 'approved' ? 1 : 0;
            updateData.is_active = account_status === 'rejected' ? 0 : 1;
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
        
        // Agregar campo 'account_status' calculado
        if (updatedUser.is_verified === 1 || updatedUser.is_verified === '1') {
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
            account_status: updatedUser.account_status
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
        
        await userModel.delete(userId);
        
        console.log(`🗑️ Usuario eliminado: #${userId} por Admin #${adminId}`);
        
        res.json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('❌ Error en DELETE /users/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
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
        
        // Obtener documentos del usuario
        const db = require('../database/db').getInstance();
        const documents = await db.all(
            'SELECT * FROM user_documents WHERE user_id = ? ORDER BY uploaded_at DESC',
            [userId]
        );
        
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
        const savedDocuments = [];
        
        for (const doc of documents) {
            if (!doc.document_type || !doc.file_data) {
                continue;
            }
            
            // Calcular tamaño del archivo en bytes
            const fileSize = Buffer.byteLength(doc.file_data, 'base64');
            
            // Determinar MIME type basado en el prefijo
            let mimeType = 'application/pdf';
            if (doc.file_data.startsWith('data:image/')) {
                mimeType = doc.file_data.substring(5, doc.file_data.indexOf(';'));
            }
            
            // Insertar documento
            const result = await db.run(
                `INSERT INTO user_documents 
                (user_id, document_type, file_name, file_data, file_size, mime_type, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                [
                    userId,
                    doc.document_type,
                    doc.file_name || `${doc.document_type}.pdf`,
                    doc.file_data,
                    fileSize,
                    mimeType
                ]
            );
            
            savedDocuments.push({
                id: result.lastID,
                document_type: doc.document_type,
                file_name: doc.file_name || `${doc.document_type}.pdf`,
                file_size: fileSize,
                mime_type: mimeType
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