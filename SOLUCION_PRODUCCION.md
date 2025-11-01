# 🚀 Solución Rápida para Problemas en Producción

## URL de Producción
- **Frontend:** `https://fcp4891.github.io/apexremedy.github.io/frontend/index.html`

## ⚡ Solución Rápida: Problema "Admin" sin estar logueado

Si aparece el menú "Admin" sin estar logueado, ejecuta esto en la consola del navegador:

```javascript
// Abre la consola (F12) y ejecuta:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

O visita esta URL directamente:
```
https://fcp4891.github.io/apexremedy.github.io/frontend/index.html?clearStorage=true
```

## ⚡ Solución Rápida: Productos no se cargan

### Paso 1: Verificar URL del Backend

Abre la consola del navegador (F12) y verifica:

1. Debe aparecer: `🌐 Modo producción detectado`
2. Debe mostrar: `🔗 API URL: https://...`

Si muestra `http://localhost:3000/api`, significa que aún no has configurado la URL de producción.

### Paso 2: Configurar URL del Backend

**¿Dónde está tu backend desplegado?**
- Heroku: `https://tu-app.herokuapp.com/api`
- Railway: `https://tu-app.railway.app/api`
- Render: `https://tu-app.onrender.com/api`
- Otro: `https://tu-dominio.com/api`

Una vez que tengas la URL, actualiza estos archivos:

1. **`frontend/js/api/apiClient.js`** - Línea ~17
2. **`frontend/js/config.js`** - Línea ~13

Cambia `'https://tu-backend-en-produccion.com/api'` por tu URL real.

### Paso 3: Verificar Backend

Asegúrate de que tu backend:
- ✅ Esté corriendo y accesible
- ✅ Tenga CORS configurado para GitHub Pages
- ✅ Responda en `/api/health`

Prueba desde el navegador:
```
https://TU-BACKEND-URL/api/health
```

Debe devolver: `{"success":true,"message":"API funcionando correctamente"}`

## 🔍 Debug en Producción

Abre la consola del navegador (F12) y revisa:

1. **Errores de red:** Ve a la pestaña "Network" y busca peticiones fallidas a `/api/products`
2. **Errores de CORS:** Si ves "CORS policy", el backend no permite requests desde GitHub Pages
3. **URL incorrecta:** Si las peticiones van a `localhost:3000`, la configuración no está correcta

## 📝 Checklist Completo

- [ ] Backend desplegado y accesible
- [ ] URL del backend configurada en `apiClient.js`
- [ ] URL del backend configurada en `config.js`
- [ ] CORS configurado en el backend para `*.github.io`
- [ ] localStorage limpiado si hay datos obsoletos
- [ ] Probado carga de productos en producción
- [ ] Verificado que no aparece "admin" sin estar logueado

## 🆘 Si Nada Funciona

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Toma captura de pantalla de los errores
4. Ve a la pestaña "Network"
5. Intenta cargar productos y revisa qué peticiones fallan
6. Comparte los errores para diagnóstico

