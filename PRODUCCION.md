# 🔧 Configuración para Producción

## ⚠️ IMPORTANTE: Configurar URL del Backend

**Frontend en producción:** `https://fcp4891.github.io/apexremedy.github.io/frontend/index.html`

Antes de hacer deploy, debes actualizar la URL del backend en producción en estos archivos:

1. **`frontend/js/api/apiClient.js`** (línea ~17)
   - Buscar: `const PRODUCTION_API_URL = 'https://tu-backend-en-produccion.com/api';`
   - Cambiar por tu URL real del backend, ejemplo: 
     - `'https://apexremedy-api.herokuapp.com/api'` (si está en Heroku)
     - `'https://api.apexremedy.com/api'` (si tienes dominio propio)
     - `'https://apexremedy-backend.railway.app/api'` (si está en Railway)

2. **`frontend/js/config.js`** (línea ~13)
   - Buscar: `const PRODUCTION_API_URL = 'https://tu-backend-en-produccion.com/api';`
   - Cambiar por la misma URL que configuraste arriba

## 📋 Checklist Pre-Deploy

- [ ] Configurar URL del backend en `apiClient.js`
- [ ] Configurar URL del backend en `config.js`
- [ ] Verificar que el backend tenga CORS configurado para GitHub Pages
- [ ] Verificar que el backend esté corriendo y accesible
- [ ] Probar carga de productos desde producción
- [ ] Limpiar localStorage si hay datos obsoletos

## 🐛 Problemas Comunes en Producción

### 1. Productos no se cargan
**Causa:** URL del backend incorrecta o backend no accesible
**Solución:** 
- Verificar URL en `apiClient.js`
- Verificar que el backend esté corriendo
- Verificar CORS en el backend

### 2. Aparece "admin" sin estar logueado
**Causa:** Datos obsoletos en localStorage
**Solución:**
```javascript
// En consola del navegador en producción:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 3. Error CORS
**Causa:** Backend no permite requests desde GitHub Pages
**Solución:** Agregar el dominio de GitHub Pages a CORS en el backend:
```javascript
// backend/src/server.js o config
cors({
  origin: [
    'https://fcp4891.github.io',
    'https://fcp4891.github.io/apexremedy.github.io'
  ]
})
```

## 🔍 Verificar Configuración

Abre la consola del navegador en producción y verifica:
1. Debe aparecer: `🌐 Modo producción detectado`
2. Debe mostrar la URL correcta del backend
3. No debe haber errores de CORS

