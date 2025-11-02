# 📚 Documentación Completa del Proyecto Apexremedy

**Versión:** 2.0  
**Última actualización:** Enero 2025  
**Propósito:** Documentación unificada para LLMs y desarrolladores sobre la lógica, arquitectura y funcionamiento del sistema.

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [API Estática (Producción)](#api-estática-producción)
4. [Autenticación](#autenticación)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Configuración de Entornos](#configuración-de-entornos)
7. [Flujos de Datos Principales](#flujos-de-datos-principales)
8. [GitHub Actions y Despliegue](#github-actions-y-despliegue)
9. [Base de Datos](#base-de-datos)
10. [Seguridad](#seguridad)
11. [Troubleshooting](#troubleshooting)
12. [Comandos Útiles](#comandos-útiles)

---

## 🎯 Visión General

### Descripción
Apexremedy es una plataforma de e-commerce especializada con sistema de administración integrado, diseñada para funcionar en **dos modos**:

1. **Modo Desarrollo**: Frontend + Backend dinámico (Node.js/Express)
2. **Modo Producción**: Frontend estático (GitHub Pages) + API estática (JSON)

### Características Principales

- ✅ **Frontend**: Interfaz responsive con Tailwind CSS
- ✅ **Backend**: API REST con Node.js/Express (opcional en producción)
- ✅ **Base de Datos**: SQLite con arquitectura modular (migrable a PostgreSQL/MySQL)
- ✅ **Autenticación**: JWT dinámico o estático (según entorno)
- ✅ **API Estática**: JSON generados en build-time para producción
- ✅ **Panel de Administración**: Gestión completa de productos, usuarios y pedidos
- ✅ **Carrito de Compras**: Gestión local y persistente
- ✅ **Productos Medicinales**: Sistema de permisos basado en autenticación

### URL de Producción
- Frontend: `https://fcp4891.github.io/apexremedy.github.io/frontend/index.html`

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA Estático)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  index.html  │  │  tienda.html  │  │  admin/      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  API Client   │                           │
│                    │ (apiClient.js)│                           │
│                    │               │                           │
│                    │ [Modo Auto-   │                           │
│                    │  Detección]   │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼──────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼──────┐        ┌────────▼─────────┐
        │ Producción    │        │  Desarrollo      │
        │ (GitHub Pages)│        │  (Backend API)   │
        │              │        │                  │
        │ JSON Estático │        │  ┌──────────────▼──┐
        │ - products.json│        │  │ Backend Express │
        │ - users.json   │        │  │  API REST       │
        │ - orders.json  │        │  └──────────┬─────┘
        └───────────────┘        │             │
                                 │  ┌──────────▼─────┐
                                 │  │ SQLite Database│
                                 │  │ (apexremedy.db)│
                                 │  └────────────────┘
                                 └─────────────────────
```

### Principios de Diseño

1. **Separación de Responsabilidades**
   - Frontend: Presentación y UX
   - API Client: Comunicación HTTP / Carga de JSON
   - Routes: Enrutamiento de peticiones
   - Controllers: Lógica de negocio
   - Models: Acceso a datos
   - Database Layer: Abstracción de BD

2. **Arquitectura de Capas**
   ```
   Presentation → Business Logic → Data Access → Database
   ```

3. **Modularidad**
   - Cambio fácil de base de datos
   - Componentes reutilizables
   - Testing independiente por capa

4. **Seguridad por Capas**
   ```
   JWT Auth → Route Guards → Input Validation → SQL Safe Queries
   ```

---

## 📡 API Estática (Producción)

### Descripción
Sistema de API estática generada en build-time mediante GitHub Actions. Los datos se exportan desde SQLite a archivos JSON que se publican en GitHub Pages.

### Archivos JSON Generados

```
frontend/api/
├── products.json              # Todos los productos
├── products-featured.json      # Productos destacados
├── users.json                  # Usuarios (con password_hash)
└── orders.json                 # Todos los pedidos
```

### Cómo Funciona

#### 1. Scripts de Exportación

**`backend/scripts/export-products-to-json.js`**
- Se conecta a SQLite
- Exporta todos los productos con imágenes
- Genera `products.json`, `products-featured.json`

**`backend/scripts/export-users-to-json.js`**
- Exporta usuarios incluyendo `password_hash`
- Calcula `account_status` basado en `is_verified` e `is_active`
- Genera `users.json`

**`backend/scripts/export-orders-to-json.js`**
- Exporta pedidos con items asociados
- Incluye información de clientes
- Genera `orders.json`

#### 2. Cliente API (`frontend/js/api/apiClient.js`)

El cliente API implementa **fallback inteligente**:

```javascript
// Prioridad de carga de datos:
1. Intenta cargar JSON estático desde /api/*.json
2. Si falla Y hay backend configurado → Intenta API dinámica
3. Si ambos fallan → Usa JSON estático como último recurso
```

**Métodos principales:**
- `loadStaticJSON(filename)`: Carga JSON desde `/api/`
- `getProducts()`: Prioriza JSON estático, fallback a API dinámica
- `getAllOrders()`: Filtrado cliente-side para clientes (`customer_id`, `status`, `date_from`, `date_to`)
- `getCategories()`: Extrae categorías de `products.json`, maneja strings u objetos
- `loginStatic()`: Autenticación contra `users.json`
- `comparePassword()`: Soporta bcrypt (con `bcryptjs` CDN) y SHA-256
- `isBcryptHash()`: Detecta tipo de hash automáticamente

#### 3. GitHub Actions (`.github/workflows/pages.yml`)

El workflow ejecuta automáticamente en cada push a `main`:

1. Instala dependencias del backend
2. Verifica existencia de base de datos
3. Exporta productos → `frontend/api/products.json`
4. Exporta usuarios → `frontend/api/users.json`
5. Exporta pedidos → `frontend/api/orders.json`
6. Verifica que los JSON se generaron correctamente
7. Publica frontend en GitHub Pages

### Ventajas

- ✅ **Simple**: No requiere backend activo para visualizar productos
- ✅ **Rápido**: JSON servidos desde GitHub Pages (CDN)
- ✅ **Automático**: Se actualiza en cada push
- ✅ **Fallback**: Si el JSON falla, intenta con API dinámica

### Limitaciones

- ❌ **No tiempo real**: Datos actualizados solo en build-time
- ❌ **Solo lectura**: No permite crear/actualizar desde frontend
- ❌ **Requiere DB**: Script necesita acceso a SQLite en GitHub Actions

---

## 🔐 Autenticación

### Sistema Dual: Dinámico vs Estático

#### Modo Desarrollo (Dinámico)
- Usa backend Express
- JWT generado por servidor
- Validación con bcrypt en servidor
- Token almacenado en `localStorage`

#### Modo Producción (Estático)
- Usa `users.json` estático
- Token simple generado en cliente
- Validación con `bcryptjs` (CDN) o SHA-256 en cliente
- Token almacenado en `localStorage`

### Autenticación Estática (`loginStatic`)

**Ubicación:** `frontend/js/api/apiClient.js`

**Flujo:**
1. Carga `users.json` desde `/api/users.json`
2. Busca usuario por email
3. Compara contraseña usando `comparePassword()`:
   - Detecta si es hash bcrypt (inicia con `$2`)
   - Si es bcrypt: usa `bcryptjs.compareSync()` (CDN)
   - Si es SHA-256: calcula hash y compara
   - Parche temporal: si bcryptjs no está disponible, compara primeros 10 caracteres
4. Verifica `account_status`:
   - `approved`: Permite login
   - `pending`: Bloquea con mensaje específico
   - `rejected`: Bloquea con `rejection_reason`
5. Genera token simple en cliente
6. Retorna token y datos de usuario

**Código clave:**
```javascript
async loginStatic(credentials) {
    const usersData = await this.loadStaticJSON('users.json');
    const user = users.find(u => u.email === email.toLowerCase());
    const passwordMatch = await this.comparePassword(password, user.password_hash);
    
    // Validar account_status
    if (accountStatus === 'pending') {
        return { success: false, message: 'Cuenta pendiente...', account_status: 'pending' };
    }
    
    const token = this.generateSimpleToken(user);
    return { success: true, data: { token, user } };
}
```

### Estados de Cuenta (`account_status`)

El sistema maneja tres estados:

1. **`approved`**: Usuario verificado y activo → Puede hacer login
2. **`pending`**: Usuario no verificado → Bloqueado con mensaje
3. **`rejected`**: Usuario rechazado → Bloqueado con `rejection_reason`

**Cálculo automático:**
```javascript
if (is_verified && is_active) account_status = 'approved';
else if (!is_active && !is_verified) account_status = 'rejected';
else account_status = 'pending';
```

### Password Hashing

El sistema soporta **dos tipos de hash**:

1. **bcrypt** (recomendado):
   - Formato: `$2b$10$...`
   - Verificación: `bcryptjs.compareSync(password, hash)`
   - Usado en: Backend dinámico, usuarios nuevos

2. **SHA-256** (legacy):
   - Formato: 64 caracteres hexadecimales
   - Verificación: `crypto.createHash('sha256').update(password).digest('hex')`
   - Usado en: Usuarios seed iniciales

**Detección automática:**
```javascript
isBcryptHash(hash) {
    return hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$'));
}
```

### Token JWT Simple (Estático)

Cuando no hay backend, se genera un token simple en cliente:

```javascript
generateSimpleToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        account_status: user.account_status
    };
    return btoa(JSON.stringify(payload)); // Base64 simple (NO seguro, solo para desarrollo)
}
```

**⚠️ Nota:** Este token NO es seguro para producción real. Es solo para desarrollo/testing.

---

## 📁 Estructura del Proyecto

### Directorio Raíz

```
apexremedy_v2.github.io/
├── frontend/                    # Frontend estático (GitHub Pages)
│   ├── index.html               # Página principal (customer)
│   ├── tienda.html              # Catálogo de productos
│   ├── login.html               # Login/Registro
│   ├── mis-pedidos.html         # Pedidos del cliente
│   ├── carrito.html             # Carrito de compras
│   ├── checkout.html            # Checkout
│   ├── admin/                   # Panel de administración
│   │   ├── index.html           # Dashboard admin
│   │   ├── products.html        # Gestión de productos
│   │   └── orders.html          # Gestión de pedidos
│   ├── components/              # Componentes reutilizables
│   │   ├── header-customer.html
│   │   ├── footer-customer.html
│   │   ├── header.html          # Header admin
│   │   └── footer.html          # Footer admin
│   ├── js/                      # Scripts JavaScript
│   │   ├── config.js            # Configuración (entornos)
│   │   ├── basePath.js          # Cálculo de rutas base (GitHub Pages)
│   │   ├── auth.js              # Gestión de autenticación
│   │   ├── template.js          # Inyección de header/footer
│   │   ├── carrito.js           # Lógica del carrito
│   │   ├── api/
│   │   │   └── apiClient.js     # Cliente API (dual: JSON/HTTP)
│   │   ├── admin/
│   │   │   ├── admin-products.js
│   │   │   └── api/
│   │   │       └── apiClient.js # API Client para admin
│   │   └── sessionManager.js   # Gestión de inactividad
│   ├── style/
│   │   └── css_home.css        # Estilos principales
│   └── api/                     # API Estática (JSON)
│       ├── products.json
│       ├── products-featured.json
│       ├── users.json
│       └── orders.json
│
├── backend/                     # Backend Node.js/Express
│   ├── src/
│   │   ├── server.js            # Servidor principal
│   │   ├── config/
│   │   │   └── database.js      # Configuración BD
│   │   ├── models/              # Modelos de datos
│   │   │   ├── index.js         # BaseModel
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   └── Order.js
│   │   ├── controllers/         # Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── orderController.js
│   │   │   └── userController.js
│   │   ├── routes/              # Rutas API
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   └── users.js
│   │   └── middleware/          # Middleware
│   │       ├── auth.js           # JWT authentication
│   │       └── validation.js     # Validación de datos
│   ├── database/
│   │   ├── apexremedy.db        # Base de datos SQLite
│   │   └── seeds/
│   │       ├── seed.js           # Seed principal
│   │       └── seed_users.js     # Seed de usuarios
│   ├── scripts/                 # Scripts de exportación
│   │   ├── export-products-to-json.js
│   │   ├── export-users-to-json.js
│   │   └── export-orders-to-json.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── pages.yml            # GitHub Actions para deploy
│
└── PROJECT_DOCUMENTATION.md     # Este archivo
```

### Archivos Clave

#### Frontend

- **`frontend/js/config.js`**: Configuración de entornos, URLs de API (PRODUCTION_API_URL puede ser null)
- **`frontend/js/basePath.js`**: Cálculo de rutas base para GitHub Pages (incluye username en path)
- **`frontend/js/api/apiClient.js`**: Cliente API con soporte dual (JSON/HTTP), login estático
- **`frontend/js/auth.js`**: Gestión de autenticación, tokens, UI updates, manejo de `account_status`
- **`frontend/js/template.js`**: Inyección de header/footer, prevención de flickering (caching de templates)
- **`frontend/js/carrito.js`**: Lógica del carrito, actualización de sidebar modal
- **`frontend/js/sessionManager.js`**: Gestión de inactividad, modales de advertencia, cierre con ESC

#### Backend

- **`backend/src/server.js`**: Servidor Express principal
- **`backend/src/config/database.js`**: Configuración y conexión a BD
- **`backend/src/models/User.js`**: Modelo de usuarios con auth
- **`backend/src/middleware/auth.js`**: Middleware JWT

---

## ⚙️ Configuración de Entornos

### Detección Automática

El sistema detecta automáticamente el entorno:

```javascript
const isProduction = window.location.hostname.includes('github.io') || 
                    (window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1');
```

### Variables de Configuración

**`frontend/js/config.js`:**
```javascript
const PRODUCTION_API_URL = 'https://tu-backend-en-produccion.com/api'; // ⚠️ CAMBIAR ESTA URL

const CONFIG = {
    API_BASE_URL: isProduction 
        ? PRODUCTION_API_URL  // Si es null en apiClient.js, se usa solo API estática
        : 'http://localhost:3000/api',
    
    APP_NAME: 'Apexremedy',
    PRODUCTS_PER_PAGE: 12,
    TAX_RATE: 0.19,  // 19% IVA
    // ...
};
```

**`frontend/js/api/apiClient.js`:**
```javascript
const PRODUCTION_API_URL = null; // ⚠️ null = solo API estática en producción (actual)
// Para usar backend en producción, cambiar a: 'https://tu-backend.com/api'

// Si es null, el sistema usará:
// - JSON estáticos para productos/orders
// - loginStatic() para autenticación
```

### Configurar Backend en Producción

Si deseas usar backend dinámico en producción:

1. Despliega backend (Heroku, Railway, Render, etc.)
2. Actualiza `PRODUCTION_API_URL` en `apiClient.js` y `config.js`
3. Configura CORS en backend para `*.github.io`

---

## 🔄 Flujos de Datos Principales

### 1. Carga de Productos

```
Usuario visita tienda.html
    ↓
productManager.getProducts()
    ↓
api.getProducts()
    ↓
[Modo Producción]
    ├─→ loadStaticJSON('products.json')
    │   └─→ fetch('/api/products.json')
    │       └─→ Retorna productos
    │
[Modo Desarrollo]
    └─→ request('/products')
        └─→ Backend Express
            └─→ Product.findAll()
                └─→ SQLite query
                    └─→ Retorna productos
```

### 2. Login

```
Usuario ingresa credenciales en login.html
    ↓
authManager.login(email, password)
    ↓
api.login({ email, password })
    ↓
[Modo Producción - Sin Backend]
    ├─→ api.loginStatic(credentials)
    │   ├─→ loadStaticJSON('users.json')
    │   ├─→ Buscar usuario por email
    │   ├─→ comparePassword(password, user.password_hash)
    │   │   ├─→ Si bcrypt: bcryptjs.compareSync()
    │   │   └─→ Si SHA-256: hash y compara
    │   ├─→ Validar account_status
    │   ├─→ generateSimpleToken(user)
    │   └─→ Retornar token + user
    │
[Modo Desarrollo]
    └─→ request('/auth/login')
        └─→ Backend Express
            └─→ authController.login()
                ├─→ User.findByEmail()
                ├─→ Validar password (bcrypt/SHA-256)
                ├─→ Validar account_status
                ├─→ jwt.sign() (token real)
                └─→ Retornar token + user
    ↓
authManager.setToken(token)
    ↓
localStorage.setItem('authToken', token)
    ↓
updateAuthUI() → Muestra menú según rol
    ↓
Redirigir a perfil.html o admin/perfil.html
```

### 3. Ver Pedidos (Cliente)

```
Usuario visita mis-pedidos.html
    ↓
authManager.getCurrentUser() → Obtener ID
    ↓
api.getAllOrders({ customer_id: user.id })
    ↓
[Modo Producción]
    ├─→ loadStaticJSON('orders.json')
    │   └─→ Filtrar por customer_id (cliente-side)
    │       └─→ Retornar pedidos del cliente
    │
[Modo Desarrollo]
    └─→ request('/orders?customer_id=X')
        └─→ Backend Express
            └─→ orderController.getAll()
                └─→ Order.findAllWithFilters()
                    └─→ WHERE customer_id = X
                        └─→ Retornar pedidos
```

### 4. Agregar Producto al Carrito

```
Usuario hace click en "Agregar al Carrito"
    ↓
cart.addItem(productId, quantity)
    ↓
Validar stock (opcional, puede ser async)
    ↓
Agregar a cart.items[] (array local)
    ↓
cart.saveToStorage()
    ↓
localStorage.setItem('cart', JSON.stringify(cart.items))
    ↓
cart.updateUI()
    ├─→ updateCartCount() → Actualizar badge
    └─→ updateCartSidebar() → Mostrar items en modal
    ↓
showAddToCartNotification()
    └─→ notify.success() → Notificación personalizada
```

### 5. Crear Pedido

```
Usuario hace click en "Proceder al Checkout"
    ↓
Verificar autenticación
    ├─→ Si no autenticado: Redirigir a login
    └─→ Si autenticado: Continuar
    ↓
checkout.html → Formulario de datos
    ↓
api.createOrder(orderData)
    ↓
[Modo Producción]
    └─→ Error: "Backend no configurado"
        └─→ Mostrar mensaje: "Solo lectura en producción"
    │
[Modo Desarrollo]
    └─→ request('/orders', { method: 'POST', body: orderData })
        └─→ Backend Express
            └─→ orderController.create()
                ├─→ Validar stock
                ├─→ Calcular subtotal, tax, total
                ├─→ Order.createWithItems() (transacción)
                │   ├─→ INSERT INTO orders
                │   ├─→ INSERT INTO order_items (para cada item)
                │   └─→ UPDATE products (decrementar stock)
                └─→ Retornar pedido creado
    ↓
Limpiar carrito
    ↓
Redirigir a mis-pedidos.html
```

---

## 🚀 GitHub Actions y Despliegue

### Workflow: `.github/workflows/pages.yml`

**Trigger:** Push a `main` o `workflow_dispatch`

**Pasos:**

1. **Checkout**: Obtiene código del repositorio
2. **Setup Node.js**: Instala Node.js 18
3. **Install dependencies**: Instala dependencias del backend
4. **Check database**: Verifica existencia de `apexremedy.db`
5. **Export products**: Ejecuta `export-products-to-json.js`
6. **Export users**: Ejecuta `export-users-to-json.js`
7. **Export orders**: Ejecuta `export-orders-to-json.js`
8. **Verify JSON**: Verifica que los JSON se generaron correctamente
9. **Setup Pages**: Configura GitHub Pages
10. **Upload artifact**: Sube carpeta `frontend/` como artifact
11. **Deploy**: Despliega a GitHub Pages

### Variables de Entorno (GitHub Actions)

```yaml
DB_PATH: database/apexremedy.db  # Ruta a la BD
```

### Configuración de GitHub Pages

1. Ve a **Settings** > **Pages** en el repositorio
2. En **Source**, selecciona **GitHub Actions**
3. El workflow se ejecutará automáticamente en cada push

### URL de Despliegue

```
https://fcp4891.github.io/apexremedy.github.io/frontend/index.html
```

**Nota:** La ruta incluye `/fcp4891/` y `/apexremedy.github.io/` por la estructura del repositorio.

---

## 💾 Base de Datos

### Esquema SQLite

#### Tabla: `users`

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    rut TEXT UNIQUE,
    role TEXT DEFAULT 'customer',  -- 'customer' | 'admin'
    is_verified BOOLEAN DEFAULT 0,  -- Aprobación de cuenta
    is_active BOOLEAN DEFAULT 1,    -- Cuenta activa
    account_status TEXT,           -- 'approved' | 'pending' | 'rejected'
    rejection_reason TEXT,          -- Razón de rechazo (si aplica)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

#### Tabla: `products`

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER,                 -- Precio en CLP
    stock INTEGER DEFAULT 0,
    category TEXT,                 -- Slug de categoría
    category_slug TEXT,
    image TEXT,
    featured BOOLEAN DEFAULT 0,
    is_medicinal BOOLEAN DEFAULT 0,
    attributes TEXT,               -- JSON string
    price_variants TEXT,           -- JSON string (para medicinal)
    medicinal_info TEXT,           -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `orders`

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE,
    customer_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'pending_payment',  -- pending_payment, processing, shipped, delivered, cancelled
    subtotal INTEGER,
    tax INTEGER,
    total INTEGER,
    payment_method TEXT,
    payment_status TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Tabla: `order_items`

```sql
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    product_name TEXT,
    quantity INTEGER,
    unit_price INTEGER,
    subtotal INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Productos Medicinales

Los productos medicinales tienen campos adicionales:

- **`is_medicinal`**: Boolean que indica si es medicinal
- **`price_variants`**: JSON con precios por cantidad (5g, 10g, 20g)
- **`medicinal_info`**: JSON con información adicional (THC, CBD, etc.)

**Visibilidad:**
- Solo usuarios autenticados con `account_status = 'approved'` pueden ver productos medicinales
- Los filtros en `tienda.html` ocultan categorías medicinales si no hay autenticación

---

## 🔒 Seguridad

### Autenticación

1. **Passwords**: Hasheados con bcrypt (10 rounds) o SHA-256 (legacy)
2. **JWT**: Tokens con expiración (7 días por defecto)
3. **Account Status**: Validación de aprobación antes de login

### Autorización

```javascript
// Middleware en cadena
router.post('/products', 
    authenticate,      // Verificar token
    requireAdmin,      // Verificar rol
    validation.create, // Validar datos
    controller.create  // Ejecutar
);
```

### Validación de Inputs

- express-validator en todas las rutas
- Sanitización de datos
- Prevención de SQL injection (prepared statements)

### Headers de Seguridad (helmet)

```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000
```

### CORS

```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true
}
```

---

## 🐛 Troubleshooting

### Problema: Productos no se cargan en producción

**Síntomas:** La página de productos está vacía

**Soluciones:**
1. Verificar que `frontend/api/products.json` existe
2. Revisar logs de GitHub Actions (pestaña Actions)
3. Verificar que la BD está en `backend/database/apexremedy.db`
4. Verificar que el script de exportación se ejecutó correctamente

### Problema: Login no funciona en producción

**Síntomas:** "Backend no configurado" o "Credenciales incorrectas"

**Soluciones:**
1. Verificar que `frontend/api/users.json` existe
2. Verificar que el usuario tiene `account_status: 'approved'` en el JSON
3. Verificar que `password_hash` es correcto (bcrypt o SHA-256)
4. Verificar que `bcryptjs` está cargado desde CDN en `login.html`
5. Revisar consola del navegador para errores específicos

### Problema: "Index pestañea" (flickering)

**Síntomas:** La página parpadea sin cargar

**Soluciones:**
1. Verificar que `template.js` tiene flags de inicialización
2. Verificar que `basePath.js` no actualiza elementos múltiples veces
3. Limpiar cache del navegador
4. Verificar que no hay scripts cargándose múltiples veces

### Problema: Modal de carrito ocupa toda la pantalla en móvil

**Síntomas:** El modal no respeta 80vw/80vh

**Soluciones:**
1. Verificar CSS en `css_home.css`:
   ```css
   @media (max-width: 767px) {
     .cart-sidebar {
       width: 80vw !important;
       height: 80vh !important;
       max-height: 80vh !important;
       top: 10vh !important;
     }
   }
   ```

### Problema: Categorías duplicadas en filtros

**Síntomas:** Aparecen categorías repetidas en el select

**Soluciones:**
1. Verificar que `getCategories()` retorna array único
2. Verificar que `loadCategories()` usa `Set` para evitar duplicados

---

## 🛠️ Comandos Útiles

### Desarrollo Local

```bash
# Backend
cd backend
npm install
npm run dev              # Desarrollo con auto-reload
npm run seed            # Poblar BD con datos de prueba

# Frontend
cd frontend
python -m http.server 5500    # Servidor local
# O usar Live Server en VSCode
```

### Exportar JSON Manualmente

```bash
# Desde backend/
node scripts/export-products-to-json.js
node scripts/export-users-to-json.js
node scripts/export-orders-to-json.js
```

### Base de Datos

```bash
# Ver estructura
sqlite3 database/apexremedy.db ".schema"

# Ver usuarios
sqlite3 database/apexremedy.db "SELECT id, email, role, account_status FROM users;"

# Ver productos
sqlite3 database/apexremedy.db "SELECT id, name, price, stock, category FROM products LIMIT 10;"

# Backup
cp database/apexremedy.db database/backup_$(date +%Y%m%d).db
```

### Testing API

```bash
# Health check
curl http://localhost:3000/api/health

# Obtener productos
curl http://localhost:3000/api/products

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apexremedy.cl","password":"admin123"}'
```

---

## 📝 Notas Adicionales

### Base Path para GitHub Pages

El sistema calcula automáticamente el `basePath` para GitHub Pages:

```javascript
// basePath.js
const isGitHubPages = window.location.hostname.includes('github.io');
if (isGitHubPages) {
    // Calcula: /username/repo-name/
    // Ejemplo: /fcp4891/apexremedy.github.io/
    const pathParts = window.location.pathname.split('/').filter(p => p);
    // Busca índice del repo (apexremedy.github.io)
    // Construye basePath incluyendo username (fcp4891)
    // Usa WeakSet para prevenir actualizaciones múltiples de elementos DOM
}
```

**Características:**
- Detecta automáticamente estructura de GitHub Pages
- Incluye username en la ruta base
- Previene actualizaciones múltiples con `WeakSet`
- No actualiza scripts/link tags dinámicamente (previene flickering)

### Prevención de Flickering

El sistema implementa múltiples mecanismos para prevenir flickering:

1. **Template Cache**: Cache de templates cargados
2. **Loading Flags**: Flags para prevenir carga múltiple
3. **WeakSet**: Tracking de elementos ya actualizados
4. **Init Lock**: Lock global de inicialización

### Responsive Design

- **Desktop**: Sidebar de carrito lateral (360px)
- **Mobile**: Modal de carrito (80vw x 80vh, centrado)
- **Productos**: 1 columna en móvil, 2-3 en desktop
- **Cards "Sobre Nosotros"**: Scroll horizontal en móvil

---

## 🔮 Roadmap Futuro

### Corto Plazo
- [ ] Tests automatizados (Jest)
- [ ] Documentación API (Swagger)
- [ ] Rate limiting
- [ ] Refresh tokens

### Medio Plazo
- [ ] Migración a PostgreSQL
- [ ] Caché con Redis
- [ ] WebSockets para notificaciones
- [ ] Panel de analytics avanzado

### Largo Plazo
- [ ] Microservicios
- [ ] GraphQL API
- [ ] Machine Learning (recomendaciones)
- [ ] App móvil nativa

---

## 📞 Referencias

- **README.md**: Información general y setup
- **ARCHITECTURE.md**: Arquitectura técnica detallada (legacy)
- **QUICKSTART.md**: Inicio rápido y troubleshooting (legacy)
- **API_ESTATICA.md**: Documentación de API estática (legacy)

**Nota:** Este documento (`PROJECT_DOCUMENTATION.md`) reemplaza y unifica toda la documentación anterior.

---

**Última actualización:** Enero 2025  
**Versión del documento:** 2.0  
**Mantenedores:** Apexremedy Team

