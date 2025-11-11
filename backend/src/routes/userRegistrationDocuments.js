// backend/src/routes/userRegistrationDocuments.js
// Rutas para gestionar documentos asociados a registros de receta

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db').getInstance();
const { encryptDocument, decryptDocument, hashKey } = require('../utils/encryption');

// POST /api/user-registration-documents
// Guardar documentos asociados a un registro de receta
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            registration_id,
            user_id,
            documents // Array de documentos: [{document_type, file_data, file_name, file_size, mime_type}]
        } = req.body;

        // Validar datos requeridos
        if (!registration_id || !user_id || !documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (registration_id, user_id, documents)'
            });
        }

        // Verificar que el registro existe y pertenece al usuario
        const registration = await db.get(
            'SELECT user_id FROM user_registrations WHERE id = ? AND user_id = ?',
            [registration_id, user_id]
        );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registro de receta no encontrado o no pertenece al usuario'
            });
        }

        // Verificar que el usuario solo puede guardar documentos en sus propios registros (o ser admin)
        if (parseInt(user_id) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para guardar documentos en este registro'
            });
        }

        const savedDocuments = [];

        // Guardar cada documento
        for (const doc of documents) {
            const {
                document_type,
                file_data,
                file_name,
                file_size,
                mime_type
            } = doc;

            if (!document_type || !file_data || !file_name) {
                console.warn('⚠️ Documento incompleto, omitiendo:', doc);
                continue;
            }

            // Encriptar documento
            const encryptedData = encryptDocument(file_data);
            const keyHash = hashKey(process.env.ENCRYPTION_KEY || 'default_key');

            // Insertar documento
            const result = await db.run(`
                INSERT INTO user_registration_documents (
                    registration_id,
                    user_id,
                    document_type,
                    file_name,
                    file_data,
                    file_size,
                    mime_type,
                    is_encrypted,
                    encryption_key_hash,
                    uploaded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
            `, [
                registration_id,
                user_id,
                document_type,
                file_name,
                encryptedData,
                file_size || null,
                mime_type || null,
                keyHash
            ]);

            savedDocuments.push({
                id: result.lastID,
                document_type,
                file_name,
                file_size,
                mime_type
            });
        }

        res.json({
            success: true,
            message: `${savedDocuments.length} documento(s) guardado(s) correctamente`,
            data: savedDocuments
        });
    } catch (error) {
        console.error('Error guardando documentos de registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar documentos de registro',
            error: error.message
        });
    }
});

// GET /api/user-registration-documents/registration/:registrationId
// Obtener documentos de un registro de receta
router.get('/registration/:registrationId', authenticateToken, async (req, res) => {
    try {
        const { registrationId } = req.params;

        // Verificar que el registro existe
        const registration = await db.get(
            'SELECT user_id FROM user_registrations WHERE id = ?',
            [registrationId]
        );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registro de receta no encontrado'
            });
        }

        // Verificar permisos
        if (parseInt(registration.user_id) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estos documentos'
            });
        }

        // Obtener documentos
        const documents = await db.all(`
            SELECT 
                id,
                registration_id,
                user_id,
                document_type,
                file_name,
                file_size,
                mime_type,
                is_encrypted,
                uploaded_at
            FROM user_registration_documents
            WHERE registration_id = ?
            ORDER BY uploaded_at DESC
        `, [registrationId]);

        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        console.error('Error obteniendo documentos de registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener documentos de registro',
            error: error.message
        });
    }
});

// GET /api/user-registration-documents/:documentId/download
// Descargar un documento específico (desencriptado)
router.get('/:documentId/download', authenticateToken, async (req, res) => {
    try {
        const { documentId } = req.params;

        // Obtener documento
        const document = await db.get(`
            SELECT 
                urd.*,
                ur.user_id as registration_user_id
            FROM user_registration_documents urd
            JOIN user_registrations ur ON urd.registration_id = ur.id
            WHERE urd.id = ?
        `, [documentId]);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Documento no encontrado'
            });
        }

        // Verificar permisos
        if (parseInt(document.registration_user_id) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar este documento'
            });
        }

        // Desencriptar documento
        let decryptedData = document.file_data;
        if (document.is_encrypted) {
            try {
                decryptedData = decryptDocument(document.file_data);
            } catch (error) {
                console.error('Error desencriptando documento:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al desencriptar documento'
                });
            }
        }

        // Enviar documento
        res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
        res.send(Buffer.from(decryptedData, 'base64'));
    } catch (error) {
        console.error('Error descargando documento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar documento',
            error: error.message
        });
    }
});

module.exports = router;






