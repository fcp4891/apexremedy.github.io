// backend/src/controllers/dispatchCenterController.js
const DispatchCenter = require('../models/DispatchCenter');

const dispatchCenterModel = new DispatchCenter();

class DispatchCenterController {
    async getAll(req, res) {
        try {
            const centers = await dispatchCenterModel.findAll();
            res.json({
                success: true,
                data: { centers },
                count: centers.length
            });
        } catch (error) {
            console.error('Error al obtener centros:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener centros',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const center = await dispatchCenterModel.findById(id);

            if (!center) {
                return res.status(404).json({
                    success: false,
                    message: 'Centro no encontrado'
                });
            }

            res.json({
                success: true,
                data: { center }
            });
        } catch (error) {
            console.error('Error al obtener centro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener centro',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await dispatchCenterModel.create(req.body);
            const center = await dispatchCenterModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Centro creado exitosamente',
                data: { center }
            });
        } catch (error) {
            console.error('Error al crear centro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear centro',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const center = await dispatchCenterModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Centro actualizado exitosamente',
                data: { center }
            });
        } catch (error) {
            console.error('Error al actualizar centro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar centro',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await dispatchCenterModel.delete(id);

            res.json({
                success: true,
                message: 'Centro eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar centro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar centro',
                error: error.message
            });
        }
    }
}

module.exports = new DispatchCenterController();








