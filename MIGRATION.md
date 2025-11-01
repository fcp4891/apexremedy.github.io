# 📦 Guía de Migración - LocalStorage a API Backend

Esta guía te ayudará a migrar tu código frontend actual desde localStorage fake a la API real.

## 🎯 Pasos de Migración

### 1. Preparar el Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run seed
npm run dev
```

Verificar que la API esté funcionando:
```bash
curl http://localhost:3000/api/health
```

### 2. Incluir el API Client en el Frontend

En todos tus archivos HTML, agregar antes de otros scripts:

```html
<!-- API Client -->
<script src="js/api/apiClient.js"></script>

<!-- Resto de scripts -->
<script src="db/db_articulos.js"></script>
<script src="js/js_global.js"></script>
```

### 3. Reemplazar Clase Database

#### ❌ Código Anterior (db_articulos.js)
```javascript
class Database {
    static async getProducts() {
        return JSON.parse(localStorage.getItem('products') || '[]');
    }
    
    static async authenticateUser(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === email && u.password === password);
    }
}
```

#### ✅ Código Nuevo (reemplazar db_articulos.js)
```javascript
// db/db_articulos.js - Adaptador para la API
class Database {
    // Productos
    static async getProducts(limit) {
        try {
            const response = await api.getProducts({ limit });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            return [];
        }
    }

    static async getProductById(id) {
        try {
            const response = await api.getProductById(id);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            return null;
        }
    }

    static async searchProducts(query) {
        try {
            const response = await api.searchProducts(query);
            return response.data;
        } catch (error) {
            console.error('Error buscando productos:', error);
            return [];
        }
    }

    static async getProductsByCategory(category) {
        try {
            const response = await api.getProducts({ category });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo productos por categoría:', error);
            return [];
        }
    }

    // Autenticación
    static async registerUser(userData) {
        try {
            const response = await api.register(userData);
            if (response.success) {
                return response.data.user;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error registrando usuario:', error);
            throw error;
        }
    }

    static async authenticateUser(email, password) {
        try {
            const response = await api.login({ email, password });
            if (response.success) {
                return response.data.user;
            }
            return null;
        } catch (error) {
            console.error('Error autenticando usuario:', error);
            return null;
        }
    }

    // Pedidos
    static async createOrder(orderData) {
        try {
            // Transformar items del carrito al formato de la API
            const items = orderData.items.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            const apiOrderData = {
                items,
                customer_name: orderData.customerInfo.name,
                customer_email: orderData.customerInfo.email,
                customer_phone: orderData.customerInfo.phone
            };

            const response = await api.createOrder(apiOrderData);
            return response.data;
        } catch (error) {
            console.error('Error creando pedido:', error);
            throw error;
        }
    }

    static async getOrders() {
        try {
            const response = await api.getAllOrders();
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            return [];
        }
    }

    static async getOrdersByUser(userId) {
        try {
            const response = await api.getMyOrders();
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pedidos del usuario:', error);
            return [];
        }
    }

    static async updateOrderStatus(orderId, status) {
        try {
            const response = await api.updateOrderStatus(orderId, status);
            return response.data;
        } catch (error) {
            console.error('Error actualizando estado del pedido:', error);
            throw error;
        }
    }

    // Métodos de Admin
    static async addProduct(productData) {
        try {
            const response = await api.createProduct(productData);
            return response.data;
        } catch (error) {
            console.error('Error agregando producto:', error);
            throw error;
        }
    }

    static async updateProduct(id, productData) {
        try {
            const response = await api.updateProduct(id, productData);
            return response.data;
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    }

    static async deleteProduct(id) {
        try {
            await api.deleteProduct(id);
            return true;
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }

    static async updateStock(productId, newStock) {
        try {
            const product = await this.getProductById(productId);
            const quantity = newStock - product.stock;
            const response = await api.updateProductStock(productId, quantity);
            return response.data;
        } catch (error) {
            console.error('Error actualizando stock:', error);
            throw error;
        }
    }

    // Usuarios (Admin)
    static async getUsers() {
        try {
            // Implementar endpoint en el backend si es necesario
            const response = await api.request('/users');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    }

    static async getUserById(id) {
        try {
            const response = await api.request(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }

    static async updateUser(id, userData) {
        try {
            const response = await api.request(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            return response.data;
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            throw error;
        }
    }

    static async deleteUser(id) {
        try {
            await api.request(`/users/${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            throw error;
        }
    }

    // Estadísticas
    static async getStats() {
        try {
            const [productStats, orderStats] = await Promise.all([
                api.getProductStats(),
                api.getOrderStats()
            ]);

            return {
                totalProducts: productStats.data.total,
                totalUsers: orderStats.data.total, // Ajustar según tu API
                totalOrders: orderStats.data.total,
                lowStockProducts: productStats.data.lowStock,
                recentOrders: orderStats.data.recentOrders
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                totalProducts: 0,
                totalUsers: 0,
                totalOrders: 0,
                lowStockProducts: 0,
                recentOrders: []
            };
        }
    }
}
```

### 4. Actualizar Manejo de Sesión

#### ❌ Código Anterior
```javascript
// Login
const user = await Database.authenticateUser(email, password);
localStorage.setItem('currentUser', JSON.stringify(user));
```

#### ✅ Código Nuevo
```javascript
// Login
const response = await api.login({ email, password });
if (response.success) {
    // El token se guarda automáticamente en apiClient
    const user = response.data.user;
    localStorage.setItem('currentUser', JSON.stringify(user));
}
```

### 5. Verificar Token al Cargar la Página

Agregar al inicio de `js_global.js`:

```javascript
// Verificar token al cargar
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const response = await api.verifyToken();
            if (response && response.success) {
                // Token válido, actualizar usuario
                const currentUser = response.data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                // Token inválido, limpiar
                api.clearToken();
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            // Token expirado o inválido
            api.clearToken();
            localStorage.removeItem('currentUser');
        }
    }
    
    // Continuar con la inicialización normal
    globalApp = new GlobalApp();
});
```

### 6. Actualizar Logout

```javascript
logout() {
    // Limpiar token y datos locales
    api.logout();
    
    // Redirigir
    window.location.href = 'index.html';
}
```

### 7. Manejo de Errores Mejorado

```javascript
async addToCart(productId) {
    try {
        const product = await Database.getProductById(productId);
        
        if (!product) {
            this.showAlert('Producto no encontrado', 'error');
            return;
        }
        
        if (product.stock === 0) {
            this.showAlert('Producto agotado', 'error');
            return;
        }
        
        // Resto del código...
        
    } catch (error) {
        console.error('Error:', error);
        
        if (error.message.includes('401') || error.message.includes('Token')) {
            this.showAlert('Sesión expirada. Por favor inicia sesión nuevamente', 'warning');
            api.clearToken();
            this.openLoginModal();
        } else {
            this.showAlert('Error al agregar producto al carrito', 'error');
        }
    }
}
```

## 🔄 Cambios en el Flujo de Trabajo

### Antes (LocalStorage)
```
Usuario → Frontend → LocalStorage → Frontend → Usuario
```

### Ahora (API)
```
Usuario → Frontend → API Client → Backend API → Base de Datos
                  ↓                    ↓
              Token JWT          Validación/Auth
```

## ⚠️ Puntos Importantes

### 1. CORS
El backend ya está configurado para aceptar peticiones desde `http://localhost:5500`. Si usas otro puerto, actualizar en `.env`:

```env
FRONTEND_URL=http://localhost:TUPUERTO
```

### 2. Tokens Expirados
Los tokens expiran en 7 días. Implementar refresh o re-login:

```javascript
// En apiClient.js, agregar interceptor
async request(endpoint, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expirado
            this.clearToken();
            window.location.href = '/index.html';
            throw new Error('Sesión expirada');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}
```

### 3. Caché Local (Opcional)
Para mejorar performance, cachear datos:

```javascript
class CachedAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 minutos
    }

    async getProducts() {
        const cacheKey = 'products';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            return cached.data;
        }

        const data = await api.getProducts();
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }
}
```

## ✅ Checklist de Migración

- [ ] Backend instalado y corriendo
- [ ] Base de datos inicializada con seed
- [ ] API Client incluido en HTML
- [ ] Clase Database actualizada
- [ ] Sistema de autenticación migrado
- [ ] Verificación de token implementada
- [ ] Manejo de errores actualizado
- [ ] Logout actualizado
- [ ] Productos cargándose desde API
- [ ] Pedidos creándose correctamente
- [ ] Panel admin funcionando
- [ ] CORS configurado correctamente
- [ ] Variables de entorno configuradas

## 🧪 Testing de la Migración

### 1. Test de Autenticación
```javascript
// En la consola del navegador
async function testAuth() {
    // Registrar usuario
    const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123',
        phone: '+56912345678'
    };
    
    const register = await api.register(registerData);
    console.log('Register:', register);
    
    // Login
    const login = await api.login({
        email: 'test@example.com',
        password: 'test123'
    });
    console.log('Login:', login);
    
    // Verificar perfil
    const profile = await api.getProfile();
    console.log('Profile:', profile);
}

testAuth();
```

### 2. Test de Productos
```javascript
async function testProducts() {
    // Obtener productos
    const products = await api.getProducts();
    console.log('Products:', products);
    
    // Buscar productos
    const search = await api.searchProducts('kush');
    console.log('Search:', search);
    
    // Productos destacados
    const featured = await api.getFeaturedProducts();
    console.log('Featured:', featured);
}

testProducts();
```

### 3. Test de Pedidos
```javascript
async function testOrder() {
    // Primero hacer login
    await api.login({
        email: 'cliente@test.cl',
        password: 'test123'
    });
    
    // Crear pedido
    const orderData = {
        items: [
            { product_id: 1, quantity: 2 },
            { product_id: 2, quantity: 1 }
        ],
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        customer_phone: '+56912345678'
    };
    
    const order = await api.createOrder(orderData);
    console.log('Order created:', order);
    
    // Obtener mis pedidos
    const myOrders = await api.getMyOrders();
    console.log('My orders:', myOrders);
}

testOrder();
```

## 🐛 Problemas Comunes y Soluciones

### Error: CORS Policy
**Problema:** No se pueden hacer peticiones desde el frontend

**Solución:**
```javascript
// En backend/.env
FRONTEND_URL=http://localhost:5500

// Reiniciar el servidor
npm run dev
```

### Error: Token Undefined
**Problema:** El token no se está guardando

**Solución:**
```javascript
// Verificar que apiClient.js esté cargado ANTES de otros scripts
<script src="js/api/apiClient.js"></script>
<script src="js/js_global.js"></script>
```

### Error: 401 Unauthorized
**Problema:** Token expirado o inválido

**Solución:**
```javascript
// Limpiar y volver a iniciar sesión
api.clearToken();
localStorage.clear();
// Hacer login nuevamente
```

### Error: Cannot read property of undefined
**Problema:** Respuesta de API diferente a la esperada

**Solución:**
```javascript
// Verificar estructura de respuesta
async function debugAPI() {
    try {
        const response = await api.getProducts();
        console.log('Response structure:', response);
        
        // Ajustar código según la estructura
        const products = response.data || response;
    } catch (error) {
        console.error('Full error:', error);
    }
}
```

## 📊 Comparación de Performance

### Antes (LocalStorage)
- ✅ Instantáneo
- ❌ Sin validación
- ❌ Sin seguridad
- ❌ Límite 5-10MB
- ❌ Solo un usuario

### Ahora (API + SQLite)
- ⚡ ~50-200ms (local)
- ✅ Validación completa
- ✅ JWT + bcrypt
- ✅ Sin límites prácticos
- ✅ Multi-usuario real

## 🚀 Optimizaciones Adicionales

### 1. Request Batching
```javascript
class OptimizedAPI extends APIClient {
    async batchGetProducts(ids) {
        // Hacer una sola petición con múltiples IDs
        const promises = ids.map(id => this.getProductById(id));
        return await Promise.all(promises);
    }
}
```

### 2. Lazy Loading
```javascript
// Cargar productos solo cuando sean visibles
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            loadMoreProducts();
        }
    });
});
```

### 3. Optimistic Updates
```javascript
async addToCart(productId) {
    // Actualizar UI inmediatamente
    this.updateCartUI(productId);
    
    try {
        // Sincronizar con servidor
        await this.syncCartWithServer();
    } catch (error) {
        // Revertir si falla
        this.revertCartUpdate(productId);
        this.showAlert('Error al agregar al carrito', 'error');
    }
}
```

## 📝 Notas Finales

### Datos de Prueba
Después de ejecutar `npm run seed`, tendrás:
- **Admin:** admin@apexremedy.cl / admin123
- **Cliente:** cliente@test.cl / test123
- **10 productos** de ejemplo
- **Base de datos limpia**

### Resetear Base de Datos
```bash
cd backend
rm database/apexremedy.db
npm run seed
```

### Backup de Base de Datos
```bash
# SQLite permite copiar el archivo directamente
cp database/apexremedy.db database/backup_$(date +%Y%m%d).db
```

### Logs de Desarrollo
```bash
# Ver logs en tiempo real
cd backend
npm run dev

# Los logs mostrarán:
# - Peticiones HTTP (morgan)
# - Errores de base de datos
# - Autenticación de usuarios
# - Creación de pedidos
```

## 🎓 Recursos Adicionales

- [Express.js Docs](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [JWT Introduction](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 💡 Próximos Pasos

1. **Implementar Tests Automatizados**
   ```bash
   npm install --save-dev jest supertest
   ```

2. **Agregar Documentación API (Swagger)**
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   ```

3. **Implementar Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Agregar Logging Avanzado**
   ```bash
   npm install winston
   ```

5. **Migrar a PostgreSQL (Producción)**
   - Crear PostgresAdapter
   - Actualizar configuración
   - Migrar datos con scripts

## 🤝 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Prueba los endpoints con Postman/Thunder Client
4. Consulta esta guía de troubleshooting
5. Revisa el README.md para más detalles

---

**¡Éxito con la migración!** 🎉

Una vez completada, tendrás un sistema productivo, seguro y escalable.