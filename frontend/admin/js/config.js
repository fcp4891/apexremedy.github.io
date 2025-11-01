// admin/js/config.js
// Configuración del frontend ADMIN

const CONFIG = {
    // URLs de la API
    API_BASE_URL: 'http://localhost:3000/api',
    
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

