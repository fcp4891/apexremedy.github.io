// admin/js/config.js
// Configuración del frontend ADMIN

// Función para detectar la URL base de la API según el entorno
// Usa el sistema centralizado env-config.js si está disponible
function getAPIBaseURL() {
    // Usar el sistema centralizado si está disponible (env-config.js)
    if (typeof window !== 'undefined' && window.API_BASE_URL !== undefined) {
        return window.API_BASE_URL; // Puede ser null (solo JSON estático)
    }
    
    // Fallback: detección básica
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // GitHub Pages
    if (hostname.includes('github.io')) {
        return null; // Usar solo JSON estático
    }
    
    // Local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'http://localhost:3000/api';
    }
    
    // Producción - si hay backend configurado
    // ⚠️ IMPORTANTE: Configurar la URL de tu backend en producción si es necesario
    const PRODUCTION_API_URL = null; // null = solo API estática
    // TODO: Cuando haya backend en producción, cambiar a:
    // const PRODUCTION_API_URL = 'https://api.apexremedy.cl/api';
    
    return PRODUCTION_API_URL || null;
}

const CONFIG = {
    // URLs de la API - Auto-detectar entorno
    get API_BASE_URL() {
        return getAPIBaseURL();
    },
    
    // Configuración de la aplicación
    APP_NAME: 'Apexremedy Admin',
    APP_VERSION: '2.0.0',
    
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


