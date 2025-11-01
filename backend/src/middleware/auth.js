// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo_en_produccion';
const userModel = new User();

/**
 * Middleware para autenticar token JWT
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario aún existe
        const user = await userModel.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que la cuenta esté activa
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido desactivada'
            });
        }

        // Calcular account_status basado en is_active e is_verified
        let account_status = 'pending';
        if (user.is_verified && user.is_active) {
            account_status = 'approved';
        } else if (!user.is_active && !user.is_verified) {
            account_status = 'rejected';
        }

        // Agregar información del usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            is_verified: user.is_verified,
            is_active: user.is_active,
            account_status: account_status
        };

        next();
    } catch (error) {
        console.error('❌ Error en authenticateToken:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Error de autenticación',
            error: error.message
        });
    }
};

/**
 * Middleware para requerir rol de administrador
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador'
        });
    }
    next();
};

/**
 * Middleware para requerir que sea el propietario o administrador
 */
const requireOwnerOrAdmin = (req, res, next) => {
    const userId = parseInt(req.params.id);
    
    if (req.user.role === 'admin' || req.user.id === userId) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo puedes acceder a tu propia información'
        });
    }
};

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            
            if (user && user.is_active) {
                // Calcular account_status basado en is_active e is_verified
                let account_status = 'pending';
                if (user.is_verified && user.is_active) {
                    account_status = 'approved';
                } else if (!user.is_active && !user.is_verified) {
                    account_status = 'rejected';
                }

                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    is_verified: user.is_verified,
                    is_active: user.is_active,
                    account_status: account_status
                };
            }
        }
        
        next();
    } catch (error) {
        // En autenticación opcional, continuamos sin usuario
        next();
    }
};

/**
 * Middleware para verificar que el usuario tenga autorización médica válida
 */
const requireMedicalAuthorization = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Los admins siempre pasan
        if (req.user.role === 'admin') {
            return next();
        }

        const hasAuthorization = await userModel.hasValidMedicalAuthorization(userId);

        if (!hasAuthorization) {
            return res.status(403).json({
                success: false,
                message: 'Requieres autorización médica válida para acceder a productos medicinales'
            });
        }

        next();
    } catch (error) {
        console.error('❌ Error en requireMedicalAuthorization:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar autorización médica',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar que la cuenta esté verificada
 */
const requireVerified = (req, res, next) => {
    // Los admins siempre pasan
    if (req.user.role === 'admin') {
        return next();
    }

    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            message: 'Debes verificar tu cuenta de email para acceder a esta función'
        });
    }

    next();
};

/**
 * Middleware para requerir cuenta aprobada (verificada)
 * ✅ FUNCIÓN QUE FALTABA
 */
const requireApprovedAccount = (req, res, next) => {
    // Los admins siempre pasan
    if (req.user.role === 'admin') {
        return next();
    }

    // Para la nueva estructura, verificamos is_verified
    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            message: 'Tu cuenta debe estar verificada para acceder a esta función',
            account_status: 'pending'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOwnerOrAdmin,
    optionalAuth,
    requireMedicalAuthorization,
    requireVerified,
    requireApprovedAccount
};