// admin/js/utils.js
// Utilidades generales para el frontend ADMIN

class Utils {
    // Formatear precio en pesos chilenos
    static formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    // Formatear fecha
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('es-CL', { ...defaultOptions, ...options }).format(new Date(date));
    }

    // Formatear número con separadores de miles
    static formatNumber(number) {
        return new Intl.NumberFormat('es-CL').format(number);
    }

    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar RUT chileno
    static isValidRUT(rut) {
        const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
        if (!rutRegex.test(rut)) return false;
        
        // Validar dígito verificador
        const cleanRUT = rut.replace(/\./g, '').replace('-', '');
        const body = cleanRUT.slice(0, -1);
        const dv = cleanRUT.slice(-1).toUpperCase();
        
        let sum = 0;
        let multiplier = 2;
        
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const remainder = sum % 11;
        const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
        
        return dv === calculatedDV;
    }

    // Validar teléfono chileno
    static isValidPhone(phone) {
        const phoneRegex = /^\+569\d{8}$/;
        return phoneRegex.test(phone);
    }

    // Generar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce para funciones
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle para funciones
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Capitalizar primera letra
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Truncar texto
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    // Obtener parámetros de URL
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    // Establecer parámetro de URL
    static setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    }

    // Remover parámetro de URL
    static removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    }

    // Copiar texto al portapapeles
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Mostrar notificación toast
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full`;
        
        // Colores según tipo
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        toast.classList.add(colors[type] || colors.info);
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remover después del tiempo especificado
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Confirmar acción
    static async confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            
            modal.innerHTML = `
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex gap-3 justify-end">
                        <button class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors" data-action="cancel">
                            Cancelar
                        </button>
                        <button class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" data-action="confirm">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Manejar clics
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                } else if (e.target.dataset.action === 'cancel') {
                    document.body.removeChild(modal);
                    resolve(false);
                } else if (e.target.dataset.action === 'confirm') {
                    document.body.removeChild(modal);
                    resolve(true);
                }
            });
        });
    }

    // Cargar imagen con fallback
    static loadImage(src, fallback = CONFIG.DEFAULT_PRODUCT_IMAGE) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(fallback);
            img.src = src;
        });
    }

    // Obtener imagen optimizada
    static getOptimizedImage(src, width = 400, height = 400) {
        if (!src) return CONFIG.DEFAULT_PRODUCT_IMAGE;
        
        // Si es una URL de Unsplash, optimizar
        if (src.includes('unsplash.com')) {
            return src.replace(/w=\d+/, `w=${width}`).replace(/h=\d+/, `h=${height}`);
        }
        
        return src;
    }

    // Calcular tiempo transcurrido
    static timeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'hace unos segundos';
    }

    // Sanitizar HTML
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Obtener estado de pedido en español
    static getOrderStatusText(status) {
        const statusMap = {
            pending: 'Pendiente',
            processing: 'Procesando',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return statusMap[status] || status;
    }

    // Obtener color de estado de pedido
    static getOrderStatusColor(status) {
        const colorMap = {
            pending: 'text-yellow-600',
            processing: 'text-blue-600',
            shipped: 'text-purple-600',
            delivered: 'text-green-600',
            cancelled: 'text-red-600'
        };
        return colorMap[status] || 'text-gray-600';
    }
}

// Exportar para uso global
window.Utils = Utils;



