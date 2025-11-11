// ============================================
// RUTAS: Geographic Data (GeoJSON)
// ============================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/geo/rm-comunas
 * Servir GeoJSON de comunas de la Región Metropolitana
 */
router.get('/rm-comunas', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const geoJsonPath = path.join(__dirname, '../../data/geo/rm_comunas.geojson');
        
        try {
            const geoJsonContent = await fs.readFile(geoJsonPath, 'utf8');
            const geoJson = JSON.parse(geoJsonContent);
            
            res.json(geoJson);
        } catch (fileError) {
            // Si no existe el archivo, devolver un GeoJSON básico
            console.warn('⚠️ GeoJSON no encontrado, usando estructura básica:', fileError.message);
            
            // GeoJSON básico con las comunas principales de la RM
            const basicGeoJson = {
                type: 'FeatureCollection',
                features: [
                    // Comunas principales de Santiago (estructura simplificada)
                    // En producción, deberías usar un GeoJSON real de comunas de Chile
                    {
                        type: 'Feature',
                        properties: {
                            NOM_COM: 'Santiago',
                            COMUNA: 'Santiago',
                            REGION: 'Metropolitana'
                        },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[[-70.6483, -33.4489], [-70.6483, -33.4489], [-70.6483, -33.4489], [-70.6483, -33.4489]]]
                        }
                    }
                ]
            };
            
            res.json(basicGeoJson);
        }
    } catch (error) {
        console.error('❌ Error al servir GeoJSON:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener GeoJSON',
            error: error.message
        });
    }
});

module.exports = router;









