# ⚡ Quick Start - Apexremedy

## 🚀 Inicio en 5 Minutos

### 1. Clonar y Setup (2 min)

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/apexremedy.git
cd apexremedy

# Setup backend
cd backend
npm install
cp .env.example .env

# Inicializar BD con datos de prueba
npm run seed
```

### 2. Iniciar Backend (1 min)

```bash
# En /backend
npm run dev

# Deberías ver:
# ✅ Base de datos lista
# ✅ Servidor corriendo en puerto 3000
```

### 3. Iniciar Frontend (1 min)

```bash
# En otra terminal, desde /frontend
# Opción 1: Con VSCode Live Server
# Click derecho en index.html → "Open with Live Server"

# Opción 2: Con Python
python -m http.server 5500

# Opción 3: Con Node
npx http-server -p 5500
```

### 4. ¡Listo! (1 min)

Abrir navegador en `http://localhost:5500`

**Credenciales de prueba:**
- Admin: `admin@apexremedy.cl` / `admin123`
- Cliente: `cliente@test.cl` / `test123`

---

## 📋 Comandos Útiles

### Backend

```bash
# Desarrollo (auto-reload)
npm run dev

# Producción
npm start

# Poblar BD
npm run seed

# CLI Admin
node scripts/cli.js

# Tests (cuando estén implementados)
npm test
```

### Base de Datos

```bash
# Ver estructura
sqlite3 database/apexremedy.db ".schema"

# Ver usuarios
sqlite3 database/apexremedy.db "SELECT * FROM users;"

# Ver productos
sqlite3 database/apexremedy.db "SELECT id, name, price, stock FROM products;"

# Backup
cp database/apexremedy.db database/backup_$(date +%Y%m%d).db

# Resetear
rm database/apexremedy.db
npm run seed
```

### Testing API con cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Obtener productos
curl http://localhost:3000/api/products

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@test.cl","password":"test123"}'

# Crear producto (requiere token admin)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "name": "Nuevo Producto",
    "description": "Descripción",
    "price": 25000,
    "stock": 10,
    "category": "Sativa"
  }'
```

---

## 🐛 Troubleshooting

### ❌ Error: Puerto 3000 ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
# o en Windows
netstat -ano | findstr :3000

# Matar proceso
kill -9 PID

# O cambiar puerto en .env
PORT=3001
```

### ❌ Error: CORS Policy

**Problema:** Frontend no puede conectar con backend

**Solución:**
```bash
# backend/.env
FRONTEND_URL=http://localhost:5500

# Reiniciar servidor
npm run dev
```

### ❌ Error: Database locked

**Problema:** Múltiples procesos accediendo a SQLite

**Solución:**
```bash
# Cerrar todos los procesos node
killall node

# O en Windows
taskkill /F /IM node.exe

# Reiniciar
npm run dev
```

### ❌ Error: Token inválido/expirado

**Solución en Frontend:**
```javascript
// En consola del navegador
localStorage.clear();
// Recargar página y volver a loguearse
```

### ❌ Error: Cannot find module

**Solución:**
```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### ❌ Error: SQLite version incompatible

**Solución:**
```bash
# Rebuild sqlite3
npm rebuild sqlite3

# O reinstalar
npm uninstall sqlite3
npm install sqlite3
```

---

## 🔧 Configuración Avanzada

### Cambiar Puerto del Backend

```bash
# backend/.env
PORT=8080
```

### Cambiar Tiempo de Expiración del JWT

```bash
# backend/.env
JWT_EXPIRES_IN=30d  # 30 días
# o
JWT_EXPIRES_IN=24h  # 24 horas
```

### Habilitar Modo Debug

```bash
# backend/.env
NODE_ENV=development
DEBUG=*
```

### Configurar HTTPS (Producción)

```javascript
// backend/src/server.js
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('path/to/private.key'),
    cert: fs.readFileSync('path/to/certificate.crt')
};

https.createServer(options, app).listen(443);
```

---

## 📊 Monitoreo en Desarrollo

### Ver Logs en Tiempo Real

```bash
# Backend logs
npm run dev

# Ver todas las peticiones HTTP
# Morgan mostrará automáticamente:
# GET /api/products 200 45ms
# POST /api/orders 201 125ms
```

### Inspeccionar Base de Datos

```bash
# Abrir SQLite CLI
sqlite3 database/apexremedy.db

# Comandos útiles:
.tables                    # Listar tablas
.schema users              # Ver estructura de tabla
SELECT * FROM products;    # Query normal
.exit                      # Salir
```

### Monitor de Performance

```javascript
// En el navegador (consola)
performance.mark('start');
await api.getProducts();
performance.mark('end');
performance.measure('productos', 'start', 'end');
console.log(performance.getEntriesByName('productos')[0].duration);
```

---

## 🎯 Tareas Comunes

### Crear Nuevo Usuario Admin

```bash
# Opción 1: Con CLI
node scripts/cli.js
# Seleccionar opción 1

# Opción 2: Con cURL
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Admin",
    "email": "admin2@apexremedy.cl",
    "password": "admin123",
    "phone": "+56912345678"
  }'

# Luego actualizar rol en BD:
sqlite3 database/apexremedy.db "UPDATE users SET role='admin' WHERE email='admin2@apexremedy.cl';"
```

### Agregar Producto Rápido

```javascript
// En consola del navegador (como admin)
const token = localStorage.getItem('authToken');
const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        name: 'Producto Test',
        description: 'Descripción del producto',
        price: 25000,
        stock: 10,
        category: 'Sativa',
        featured: false
    })
});
const data = await response.json();
console.log(data);
```

### Ver Estadísticas

```javascript
// Como admin en la consola
const stats = await api.getOrderStats();
console.table(stats.data.byStatus);

const productStats = await api.getProductStats();
console.log('Total productos:', productStats.data.total);
console.log('Stock bajo:', productStats.data.lowStock);
```

### Resetear Contraseña de Usuario

```bash
# En SQLite
sqlite3 database/apexremedy.db

# Generar hash bcrypt de nueva contraseña (usa Node)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('nuevapass123', 10, (err, hash) => console.log(hash));"

# Actualizar en BD
UPDATE users SET password='HASH_GENERADO' WHERE email='usuario@email.com';
```

---

## 🧪 Testing Manual

### Flujo Completo de Usuario

```bash
# 1. Registrarse
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","phone":"+56912345678"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Copiar el token de la respuesta

# 3. Ver productos
curl http://localhost:3000/api/products

# 4. Crear pedido
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -d '{
    "items": [{"product_id": 1, "quantity": 2}],
    "customer_name": "Test User",
    "customer_email": "test@test.com",
    "customer_phone": "+56912345678"
  }'

# 5. Ver mis pedidos
curl http://localhost:3000/api/orders/my-orders \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## 📱 Acceder desde Otros Dispositivos

### En la Misma Red Local

```bash
# 1. Obtener tu IP local
# En Mac/Linux:
ifconfig | grep "inet "
# En Windows:
ipconfig

# 2. Actualizar CORS en backend/.env
FRONTEND_URL=http://TU_IP:5500

# 3. Reiniciar backend
npm run dev

# 4. Acceder desde otro dispositivo
# http://TU_IP:5500
```

---

## 🎨 Personalización Rápida

### Cambiar Logo y Nombre

```javascript
// frontend/js/js_header.js y js_footer.js
// Buscar y reemplazar:
<span>Apexremedy</span>
// Por:
<span>Tu Nombre</span>

// CSS: frontend/style/css_home.css
// Buscar variables de color en :root
--primary-green: #tu-color;
--accent-yellow: #tu-color;
```

### Agregar Nueva Categoría de Productos

```javascript
// backend/src/middleware/validation.js
// Agregar en productValidation.create:
.isIn(['Indoor', 'Sativa', 'Índica', 'Híbrido', 'Aceites', 'Comestibles', 'TU_NUEVA_CATEGORIA'])

// frontend/shop.html y articulos.html
// Agregar opción en el select:
<option value="TU_NUEVA_CATEGORIA">Tu Nueva Categoría</option>
```

### Cambiar Moneda

```javascript
// backend/src/controllers/orderController.js
// Actualizar cálculo de impuestos:
const tax = Math.round(subtotal * 0.XX); // Tu tasa de impuesto

// frontend/js/js_global.js
// Buscar formatPrice() y actualizar:
formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP' // Cambiar a USD, EUR, etc.
    }).format(price);
}
```

---

## 📦 Deployment Checklist

### Pre-Despliegue

- [ ] Cambiar JWT_SECRET a valor aleatorio seguro
- [ ] NODE_ENV=production en .env
- [ ] Actualizar FRONTEND_URL a dominio real
- [ ] Revisar logs y eliminar console.log innecesarios
- [ ] Probar todos los flujos críticos
- [ ] Hacer backup de base de datos
- [ ] Documentar credenciales de admin

### Post-Despliegue

- [ ] Verificar HTTPS funcionando
- [ ] Probar registro de usuario
- [ ] Probar creación de pedido
- [ ] Verificar emails/notificaciones (si implementados)
- [ ] Monitorear logs por 24h
- [ ] Configurar backups automáticos
- [ ] Documentar procedimientos de rollback

---

## 🔥 Comandos de Emergencia

### Backend Bloqueado

```bash
# Kill all node processes
killall -9 node

# O más seguro
ps aux | grep node
kill -9 PID_DEL_PROCESO
```

### Base de Datos Corrupta

```bash
# Verificar integridad
sqlite3 database/apexremedy.db "PRAGMA integrity_check;"

# Si está corrupta, restaurar backup
cp database/backup_FECHA.db database/apexremedy.db

# Si no hay backup, recrear
rm database/apexremedy.db
npm run seed
```

### Restaurar a Estado Inicial

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json database/apexremedy.db
npm install
npm run seed

# Frontend
cd frontend
# Limpiar localStorage en navegador
localStorage.clear();
```

### Error: Puerto en Uso

```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 PID

# O cambiar puerto
# En .env: PORT=3001
```

---

## 🎓 Recursos para Aprender

### Tutoriales Recomendados

1. **Express.js**: https://expressjs.com/en/starter/installing.html
2. **SQLite**: https://www.sqlitetutorial.net/
3. **JWT**: https://jwt.io/introduction
4. **REST APIs**: https://restfulapi.net/
5. **JavaScript Async/Await**: https://javascript.info/async-await

### Videos Útiles

- Node.js Crash Course
- Express.js API Development
- SQLite Database Tutorial
- JWT Authentication Explained

---

## 💡 Tips y Trucos

### Desarrollo Más Rápido

```bash
# Usar nodemon para auto-reload
npm install -g nodemon
nodemon src/server.js

# Usar extensiones de VSCode
# - REST Client (probar API sin Postman)
# - SQLite Viewer (ver BD en VSCode)
# - Thunder Client (cliente HTTP integrado)
```

### Debug en VSCode

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Backend",
            "program": "${workspaceFolder}/backend/src/server.js",
            "envFile": "${workspaceFolder}/backend/.env"
        }
    ]
}
```

### Shortcuts útiles

```bash
# Ver logs en tiempo real con colores
npm run dev | grep --color=always "Error\|POST\|GET"

# Contar usuarios en BD
sqlite3 database/apexremedy.db "SELECT COUNT(*) FROM users;"

# Ver últimos pedidos
sqlite3 database/apexremedy.db "SELECT id, customer_name, total, status FROM orders ORDER BY created_at DESC LIMIT 5;"

# Exportar datos a CSV
sqlite3 -header -csv database/apexremedy.db "SELECT * FROM products;" > products.csv
```

---

## 🚨 Problemas Conocidos

### Issue #1: Token expirado después de 7 días

**Solución temporal:**
```bash
# Aumentar tiempo de expiración
# backend/.env
JWT_EXPIRES_IN=30d
```

**Solución permanente:**
- Implementar refresh tokens

### Issue #2: Imágenes no cargan

**Causa:** URLs de Unsplash pueden cambiar

**Solución:**
```javascript
// Usar imágenes locales
// Guardar en frontend/images/
// Actualizar en seed.js:
image: '/images/producto1.jpg'
```

### Issue #3: CORS en producción

**Solución:**
```javascript
// backend/src/server.js
app.use(cors({
    origin: [
        'http://localhost:5500',
        'https://tudominio.com',
        'https://www.tudominio.com'
    ],
    credentials: true
}));
```

---

## 📞 Soporte y Ayuda

### Documentación

- **README.md** - Información general
- **ARCHITECTURE.md** - Documentación técnica
- **MIGRATION.md** - Guía de migración
- **Este archivo** - Quick start y troubleshooting

### Comunidad

- GitHub Issues: Reportar bugs
- Discussions: Hacer preguntas
- Wiki: Documentación adicional

### Contacto

- Email: soporte@apexremedy.cl
- Discord: [Enlace al servidor]
- Twitter: @apexremedy

---

## ✅ Checklist de Verificación

### Después de Instalación

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend accesible en puerto 5500
- [ ] Puede ver productos en la página principal
- [ ] Puede registrar nuevo usuario
- [ ] Puede hacer login
- [ ] Puede agregar productos al carrito
- [ ] Puede crear pedido
- [ ] Panel admin accesible con credenciales correctas
- [ ] Puede crear/editar/eliminar productos (admin)
- [ ] Base de datos con datos de prueba

### Antes de Desarrollo

- [ ] Git configurado
- [ ] .env personalizado
- [ ] Credenciales de admin cambiadas
- [ ] Puerto 3000 libre
- [ ] Node.js 16+ instalado
- [ ] Editor de código configurado

### Antes de Producción

- [ ] Variables de entorno de producción
- [ ] JWT_SECRET único y seguro
- [ ] CORS correctamente configurado
- [ ] HTTPS habilitado
- [ ] Backups automáticos configurados
- [ ] Logs de producción configurados
- [ ] Rate limiting implementado
- [ ] Monitoring habilitado

---

## 🎉 ¡Estás Listo!

Si completaste el Quick Start, ya tienes:

✅ Backend funcionando con SQLite  
✅ API REST completa y documentada  
✅ Frontend integrado con el backend  
✅ Sistema de autenticación con JWT  
✅ Panel administrativo funcional  
✅ Base de datos con datos de prueba  

### Próximos Pasos

1. **Explora el código** - Familiarízate con la estructura
2. **Personaliza el diseño** - Adapta colores y textos
3. **Agrega funcionalidades** - Sigue la arquitectura existente
4. **Despliega** - Usa Heroku, DigitalOcean, o AWS
5. **Escala** - Migra a PostgreSQL cuando sea necesario

---

**¿Problemas?** Revisa la sección de Troubleshooting o consulta ARCHITECTURE.md para entender mejor el sistema.

**¿Sugerencias?** Abre un issue en GitHub o contribuye con un PR.

**¡Happy Coding!** 🚀