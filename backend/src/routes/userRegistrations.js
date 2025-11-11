// backend/src/routes/userRegistrations.js
// Rutas para gestionar registros de usuario con datos de cesión

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db').getInstance();
const { encrypt, decrypt } = require('../utils/encryption');

// POST /api/user-registrations
// Crear un nuevo registro de usuario con datos de cesión
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            user_id,
            cedente_nombre,
            cedente_rut,
            cedente_firma,
            enfermedad_condicion, // Se encriptará
            fecha_inicio,
            fecha_termino,
            es_indefinido,
            es_revocable,
            dispensario_nombre,
            dispensario_rut,
            dispensario_direccion,
            dispensario_firma,
            documento_html,
            fecha_cesion
        } = req.body;

        // Validar datos requeridos
        if (!user_id || !cedente_nombre || !cedente_rut || !fecha_inicio || !enfermedad_condicion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (user_id, cedente_nombre, cedente_rut, fecha_inicio, enfermedad_condicion)'
            });
        }

        // Verificar que el usuario existe
        const user = await db.get('SELECT id FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Encriptar enfermedad/condición
        const encryptedEnfermedad = encrypt(enfermedad_condicion);

        // Insertar registro
        const result = await db.run(`
            INSERT INTO user_registrations (
                user_id,
                cedente_nombre,
                cedente_rut,
                cedente_firma,
                enfermedad_condicion,
                fecha_inicio,
                fecha_termino,
                es_indefinido,
                es_revocable,
                dispensario_nombre,
                dispensario_rut,
                dispensario_direccion,
                dispensario_firma,
                documento_html,
                fecha_cesion,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            user_id,
            cedente_nombre,
            cedente_rut,
            cedente_firma || null,
            encryptedEnfermedad,
            fecha_inicio,
            fecha_termino || null,
            es_indefinido || 0,
            es_revocable !== undefined ? es_revocable : 1,
            dispensario_nombre || 'Apexremedy',
            dispensario_rut || '76.237.243-6',
            dispensario_direccion || 'Oficina Virtual',
            dispensario_firma || null,
            documento_html || null,
            fecha_cesion || new Date().toISOString().split('T')[0]
        ]);

        // Obtener registro creado
        const registration = await db.get(
            'SELECT * FROM user_registrations WHERE id = ?',
            [result.lastID]
        );

        // Desencriptar enfermedad para respuesta (solo si el usuario es el dueño o admin)
        if (registration && (req.user.id === user_id || req.user.role === 'admin')) {
            try {
                registration.enfermedad_condicion = decrypt(registration.enfermedad_condicion);
            } catch (error) {
                console.error('Error desencriptando enfermedad:', error);
            }
        }

        res.json({
            success: true,
            message: 'Registro de usuario con datos de cesión guardado correctamente',
            data: registration
        });
    } catch (error) {
        console.error('Error guardando registro de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar registro de usuario',
            error: error.message
        });
    }
});

// GET /api/user-registrations/user/:userId
// Obtener registros de un usuario
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user.id;

        // Verificar que el usuario solo pueda ver sus propios registros (o ser admin)
        if (parseInt(userId) !== requestingUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estos registros'
            });
        }

        const registrations = await db.all(
            'SELECT * FROM user_registrations WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Desencriptar enfermedad/condición solo si el usuario es el dueño o admin
        const decryptedRegistrations = registrations.map(reg => {
            if (reg.enfermedad_condicion) {
                try {
                    reg.enfermedad_condicion = decrypt(reg.enfermedad_condicion);
                } catch (error) {
                    console.error('Error desencriptando enfermedad:', error);
                }
            }
            return reg;
        });

        res.json({
            success: true,
            data: decryptedRegistrations
        });
    } catch (error) {
        console.error('Error obteniendo registros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener registros',
            error: error.message
        });
    }
});

module.exports = router;






