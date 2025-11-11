// Adaptador legacy → mantiene window.api consumiendo el proxy ESM
import { apiClientProxy } from '../src/lib/apiClient.js';

if (typeof window !== 'undefined') {
    window.api = window.api || apiClientProxy;
}



