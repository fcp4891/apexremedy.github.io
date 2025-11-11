// app.js (o server.js)
// Ejemplo de cómo integrar todo en tu aplicación Express

const express = require('express');
const path = require('path');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS ESTÁTICAS
// ============================================

// Servir GeoJSON
app.use('/geo', express.static(path.join(__dirname, 'public/geo')));

// Servir archivos estáticos (CSS, JS, imágenes)
app.use('/static', express.static(path.join(__dirname, 'public')));

// ============================================
// RUTAS DE ANALYTICS
// ============================================

// Montar rutas de analytics en /analytics
app.use('/analytics', analyticsRoutes);

// ============================================
// PÁGINA DE ANALYTICS GEOGRÁFICO
// ============================================

app.get('/analytics-geo', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'analytics-geografico.html'));
});

// O si usas un motor de plantillas:
// app.get('/analytics-geo', (req, res) => {
//   res.render('analytics-geografico');
// });

// ============================================
// RUTA PARA DESCARGAR GEOJSON ACTUALIZADO
// ============================================

// Endpoint para regenerar/actualizar GeoJSON si lo necesitas
app.get('/admin/update-geojson', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Descargar GeoJSON oficial
    const response = await fetch('https://raw.githubusercontent.com/pachadotdev/chilemapas/master/data-raw/geojson/comunas.geojson');
    const geojson = await response.json();
    
    // Filtrar solo RM (código región 13)
    const rmGeoJSON = {
      type: 'FeatureCollection',
      features: geojson.features.filter(f => 
        f.properties.CUT_COM && f.properties.CUT_COM.startsWith('13')
      )
    };
    
    // Guardar archivo
    const fs = require('fs').promises;
    await fs.writeFile(
      path.join(__dirname, 'public/geo/rm_comunas.geojson'),
      JSON.stringify(rmGeoJSON, null, 2)
    );
    
    res.json({ 
      success: true, 
      comunas: rmGeoJSON.features.length,
      message: 'GeoJSON actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando GeoJSON:', error);
    res.status(500).json({ error: 'Error al actualizar GeoJSON' });
  }
});

// ============================================
// OTRAS RUTAS DE TU APP
// ============================================

// Tus rutas existentes...
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// etc...

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Analytics: http://localhost:${PORT}/analytics-geo`);
});

module.exports = app;
