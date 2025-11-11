# 🚀 Setup Completo de Dashboards - Apexremedy

## Guía de Instalación y Configuración

Esta guía te ayudará a configurar completamente el sistema de dashboards.

---

## 📋 Prerrequisitos

1. Node.js >= 16.0.0
2. Base de datos SQLite funcionando
3. Backend configurado y corriendo

---

## 🔧 Pasos de Instalación

### 1. Ejecutar Migraciones

Crea todas las tablas necesarias (incluyendo las de analytics):

```bash
cd backend/database/migrations
node create_tables.js
```

**Verificación:**
- Deberías ver mensajes de éxito para todas las tablas
- Incluyendo las tablas de analytics (web_sessions, pageviews, etc.)

### 2. Ejecutar Seeds

Genera datos relacionados para poblar los dashboards:

```bash
cd backend/database/seeders

# Opción 1: Ejecutar todo (recomendado)
node seed-all.js

# Opción 2: Solo analytics (si ya tienes usuarios y productos)
node seed-analytics.js --days=90 --sessions=500
```

**Parámetros del seed de analytics:**
- `--days=90`: Genera datos de los últimos 90 días (default: 90)
- `--sessions=500`: Genera 500 sesiones web (default: 500)

### 3. Validar Instalación

Ejecuta el script de validación:

```bash
cd backend/scripts
node validate-dashboards.js
```

**Deberías ver:**
- ✅ Todas las tablas creadas
- ✅ Datos relacionados válidos
- ✅ Índices y vistas funcionando

---

## 🎯 Configurar Alertas Automáticas

### Opción 1: Cron Job (Linux/Mac)

Agrega al crontab para ejecutar alertas diariamente a las 8 AM:

```bash
0 8 * * * cd /ruta/al/proyecto/backend/scripts && node run-alerts.js
```

### Opción 2: Task Scheduler (Windows)

1. Abre "Programador de tareas"
2. Crea tarea básica
3. Configura para ejecutar diariamente:
   ```powershell
   node D:\Proyectos_IA\dispensario\apexremedy_v2.github.io\backend\scripts\run-alerts.js
   ```

### Opción 3: Manual

Ejecuta manualmente cuando necesites:

```bash
cd backend/scripts
node run-alerts.js
```

---

## 🌐 Acceder a los Dashboards

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Abre el dashboard:**
   - Navega a `frontend/admin/dashboard.html`
   - Inicia sesión como administrador
   - El dashboard se cargará automáticamente

3. **Navega entre tabs:**
   - Usa los tabs en la parte superior para cambiar entre dashboards
   - Selecciona el período deseado
   - Presiona "Actualizar" para recargar datos

---

## 📊 Verificar que Todo Funciona

### 1. Verificar Endpoints

Prueba los endpoints de analytics (requiere autenticación admin):

```bash
# Executive Dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/analytics/executive?period=30d

# Commercial Dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/analytics/commercial?period=30d
```

### 2. Verificar Datos

```bash
# Verificar sesiones
sqlite3 backend/database/apexremedy.db "SELECT COUNT(*) FROM web_sessions;"

# Verificar eventos
sqlite3 backend/database/apexremedy.db "SELECT COUNT(*) FROM web_events;"

# Verificar campañas
sqlite3 backend/database/apexremedy.db "SELECT COUNT(*) FROM marketing_campaigns;"
```

### 3. Verificar Dashboard

1. Abre `frontend/admin/dashboard.html`
2. Verifica que:
   - Los tabs se muestren correctamente
   - Los gráficos se carguen
   - Los datos aparezcan (no "0" en todos lados)
   - El selector de período funcione

---

## 🔍 Troubleshooting

### Error: "No hay usuarios" o "No hay productos"

**Solución:**
```bash
cd backend/database/seeders
node seed-users.js --add-demo
node seed-products.js
node seed-analytics.js
```

### Los gráficos muestran "0" o están vacíos

**Posibles causas:**
1. No hay datos en el período seleccionado
2. No se ejecutó el seed de analytics
3. Error en la conexión con el backend

**Solución:**
1. Verifica que el backend esté corriendo
2. Ejecuta el seed de analytics
3. Cambia el período a "Último año" o "Año actual"
4. Revisa la consola del navegador para errores

### Error: "Tabla no existe"

**Solución:**
```bash
cd backend/database/migrations
node create_tables.js
```

### Las alertas no se generan

**Solución:**
1. Verifica que haya productos con stock bajo
2. Ejecuta manualmente: `node backend/scripts/run-alerts.js`
3. Revisa que haya usuarios admin en la base de datos

---

## 📚 Documentación Adicional

- **Guía de Uso**: `documentacion/GUIA_DASHBOARDS.md`
- **Data Dictionary**: `documentacion/DATA_DICTIONARY.md`
- **Playbooks**: `documentacion/PLAYBOOKS_ACCION.md`
- **Documentación Completa**: `mapa_ruta/dashboards.md`

---

## ✅ Checklist de Verificación

Después de la instalación, verifica:

- [ ] Tablas de analytics creadas (8 tablas)
- [ ] Datos de seed generados (sessions, events, campaigns, etc.)
- [ ] Endpoints de analytics responden correctamente
- [ ] Dashboard HTML carga sin errores
- [ ] Gráficos se renderizan correctamente
- [ ] Selector de período funciona
- [ ] Alertas se pueden ejecutar manualmente
- [ ] Documentación accesible

---

## 🎉 ¡Listo!

Una vez completado el setup, tendrás:

- ✅ 10 dashboards completos funcionando
- ✅ Datos relacionados para visualizar
- ✅ Sistema de alertas configurado
- ✅ Documentación completa
- ✅ Scripts de validación y mantenimiento

**Próximo paso:** Revisa `documentacion/GUIA_DASHBOARDS.md` para aprender a usar los dashboards.

