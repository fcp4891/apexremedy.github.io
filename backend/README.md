# Backend ApexRemedy – Guía Única

Guía consolidada para instalar, configurar y operar el backend del dispensario ApexRemedy. Sustituye a los documentos previos (`CONFIGURACION-ENV.md`, `ENVIRONMENT.md`, `README-ENVIRONMENT.md`, `database/ingestion/README.md`, `database/ingestion/RESUMEN-ENTORNOS.md`).  

## 🧱 Estructura Clave

```
backend/
├── src/                 # Código del servidor Express
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── ingestion/
├── scripts/             # Utilidades CLI
├── tests/
├── env.local.txt        # Template .env local
├── env.production.txt   # Template producción
└── README.md            # (este archivo)
```

## ⚙️ Requisitos

- Node.js ≥ 16  
- npm ≥ 8  
- SQLite (incluido con `sqlite3`)
- PostgreSQL sólo si se usará en producción

Instalar dependencias:
```bash
cd backend
npm install
```

## 🌐 Entornos Soportados

| Entorno        | Frontend detecta…                               | Backend usa…                     | Fuente de datos                |
|----------------|--------------------------------------------------|----------------------------------|--------------------------------|
| **Local**      | `localhost`, `127.0.0.1` o `file://`             | `.env` con `DB_TYPE=sqlite`      | `backend/database/apexremedy.db` |
| **GitHub Pages** | `hostname.includes('github.io')`               | No aplica (frontend solo)        | `frontend/api/*.json`          |
| **Producción** | Cualquier otro dominio                           | Variables de entorno del servidor | Servidor PostgreSQL            |

### Creación de `.env` local
```powershell
cd backend
Copy-Item env.local.txt .env    # Windows PowerShell
```
Contenido recomendado:
```env
NODE_ENV=development
DB_TYPE=sqlite
DB_PATH=database/apexremedy.db
PORT=3000
FRONTEND_URL=http://localhost:5500
JWT_SECRET=tu_secreto_local
```

### Variables de entorno producción
```env
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=tu-servidor-postgres.com
DB_PORT=5432
DB_NAME=apexremedy
DB_USER=apexremedy_user
DB_PASSWORD=su_password_seguro
DB_SSL=true
```
Configúralas directamente en tu plataforma (Render, Railway, Heroku, etc.).

### GitHub Pages
No requiere `.env`. El frontend usa los JSON estáticos generados en `frontend/api/`.

## 🧭 Detección Automática

- **Frontend** (`env-detector.js`) decide si usa API o JSON según hostname, mostrando un banner en la consola del navegador con el entorno detectado.
- **Backend** elige adaptador (`SQLiteAdapter` o `PostgreSQLAdapter`) según `DB_TYPE` cuando se inicia `src/server.js`.

Ver estado actual:
```bash
node backend/scripts/show-environment.js
```

## 🗄️ Base de Datos

### Ejecutar migraciones
```bash
node backend/database/migrations/create_tables.js
```
Esto crea/actualiza más de 70 tablas, vistas, triggers y datos paramétricos iniciales. El módulo `domains/users.js` maneja la lógica incremental para la tabla `users`.

### Semillas
`seed-all.js` orquesta los seeders mediante un pipeline declarativo.

```bash
# Ejecutar todo
node backend/database/seeders/seed-all.js

# Filtrar por dataset: parametric | demo | test | analytics (puedes combinar con coma)
node backend/database/seeders/seed-all.js --dataset=parametric

# Opciones útiles
--force                  # fuerza actualizaciones
--skip-<sección>         # omite pasos específicos (ej. --skip-payments)
--payment-count=150      # tamaño dataset de pagos demo
--analytics-days=90      # historial a generar para analytics
```

### Verificar estado de BD (`db:check`)
Script nuevo que valida tablas críticas, roles, proveedores y datos mínimos.
```bash
npm run db:check            # desde la raíz del repo
# o dentro de backend/
npm run db:check --prefix backend
```
Muestra un resumen con ✅/⚠️/❌ e informa si se detecta un usuario administrador.

## 📦 Sistema de Ingesta Unificado
Archivo principal: `backend/database/ingestion/ingest-products.js`

```bash
# JSON para GitHub Pages
node backend/database/ingestion/ingest-products.js --mode=json

# SQLite local (opcional --force sobrescribe datos)
node backend/database/ingestion/ingest-products.js --mode=sqlite --force

# PostgreSQL producción (requiere variables de entorno)
node backend/database/ingestion/ingest-products.js --mode=postgres --force

# Filtros adicionales
--category=slug-especifico
```
Archivos generados en modo JSON:
- `frontend/api/products.json`
- `frontend/api/products-featured.json`
- `frontend/api/products-by-category.json`

Fuente de datos compartida: `backend/database/seeders/data/products-data.js`

## 🚀 Flujo recomendado (desarrollo)

1. Clonar repositorio e instalar dependencias (`npm install` en `backend`).
2. Crear `.env` local copiando `env.local.txt`.
3. Correr migraciones: `node database/migrations/create_tables.js`.
4. Sembrar datos paramétricos/demo: `node database/seeders/seed-all.js --dataset=parametric,demo`.
5. Verificar BD: `npm run db:check`.
6. Iniciar servidor: `npm run dev` (en `backend/`).

## 🧰 Scripts útiles

| Comando                                   | Descripción |
|-------------------------------------------|-------------|
| `npm run dev`                             | Arranca el servidor con nodemon |
| `npm run seed`                            | Ejecuta seed legacy (mantenido por compatibilidad) |
| `node scripts/show-environment.js`        | Muestra configuración actual |
| `node scripts/create-admin-bcrypt.js`     | Crea admin usando bcrypt |
| `node scripts/export-*.js`                | Exporta órdenes, productos o usuarios a JSON |
| `node scripts/db-check.js`               | Valida estado de la base de datos |
| `node scripts/validate-dashboards.js`     | Verifica datos usados por dashboards |

> La mayoría de estos scripts viven en `backend/scripts/`. Usa `node scripts/<nombre>.js --help` si el archivo la provee.

## ✅ Checklist rápida

- [ ] `.env` configurado o variables de entorno listas
- [ ] `npm install` ejecutado en `backend/`
- [ ] `node database/migrations/create_tables.js` completado sin errores
- [ ] `node database/seeders/seed-all.js` ejecutado (según dataset)
- [ ] `npm run db:check` pasa sin ❌
- [ ] `npm run dev` enciende el backend en `http://localhost:3000`

## 🔧 Solución de problemas

| Problema                                   | Solución |
|--------------------------------------------|----------|
| Frontend en local no muestra datos         | Asegura que `npm run dev` esté activo y `DB_TYPE=sqlite` |
| GitHub Pages vacío                         | Regenera JSON (`--mode=json`), haz commit/push |
| Error conectando a PostgreSQL              | Revisa variables `DB_*`, permisos, firewall, migraciones |
| `db:check` reporta errores                 | Ejecuta migraciones y seeds; revisa mensajes específicos |

## 📎 Notas finales

- Los archivos `.env` reales **no** deben versionarse.
- Este README reemplaza a la documentación fragmentada anterior; actualiza cualquier enlace interno a este archivo.
- Cuando realices cambios en migraciones/seeders, recuerda actualizar la sección correspondiente aquí.

¡Listo! Con esta guía deberías poder levantar el backend completo, poblar datos y validar la instalación en todos los entornos soportados. 




