// frontend/js/config.js
// Configuración del frontend

// Detectar entorno
const isProduction = typeof window !== 'undefined' && (
    window.location.hostname.includes('github.io') || 
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
);

// ⚠️ IMPORTANTE: Configurar la URL de tu backend en producción
// Si tu backend está en Heroku/Railway/Render/etc, reemplaza la URL abajo
const PRODUCTION_API_URL = 'https://tu-backend-en-produccion.com/api'; // ⚠️ CAMBIAR ESTA URL

const CONFIG = {
    // URLs de la API - Auto-detectar entorno
    API_BASE_URL: isProduction 
        ? PRODUCTION_API_URL
        : 'http://localhost:3000/api',
    
    // Configuración de la aplicación
    APP_NAME: 'Apexremedy',
    APP_VERSION: '1.0.0',
    
    // Configuración de paginación
    PRODUCTS_PER_PAGE: 12,
    
    // Configuración de notificaciones
    NOTIFICATION_DURATION: 3000,
    
    // Configuración de imágenes
    DEFAULT_PRODUCT_IMAGE: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400',
    
    // Configuración de moneda
    CURRENCY: 'CLP',
    CURRENCY_SYMBOL: '$',
    
    // Configuración de impuestos
    TAX_RATE: 0.19, // 19% IVA
    
    // Configuración de localStorage
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_DATA: 'userData',
        CART: 'cart',
        THEME: 'theme'
    },
    
    // Configuración de validación
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 6,
        PHONE_REGEX: /^\+569\d{8}$/,
        RUT_REGEX: /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/
    },
    
    // Configuración de categorías
    CATEGORIES: [
        'Indoor',
        'Sativa', 
        'Índica',
        'Híbrido',
        'Aceites',
        'Comestibles',
        'Accesorios'
    ],
    
    // Estados de pedidos
    ORDER_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        SHIPPED: 'shipped',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    },
    
    // Roles de usuario
    USER_ROLES: {
        CUSTOMER: 'customer',
        ADMIN: 'admin'
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;




