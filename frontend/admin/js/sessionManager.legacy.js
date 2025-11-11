import { sessionManagerProxy } from '../src/lib/sessionManager.js';

if (typeof window !== 'undefined') {
    window.sessionManager = window.sessionManager || sessionManagerProxy;
}



