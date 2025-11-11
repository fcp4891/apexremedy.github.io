/**
 * Logger común para futuras migraciones.
 * Actualmente utiliza `console` directamente.
 * Se podrá extender con niveles y reportes remotos.
 */

const DEFAULT_NAMESPACE = 'frontend/admin';

function formatMessage(namespace, level, message) {
    return `[${namespace}] ${level.toUpperCase()}: ${message}`;
}

export function createLogger(namespace = DEFAULT_NAMESPACE) {
    return {
        info(message, ...args) {
            console.info(formatMessage(namespace, 'info', message), ...args);
        },
        warn(message, ...args) {
            console.warn(formatMessage(namespace, 'warn', message), ...args);
        },
        error(message, ...args) {
            console.error(formatMessage(namespace, 'error', message), ...args);
        },
        debug(message, ...args) {
            if (process?.env?.NODE_ENV !== 'production') {
                console.debug(formatMessage(namespace, 'debug', message), ...args);
            }
        }
    };
}

export const logger = createLogger();



