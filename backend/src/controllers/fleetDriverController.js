// backend/src/controllers/fleetDriverController.js
const FleetDriver = require('../models/FleetDriver');

const fleetDriverModel = new FleetDriver();

class FleetDriverController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const drivers = active_only === 'true' 
                ? await fleetDriverModel.getActive()
                : await fleetDriverModel.findAll();
            
            res.json({
                success: true,
                data: { drivers },
                count: drivers.length
            });
        } catch (error) {
            console.error('Error al obtener conductores:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener conductores',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const driver = await fleetDriverModel.findById(id);

            if (!driver) {
                return res.status(404).json({
                    success: false,
                    message: 'Conductor no encontrado'
                });
            }

            res.json({
                success: true,
                data: { driver }
            });
        } catch (error) {
            console.error('Error al obtener conductor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener conductor',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await fleetDriverModel.create(req.body);
            const driver = await fleetDriverModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Conductor creado exitosamente',
                data: { driver }
            });
        } catch (error) {
            console.error('Error al crear conductor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear conductor',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const driver = await fleetDriverModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Conductor actualizado exitosamente',
                data: { driver }
            });
        } catch (error) {
            console.error('Error al actualizar conductor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar conductor',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await fleetDriverModel.delete(id);

            res.json({
                success: true,
                message: 'Conductor eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar conductor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar conductor',
                error: error.message
            });
        }
    }
}

module.exports = new FleetDriverController();








