# API Estática - Documentación

## 📋 Descripción

Este proyecto implementa una **API estática** generada en build-time mediante GitHub Actions. Los productos se exportan desde la base de datos SQLite a archivos JSON que se publican en GitHub Pages, permitiendo que el frontend funcione sin necesidad de un backend activo.

## 🚀 ¿Cómo funciona?

### 1. Script de Exportación (`backend/scripts/export-products-to-json.js`)

El script:
- Se conecta a la base de datos SQLite
- Exporta todos los productos con sus imágenes y datos relacionados
- Genera tres archivos JSON:
  - `frontend/api/products.json` - Todos los productos
  - `frontend/api/products-featured.json` - Solo productos destacados
  - `frontend/api/products-by-category.json` - Productos agrupados por categoría

### 2. GitHub Actions Workflow (`.github/workflows/pages.yml`)

El workflow:
1. Instala Node.js y dependencias del backend
2. Ejecuta el script de exportación
3. Verifica que los JSON se generaron correctamente
4. Publica el frontend (incluyendo los JSON) en GitHub Pages

### 3. Cliente API (`frontend/js/api/apiClient.js`)

El cliente API:
- **En producción (GitHub Pages)**: Intenta primero cargar los JSON estáticos
- **Si falla**: Intenta con la API dinámica (si está configurada)
- **En desarrollo**: Usa directamente la API dinámica (`localhost:3000`)

## 📁 Estructura de Archivos

```
frontend/
  └── api/
      ├── products.json              # Todos los productos
      ├── products-featured.json      # Productos destacados
      └── products-by-category.json   # Productos por categoría
```

## ✅ Ventajas

- ✅ **Simple**: No requiere backend activo para visualizar productos
- ✅ **Rápido**: Los JSON se sirven directamente desde GitHub Pages (CDN)
- ✅ **Automático**: Se actualiza en cada push a `main`
- ✅ **Fallback**: Si el JSON falla, intenta con la API dinámica

## ⚠️ Limitaciones

- ❌ **No tiempo real**: Los datos se actualizan solo cuando corre el Action (push a `main`)
- ❌ **Solo lectura**: No permite crear/actualizar productos desde el frontend
- ❌ **Requiere DB**: El script necesita acceso a la base de datos SQLite

## 🔧 Configuración

### Requisitos

1. La base de datos SQLite debe estar en el repositorio o ser accesible
2. Ruta por defecto: `backend/database/apexremedy.db`
3. Puede configurarse con variable de entorno: `DB_PATH`

### Variables de Entorno (opcional)

```bash
DB_PATH=backend/database/apexremedy.db  # Ruta a la base de datos
DB_TYPE=sqlite                          # Tipo de base de datos
```

## 🧪 Probar Localmente

```bash
# Desde el directorio backend
cd backend
node scripts/export-products-to-json.js
```

Esto generará los archivos JSON en `frontend/api/`.

## 📊 Formato de los JSON

### products.json
```json
{
  "success": true,
  "message": "Productos exportados correctamente",
  "data": {
    "products": [...],
    "total": 150,
    "timestamp": "2025-01-XX..."
  }
}
```

### products-featured.json
```json
{
  "success": true,
  "message": "Productos destacados exportados correctamente",
  "data": {
    "products": [...],
    "total": 10,
    "timestamp": "2025-01-XX..."
  }
}
```

## 🔄 Actualizar Productos

Para actualizar los productos en producción:

1. **Actualizar la base de datos** (localmente o en servidor)
2. **Hacer commit y push** a la rama `main`
3. **GitHub Actions** ejecutará automáticamente:
   - Exportará los productos a JSON
   - Publicará en GitHub Pages

## 🐛 Troubleshooting

### Los JSON no se generan

1. Verifica que la base de datos existe en `backend/database/apexremedy.db`
2. Revisa los logs de GitHub Actions
3. Verifica que las dependencias del backend estén instaladas

### El frontend no carga los JSON

1. Verifica que los archivos existan en `frontend/api/`
2. Abre la consola del navegador para ver errores
3. Verifica la ruta base en `loadStaticJSON()`

### Filtros no funcionan con JSON estático

Los filtros se aplican localmente en el cliente. Si necesitas filtros más complejos, considera usar la API dinámica.

## 📝 Notas Adicionales

- Los JSON se regeneran en cada push a `main`
- Los JSON incluyen todos los productos activos
- Las imágenes se referencian por URL (deben estar disponibles públicamente)
- El timestamp indica cuándo se generaron los JSON

