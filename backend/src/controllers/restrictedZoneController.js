// backend/src/controllers/restrictedZoneController.js
const RestrictedZone = require('../models/RestrictedZone');

const restrictedZoneModel = new RestrictedZone();

class RestrictedZoneController {
    async getAll(req, res) {
        try {
            console.log('🔍 [RestrictedZoneController] getAll llamado');
            const { active_only } = req.query;
            console.log('📋 [RestrictedZoneController] active_only:', active_only);
            
            const zones = active_only === 'true' 
                ? await restrictedZoneModel.getActive()
                : await restrictedZoneModel.findAll();
            
            console.log('✅ [RestrictedZoneController] Zonas encontradas:', zones.length);
            
            res.json({
                success: true,
                data: { zones },
                count: zones.length
            });
        } catch (error) {
            console.error('❌ Error al obtener zonas restringidas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener zonas restringidas',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const zone = await restrictedZoneModel.findById(id);

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zona restringida no encontrada'
                });
            }

            res.json({
                success: true,
                data: { zone }
            });
        } catch (error) {
            console.error('Error al obtener zona:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener zona',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await restrictedZoneModel.create(req.body);
            const zone = await restrictedZoneModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Zona restringida creada exitosamente',
                data: { zone }
            });
        } catch (error) {
            console.error('Error al crear zona:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear zona',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const zone = await restrictedZoneModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Zona restringida actualizada exitosamente',
                data: { zone }
            });
        } catch (error) {
            console.error('Error al actualizar zona:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar zona',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await restrictedZoneModel.delete(id);

            res.json({
                success: true,
                message: 'Zona restringida eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar zona:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar zona',
                error: error.message
            });
        }
    }
}

module.exports = new RestrictedZoneController();
