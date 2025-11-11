// backend/src/controllers/shippingProviderController.js
const ShippingProvider = require('../models/ShippingProvider');

const shippingProviderModel = new ShippingProvider();

class ShippingProviderController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const providers = active_only === 'true' 
                ? await shippingProviderModel.getActive()
                : await shippingProviderModel.findAll();
            
            res.json({
                success: true,
                data: { providers },
                count: providers.length
            });
        } catch (error) {
            console.error('Error al obtener proveedores de envío:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener proveedores de envío',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const provider = await shippingProviderModel.findById(id);

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Proveedor no encontrado'
                });
            }

            res.json({
                success: true,
                data: { provider }
            });
        } catch (error) {
            console.error('Error al obtener proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener proveedor',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await shippingProviderModel.create(req.body);
            const provider = await shippingProviderModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Proveedor creado exitosamente',
                data: { provider }
            });
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear proveedor',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const provider = await shippingProviderModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Proveedor actualizado exitosamente',
                data: { provider }
            });
        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar proveedor',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await shippingProviderModel.delete(id);

            res.json({
                success: true,
                message: 'Proveedor eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar proveedor',
                error: error.message
            });
        }
    }
}

module.exports = new ShippingProviderController();








