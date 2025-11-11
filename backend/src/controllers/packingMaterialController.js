// backend/src/controllers/packingMaterialController.js
const PackingMaterial = require('../models/PackingMaterial');

const packingMaterialModel = new PackingMaterial();

class PackingMaterialController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const materials = active_only === 'true' 
                ? await packingMaterialModel.getActive()
                : await packingMaterialModel.findAll();
            
            res.json({
                success: true,
                data: { materials },
                count: materials.length
            });
        } catch (error) {
            console.error('Error al obtener materiales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener materiales',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const material = await packingMaterialModel.findById(id);

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: 'Material no encontrado'
                });
            }

            res.json({
                success: true,
                data: { material }
            });
        } catch (error) {
            console.error('Error al obtener material:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener material',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await packingMaterialModel.create(req.body);
            const material = await packingMaterialModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Material creado exitosamente',
                data: { material }
            });
        } catch (error) {
            console.error('Error al crear material:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear material',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const material = await packingMaterialModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Material actualizado exitosamente',
                data: { material }
            });
        } catch (error) {
            console.error('Error al actualizar material:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar material',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await packingMaterialModel.delete(id);

            res.json({
                success: true,
                message: 'Material eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar material:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar material',
                error: error.message
            });
        }
    }

    async getLowStock(req, res) {
        try {
            const materials = await packingMaterialModel.getLowStock();
            res.json({
                success: true,
                data: { materials },
                count: materials.length
            });
        } catch (error) {
            console.error('Error al obtener materiales con stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener materiales con stock bajo',
                error: error.message
            });
        }
    }
}

module.exports = new PackingMaterialController();








