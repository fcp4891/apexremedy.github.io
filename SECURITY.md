# 🔒 Guía de Seguridad - Apexremedy

Este documento describe las medidas de seguridad implementadas y las mejores prácticas para mantener la seguridad de la aplicación.

## ✅ Medidas de Seguridad Implementadas

### 1. Autenticación y Sesiones

- ✅ **Tokens JWT almacenados en cookies httpOnly, Secure, SameSite**
  - Los tokens de acceso y refresh se almacenan en cookies httpOnly (no accesibles desde JavaScript)
  - Cookies configuradas con flag `Secure` en producción (requiere HTTPS)
  - Cookies configuradas con `SameSite=Strict` para prevenir CSRF
  - Rotación de refresh tokens implementada

- ✅ **Gestión de sesiones**
  - Tokens de acceso con TTL corto (10 minutos por defecto)
  - Tokens de refresh con TTL largo (7 días por defecto)
  - Revocación de tokens en logout
  - Prevención de session fixation

### 2. CSRF (Cross-Site Request Forgery) Protection

- ✅ **Protección CSRF implementada**
  - Double-submit token pattern
  - Token CSRF almacenado en cookie (legible por JS) y enviado en header `X-CSRF-Token`
  - Validación en todas las peticiones no-GET
  - Exclusión de rutas públicas (login, register, health check)

### 3. CORS (Cross-Origin Resource Sharing)

- ✅ **Configuración estricta de CORS**
  - Orígenes permitidos configurados mediante variable de entorno `CORS_ORIGINS`
  - En producción: rechaza requests sin origin
  - En desarrollo: lista de orígenes locales permitidos
  - Soporte para GitHub Pages mediante `ALLOW_GITHUB_PAGES=true`
  - Credenciales habilitadas solo para orígenes permitidos

### 4. CSP (Content Security Policy)

- ✅ **CSP configurado con Helmet**
  - `defaultSrc: ['self']` - Solo recursos del mismo origen
  - `scriptSrc: ['self', 'https://cdn.tailwindcss.com']` - Scripts desde orígenes permitidos
  - `styleSrc: ['self', 'https://cdnjs.cloudflare.com', 'unsafe-inline']` - ⚠️ Temporal: `unsafe-inline` permitido
  - `frameAncestors: ['none']` - Previene clickjacking
  - `objectSrc: ['none']` - Previene plugins obsoletos

- ⚠️ **Pendiente**: Eliminar `unsafe-inline` de `styleSrc`
  - Migración de estilos inline a archivos CSS externos (en progreso)
  - Todos los scripts inline han sido migrados a archivos JS externos

### 5. XSS (Cross-Site Scripting) Protection

- ✅ **Prevención de XSS**
  - CSP restringe ejecución de scripts inline
  - Event delegation implementada (no uso de `onclick`, `onchange`, etc.)
  - Sanitización de datos de usuario antes de renderizar
  - Validación de entrada en backend

### 6. Headers de Seguridad

- ✅ **Headers de seguridad configurados con Helmet**
  - `Strict-Transport-Security` (HSTS) - Forzar HTTPS
  - `X-Content-Type-Options: nosniff` - Previene MIME sniffing
  - `X-Frame-Options: DENY` - Previene clickjacking
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`

### 7. Minimización de Datos Sensibles

- ✅ **Datos sensibles no expuestos**
  - `password_hash` eliminado de todas las respuestas
  - `password` eliminado de todas las respuestas
  - Tokens de verificación/reset no expuestos
  - Logs no contienen información sensible

### 8. Gestión de Secretos

- ✅ **Secretos manejados correctamente**
  - Variables de entorno para secretos (JWT_SECRET, DB_PASSWORD, etc.)
  - Archivos `.env` en `.gitignore`
  - Documentación de variables de entorno en `env.local.txt` y `env.production.txt`
  - ⚠️ **Recomendación**: Usar un gestor de secretos en producción (AWS Secrets Manager, HashiCorp Vault, etc.)

### 9. Dependencias

- ⚠️ **Vulnerabilidades detectadas** (ver `backend/SECURITY_AUDIT.md`)
  - `cookie` < 0.7.0 (2 vulnerabilidades - low) - Dependencia de `cookie-parser`
  - `validator` < 13.15.20 (2 vulnerabilidades - moderate) - Dependencia de `express-validator`
  - **Acción requerida**: Ejecutar `npm audit fix` en el directorio `backend/`
  
- ✅ **Gestión de dependencias**
  - Dependencias auditadas con `npm audit`
  - ⚠️ **Recomendación**: Ejecutar `npm audit` regularmente (mensualmente)
  - ⚠️ **Recomendación**: Usar herramientas como Snyk o Dependabot para monitoreo automático
  - ⚠️ **Recomendación**: Configurar GitHub Dependabot para alertas automáticas

### 10. CDN y SRI (Subresource Integrity)

- ⚠️ **CDN sin SRI** (pendiente de implementar)
  - `https://cdn.tailwindcss.com` - Sin integrity hash
  - `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css` - Sin integrity hash
  - `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` - Sin integrity hash
  - `https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js` - Sin integrity hash

  **Recomendación**: Agregar atributos `integrity` y `crossorigin` a todos los recursos CDN:
  ```html
  <script src="https://cdn.tailwindcss.com" 
          integrity="sha384-..." 
          crossorigin="anonymous"></script>
  ```

## 🔧 Configuración de Variables de Entorno

### Desarrollo (`backend/.env`)

```env
NODE_ENV=development
DB_TYPE=sqlite
DB_PATH=database/apexremedy.db
PORT=3000
FRONTEND_URL=http://localhost:5500
JWT_SECRET=apexremedy_jwt_secret_local_development
JWT_EXPIRES_IN=10m
JWT_REFRESH_EXPIRES_IN=7d
```

### Producción

```env
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=tu-servidor-postgres.com
DB_PORT=5432
DB_NAME=apexremedy
DB_USER=apexremedy_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_SSL=true
PORT=3000
FRONTEND_URL=https://tu-dominio.com
JWT_SECRET=TU_SECRETO_JWT_SUPER_SEGURO_GENERAR_CON_OPENSSL
JWT_EXPIRES_IN=10m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
ALLOW_GITHUB_PAGES=false
```

## 📋 Checklist de Seguridad para Producción

- [ ] Cambiar `JWT_SECRET` por un secreto fuerte (generar con `openssl rand -base64 32`)
- [ ] Configurar `CORS_ORIGINS` con los dominios de producción
- [ ] Habilitar HTTPS en el servidor
- [ ] Configurar `DB_SSL=true` para conexiones a PostgreSQL
- [ ] Revisar y actualizar dependencias (`npm audit`)
- [ ] Agregar SRI a todos los recursos CDN
- [ ] Eliminar `unsafe-inline` de CSP (`styleSrc`)
- [ ] Configurar rate limiting para prevenir ataques de fuerza bruta
- [ ] Configurar logging de seguridad (intentos de acceso fallidos, etc.)
- [ ] Configurar backup automático de la base de datos
- [ ] Revisar permisos de archivos y directorios
- [ ] Configurar firewall para restringir acceso al servidor
- [ ] Revisar logs regularmente para detectar actividad sospechosa

## 🚨 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO** crees un issue público en GitHub
2. Envía un email a: [email de seguridad]
3. Describe la vulnerabilidad en detalle
4. Proporciona pasos para reproducir (si es posible)

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🔄 Actualizaciones de Seguridad

Este documento se actualiza regularmente. Última actualización: 2025-01-XX

---

**Nota**: Esta guía es un documento vivo. Se actualizará conforme se implementen nuevas medidas de seguridad o se identifiquen nuevas vulnerabilidades.

