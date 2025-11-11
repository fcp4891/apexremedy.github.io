import { notificationsProxy } from '../src/lib/notifications.js';

if (typeof window !== 'undefined') {
    window.notify = window.notify || notificationsProxy;
}



