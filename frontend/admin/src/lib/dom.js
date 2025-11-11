/**
 * Helpers DOM genéricos centralizados.
 * Se apoya en data-attributes para futuras mejoras.
 */

import { logger } from './logger.js';

const domLogger = logger;

export function query(selector, root = document) {
    const element = root.querySelector(selector);
    if (!element) {
        domLogger.warn(`Selector no encontrado: ${selector}`);
    }
    return element;
}

export function queryAll(selector, root = document) {
    const elements = root.querySelectorAll(selector);
    if (!elements.length) {
        domLogger.warn(`Selector múltiple vacío: ${selector}`);
    }
    return Array.from(elements);
}

export function on(element, eventName, handler, options) {
    if (!element) {
        domLogger.warn(`No se pudo registrar listener ${eventName}: elemento nulo`);
        return () => {};
    }
    element.addEventListener(eventName, handler, options);
    return () => element.removeEventListener(eventName, handler, options);
}

export function delegate(root, eventName, selector, handler) {
    if (!root) {
        domLogger.warn(`No se pudo delegar evento ${eventName}: root nulo`);
        return () => {};
    }
    const listener = (event) => {
        const target = event.target.closest(selector);
        if (target && root.contains(target)) {
            handler(event, target);
        }
    };
    root.addEventListener(eventName, listener);
    return () => root.removeEventListener(eventName, listener);
}



