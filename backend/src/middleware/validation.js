const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Validaciones para autenticación
const authValidation = {
    register: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        
        body('password')
            .isLength({ min: 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres'),
        
        body('phone')
            .optional({ checkFalsy: true }),
        
        body('rut')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ],
    
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        
        body('password')
            .notEmpty()
            .withMessage('Contraseña requerida'),
        
        handleValidationErrors
    ],
    
    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        
        body('phone')
            .optional({ checkFalsy: true }),
        
        body('rut')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ]
};

// Validaciones para productos
const productValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 200 })
            .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
        
        body('description')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 1000 })
            .withMessage('La descripción no puede exceder 1000 caracteres'),
        
        body('price')
            .isInt({ min: 1 })
            .withMessage('El precio debe ser un número entero positivo'),
        
        body('stock')
            .isInt({ min: 0 })
            .withMessage('El stock debe ser un número entero no negativo'),
        
        body('category')
            .optional({ checkFalsy: true }),
        
        body('featured')
            .optional({ checkFalsy: true })
            .isBoolean()
            .withMessage('Featured debe ser true o false'),
        
        body('image')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ],
    
    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 200 })
            .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
        
        body('description')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 1000 })
            .withMessage('La descripción no puede exceder 1000 caracteres'),
        
        body('price')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El precio debe ser un número entero positivo'),
        
        body('stock')
            .optional()
            .isInt({ min: 0 })
            .withMessage('El stock debe ser un número entero no negativo'),
        
        body('category')
            .optional({ checkFalsy: true }),
        
        body('featured')
            .optional({ checkFalsy: true })
            .isBoolean()
            .withMessage('Featured debe ser true o false'),
        
        body('image')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ],
    
    updateStock: [
        body('stock')
            .isInt({ min: 0 })
            .withMessage('El stock debe ser un número entero no negativo'),
        
        handleValidationErrors
    ],
    
    id: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de producto inválido'),
        
        handleValidationErrors
    ]
};

// Validaciones para pedidos
const orderValidation = {
    create: [
        body('items')
            .isArray({ min: 1 })
            .withMessage('Debe incluir al menos un item'),
        
        body('items.*.product_id')
            .isInt({ min: 1 })
            .withMessage('ID de producto inválido'),
        
        body('items.*.quantity')
            .isInt({ min: 1 })
            .withMessage('Cantidad debe ser un número entero positivo'),
        
        body('customer_name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Nombre del cliente debe tener entre 2 y 100 caracteres'),
        
        body('customer_email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email del cliente inválido'),
        
        body('customer_phone')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ],
    
    updateStatus: [
        body('status')
            .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
            .withMessage('Estado inválido'),
        
        handleValidationErrors
    ],
    
    id: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de pedido inválido'),
        
        handleValidationErrors
    ]
};

// Validaciones para usuarios
const userValidation = {
    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        
        body('phone')
            .optional({ checkFalsy: true }),
        
        body('rut')
            .optional({ checkFalsy: true }),
        
        body('role')
            .optional()
            .isIn(['customer', 'admin'])
            .withMessage('Rol inválido'),
        
        handleValidationErrors
    ],
    
    id: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de usuario inválido'),
        
        handleValidationErrors
    ]
};

// Validaciones para queries - MÁS FLEXIBLE
const queryValidation = {
    pagination: [
        query('page')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Página debe ser un número entero positivo'),
        
        query('limit')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 })
            .withMessage('Límite debe ser un número entre 1 y 1000'),
        
        query('search')
            .optional({ checkFalsy: true }),
        
        handleValidationErrors
    ],
    
    productFilters: [
        query('category')
            .optional({ checkFalsy: true }),
        
        query('minPrice')
            .optional({ checkFalsy: true })
            .isInt({ min: 0 })
            .withMessage('Precio mínimo debe ser un número no negativo'),
        
        query('maxPrice')
            .optional({ checkFalsy: true })
            .isInt({ min: 0 })
            .withMessage('Precio máximo debe ser un número no negativo'),
        
        query('inStock')
            .optional({ checkFalsy: true }),
        
        query('featured')
            .optional({ checkFalsy: true }),
        
        query('orderBy')
            .optional({ checkFalsy: true }),
        
        query('page')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 }),
        
        query('limit')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 }),
        
        handleValidationErrors
    ],
    
    orderFilters: [
        query('status')
            .optional({ checkFalsy: true })
            .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
            .withMessage('Estado inválido'),
        
        query('startDate')
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage('Fecha de inicio inválida (formato ISO)'),
        
        query('endDate')
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage('Fecha de fin inválida (formato ISO)'),
        
        query('page')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 }),
        
        query('limit')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 }),
        
        handleValidationErrors
    ]
};

// Validación para parámetros
const paramValidation = {
    id: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID inválido'),
        
        handleValidationErrors
    ]
};

module.exports = {
    authValidation,
    productValidation,
    orderValidation,
    userValidation,
    queryValidation,
    paramValidation,
    handleValidationErrors
};


