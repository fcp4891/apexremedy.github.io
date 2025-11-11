import { utilsProxy } from '../src/lib/utils.js';

if (typeof window !== 'undefined') {
    window.Utils = window.Utils || utilsProxy;
}



