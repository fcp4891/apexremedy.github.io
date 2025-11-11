// frontend/js/logPersister.js
// Sistema de logging persistente que guarda logs en localStorage

(function() {
    'use strict';

    const LOG_STORAGE_KEY = 'apexremedy_logs';
    const MAX_LOGS = 500; // Máximo de logs a guardar
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

    // Interceptar console.log, console.error, console.warn
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function saveLog(level, ...args) {
        try {
            const logs = getLogs();
            const timestamp = new Date().toISOString();
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            logs.push({
                timestamp,
                level,
                message,
                url: window.location.href
            });

            // Limpiar logs antiguos
            const now = Date.now();
            const filteredLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return (now - logTime) < MAX_AGE_MS;
            });

            // Limitar cantidad de logs
            const limitedLogs = filteredLogs.slice(-MAX_LOGS);

            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(limitedLogs));
        } catch (e) {
            // Si hay error, no hacer nada (no queremos romper la aplicación)
        }
    }

    function getLogs() {
        try {
            const stored = localStorage.getItem(LOG_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function clearLogs() {
        try {
            localStorage.removeItem(LOG_STORAGE_KEY);
        } catch (e) {
            // Ignorar errores
        }
    }

    function displayLogs() {
        const logs = getLogs();
        if (logs.length === 0) {
            console.log('📋 [LOG PERSISTER] No hay logs guardados');
            return;
        }

        console.group('📋 [LOG PERSISTER] Logs guardados (' + logs.length + ' entradas)');
        logs.forEach((log, index) => {
            const prefix = `[${index + 1}] [${log.level.toUpperCase()}] [${new Date(log.timestamp).toLocaleTimeString()}]`;
            if (log.level === 'error') {
                console.error(prefix, log.message);
            } else if (log.level === 'warn') {
                console.warn(prefix, log.message);
            } else {
                console.log(prefix, log.message);
            }
        });
        console.groupEnd();
    }

    // Interceptar console.log
    console.log = function(...args) {
        originalLog.apply(console, args);
        saveLog('log', ...args);
    };

    // Interceptar console.error
    console.error = function(...args) {
        originalError.apply(console, args);
        saveLog('error', ...args);
    };

    // Interceptar console.warn
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        saveLog('warn', ...args);
    };

    // Exponer funciones útiles
    window.logPersister = {
        getLogs,
        clearLogs,
        displayLogs,
        saveLog: (level, ...args) => saveLog(level, ...args)
    };

    // Mostrar logs guardados al cargar la página
    function autoDisplayLogs() {
        const logs = getLogs();
        if (logs.length > 0) {
            // Solo mostrar si hay logs de la sesión anterior (logs con URL diferente o timestamp reciente)
            const currentUrl = window.location.href;
            const recentLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                const now = Date.now();
                // Mostrar logs de los últimos 30 segundos o de otra URL
                return (now - logTime) < 30000 || log.url !== currentUrl;
            });

            if (recentLogs.length > 0) {
                console.log('📋 [LOG PERSISTER] Mostrando logs de la sesión anterior...');
                displayLogs();
                console.log('💡 [LOG PERSISTER] Tip: Escribe "logPersister.displayLogs()" en la consola para ver los logs guardados');
                console.log('💡 [LOG PERSISTER] Tip: Escribe "logPersister.clearLogs()" en la consola para limpiar los logs');
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(autoDisplayLogs, 1500);
        });
    } else {
        setTimeout(autoDisplayLogs, 1500);
    }

    console.log('✅ [LOG PERSISTER] Sistema de logging persistente activado');
    console.log('💡 [LOG PERSISTER] Todos los logs se guardan automáticamente en localStorage');
    console.log('💡 [LOG PERSISTER] Comandos disponibles:');
    console.log('   - logPersister.displayLogs() - Ver todos los logs guardados');
    console.log('   - logPersister.clearLogs() - Limpiar logs guardados');
    console.log('   - logPersister.getLogs() - Obtener array de logs');
})();

