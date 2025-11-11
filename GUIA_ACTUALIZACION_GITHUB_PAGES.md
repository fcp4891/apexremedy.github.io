# 🚀 Guía para Actualizar GitHub Pages

## ⚠️ IMPORTANTE: Consideraciones Previas

GitHub Pages usa archivos JSON estáticos como fuente de datos. El workflow preserva JSON existentes si tienen productos para evitar sobrescribir datos.

## 📋 Pasos para Actualizar GitHub Pages

### 1. Verificar Cambios Locales

Antes de actualizar, asegúrate de que:

```bash
# Verificar estado de git
git status

# Ver cambios pendientes
git diff

# Verificar que la base de datos local esté actualizada
# (con los nuevos cambios: payment_method, customer_name, etc.)
```

### 2. Exportar JSON Localmente (Opcional - Para Verificar)

Puedes exportar los JSON localmente para verificar que todo esté correcto:

```bash
# Exportar productos
cd backend
DB_PATH=database/apexremedy.db node scripts/export-products-to-json.js

# Exportar usuarios
DB_PATH=database/apexremedy.db node scripts/export-users-to-json.js

# Exportar pedidos (incluye payment_method desde payments)
DB_PATH=database/apexremedy.db node scripts/export-orders-to-json.js

# Verificar que los JSON se generaron correctamente
cd ../frontend/api
ls -lh *.json
```

### 3. Verificar que la Base de Datos Esté en el Repositorio

**⚠️ IMPORTANTE**: El workflow necesita la base de datos para exportar. Verifica:

```bash
# La base de datos debe estar en: backend/database/apexremedy.db
# Pero está en .gitignore, así que necesitas agregarla temporalmente o usar un commit específico

# Opción 1: Agregar temporalmente (NO RECOMENDADO para producción)
# git add -f backend/database/apexremedy.db

# Opción 2: Usar GitHub Actions Secrets para base de datos remota
# (Recomendado para producción)
```

### 4. Hacer Commit y Push

```bash
# Agregar todos los cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat: Actualizar GitHub Pages con nuevos cambios

- Agregado payment_method desde tabla payments en orders
- Mejorada relación entre orders y payments
- Corregidos scripts de exportación
- Actualizados seeds para incluir diferentes métodos de pago"

# Push a main (esto activará el workflow)
git push origin main
```

### 5. Monitorear el Workflow

1. Ve a: `https://github.com/fcp4891/apexremedy.github.io/actions`
2. Verifica que el workflow "Deploy to GitHub Pages" se ejecute
3. Revisa los logs para asegurarte de que:
   - ✅ La base de datos se encontró
   - ✅ Los JSON se exportaron correctamente
   - ✅ Los archivos se verificaron
   - ✅ El deploy fue exitoso

### 6. Verificar en GitHub Pages

Después del deploy (puede tardar 1-2 minutos):

1. Ve a: `https://fcp4891.github.io/apexremedy.github.io/`
2. Abre la consola del navegador (F12)
3. Verifica que los JSON se carguen correctamente:
   - `/api/products.json`
   - `/api/users.json`
   - `/api/orders.json`
4. Verifica que los pedidos incluyan `payment_method`

## 🔄 Forzar Actualización de JSON (Si es Necesario)

Si necesitas forzar la actualización de los JSON (sobrescribir los existentes):

### Opción 1: Modificar Temporalmente el Workflow

Edita `.github/workflows/pages.yml` y cambia:

```yaml
# Cambiar esta línea (línea 90):
if [ "$PRODUCTS_EXIST" = "true" ]; then

# Por:
if [ "false" = "true" ]; then  # Forzar siempre exportar
```

**⚠️ IMPORTANTE**: Recuerda revertir este cambio después del deploy.

### Opción 2: Eliminar JSON Existentes Manualmente

```bash
# Eliminar JSON existentes
rm frontend/api/products.json
rm frontend/api/products-featured.json
rm frontend/api/users.json
rm frontend/api/orders.json

# Hacer commit y push
git add frontend/api/
git commit -m "chore: Eliminar JSON existentes para forzar re-exportación"
git push origin main
```

## 📊 Verificación Post-Deploy

Después del deploy, verifica:

1. **Estructura de orders.json**:
   ```json
   {
     "success": true,
     "data": {
       "orders": [
         {
           "id": 1,
           "payment_method": "transfer",  // ✅ Debe estar presente
           "customer_name": "...",        // ✅ Debe estar presente
           "customer_email": "...",        // ✅ Debe estar presente
           ...
         }
       ]
     }
   }
   ```

2. **Métodos de pago variados**: Los pedidos deben tener diferentes métodos:
   - `transfer`
   - `credit`
   - `debit`
   - `cash`

3. **Relación orders-payments**: Cada pedido debe tener su método de pago correcto desde la tabla `payments`.

## 🐛 Solución de Problemas

### Problema: JSON no se actualiza

**Causa**: El workflow preserva JSON existentes si tienen productos.

**Solución**: Usa la Opción 2 de "Forzar Actualización" arriba.

### Problema: Base de datos no encontrada

**Causa**: La base de datos está en `.gitignore`.

**Solución**: 
- Agregar temporalmente: `git add -f backend/database/apexremedy.db`
- O configurar GitHub Actions Secrets para usar una base de datos remota

### Problema: payment_method es null

**Causa**: El JOIN con payments no está funcionando o no hay pagos relacionados.

**Solución**:
1. Verificar que existan pagos en la tabla `payments`
2. Verificar que los pagos tengan `order_id` correcto
3. Ejecutar el seed de payments: `node backend/database/seeders/seed-payments.js --force`

## 📝 Notas Importantes

- ⚠️ **NO** hagas commit de la base de datos en producción (está en `.gitignore` por seguridad)
- ✅ El workflow usa la base de datos del repositorio si está disponible
- ✅ Si no hay base de datos, crea JSON vacíos para evitar errores
- ✅ Los JSON se preservan si tienen datos para evitar pérdida de información
- ✅ Los cambios en el código (frontend/backend) se despliegan automáticamente

## 🔐 Seguridad

- ⚠️ Los JSON de usuarios incluyen `password_hash` (NO texto plano)
- ⚠️ Los JSON son públicos en GitHub Pages
- ✅ Considera usar variables de entorno o secrets para datos sensibles
- ✅ Revisa qué información se exporta antes de hacer push

