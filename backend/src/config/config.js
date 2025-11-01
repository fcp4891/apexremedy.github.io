// backend/src/config/config.js
require('dotenv').config();

const config = {
    // Entorno
    env: process.env.NODE_ENV || 'development',
    
    // Servidor
    port: parseInt(process.env.PORT) || 3000,
    
    // Base de datos
    database: {
        type: process.env.DB_TYPE || 'sqlite',
        path: process.env.DB_PATH || 'database/apexremedy.db'
    },
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'apexremedy_jwt_secret_2025_muy_seguro_cambiar_en_produccion',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    // Frontend
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
    
    // Seguridad
    security: {
        corsOrigins: [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ]
    },
    
    // Logging
    logging: {
        format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
    }
};

module.exports = config;