// backend/src/controllers/internalDeliveryZoneController.js
const InternalDeliveryZone = require('../models/InternalDeliveryZone');

const zoneModel = new InternalDeliveryZone();

class InternalDeliveryZoneController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const zones = active_only === 'true' 
                ? await zoneModel.getActive()
                : await zoneModel.findAll();
            
            res.json({
                success: true,
                data: { zones },
                count: zones.length
            });
        } catch (error) {
            console.error('Error al obtener zonas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener zonas',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const zone = await zoneModel.findById(id);

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zona no encontrada'
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
            const id = await zoneModel.create(req.body);
            const zone = await zoneModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Zona creada exitosamente',
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
            const zone = await zoneModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Zona actualizada exitosamente',
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
            await zoneModel.delete(id);

            res.json({
                success: true,
                message: 'Zona eliminada exitosamente'
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

module.exports = new InternalDeliveryZoneController();








