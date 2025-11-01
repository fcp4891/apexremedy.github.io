// frontend/js/api/apiClient.js
// Cliente API para comunicación con el backend
// ✅ ACTUALIZADO CON SOPORTE MEDICINAL

// Prevenir doble declaración
if (typeof APIClient === 'undefined') {
    class APIClient {
        constructor() {
            this.baseURL = 'http://localhost:3000/api';
            this.token = localStorage.getItem('authToken');
        }

        // Método auxiliar para hacer peticiones
        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Agregar token si existe
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                const data = await response.json();

                if (!response.ok) {
                    // Si es error 401, limpiar token y redirigir
                    if (response.status === 401) {
                        this.token = null;
                        localStorage.removeItem('authToken');
                        if (typeof authManager !== 'undefined') {
                            authManager.logout();
                        }
                    }
                    throw new Error(data.message || 'Error en la petición');
                }

                return data;
            } catch (error) {
                console.error('Error en petición:', error);
                throw error;
            }
        }

        // Métodos de autenticación
        async register(userData) {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success && response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        }

        async login(credentials) {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success && response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        }

        async getProfile() {
            return await this.request('/auth/profile');
        }

        async updateProfile(data) {
            return await this.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        async verifyToken() {
            try {
                return await this.request('/auth/verify');
            } catch (error) {
                this.clearToken();
                return null;
            }
        }

        logout() {
            this.clearToken();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('cart');
        }

        setToken(token) {
            this.token = token;
            localStorage.setItem('authToken', token);
        }

        clearToken() {
            this.token = null;
            localStorage.removeItem('authToken');
        }

        // Métodos de productos
        async getProducts(filters = {}) {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = queryString ? `/products?${queryString}` : '/products';
            
            return await this.request(endpoint);
        }

        async getProductById(id) {
            return await this.request(`/products/${id}`);
        }

        async searchProducts(query) {
            return await this.request(`/products/search?q=${encodeURIComponent(query)}`);
        }

        async getFeaturedProducts() {
            return await this.request('/products/featured');
        }

        async getCategories() {
            return await this.request('/products/categories');
        }

        async getBestSellers(limit = 10) {
            return await this.request(`/products/bestsellers?limit=${limit}`);
        }

        // 🆕 NUEVO: Obtener productos medicinales (requiere autenticación y aprobación)
        async getMedicinalProducts(limit = 50) {
            return await this.request(`/products/medicinal/all?limit=${limit}`);
        }

        // Métodos de productos (ADMIN)
        async createProduct(productData) {
            return await this.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        }

        async updateProduct(id, productData) {
            return await this.request(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        }

        async deleteProduct(id) {
            return await this.request(`/products/${id}`, {
                method: 'DELETE'
            });
        }

        async updateProductStock(id, quantity) {
            return await this.request(`/products/${id}/stock`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity })
            });
        }

        async getProductStats() {
            return await this.request('/products/stats');
        }

        // Métodos de pedidos
        async createOrder(orderData) {
            return await this.request('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        }

        async getMyOrders(limit) {
            const endpoint = limit ? `/orders/my-orders?limit=${limit}` : '/orders/my-orders';
            return await this.request(endpoint);
        }

        async getOrderById(id) {
            return await this.request(`/orders/${id}`);
        }

        async cancelOrder(id) {
            return await this.request(`/orders/${id}/cancel`, {
                method: 'POST'
            });
        }

        // Métodos de pedidos (ADMIN)
        async getAllOrders(filters = {}) {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = queryString ? `/orders?${queryString}` : '/orders';
            
            return await this.request(endpoint);
        }

        async updateOrderStatus(id, status) {
            return await this.request(`/orders/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        }

        async getOrderStats() {
            return await this.request('/orders/admin/stats');
        }

        async getSalesSummary(period = 'day') {
            return await this.request(`/orders/admin/sales-summary?period=${period}`);
        }

        // Verificar salud de la API
        async checkHealth() {
            try {
                return await this.request('/health');
            } catch (error) {
                return { success: false, message: 'API no disponible' };
            }
        }

        // ============================================
        // MÉTODOS DE USUARIOS (ADMIN)
        // ============================================
        
        async getUsers(filters = {}) {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = queryString ? `/users?${queryString}` : '/users';
            
            return await this.request(endpoint);
        }

        async getUserById(id) {
            return await this.request(`/users/${id}`);
        }

        async getUserDocuments(id) {
            return await this.request(`/users/${id}/documents`);
        }

        async saveUserDocuments(userId, documents) {
            return await this.request(`/users/${userId}/documents`, {
                method: 'POST',
                body: JSON.stringify({ documents })
            });
        }

        async approveUser(id, notes = '') {
            return await this.request(`/users/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ admin_notes: notes })
            });
        }

        async rejectUser(id, reason, notes = '') {
            return await this.request(`/users/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ 
                    rejection_reason: reason,
                    admin_notes: notes 
                })
            });
        }

        async updateUser(id, userData) {
            return await this.request(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        }

        async deleteUser(id) {
            return await this.request(`/users/${id}`, {
                method: 'DELETE'
            });
        }

        async getPendingUsers() {
            return await this.request('/users/pending');
        }

        async createUser(userData) {
            return await this.request('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

// Subir comprobante de pago
async uploadPaymentProof(orderId, file) {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('orderId', orderId);

    const url = `${this.baseURL}/orders/${orderId}/payment-proof`;
    const headers = {};

    // Agregar token si existe
    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData // No incluir Content-Type, el navegador lo manejará
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al subir comprobante');
        }

        return data;
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        throw error;
    }
}

// Verificar estado de pago
async checkPaymentStatus(orderId) {
    return await this.request(`/orders/${orderId}/payment-status`);
}

// Confirmar pago (ADMIN)
async confirmPayment(orderId, notes = '') {
    return await this.request(`/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: notes })
    });
}

// Rechazar pago (ADMIN)
async rejectPayment(orderId, reason) {
    return await this.request(`/orders/${orderId}/reject-payment`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: reason })
    });
}

// Obtener órdenes pendientes de pago (ADMIN)
async getPendingPayments() {
    return await this.request('/orders/pending-payments');
}

// Obtener comprobante de pago
async getPaymentProof(orderId) {
    return await this.request(`/orders/${orderId}/payment-proof`);
}

// ============================================
// PAGOS (Transferencias)
// ============================================

// Enviar transferencia (cliente) con FormData (no usar this.request por Content-Type)
async submitTransferProof(formData) {
    const url = `${this.baseURL}/payments/bank-transfer`;
    const headers = {};

    // token
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, {
        method: 'POST',
        headers,          // sin Content-Type; fetch lo define por boundary
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al enviar transferencia');
    }
    return data;
}

// Listar transferencias pendientes (admin)
async getPendingTransfers() {
    return await this.request('/payments/pending');
}

// Obtener una transferencia por ID (admin)
async getTransferById(id) {
    return await this.request(`/payments/${id}`);
}

// Validar transferencia (admin): approved=true/false
async validateTransfer(id, approved) {
    return await this.request(`/payments/${id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ approved })
    });
}


    }

    // Crear instancia global solo si no existe
    if (typeof api === 'undefined') {
        window.api = new APIClient();
    }

    // Exportar para uso en módulos
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = APIClient;
    }
    
}

console.log('✅ API Client cargado con soporte medicinal');

