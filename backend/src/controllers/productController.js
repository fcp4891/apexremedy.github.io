// backend/src/controllers/productController.js
const Product = require('../models/Product');

const productModel = new Product();

class ProductController {
    async getAll(req, res) {
        try {
            const {
                category,
                minPrice,
                maxPrice,
                featured,
                inStock,
                search,
                orderBy = 'name',
                order = 'ASC',
                limit,
                offset
            } = req.query;

            const filters = {
                category,
                minPrice: minPrice ? parseInt(minPrice) : undefined,
                maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
                featured: featured === 'true' ? true : undefined,
                inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
                search,
                orderBy,
                order,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            };

            const user = req.user;
            console.log('🔍 [getAll] Debug info:');
            console.log('  - user:', user ? { 
                id: user.id,
                email: user.email, 
                role: user.role, 
                account_status: user.account_status,
                is_verified: user.is_verified,
                is_active: user.is_active 
            } : 'no user');
            
            // Solo excluir productos medicinales si NO es admin y NO está aprobado
            if (!user || (user.role !== 'admin' && user.account_status !== 'approved')) {
                filters.excludeMedicinal = true;
                console.log('  - Excluyendo productos medicinales');
            } else {
                console.log('  - Incluyendo productos medicinales (admin o aprobado)');
            }

            const products = await productModel.findAllWithFilters(filters);
            console.log('  - Productos devueltos:', products.length);

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const product = await productModel.findById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            if (product.requires_prescription) {
                const user = req.user;
                
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Debes iniciar sesión para ver este producto',
                        requires_auth: true
                    });
                }
                
                if (user.account_status !== 'approved' && user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Tu cuenta debe estar aprobada para ver productos medicinales',
                        requires_approval: true,
                        account_status: user.account_status
                    });
                }
            }

            res.json({
                success: true,
                data: { product }
            });
        } catch (error) {
            console.error('Error al obtener producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener producto',
                error: error.message
            });
        }
    }

    async search(req, res) {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Query de búsqueda requerido'
                });
            }

            let products = await productModel.search(q);
            
            const user = req.user;
            // Solo filtrar productos medicinales si NO es admin y NO está aprobado
            if (!user || (user.role !== 'admin' && user.account_status !== 'approved')) {
                products = products.filter(p => !p.requires_prescription);
            }

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al buscar productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar productos',
                error: error.message
            });
        }
    }

    async getFeatured(req, res) {
        try {
            let products = await productModel.getFeatured();
            
            const user = req.user;
            // Solo filtrar productos medicinales si NO es admin y NO está aprobado
            if (!user || (user.role !== 'admin' && user.account_status !== 'approved')) {
                products = products.filter(p => !p.requires_prescription);
            }

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al obtener destacados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos destacados',
                error: error.message
            });
        }
    }

    async getCategories(req, res) {
        try {
            const user = req.user;
            const { all = 'false' } = req.query; // Query param para forzar todas las categorías
            
            console.log('🔍 [getCategories] Debug info:');
            console.log('  - all param:', all);
            console.log('  - user:', user ? { role: user.role, account_status: user.account_status } : 'no user');
            
            let categories;
            
            // Si es admin o se solicita 'all=true', cargar TODAS las categorías disponibles
            if (all === 'true' || (user && user.role === 'admin')) {
                console.log('  - Usando getAllAvailableCategories()');
                // Obtener todas las categorías de la tabla product_categories
                categories = await productModel.getAllAvailableCategories();
            } else if (!user || user.account_status !== 'approved') {
                console.log('  - Usando getPublicCategories()');
                // Usuario no autenticado: solo categorías públicas
                categories = await productModel.getPublicCategories();
            } else {
                console.log('  - Usando getCategories()');
                // Usuario aprobado: categorías de productos existentes
                categories = await productModel.getCategories();
            }

            console.log('  - Categorías devueltas:', categories.length);
            console.log('  - Categorías:', categories);

            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener categorías',
                error: error.message
            });
        }
    }

    async getBestSellers(req, res) {
        try {
            const { limit = 10 } = req.query;
            const products = await productModel.getBestSellers(parseInt(limit));

            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Error al obtener best sellers:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos más vendidos',
                error: error.message
            });
        }
    }

    async getMedicinalProducts(req, res) {
        try {
            const { limit = 50 } = req.query;
            const products = await productModel.getMedicinalProducts(parseInt(limit));

            res.json({
                success: true,
                data: { products },
                count: products.length,
                message: 'Productos medicinales obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener productos medicinales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos medicinales',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const productData = req.body;
            const productId = await productModel.create(productData);
            const product = await productModel.findById(productId);

            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                data: product
            });
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear producto',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const productData = req.body;

            const product = await productModel.update(id, productData);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Producto actualizado exitosamente',
                data: product
            });
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar producto',
                error: error.message
            });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const deleted = await productModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar producto',
                error: error.message
            });
        }
    }

    // Alias para delete
    async delete(req, res) {
        return this.deleteProduct(req, res);
    }

    async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { quantity } = req.body;

            const product = await productModel.updateStock(id, quantity);

            res.json({
                success: true,
                message: 'Stock actualizado exitosamente',
                data: product
            });
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar stock',
                error: error.message
            });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await productModel.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }

    async getBrands(req, res) {
        try {
            // Implementación temporal - devolver array vacío
            res.json({
                success: true,
                data: { brands: [] }
            });
        } catch (error) {
            console.error('Error al obtener marcas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener marcas',
                error: error.message
            });
        }
    }

    async getTags(req, res) {
        try {
            // Implementación temporal - devolver array vacío
            res.json({
                success: true,
                data: { tags: [] }
            });
        } catch (error) {
            console.error('Error al obtener tags:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tags',
                error: error.message
            });
        }
    }

    async getByType(req, res) {
        try {
            const { type } = req.params;
            const filters = { type };
            
            const user = req.user;
            // Solo excluir productos medicinales si NO es admin y NO está aprobado
            if (!user || (user.role !== 'admin' && user.account_status !== 'approved')) {
                filters.excludeMedicinal = true;
            }

            const products = await productModel.findAllWithFilters(filters);

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al obtener productos por tipo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos por tipo',
                error: error.message
            });
        }
    }

    async getBySlug(req, res) {
        try {
            const { slug } = req.params;
            // Implementación temporal - buscar por ID si slug es numérico
            const product = await productModel.findById(slug);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // Validar acceso a productos medicinales
            if (product.requires_prescription) {
                const user = req.user;
                
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Debes iniciar sesión para ver este producto',
                        requires_auth: true
                    });
                }
                
                if (user.account_status !== 'approved' && user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Tu cuenta debe estar aprobada para ver productos medicinales',
                        requires_approval: true
                    });
                }
            }

            res.json({
                success: true,
                data: { product }
            });
        } catch (error) {
            console.error('Error al obtener producto por slug:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener producto por slug',
                error: error.message
            });
        }
    }

    async getLowStock(req, res) {
        try {
            const products = await productModel.getLowStock();

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al obtener productos con stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos con stock bajo',
                error: error.message
            });
        }
    }

    async getOutOfStock(req, res) {
        try {
            const products = await productModel.findAllWithFilters({ inStock: false });

            res.json({
                success: true,
                data: { products },
                count: products.length
            });
        } catch (error) {
            console.error('Error al obtener productos sin stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos sin stock',
                error: error.message
            });
        }
    }
}

module.exports = new ProductController();