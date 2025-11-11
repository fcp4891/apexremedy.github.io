// backend/src/controllers/shipmentController.js
const Shipment = require('../models/Shipment');

const shipmentModel = new Shipment();

class ShipmentController {
    async getAll(req, res) {
        try {
            const shipments = await shipmentModel.findAll();
            
            res.json({
                success: true,
                data: { shipments },
                count: shipments.length
            });
        } catch (error) {
            console.error('Error al obtener envíos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener envíos',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const shipment = await shipmentModel.findById(id);

            if (!shipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Envío no encontrado'
                });
            }

            res.json({
                success: true,
                data: { shipment }
            });
        } catch (error) {
            console.error('Error al obtener envío:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener envío',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await shipmentModel.create(req.body);
            const shipment = await shipmentModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Envío creado exitosamente',
                data: { shipment }
            });
        } catch (error) {
            console.error('Error al crear envío:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear envío',
                error: error.message
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, location, description } = req.body;
            
            const shipment = await shipmentModel.updateStatus(id, status, location, description);

            res.json({
                success: true,
                message: 'Estado del envío actualizado exitosamente',
                data: { shipment }
            });
        } catch (error) {
            console.error('Error al actualizar estado del envío:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado del envío',
                error: error.message
            });
        }
    }

    async getByOrder(req, res) {
        try {
            const { orderId } = req.params;
            const shipments = await shipmentModel.getByOrder(orderId);

            res.json({
                success: true,
                data: { shipments },
                count: shipments.length
            });
        } catch (error) {
            console.error('Error al obtener envíos por orden:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener envíos por orden',
                error: error.message
            });
        }
    }

    async getByTracking(req, res) {
        try {
            const { trackingNumber } = req.params;
            const shipment = await shipmentModel.getByTracking(trackingNumber);

            if (!shipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Envío no encontrado'
                });
            }

            res.json({
                success: true,
                data: { shipment }
            });
        } catch (error) {
            console.error('Error al buscar envío por tracking:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar envío por tracking',
                error: error.message
            });
        }
    }
}

module.exports = new ShipmentController();








