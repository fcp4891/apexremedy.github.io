/// ============================================
// SERVER: Configuración principal del servidor
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const csrfProtection = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' }
}));

// Configurar CORS para producción y desarrollo
// Leer orígenes permitidos desde variables de entorno o usar valores por defecto
const getAllowedOrigins = () => {
    // En producción, usar variable de entorno CORS_ORIGINS (formato: "origin1,origin2,origin3")
    if (process.env.NODE_ENV === 'production') {
        if (process.env.CORS_ORIGINS) {
            return process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
        }
        // Fallback: solo permitir el frontend URL si está definido
        if (process.env.FRONTEND_URL) {
            return [process.env.FRONTEND_URL];
        }
        // Si no hay configuración, rechazar todos (más seguro)
        return [];
    }
    
    // En desarrollo, usar lista por defecto
    return [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ];
};

const corsOptions = {
    origin: function (origin, callback) {
        // En producción, NO permitir requests sin origin (excepto para servicios internos)
        if (!origin) {
            // Solo permitir en desarrollo o si es un request interno
            if (process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }
            // En producción, rechazar requests sin origin
            console.warn('⚠️ CORS: Request sin origin rechazado en producción');
            return callback(new Error('Origin requerido en producción'));
        }
        
        const allowedOrigins = getAllowedOrigins();
        
        // Verificar si el origen está permitido
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        // También permitir GitHub Pages si está configurado
        if (!isAllowed && /^https:\/\/.*\.github\.io$/.test(origin)) {
            // Solo permitir GitHub Pages si está en la lista de orígenes o en desarrollo
            if (process.env.NODE_ENV === 'development' || process.env.ALLOW_GITHUB_PAGES === 'true') {
                return callback(null, true);
            }
        }
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS bloqueado desde: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    // Métodos permitidos
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Headers permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    // Exponer headers
    exposedHeaders: ['X-CSRF-Token']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Para imágenes base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests (sin datos sensibles)
app.use((req, res, next) => {
    // No registrar bodies que puedan contener passwords, tokens, etc.
    const sensitivePaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
    const isSensitive = sensitivePaths.some(path => req.path.includes(path));
    
    if (isSensitive) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} [datos sensibles omitidos]`);
    } else {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// ============================================
// RUTAS
// ============================================

// Importar rutas
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const addressRoutes = require('./routes/addresses');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const supplierRoutes = require('./routes/suppliers');

// Rutas del sistema de pagos
const paymentRoutes = require('./routes/payments');
const refundRoutes = require('./routes/refunds');
const giftCardRoutes = require('./routes/giftCards');
const giftCardTransactionRoutes = require('./routes/giftCardTransactions');
const refundReasonRoutes = require('./routes/refundReasons');
const giftCardCampaignRoutes = require('./routes/giftCardCampaigns');
const paymentMethodRoutes = require('./routes/paymentMethods');
const paymentProviderRoutes = require('./routes/paymentProviders');
const chargebackRoutes = require('./routes/chargebacks');
const settlementRoutes = require('./routes/settlements');
const webhookDeliveryRoutes = require('./routes/webhookDeliveries');

// Rutas de logística
const shippingProviderRoutes = require('./routes/shippingProviders');
const shipmentRoutes = require('./routes/shipments');
const packingMaterialRoutes = require('./routes/packingMaterials');
const fleetDriverRoutes = require('./routes/fleetDrivers');
const internalDeliveryZoneRoutes = require('./routes/internalDeliveryZones');
const dispatchCenterRoutes = require('./routes/dispatchCenters');
const pickupPointDispensaryRoutes = require('./routes/pickupPointsDispensary');
const freeShippingRuleRoutes = require('./routes/freeShippingRules');
const restrictedZoneRoutes = require('./routes/restrictedZones');
const logisticsRoutes = require('./routes/logistics');
const analyticsRoutes = require('./routes/analytics');
const geoRoutes = require('./routes/geo');
const alertRoutes = require('./routes/alerts');
const dispensaryRoutes = require('./routes/dispensary');
const cultivationCessionRoutes = require('./routes/cultivationCessions');
const userRegistrationsRoutes = require('./routes/userRegistrations');
const userRegistrationDocumentsRoutes = require('./routes/userRegistrationDocuments');

// Migraciones
const addRefreshTokensTable = require('../database/migrations/add_refresh_tokens_table');

// Montar rutas
app.use(csrfProtection);

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/suppliers', supplierRoutes);

// Montar rutas del sistema de pagos
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/gift-card-transactions', giftCardTransactionRoutes);
app.use('/api/refund-reasons', refundReasonRoutes);
app.use('/api/gift-card-campaigns', giftCardCampaignRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/payment-providers', paymentProviderRoutes);
app.use('/api/chargebacks', chargebackRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/webhook-deliveries', webhookDeliveryRoutes);

// Montar rutas de logística
app.use('/api/shipping-providers', shippingProviderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/packing-materials', packingMaterialRoutes);
app.use('/api/fleet-drivers', fleetDriverRoutes);
app.use('/api/internal-delivery-zones', internalDeliveryZoneRoutes);
app.use('/api/dispatch-centers', dispatchCenterRoutes);
app.use('/api/pickup-points-dispensary', pickupPointDispensaryRoutes);
app.use('/api/free-shipping-rules', freeShippingRuleRoutes);
app.use('/api/restricted-zones', restrictedZoneRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dispensary', dispensaryRoutes);
app.use('/api/cultivation-cessions', cultivationCessionRoutes);
app.use('/api/user-registrations', userRegistrationsRoutes);
app.use('/api/user-registration-documents', userRegistrationDocumentsRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

app.use((error, req, res, next) => {
    // Logging de errores (sin exponer información sensible)
    const errorMessage = error.message || 'Error interno del servidor';
    const errorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    // No loggear detalles de errores de autenticación en producción
    if (process.env.NODE_ENV === 'production' && error.status === 401) {
        console.error(`Error ${error.status} en ${req.method} ${req.path}: [autenticación fallida]`);
    } else {
        console.error(`Error ${error.status || 500} en ${req.method} ${req.path}:`, errorMessage);
        if (errorStack && process.env.NODE_ENV === 'development') {
            console.error('Stack trace:', errorStack);
        }
    }
    
    res.status(error.status || 500).json({
        success: false,
        message: errorMessage,
        error: errorStack
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Ejecutar migraciones necesarias antes de iniciar el servidor
async function initializeServer() {
    try {
        console.log('🔄 Verificando migraciones de base de datos...');
        await addRefreshTokensTable();
        console.log('✅ Migraciones verificadas\n');
    } catch (error) {
        console.error('⚠️ Error ejecutando migraciones (continuando de todas formas):', error.message);
    }

    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📦 API disponible en http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    });
}

initializeServer();

module.exports = app;