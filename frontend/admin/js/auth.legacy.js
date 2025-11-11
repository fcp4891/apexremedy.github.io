import { authManagerProxy } from '../src/lib/authManager.js';

if (typeof window !== 'undefined') {
    window.authManager = window.authManager || authManagerProxy;
}



