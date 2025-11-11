// backend/src/routes/cultivationCessions.js
// Rutas para gestionar cesiones de cultivo

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db').getInstance();

// POST /api/cultivation-cessions
// Crear una nueva cesión de cultivo
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            user_id,
            cedente_nombre,
            cedente_rut,
            cedente_firma,
            enfermedad_condicion, // Viene encriptado desde el frontend
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
            template_version,
            provider_name,
            signature_type,
            signature_hash,
            signed_at
        } = req.body;

        // Validar datos requeridos
        if (!user_id || !cedente_nombre || !cedente_rut || !fecha_inicio) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (user_id, cedente_nombre, cedente_rut, fecha_inicio)'
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

        // Insertar cesión
        const result = await db.run(`
            INSERT INTO cultivation_rights_cessions (
                user_id,
                template_version,
                provider_name,
                signature_type,
                signature_hash,
                signed_at,
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
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            user_id,
            template_version || '2025_01',
            provider_name || 'Apexremedy',
            signature_type || 'digital',
            signature_hash || '',
            signed_at || new Date().toISOString(),
            cedente_nombre,
            cedente_rut,
            cedente_firma || null,
            enfermedad_condicion || null, // Ya viene encriptado
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

        // Obtener cesión creada
        const cession = await db.get(
            'SELECT * FROM cultivation_rights_cessions WHERE id = ?',
            [result.lastID]
        );

        res.json({
            success: true,
            message: 'Cesión de cultivo guardada correctamente',
            data: cession
        });
    } catch (error) {
        console.error('Error guardando cesión de cultivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar cesión de cultivo',
            error: error.message
        });
    }
});

// GET /api/cultivation-cessions/user/:userId
// Obtener cesiones de un usuario
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user.id;

        // Verificar que el usuario solo pueda ver sus propias cesiones (o ser admin)
        if (parseInt(userId) !== requestingUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estas cesiones'
            });
        }

        const cessions = await db.all(
            'SELECT * FROM cultivation_rights_cessions WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            success: true,
            data: cessions
        });
    } catch (error) {
        console.error('Error obteniendo cesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cesiones',
            error: error.message
        });
    }
});

module.exports = router;






