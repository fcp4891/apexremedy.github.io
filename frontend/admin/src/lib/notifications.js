/**
 * Adaptador temporal para notifications (modo legacy).
 * Permite consumir `window.notify` desde módulos sin perder compatibilidad.
 */

const LEGACY_GLOBAL_KEY = 'notify';

function resolveLegacyInstance() {
    const instance = window?.[LEGACY_GLOBAL_KEY];
    if (!instance) {
        console.warn('[legacy-adapter] notify global no disponible todavía.');
    }
    return instance;
}

export function getNotifications() {
    return resolveLegacyInstance();
}

export const notificationsProxy = new Proxy(
    {},
    {
        get(_target, prop) {
            const instance = resolveLegacyInstance();
            const value = instance?.[prop];
            if (typeof value === 'function') {
                return value.bind(instance);
            }
            return value;
        }
    }
);



