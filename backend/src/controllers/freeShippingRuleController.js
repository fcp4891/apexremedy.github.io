// backend/src/controllers/freeShippingRuleController.js
const FreeShippingRule = require('../models/FreeShippingRule');

const ruleModel = new FreeShippingRule();

class FreeShippingRuleController {
    async getAll(req, res) {
        try {
            const { active_only } = req.query;
            const rules = active_only === 'true' 
                ? await ruleModel.getActive()
                : await ruleModel.findAll();
            
            res.json({
                success: true,
                data: { rules },
                count: rules.length
            });
        } catch (error) {
            console.error('Error al obtener reglas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reglas',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const rule = await ruleModel.findById(id);

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    message: 'Regla no encontrada'
                });
            }

            res.json({
                success: true,
                data: { rule }
            });
        } catch (error) {
            console.error('Error al obtener regla:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener regla',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const id = await ruleModel.create(req.body);
            const rule = await ruleModel.findById(id);

            res.status(201).json({
                success: true,
                message: 'Regla creada exitosamente',
                data: { rule }
            });
        } catch (error) {
            console.error('Error al crear regla:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear regla',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const rule = await ruleModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Regla actualizada exitosamente',
                data: { rule }
            });
        } catch (error) {
            console.error('Error al actualizar regla:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar regla',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await ruleModel.delete(id);

            res.json({
                success: true,
                message: 'Regla eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar regla:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar regla',
                error: error.message
            });
        }
    }
}

module.exports = new FreeShippingRuleController();








