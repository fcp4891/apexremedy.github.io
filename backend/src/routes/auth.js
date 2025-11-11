// ============================================
// RUTAS: Autenticación
// ============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS
// ============================================

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', authController.login);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario (alias de /me)
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario
 */
router.post('/change-password', authenticateToken, authController.changePassword);

/**
 * POST /api/auth/logout
 * Cerrar sesión (opcional, principalmente del lado del cliente)
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * POST /api/auth/refresh
 * Refrescar token (opcional)
 */
router.post('/refresh', authController.refreshToken);

/**
 * GET /api/auth/csrf
 * Obtener token CSRF (doble submit)
 */
router.get('/csrf', authController.getCsrfToken);

module.exports = router;