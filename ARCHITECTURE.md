# 🏗️ Arquitectura del Sistema Apexremedy

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (SPA)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   index.html │  │   shop.html  │  │  admin.html  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  API Client    │                           │
│                    │  (apiClient.js)│                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP/JSON
                             │ Bearer Token (JWT)
┌────────────────────────────▼──────────────────────────────────┐
│                        BACKEND API                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                      Express Server                        │ │
│  │  ┌────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Helmet    │  │    CORS     │  │   Morgan    │       │ │
│  │  │ (Security) │  │  (Access)   │  │  (Logging)  │       │ │
│  │  └────────────┘  └─────────────┘  └─────────────┘       │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                   │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │                    Middleware Layer                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │     Auth     │  │  Validation  │  │ Error Handler│    │ │
│  │  │  (JWT Check) │  │   (Schema)   │  │  (Global)    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                   │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │                      Routes Layer                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │   Auth   │  │ Products │  │  Orders  │  │  Users   │  │ │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │ │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────┘ │
│          │             │             │             │            │
│  ┌───────▼─────────────▼─────────────▼─────────────▼─────────┐ │
│  │                   Controllers Layer                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │    Auth    │  │  Product   │  │   Order    │           │ │
│  │  │ Controller │  │ Controller │  │ Controller │  ...      │ │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │ │
│  └────────┼───────────────┼───────────────┼───────────────────┘ │
│           │               │               │                     │
│  ┌────────▼───────────────▼───────────────▼───────────────────┐ │
│  │                    Models Layer                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │   User   │  │ Product  │  │  Order   │  │   Base   │  │ │
│  │  │  Model   │  │  Model   │  │  Model   │  │  Model   │  │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │ │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────┘ │
│          │             │             │             │            │
│  ┌───────▼─────────────▼─────────────▼─────────────▼─────────┐ │
│  │              Database Abstraction Layer                     │ │
│  │  ┌──────────────────┐         ┌──────────────────┐        │ │
│  │  │   Interface      │◄────────│  SQLite Adapter  │        │ │
│  │  │  (Abstract)      │         │  (Implementation)│        │ │
│  │  └──────────────────┘         └────────┬─────────┘        │ │
│  └─────────────────────────────────────────┼───────────────────┘ │
└────────────────────────────────────────────┼─────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  SQLite Database│
                                    │  (apexremedy.db)│
                                    └─────────────────┘
```

## 🎯 Principios de Diseño

### 1. **Separación de Responsabilidades**
Cada capa tiene una función específica:
- **Frontend**: Presentación y UX
- **API Client**: Comunicación HTTP
- **Routes**: Enrutamiento de peticiones
- **Controllers**: Lógica de negocio
- **Models**: Acceso a datos
- **Database Layer**: Abstracción de BD

### 2. **Arquitectura de Capas**
```
Presentation → Business Logic → Data Access → Database
```

### 3. **Modularidad**
- Cambio fácil de base de datos
- Componentes reutilizables
- Testing independiente por capa

### 4. **Seguridad por Capas**
```
JWT Auth → Route Guards → Input Validation → SQL Safe Queries
```

## 🔄 Flujo de Datos

### Ejemplo: Crear un Pedido

```
1. FRONTEND
   ↓ Usuario hace clic en "Proceder al Pago"
   ↓ globalApp.checkout()
   
2. API CLIENT
   ↓ api.createOrder(orderData)
   ↓ POST /api/orders
   ↓ Headers: { Authorization: Bearer <token> }
   
3. BACKEND - Middleware
   ↓ authenticate() - Verifica JWT
   ↓ orderValidation.create - Valida datos
   
4. BACKEND - Route
   ↓ POST /api/orders → orderController.create
   
5. BACKEND - Controller
   ↓ Verifica stock de productos
   ↓ Calcula subtotal, tax, total
   ↓ Order.createWithItems(orderData, items)
   
6. BACKEND - Model
   ↓ Inicia transacción
   ↓ INSERT INTO orders
   ↓ INSERT INTO order_items (para cada item)
   ↓ UPDATE products (decrementar stock)
   ↓ Commit transacción
   
7. DATABASE
   ↓ SQLite ejecuta queries
   ↓ Retorna IDs y datos
   
8. RESPUESTA
   ↑ Model → Controller → Route → Middleware
   ↑ JSON Response { success: true, data: {...} }
   
9. FRONTEND
   ↑ apiClient recibe respuesta
   ↑ Actualiza UI
   ↑ Muestra mensaje de éxito
```

## 📦 Estructura de Datos

### Base de Datos (SQLite)

```sql
users
├── id (INTEGER PRIMARY KEY)
├── name (TEXT)
├── email (TEXT UNIQUE)
├── password (TEXT) -- bcrypt hash
├── phone (TEXT)
├── rut (TEXT UNIQUE)
├── role (TEXT) -- 'customer' | 'admin'
├── created_at (DATETIME)
└── updated_at (DATETIME)

products
├── id (INTEGER PRIMARY KEY)
├── name (TEXT)
├── description (TEXT)
├── price (INTEGER) -- en CLP
├── stock (INTEGER)
├── category (TEXT)
├── featured (BOOLEAN)
├── image (TEXT)
├── created_at (DATETIME)
└── updated_at (DATETIME)

orders
├── id (INTEGER PRIMARY KEY)
├── user_id (INTEGER FK → users.id)
├── total (INTEGER)
├── subtotal (INTEGER)
├── tax (INTEGER)
├── status (TEXT) -- 'pending' | 'processing' | ...
├── customer_name (TEXT)
├── customer_email (TEXT)
├── customer_phone (TEXT)
├── created_at (DATETIME)
└── updated_at (DATETIME)

order_items
├── id (INTEGER PRIMARY KEY)
├── order_id (INTEGER FK → orders.id)
├── product_id (INTEGER FK → products.id)
├── product_name (TEXT)
├── quantity (INTEGER)
├── price (INTEGER)
└── created_at (DATETIME)
```

### JWT Token Structure

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 1,
    "email": "user@example.com",
    "role": "customer",
    "iat": 1704067200,
    "exp": 1704672000
  },
  "signature": "..."
}
```

## 🔐 Seguridad Implementada

### 1. Autenticación
- **bcrypt** para hash de contraseñas (10 rounds)
- **JWT** para sesiones stateless
- Tokens con expiración (7 días por defecto)

### 2. Autorización
```javascript
// Middleware en cadena
router.post('/products', 
    authenticate,      // Verificar token
    requireAdmin,      // Verificar rol
    validation.create, // Validar datos
    controller.create  // Ejecutar
);
```

### 3. Validación de Inputs
- express-validator en todas las rutas
- Sanitización de datos
- Prevención de SQL injection (prepared statements)

### 4. Headers de Seguridad (helmet)
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000
```

### 5. CORS Configurado
```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true
}
```

## 🚀 Rendimiento

### Optimizaciones Implementadas

1. **Índices de Base de Datos**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user ON orders(user_id);
```

2. **Queries Optimizadas**
```javascript
// Evitar N+1 queries
const orders = await Order.findAllWithItems(); // 2 queries
// vs
for (order of orders) {
  order.items = await getItems(order.id); // N queries
}
```

3. **Transacciones para Integridad**
```javascript
await db.beginTransaction();
try {
  // Múltiples operaciones
  await db.commit();
} catch (error) {
  await db.rollback();
}
```

## 🔧 Extensibilidad

### Agregar Nueva Base de Datos

```javascript
// 1. Crear adaptador
class PostgresAdapter extends DatabaseInterface {
    constructor(config) {
        super();
        this.pool = new Pool(config);
    }
    
    async connect() { /* implementar */ }
    async query() { /* implementar */ }
    // ... otros métodos
}

// 2. Registrar en configuración
const adapters = {
    sqlite: SQLiteAdapter,
    postgres: PostgresAdapter,
    mysql: MySQLAdapter
};

// 3. Usar
const db = createDatabaseAdapter('postgres');
```

### Agregar Nueva Entidad

```javascript
// 1. Crear tabla en database.js
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

// 2. Crear modelo
class Category extends BaseModel {
    constructor() {
        super('categories');
    }
    // Métodos específicos
}

// 3. Crear controlador
class CategoryController {
    async getAll(req, res) { /* ... */ }
}

// 4. Crear rutas
router.get('/categories', categoryController.getAll);

// 5. Registrar en server.js
app.use('/api/categories', categoryRoutes);
```

## 📊 Monitoreo y Logs

### Logs Implementados

```javascript
// Morgan HTTP logs
GET /api/products 200 45ms
POST /api/orders 201 125ms
GET /api/orders/123 404 12ms

// Custom logs en controllers
console.log('✅ Usuario registrado:', user.email);
console.error('❌ Error en pedido:', error.message);
```

### Métricas Disponibles

```javascript
// Estadísticas desde la API
GET /api/products/admin/stats
GET /api/orders/admin/stats
GET /api/users/stats

// Respuesta ejemplo
{
  "total": 150,
  "byStatus": { "pending": 5, "delivered": 120 },
  "revenue": 4500000,
  "averageOrderValue": 30000
}
```

## 🧪 Testing

### Estrategia de Testing

```
Unit Tests → Integration Tests → E2E Tests
   ↓              ↓                  ↓
 Models      Controllers         Full Flow
```

### Ejemplo de Test

```javascript
// tests/models/User.test.js
describe('User Model', () => {
    test('should hash password on create', async () => {
        const user = await User.create({
            name: 'Test',
            email: 'test@test.com',
            password: 'plain123'
        });
        
        expect(user.password).not.toBe('plain123');
        const isValid = await User.verifyPassword('plain123', user.password);
        expect(isValid).toBe(true);
    });
});
```

## 🌐 API Endpoints Reference

```
AUTH
├── POST   /api/auth/register
├── POST   /api/auth/login
├── GET    /api/auth/profile        [auth]
├── PUT    /api/auth/profile        [auth]
└── GET    /api/auth/verify         [auth]

PRODUCTS
├── GET    /api/products
├── GET    /api/products/:id
├── GET    /api/products/featured
├── GET    /api/products/search
├── POST   /api/products             [admin]
├── PUT    /api/products/:id         [admin]
└── DELETE /api/products/:id         [admin]

ORDERS
├── POST   /api/orders               [auth]
├── GET    /api/orders/my-orders     [auth]
├── GET    /api/orders/:id           [auth]
├── POST   /api/orders/:id/cancel    [auth]
├── GET    /api/orders               [admin]
└── PATCH  /api/orders/:id/status    [admin]

USERS
├── GET    /api/users                [admin]
├── GET    /api/users/:id            [admin]
├── PUT    /api/users/:id            [admin]
└── DELETE /api/users/:id            [admin]
```

## 📝 Convenciones de Código

### Nombres de Variables
```javascript
// camelCase para variables y funciones
const userName = 'John';
function getUserById(id) {}

// PascalCase para clases
class UserController {}

// UPPER_CASE para constantes
const JWT_SECRET = 'secret';
```

### Estructura de Respuestas API
```javascript
// Éxito
{
    "success": true,
    "message": "Operación exitosa",
    "data": { /* datos */ }
}

// Error
{
    "success": false,
    "message": "Descripción del error",
    "error": "Detalles técnicos"
}
```

### Manejo de Errores
```javascript
try {
    const result = await operation();
    res.json({ success: true, data: result });
} catch (error) {
    console.error('Error en operación:', error);
    res.status(500).json({
        success: false,
        message: 'Error en operación',
        error: error.message
    });
}
```

## 🔮 Roadmap Futuro

### Corto Plazo (1-3 meses)
- [ ] Tests automatizados (Jest)
- [ ] Documentación API (Swagger)
- [ ] Rate limiting
- [ ] Refresh tokens

### Medio Plazo (3-6 meses)
- [ ] Migración a PostgreSQL
- [ ] Caché con Redis
- [ ] WebSockets para notificaciones
- [ ] Panel de analytics avanzado

### Largo Plazo (6+ meses)
- [ ] Microservicios
- [ ] GraphQL API
- [ ] Machine Learning (recomendaciones)
- [ ] App móvil nativa

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Mantenedores:** Apexremedy Team