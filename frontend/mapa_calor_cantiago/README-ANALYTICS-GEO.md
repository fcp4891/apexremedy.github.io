# 📍 Analytics Geográfico - ApexRemedy

Sistema completo de visualización de pedidos por comuna (RM) y región (resto de Chile) usando ECharts.

---

## 🚀 Instalación Rápida

### 1. Crear estructura de carpetas

```bash
mkdir -p public/geo
mkdir -p routes
mkdir -p helpers
mkdir -p views
```

### 2. Copiar archivos

```
tu-proyecto/
├── public/
│   └── geo/
│       └── rm_comunas.geojson          ← Poner el GeoJSON aquí
├── routes/
│   └── analytics.routes.js             ← Rutas de backend
├── helpers/
│   └── comunas.helpers.js              ← Utilidades de normalización
├── views/
│   └── analytics-geografico.html       ← Página frontend
└── app.js                              ← Integración en Express
```

### 3. Descargar GeoJSON oficial (recomendado)

```bash
# Opción A: Descargar todo Chile y filtrar RM
curl -o public/geo/comunas_chile.geojson \
  https://raw.githubusercontent.com/pachadotdev/chilemapas/master/data-raw/geojson/comunas.geojson

# Opción B: Usar el GeoJSON simplificado que te generé
# (suficiente para empezar, pero tiene menos comunas)
```

### 4. Integrar en tu app Express

```javascript
// app.js
const analyticsRoutes = require('./routes/analytics.routes');

app.use('/geo', express.static('public/geo'));
app.use('/analytics', analyticsRoutes);

app.get('/analytics-geo', (req, res) => {
  res.sendFile(__dirname + '/views/analytics-geografico.html');
});
```

### 5. Adaptar queries de base de datos

Edita `routes/analytics.routes.js` líneas 60-90 para que coincidan con tu esquema:

```javascript
// ANTES (ejemplo genérico)
SELECT UPPER(TRIM(comuna)) as comuna, COUNT(*) as orders
FROM orders
WHERE created_at BETWEEN ? AND ?

// DESPUÉS (tu esquema real)
SELECT UPPER(TRIM(o.shipping_comuna)) as comuna, COUNT(*) as orders
FROM orders o
WHERE o.created_at BETWEEN ? AND ?
  AND o.status IN ('paid', 'delivered')
```

---

## 🧪 Prueba Local

```bash
# 1. Iniciar servidor
node app.js

# 2. Abrir en navegador
http://localhost:3000/analytics-geo

# 3. Verificar endpoints
http://localhost:3000/analytics/orders-by-comuna?from=2025-10-01&to=2025-11-04
http://localhost:3000/analytics/orders-resto-por-region?from=2025-10-01&to=2025-11-04
```

---

## 📊 Endpoints Disponibles

### 1. Pedidos por Comuna (RM)
```
GET /analytics/orders-by-comuna
Query params:
  - from: YYYY-MM-DD (requerido)
  - to: YYYY-MM-DD (requerido)
  - status: pending|paid|shipped|delivered (opcional)

Respuesta:
[
  {"comuna": "Santiago", "orders": 412},
  {"comuna": "Maipú", "orders": 355},
  ...
]
```

### 2. Pedidos por Región (resto de Chile)
```
GET /analytics/orders-resto-por-region
Query params: iguales que arriba

Respuesta:
[
  {"region": "Valparaíso", "orders": 320},
  {"region": "Biobío", "orders": 285},
  ...
]
```

### 3. Top Comunas (opcional)
```
GET /analytics/top-comunas?from=2025-10-01&to=2025-11-04&limit=10
```

---

## 🎨 Personalización

### Colores del heatmap
Edita en `analytics-geografico.html` línea ~220:

```javascript
inRange: {
  color: ['#e0f2fe', '#0284c7', '#0c4a6e']  // Azul claro → oscuro
  // O cambia a verde: ['#dcfce7', '#16a34a', '#14532d']
  // O morado: ['#f3e8ff', '#a855f7', '#581c87']
}
```

### Agregar filtros adicionales
En el HTML, agrega más `<select>` en la sección `.filters`:

```html
<div class="filter-group">
  <label>Carrier</label>
  <select id="carrierFilter">
    <option value="">Todos</option>
    <option value="starken">Starken</option>
    <option value="chilexpress">Chilexpress</option>
  </select>
</div>
```

Y captura en `loadCharts()`:
```javascript
const carrier = document.getElementById('carrierFilter').value;
```

---

## 🔧 Solución de Problemas

### ❌ "Cannot read properties of null"
**Causa:** El GeoJSON no se cargó correctamente.

**Solución:**
```bash
# Verificar que el archivo existe
ls -lh public/geo/rm_comunas.geojson

# Verificar que es JSON válido
cat public/geo/rm_comunas.geojson | jq .
```

### ❌ "Comunas no coinciden con el mapa"
**Causa:** Nombres de comunas no normalizados.

**Solución:** Usa `helpers/comunas.helpers.js`:
```javascript
const { matchearPedidosConCUT } = require('./helpers/comunas.helpers');
const pedidosConCUT = matchearPedidosConCUT(pedidosRaw);
```

### ❌ "El mapa se ve muy pequeño"
**Causa:** Contenedor sin altura definida.

**Solución:**
```css
#mapRM {
  height: 600px !important;  /* Forzar altura */
}
```

---

## 📈 Mejoras Futuras

- [ ] Cache de GeoJSON en localStorage
- [ ] Exportar a PDF con jsPDF
- [ ] Modo comparativo (2 períodos lado a lado)
- [ ] Animación temporal (slider de meses)
- [ ] Integración con Google Analytics
- [ ] WebSocket para actualización en tiempo real
- [ ] Clustering de comunas con pocos pedidos

---

## 🔐 Consideraciones de Privacidad

Si una comuna tiene **menos de 3 pedidos**, considera:

1. **Agrupar** con comunas vecinas
2. **Mostrar rango** ("1-5 pedidos") en vez de número exacto
3. **Enmascarar** en el tooltip

Ejemplo:
```javascript
formatter: p => {
  const value = p.value ?? 0;
  if (value < 3) return `${p.name}<br/>Pedidos: 1-5`;
  return `${p.name}<br/>Pedidos: ${value}`;
}
```

---

## 📚 Referencias Útiles

- **ECharts Docs:** https://echarts.apache.org/en/option.html#series-map
- **GeoJSON Chile:** https://github.com/pachadotdev/chilemapas
- **BCN (oficial):** https://www.bcn.cl/siit/mapas_vectoriales/index_html
- **Códigos CUT:** https://ine.cl/docs/default-source/documentos-de-trabajo/c%C3%B3digo-%C3%BAnico-territorial.pdf

---

## 🤝 Soporte

Si tienes dudas:
1. Revisa la consola del navegador (F12)
2. Verifica logs del servidor
3. Valida que los endpoints retornen JSON válido
4. Chequea que las fechas estén en formato correcto

---

**¡Listo para producción!** 🚀

Último paso: Ajusta las queries SQL en `analytics.routes.js` según tu esquema de DB y ¡estás on! 🎯
