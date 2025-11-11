const Supplier = require('../models/Supplier');

const supplierModel = new Supplier();

// Obtener todos los proveedores
const getAll = async (req, res) => {
    try {
        const suppliers = await supplierModel.findAllWithStats();
        res.json({
            success: true,
            data: { suppliers }
        });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores',
            error: error.message
        });
    }
};

// Obtener proveedor por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await supplierModel.findByIdWithStats(id);
        
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            data: { supplier }
        });
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedor',
            error: error.message
        });
    }
};

// Crear proveedor
const create = async (req, res) => {
    try {
        const supplierData = req.body;
        const now = new Date().toISOString();
        
        const supplier = {
            name: supplierData.name,
            code: supplierData.code,
            contact_name: supplierData.contact_name || null,
            email: supplierData.email || null,
            phone: supplierData.phone || null,
            address: supplierData.address || null,
            city: supplierData.city || null,
            region: supplierData.region || null,
            country: supplierData.country || 'Chile',
            website: supplierData.website || null,
            notes: supplierData.notes || null,
            status: supplierData.status || 'active',
            created_at: now,
            updated_at: now
        };

        const id = await supplierModel.create(supplier);
        const newSupplier = await supplierModel.findById(id);

        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            data: { supplier: newSupplier }
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proveedor',
            error: error.message
        });
    }
};

// Actualizar proveedor
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierData = req.body;
        
        const supplier = await supplierModel.findById(id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        const updated = await supplierModel.update(id, supplierData);
        res.json({
            success: true,
            message: 'Proveedor actualizado exitosamente',
            data: { supplier: updated }
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proveedor',
            error: error.message
        });
    }
};

// Eliminar proveedor
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        
        const supplier = await supplierModel.findById(id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        await supplierModel.delete(id);
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
};

// Obtener estadísticas de proveedores
const getStats = async (req, res) => {
    try {
        const [
            allSuppliers, 
            topSuppliers, 
            byCountry,
            productsBySupplier,
            productsByCategory,
            priceRanges,
            lowStockProducts,
            supplierDependency
        ] = await Promise.all([
            supplierModel.findAll(),
            supplierModel.getTopSuppliers(5),
            supplierModel.getByCountry(),
            supplierModel.getProductsBySupplier(),
            supplierModel.getProductsByCategory(),
            supplierModel.getPriceRanges(),
            supplierModel.getLowStockProducts(),
            supplierModel.getSupplierDependencyAnalysis()
        ]);

        // Debug logs - Validación completa de datos
        console.log('📊 [getStats] ===== VALIDACIÓN DE DATOS =====');
        console.log('📊 [getStats] productsBySupplier count:', productsBySupplier?.length);
        if (productsBySupplier && productsBySupplier.length > 0) {
            const firstSupplier = productsBySupplier[0];
            console.log('📊 [getStats] Primer proveedor completo:', JSON.stringify(firstSupplier, null, 2));
            console.log('📊 [getStats] Tiene array products?:', Array.isArray(firstSupplier?.products));
            console.log('📊 [getStats] Products length:', firstSupplier?.products?.length);
            
            // VALIDACIÓN: Si no tiene products, es un error
            if (!Array.isArray(firstSupplier?.products)) {
                console.error('⚠️ [getStats] ERROR: productsBySupplier[0] NO tiene array products!');
                console.error('⚠️ [getStats] Estructura recibida:', Object.keys(firstSupplier));
            }
        }
        console.log('📊 [getStats] productsByCategory count:', productsByCategory?.length);
        if (productsByCategory && productsByCategory.length > 0) {
            const firstCategory = productsByCategory[0];
            console.log('📊 [getStats] Primer item categorías completo:', JSON.stringify(firstCategory, null, 2));
            console.log('📊 [getStats] Tiene supplier_name?:', !!firstCategory?.supplier_name);
            console.log('📊 [getStats] Tiene array categories?:', Array.isArray(firstCategory?.categories));
            console.log('📊 [getStats] Categories length:', firstCategory?.categories?.length);
            
            // VALIDACIÓN: Si no tiene supplier_name o categories, es un error
            if (!firstCategory?.supplier_name || !Array.isArray(firstCategory?.categories)) {
                console.error('⚠️ [getStats] ERROR: productsByCategory[0] NO tiene estructura correcta!');
                console.error('⚠️ [getStats] Estructura recibida:', Object.keys(firstCategory));
            }
        }
        console.log('📊 [getStats] priceRanges type:', Array.isArray(priceRanges) ? 'array' : typeof priceRanges);
        if (Array.isArray(priceRanges)) {
            console.log('📊 [getStats] priceRanges count:', priceRanges.length);
            if (priceRanges.length > 0) {
                console.log('📊 [getStats] Primer priceRange:', JSON.stringify(priceRanges[0], null, 2));
            }
        } else {
            console.error('⚠️ [getStats] ERROR: priceRanges NO es array!');
            console.error('⚠️ [getStats] priceRanges type:', typeof priceRanges);
            console.error('⚠️ [getStats] priceRanges value:', JSON.stringify(priceRanges, null, 2));
        }
        console.log('📊 [getStats] ===== FIN VALIDACIÓN =====');

        // VALIDACIÓN FINAL: Asegurar que los datos tienen el formato correcto antes de enviar
        const validatedProductsBySupplier = Array.isArray(productsBySupplier) ? productsBySupplier : [];
        const validatedProductsByCategory = Array.isArray(productsByCategory) ? productsByCategory : [];
        const validatedPriceRanges = Array.isArray(priceRanges) ? priceRanges : [];

        const stats = {
            total: allSuppliers.length,
            active: allSuppliers.filter(s => s.status === 'active').length,
            topSuppliers,
            byCountry,
            productsBySupplier: validatedProductsBySupplier,
            productsByCategory: validatedProductsByCategory,
            priceRanges: validatedPriceRanges,
            lowStockProducts,
            supplierDependency
        };

        // LOG FINAL: Verificar qué se está enviando realmente
        console.log('📤 [getStats] ===== ENVIANDO RESPUESTA =====');
        console.log('📤 [getStats] stats.productsBySupplier[0] keys:', Object.keys(stats.productsBySupplier[0] || {}));
        console.log('📤 [getStats] stats.productsBySupplier[0] tiene products?:', 'products' in (stats.productsBySupplier[0] || {}));
        console.log('📤 [getStats] stats.productsByCategory[0] keys:', Object.keys(stats.productsByCategory[0] || {}));
        console.log('📤 [getStats] stats.productsByCategory[0] tiene supplier_name?:', 'supplier_name' in (stats.productsByCategory[0] || {}));
        console.log('📤 [getStats] stats.priceRanges es array?:', Array.isArray(stats.priceRanges));
        
        // Serializar y parsear para simular lo que hace Express
        const jsonString = JSON.stringify(stats);
        const parsed = JSON.parse(jsonString);
        console.log('📤 [getStats] Después de JSON.stringify/parse:');
        console.log('📤 [getStats] parsed.productsBySupplier[0] tiene products?:', 'products' in (parsed.productsBySupplier[0] || {}));
        console.log('📤 [getStats] parsed.productsByCategory[0] tiene supplier_name?:', 'supplier_name' in (parsed.productsByCategory[0] || {}));
        console.log('📤 [getStats] parsed.priceRanges es array?:', Array.isArray(parsed.priceRanges));
        console.log('📤 [getStats] ===== FIN ENVÍO =====');

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
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getStats
};

