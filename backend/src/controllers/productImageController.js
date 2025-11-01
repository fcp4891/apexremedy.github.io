const ProductImage = require('../models/ProductImage');
const productImageModel = new ProductImage();

class ProductImageController {
    async create(req, res) {
        try {
            const { product_id, url, alt_text, is_primary, display_order } = req.body;
            
            const imageId = await productImageModel.create({
                product_id,
                url,
                alt_text,
                display_order,
                is_primary
            });
            
            res.status(201).json({
                success: true,
                message: 'Imagen agregada exitosamente',
                data: { id: imageId }
            });
            
        } catch (error) {
            console.error('Error al crear imagen:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear imagen',
                error: error.message
            });
        }
    }
    
    async getByProductId(req, res) {
        try {
            const { productId } = req.params;
            const images = await productImageModel.findByProductId(productId);
            
            res.json({
                success: true,
                data: { images }
            });
            
        } catch (error) {
            console.error('Error al obtener imágenes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener imágenes',
                error: error.message
            });
        }
    }
}

module.exports = new ProductImageController();