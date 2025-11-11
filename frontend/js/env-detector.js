// frontend/js/env-detector.js
// Sistema de detección de entorno y fuente de datos

/**
 * Detecta el entorno actual y determina qué fuente de datos usar
 */
class EnvironmentDetector {
    constructor() {
        this.env = this.detectEnvironment();
        this.dataSource = this.detectDataSource();
        this.logEnvironment();
    }

    /**
     * Detecta el entorno (local, github, production)
     */
    detectEnvironment() {
        if (typeof window === 'undefined') {
            return 'unknown';
        }

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // GitHub Pages
        if (hostname.includes('github.io')) {
            return 'github';
        }
        
        // Local (file:// o localhost)
        if (protocol === 'file:' || 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0') {
            return 'local';
        }
        
        // Producción (cualquier otro dominio)
        return 'production';
    }

    /**
     * Detecta qué fuente de datos usar según el entorno
     */
    detectDataSource() {
        switch (this.env) {
            case 'github':
                return {
                    type: 'json',
                    description: 'Archivos JSON estáticos',
                    location: 'frontend/api/*.json',
                    hasBackend: false
                };
            
            case 'local':
                return {
                    type: 'sqlite',
                    description: 'Base de datos SQLite local',
                    location: 'backend/database/apexremedy.db',
                    hasBackend: true,
                    backendURL: 'http://localhost:3000/api'
                };
            
            case 'production':
                return {
                    type: 'postgres',
                    description: 'Base de datos PostgreSQL',
                    location: 'Configurado en servidor (variables de entorno)',
                    hasBackend: true,
                    backendURL: this.getProductionBackendURL()
                };
            
            default:
                return {
                    type: 'json',
                    description: 'Fuente desconocida, usando JSON como fallback',
                    location: 'frontend/api/*.json',
                    hasBackend: false
                };
        }
    }

    /**
     * Obtiene la URL del backend en producción
     */
    getProductionBackendURL() {
        // Verificar si hay una configuración explícita
        if (typeof window !== 'undefined' && window.PRODUCTION_API_URL) {
            return window.PRODUCTION_API_URL;
        }
        
        // Intentar inferir desde el hostname actual
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Si es HTTPS, probablemente el backend está en el mismo dominio
        if (protocol === 'https:') {
            return `${protocol}//api.${hostname}/api`;
        }
        
        return null; // No se pudo determinar, usar JSON estático
    }

    /**
     * Log del entorno detectado
     */
    logEnvironment() {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║          🔍 DETECCIÓN DE ENTORNO Y FUENTE DE DATOS        ║
╠════════════════════════════════════════════════════════════╣
║ Entorno detectado: ${this.env.padEnd(43)} ║
║ Fuente de datos:   ${this.dataSource.type.padEnd(43)} ║
║ Descripción:       ${this.dataSource.description.padEnd(43)} ║
║ Ubicación:         ${this.dataSource.location.substring(0, 43).padEnd(43)} ║
║ Backend disponible: ${(this.dataSource.hasBackend ? 'Sí' : 'No').padEnd(43)} ║
${this.dataSource.backendURL ? `║ URL Backend:        ${this.dataSource.backendURL.substring(0, 43).padEnd(43)} ║` : ''}
╚════════════════════════════════════════════════════════════╝
        `);
    }

    /**
     * Verifica si el backend está disponible
     */
    async checkBackendAvailability() {
        if (!this.dataSource.hasBackend || !this.dataSource.backendURL) {
            return false;
        }

        try {
            const response = await fetch(`${this.dataSource.backendURL}/health`, {
                method: 'GET',
                timeout: 3000
            });
            return response.ok;
        } catch (error) {
            console.warn('⚠️ Backend no disponible, usando JSON estático');
            return false;
        }
    }

    /**
     * Obtiene la URL del backend a usar
     */
    getBackendURL() {
        if (this.dataSource.hasBackend && this.dataSource.backendURL) {
            return this.dataSource.backendURL;
        }
        return null; // Usar solo JSON estático
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.envDetector = new EnvironmentDetector();
    
    // Exportar información de entorno
    window.ENVIRONMENT = {
        env: window.envDetector.env,
        dataSource: window.envDetector.dataSource.type,
        hasBackend: window.envDetector.dataSource.hasBackend,
        backendURL: window.envDetector.getBackendURL()
    };
}









