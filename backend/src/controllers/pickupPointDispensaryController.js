// backend/src/controllers/pickupPointDispensaryController.js
const PickupPointDispensary = require('../models/PickupPointDispensary');

const pickupPointModel = new PickupPointDispensary();

class PickupPointDispensaryController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const points = active_only === 'true' 
                ? await pickupPointModel.getActive()
                : await pickupPointModel.findAll();
            
            res.json({
                success: true,
                data: { points },
                count: points.length
            });
        } catch (error) {
            console.error('Error al obtener puntos de retiro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener puntos de retiro',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const point = await pickupPointModel.findById(id);

            if (!point) {
                return res.status(404).json({
                    success: false,
                    message: 'Punto de retiro no encontrado'
                });
            }

            res.json({
                success: true,
                data: { point }
            });
        } catch (error) {
            console.error('Error al obtener punto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener punto',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await pickupPointModel.create(req.body);
            const point = await pickupPointModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Punto de retiro creado exitosamente',
                data: { point }
            });
        } catch (error) {
            console.error('Error al crear punto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear punto',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const point = await pickupPointModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Punto de retiro actualizado exitosamente',
                data: { point }
            });
        } catch (error) {
            console.error('Error al actualizar punto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar punto',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await pickupPointModel.delete(id);

            res.json({
                success: true,
                message: 'Punto de retiro eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar punto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar punto',
                error: error.message
            });
        }
    }
}

module.exports = new PickupPointDispensaryController();








