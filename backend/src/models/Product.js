// backend/src/models/Product.js
const BaseModel = require('./index');

const PLACEHOLDER_IMAGE_URL = './images/catalogo/placeholder_2.png';

class Product extends BaseModel {
    constructor() {
        super('products');
    }
    
    async findById(id) {
        try {
            // Asegurar que id sea un número
            const productId = parseInt(id);
            
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug, 
                       s.id as supplier_id, s.name as supplier_name, s.code as supplier_code
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.id = ?
            `;
            const product = await this.db.get(sql, [productId]);
            if (!product) {
                console.warn(`⚠️ [findById] Producto con ID ${productId} no encontrado`);
                return null;
            }
            
            // Normalizar campos para compatibilidad con frontend
            product.price = product.base_price;
            product.stock = product.stock_quantity;
            
            // Agregar info del proveedor si existe
            if (product.supplier_id || product.supplier_name || product.supplier_code) {
                product.supplier = {
                    id: product.supplier_id || null,
                    name: product.supplier_name || null,
                    code: product.supplier_code || null
                };
            }
            
            // Limpiar campos temporales del JOIN
            delete product.supplier_id;
            delete product.supplier_name;
            delete product.supplier_code;

            if (product.attributes && typeof product.attributes === 'string') {
                try {
                    product.attributes = JSON.parse(product.attributes);
                } catch (e) {
                    console.error('Error parsing attributes:', e);
                    product.attributes = null;
                }
            }
            
            if (product.price_variants && typeof product.price_variants === 'string') {
                try {
                    product.price_variants = JSON.parse(product.price_variants);
                } catch (e) {
                    console.error('Error parsing price_variants:', e);
                    product.price_variants = null;
                }
            }
            
            if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                try {
                    product.medicinal_info = JSON.parse(product.medicinal_info);
                } catch (e) {
                    console.error('Error parsing medicinal_info:', e);
                    product.medicinal_info = null;
                }
            }
            
            // Cargar imágenes de product_images
            product.images = await this.getProductImages(productId);
            
            // Cargar variantes de precio
            product.price_variants = await this.getProductPriceVariants(productId);
            
            console.log('📖 [findById] Producto cargado:', {
                id: product.id,
                name: product.name,
                base_price: product.base_price,
                price_variants_count: product.price_variants ? product.price_variants.length : 0
            });
            
            return product;
        } catch (error) {
            console.error('Error in Product.findById:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug, 
                       s.id as supplier_id, s.name as supplier_name, s.code as supplier_code
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                LEFT JOIN suppliers s ON p.supplier_id = s.id
            `;
            const products = await this.db.all(sql);
            // Cargar todas las imágenes de una vez
            const productIds = products.map(p => p.id);
            let imagesMap = {};
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const imagesSql = `
                    SELECT product_id, url, alt_text, display_order, is_primary
                    FROM product_images
                    WHERE product_id IN (${placeholders})
                    ORDER BY is_primary DESC, display_order ASC
                `;
                const allImages = await this.db.all(imagesSql, productIds);
                
                // Organizar imágenes por product_id
                allImages.forEach(img => {
                    if (!imagesMap[img.product_id]) {
                        imagesMap[img.product_id] = [];
                    }
                    imagesMap[img.product_id].push({
                        id: img.id || null,
                        url: img.url,
                        alt_text: img.alt_text || '',
                        display_order: img.display_order || 0,
                        is_primary: img.is_primary || 0
                    });
                });
            }
            
            return products.map(product => {
                // Normalizar campos
                product.price = product.base_price;
                product.stock = product.stock_quantity;
                
                // Agregar imágenes desde product_images
                if (imagesMap[product.id]) {
                    product.images = imagesMap[product.id];
                } else {
                    product.images = [{
                        id: null,
                        url: PLACEHOLDER_IMAGE_URL,
                        alt_text: 'Imagen no disponible',
                        display_order: 0,
                        is_primary: 1
                    }];
                }
                
                if (product.attributes && typeof product.attributes === 'string') {
                    try {
                        product.attributes = JSON.parse(product.attributes);
                    } catch (e) {
                        console.error('Error parsing attributes:', e);
                        product.attributes = null;
                    }
                }
                
                if (product.price_variants && typeof product.price_variants === 'string') {
                    try {
                        product.price_variants = JSON.parse(product.price_variants);
                    } catch (e) {
                        console.error('Error parsing price_variants:', e);
                        product.price_variants = null;
                    }
                }
                
                if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                    try {
                        product.medicinal_info = JSON.parse(product.medicinal_info);
                    } catch (e) {
                        console.error('Error parsing medicinal_info:', e);
                        product.medicinal_info = null;
                    }
                }
                
                return product;
            });
        } catch (error) {
            console.error('Error in Product.findAll:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Asegurar que id sea un número
            const productId = parseInt(id);
            
            console.log('🔄 [UPDATE] Iniciando actualización:', {
                id: productId,
                idType: typeof productId,
                originalId: id
            });
            
            const product = await this.findById(productId);
            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado`);
            }
            
            console.log('📦 [UPDATE] Producto actual (antes de actualizar):', {
                id: product.id,
                name: product.name,
                base_price: product.base_price
            });

            // Mapear category_slug a category_id si viene del frontend
            let categoryId = data.category_id;
            if (!categoryId && data.category_slug) {
                const category = await this.db.get(
                    'SELECT id FROM product_categories WHERE slug = ?',
                    [data.category_slug]
                );
                categoryId = category ? category.id : null;
            }

            // base_price es MANUAL - solo se actualiza si viene explícitamente en data
            // NO se calcula automáticamente desde las variantes

            // Construir updateData solo con campos que vienen en data o que deben actualizarse
            const updateData = {};
            
            // Campos que siempre se actualizan si vienen en data
            if (data.name !== undefined) updateData.name = data.name;
            if (data.slug !== undefined) {
                updateData.slug = data.slug;
            } else if (data.name !== undefined) {
                updateData.slug = data.name.toLowerCase().replace(/\s+/g, '-');
            }
            if (data.sku !== undefined) updateData.sku = data.sku;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.short_description !== undefined) updateData.short_description = data.short_description;
            if (categoryId !== undefined) updateData.category_id = categoryId;
            if (data.category_id !== undefined) updateData.category_id = data.category_id;
            if (data.brand_id !== undefined) {
                updateData.brand_id = data.brand_id === null || data.brand_id === '' ? null : parseInt(data.brand_id);
                console.log('🏷️ brand_id será actualizado:', {
                    valorRecibido: data.brand_id,
                    valorFinal: updateData.brand_id
                });
            }
            if (data.product_type !== undefined) updateData.product_type = data.product_type;
            if (data.is_medicinal !== undefined) updateData.is_medicinal = data.is_medicinal ? 1 : 0;
            if (data.requires_prescription !== undefined) updateData.requires_prescription = data.requires_prescription ? 1 : 0;
            if (data.medical_category !== undefined) updateData.medical_category = data.medical_category;
            
            // base_price: Solo actualizar si viene explícitamente en data (MANUAL)
            // IMPORTANTE: Incluir SIEMPRE si viene en data, incluso si es el mismo valor
            // Esto permite forzar una actualización del campo updated_at
            if (data.base_price !== undefined && data.base_price !== null && data.base_price !== '') {
                const newBasePrice = parseFloat(data.base_price);
                if (!isNaN(newBasePrice) && newBasePrice >= 0) {
                    updateData.base_price = newBasePrice;
                    console.log('💰 base_price será actualizado (manual):', {
                        actual: parseFloat(product.base_price) || 0,
                        nuevo: newBasePrice,
                        esIgual: Math.abs(parseFloat(product.base_price || 0) - newBasePrice) < 0.01,
                        seActualizará: 'SI (siempre que venga en data)'
                    });
                } else {
                    console.warn('⚠️ base_price inválido, se mantiene el actual');
                }
            } else if (data.price !== undefined && data.price !== null && data.price !== '') {
                // Si viene como 'price', también aceptarlo
                const newPrice = parseFloat(data.price);
                if (!isNaN(newPrice) && newPrice >= 0) {
                    updateData.base_price = newPrice;
                    console.log('💰 base_price será actualizado desde price (manual):', {
                        actual: parseFloat(product.base_price) || 0,
                        nuevo: newPrice
                    });
                }
            } else {
                console.log('💰 base_price no se actualizará (no viene en data)');
            }
            
            if (data.stock_quantity !== undefined) updateData.stock_quantity = parseFloat(data.stock_quantity || 0);
            if (data.stock !== undefined) updateData.stock_quantity = parseFloat(data.stock);
            if (data.stock_unit !== undefined) updateData.stock_unit = data.stock_unit;
            if (data.unit_type !== undefined) updateData.unit_type = data.unit_type;
            if (data.base_unit !== undefined) updateData.base_unit = data.base_unit;
            if (data.unit_size !== undefined) updateData.unit_size = data.unit_size;
            if (data.cannabinoid_profile !== undefined) updateData.cannabinoid_profile = JSON.stringify(data.cannabinoid_profile);
            if (data.terpene_profile !== undefined) updateData.terpene_profile = JSON.stringify(data.terpene_profile);
            if (data.strain_info !== undefined) updateData.strain_info = JSON.stringify(data.strain_info);
            if (data.therapeutic_info !== undefined) updateData.therapeutic_info = JSON.stringify(data.therapeutic_info);
            if (data.usage_info !== undefined) updateData.usage_info = JSON.stringify(data.usage_info);
            if (data.safety_info !== undefined) updateData.safety_info = JSON.stringify(data.safety_info);
            if (data.specifications !== undefined) updateData.specifications = JSON.stringify(data.specifications);
            if (data.attributes !== undefined) updateData.attributes = JSON.stringify(data.attributes);
            if (data.featured !== undefined) {
                updateData.featured = data.featured ? 1 : 0;
                console.log('⭐ featured será actualizado:', {
                    valorRecibido: data.featured,
                    valorFinal: updateData.featured
                });
            }
            if (data.status !== undefined) {
                updateData.status = data.status;
                console.log('📊 status será actualizado:', {
                    valorRecibido: data.status,
                    valorFinal: updateData.status
                });
            }
            
            // updated_at siempre se actualiza
            updateData.updated_at = new Date().toISOString();
            
            console.log('📝 [UPDATE] Campos a actualizar:', {
                fieldsCount: Object.keys(updateData).length,
                fields: Object.keys(updateData),
                base_price: updateData.base_price,
                base_priceIncluded: 'base_price' in updateData
            });
            
            console.log('📝 Datos de actualización:', {
                base_price: updateData.base_price,
                has_price_variants: !!(data.price_variants && data.price_variants.length > 0),
                price_variants_count: data.price_variants ? data.price_variants.length : 0
            });

            // Filtrar campos que realmente deben actualizarse (excluir undefined)
            const fieldsToUpdate = Object.keys(updateData).filter(field => updateData[field] !== undefined);
            const placeholders = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
            const values = fieldsToUpdate.map(field => {
                const value = updateData[field];
                // Convertir null explícito a NULL de SQL, mantener otros valores
                // Asegurar que los números sean números válidos
                if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
                    console.warn(`⚠️ [UPDATE SQL] Valor inválido para campo ${field}:`, value);
                    return null;
                }
                return value === null ? null : value;
            });
            
            if (fieldsToUpdate.length === 0) {
                console.warn('⚠️ [UPDATE SQL] No hay campos para actualizar');
                return await this.findById(productId);
            }
            
            const sql = `UPDATE ${this.tableName} SET ${placeholders} WHERE id = ?`;
            const params = [...values, productId];
            
            console.log('🔧 [UPDATE SQL] Ejecutando:', {
                sql: sql.substring(0, 300),
                id: productId,
                idType: typeof productId,
                fieldsCount: fieldsToUpdate.length,
                fields: fieldsToUpdate,
                base_price: updateData.base_price,
                base_priceType: typeof updateData.base_price,
                base_priceIncluded: fieldsToUpdate.includes('base_price'),
                paramsCount: params.length,
                sampleValues: fieldsToUpdate.slice(0, 5).map(f => ({ field: f, value: updateData[f], type: typeof updateData[f] }))
            });
            
            try {
                const result = await this.db.run(sql, params);
            
                console.log('✅ [UPDATE SQL] Resultado:', {
                    changes: result.changes,
                    lastID: result.lastID,
                    success: result.changes > 0,
                    sqlExecuted: sql.substring(0, 150)
                });
                
                if (result.changes === 0) {
                    console.error('❌ [UPDATE SQL] No se actualizó ninguna fila. Verificar que el ID existe y los valores son diferentes.');
                    // Verificar si el producto existe
                    const exists = await this.db.get(`SELECT id, base_price FROM ${this.tableName} WHERE id = ?`, [productId]);
                    console.log('🔍 [UPDATE SQL] Producto existe:', !!exists);
                    if (exists) {
                        console.log('🔍 [UPDATE SQL] Valores actuales en BD:', {
                            id: exists.id,
                            base_price: exists.base_price,
                            base_priceType: typeof exists.base_price,
                            nuevo_base_price: updateData.base_price,
                            sonIguales: exists.base_price == updateData.base_price
                        });
                    }
                } else {
                    console.log('✅ [UPDATE SQL] Actualización exitosa:', result.changes, 'fila(s) actualizada(s)');
                }
            } catch (sqlError) {
                console.error('❌ [UPDATE SQL] Error ejecutando UPDATE:', sqlError);
                console.error('  - Error message:', sqlError.message);
                console.error('  - SQL:', sql.substring(0, 200));
                console.error('  - Params count:', params.length);
                console.error('  - Sample params:', params.slice(0, 5));
                throw sqlError;
            }
            
            // Manejar imágenes en product_images
            const imagesToSave = [];
            if (data.image) {
                imagesToSave.push({ url: data.image, display_order: 0, is_primary: 1 });
                console.log('📸 Imagen principal recibida para producto', id);
            }
            if (data.productSecondImage) {
                imagesToSave.push({ url: data.productSecondImage, display_order: 1, is_primary: 0 });
                console.log('📸 Segunda imagen recibida para producto', id);
            }
            
            if (imagesToSave.length > 0) {
                console.log('💾 Guardando', imagesToSave.length, 'imagen(es) en product_images para producto', id);
                await this.updateProductImages(id, imagesToSave);
                console.log('✅ Imágenes guardadas exitosamente en product_images');
            } else {
                console.log('⚠️ No se recibieron imágenes para guardar en product_images');
            }
            
            // Guardar variantes de precio si existen (siempre actualizar, incluso si viene vacío)
            if (data.price_variants !== undefined) {
                try {
                    if (Array.isArray(data.price_variants) && data.price_variants.length > 0) {
                        console.log('💾 [UPDATE] Guardando', data.price_variants.length, 'variante(s) de precio para producto', productId);
                        await this.updateProductPriceVariants(productId, data.price_variants);
                        console.log('✅ [UPDATE] Variantes de precio guardadas exitosamente');
                    } else {
                        // Si viene un array vacío, eliminar todas las variantes
                        console.log('🗑️ [UPDATE] Eliminando todas las variantes de precio (array vacío)');
                        await this.updateProductPriceVariants(productId, []);
                    }
                } catch (variantsError) {
                    console.error('❌ [UPDATE] Error al guardar variantes de precio (continuando actualización):', variantsError);
                    console.error('  - Error message:', variantsError.message);
                    console.error('  - Error stack:', variantsError.stack);
                    // Continuar con la actualización del producto aunque falle las variantes
                    // El producto se actualiza pero las variantes no
                }
            }
            
            // Retornar producto actualizado (verificar que se actualizó correctamente)
            const updatedProduct = await this.findById(productId);
            
            if (!updatedProduct) {
                throw new Error('Error al recuperar el producto actualizado');
            }
            
            console.log('✅ [UPDATE] Producto actualizado (después de actualizar):', {
                id: updatedProduct.id,
                name: updatedProduct.name,
                base_price: updatedProduct.base_price,
                price_variants_count: updatedProduct.price_variants ? updatedProduct.price_variants.length : 0,
                base_priceChanged: updatedProduct.base_price !== product.base_price
            });
            
            return updatedProduct;
        } catch (error) {
            console.error('❌ [UPDATE] Error en Product.update:', error);
            console.error('  - Error stack:', error.stack);
            console.error('  - productId:', productId);
            console.error('  - data recibida:', {
                hasBasePrice: data.base_price !== undefined,
                hasPriceVariants: data.price_variants !== undefined,
                priceVariantsCount: data.price_variants ? data.price_variants.length : 0
            });
            throw error;
        }
    }
    
    /**
     * Obtener imágenes de un producto de product_images
     */
    async getProductImages(productId) {
        try {
            const sql = `
                SELECT id, url, alt_text, display_order, is_primary
                FROM product_images
                WHERE product_id = ?
                ORDER BY display_order ASC
            `;
            return await this.db.all(sql, [productId]);
        } catch (error) {
            console.error('Error obteniendo imágenes del producto:', error);
            return [];
        }
    }
    
    /**
     * Actualizar imágenes de un producto en product_images
     */
    async updateProductImages(productId, images) {
        try {
            // Eliminar imágenes antiguas
            await this.db.run('DELETE FROM product_images WHERE product_id = ?', [productId]);
            
            // Insertar nuevas imágenes
            for (const img of images) {
                if (img.url) {
                    await this.db.run(
                        `INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [productId, img.url, img.alt_text || '', img.display_order || 0, 
                         img.is_primary || 0, new Date().toISOString()]
                    );
                }
            }
        } catch (error) {
            console.error('Error actualizando imágenes del producto:', error);
            throw error;
        }
    }
    
    /**
     * Obtener variantes de precio de un producto
     */
    async getProductPriceVariants(productId) {
        try {
            const sql = `
                SELECT id, variant_name, variant_type, quantity, unit, price, compare_at_price, is_default, status
                FROM product_price_variants
                WHERE product_id = ?
                ORDER BY quantity ASC
            `;
            return await this.db.all(sql, [productId]);
        } catch (error) {
            console.error('Error obteniendo variantes de precio del producto:', error);
            return [];
        }
    }
    
    /**
     * Actualizar variantes de precio de un producto
     */
    async updateProductPriceVariants(productId, priceVariants) {
        try {
            console.log('💾 [updateProductPriceVariants] Iniciando actualización de variantes:', {
                productId,
                variantsCount: priceVariants ? priceVariants.length : 0,
                variants: priceVariants
            });
            
            // Eliminar variantes antiguas
            console.log('🗑️ [updateProductPriceVariants] Eliminando variantes antiguas para producto', productId);
            await this.db.run('DELETE FROM product_price_variants WHERE product_id = ?', [productId]);
            console.log('✅ [updateProductPriceVariants] Variantes antiguas eliminadas');
            
            // Insertar nuevas variantes
            if (priceVariants && Array.isArray(priceVariants) && priceVariants.length > 0) {
                let insertedCount = 0;
                for (let i = 0; i < priceVariants.length; i++) {
                    const variant = priceVariants[i];
                    console.log(`📝 [updateProductPriceVariants] Procesando variante ${i + 1}:`, variant);
                    
                    // Validar que la variante tenga los datos mínimos requeridos
                    if (!variant.quantity || variant.price === undefined || variant.price === null) {
                        console.warn(`⚠️ [updateProductPriceVariants] Variante ${i + 1} ignorada (faltan datos):`, variant);
                        continue;
                    }
                    
                    // Validar tipos de datos
                    const quantity = parseFloat(variant.quantity);
                    const price = parseFloat(variant.price);
                    
                    if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price < 0) {
                        console.warn(`⚠️ [updateProductPriceVariants] Variante ${i + 1} ignorada (valores inválidos):`, {
                            quantity,
                            price,
                            original: variant
                        });
                        continue;
                    }
                    
                    try {
                        const variantName = variant.variant_name || `${quantity}${variant.unit || 'g'}`;
                        const variantType = variant.variant_type || 'quantity';
                        const unit = variant.unit || 'g';
                        const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
                        const isDefault = variant.is_default ? 1 : 0;
                        const status = variant.status || 'active';
                        const now = new Date().toISOString();
                        
                        console.log(`💾 [updateProductPriceVariants] Insertando variante ${i + 1}:`, {
                            productId,
                            variantName,
                            variantType,
                            quantity,
                            unit,
                            price,
                            compareAtPrice,
                            isDefault,
                            status
                        });
                        
                        await this.db.run(
                            `INSERT INTO product_price_variants 
                             (product_id, variant_name, variant_type, quantity, unit, price, compare_at_price, is_default, status, created_at, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                productId,
                                variantName,
                                variantType,
                                quantity,
                                unit,
                                price,
                                compareAtPrice,
                                isDefault,
                                status,
                                now,
                                now
                            ]
                        );
                        
                        insertedCount++;
                        console.log(`✅ [updateProductPriceVariants] Variante ${i + 1} insertada exitosamente`);
                    } catch (insertError) {
                        console.error(`❌ [updateProductPriceVariants] Error insertando variante ${i + 1}:`, insertError);
                        console.error('  - Error message:', insertError.message);
                        console.error('  - Error stack:', insertError.stack);
                        console.error('  - Variante:', variant);
                        throw insertError;
                    }
                }
                console.log(`✅ [updateProductPriceVariants] ${insertedCount} de ${priceVariants.length} variante(s) guardada(s) para producto ${productId}`);
            } else {
                console.log('ℹ️ [updateProductPriceVariants] No hay variantes para insertar (array vacío o null)');
            }
        } catch (error) {
            console.error('❌ [updateProductPriceVariants] Error actualizando variantes de precio:', error);
            console.error('  - Error message:', error.message);
            console.error('  - Error stack:', error.stack);
            console.error('  - productId:', productId);
            console.error('  - priceVariants:', priceVariants);
            throw error;
        }
    }

    async create(data) {
        try {
            // Mapear category_slug a category_id si viene del frontend
            let categoryId = data.category_id;
            if (!categoryId && data.category_slug) {
                const category = await this.db.get(
                    'SELECT id FROM product_categories WHERE slug = ?',
                    [data.category_slug]
                );
                categoryId = category ? category.id : null;
            }
            
            const productData = {
                name: data.name,
                slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
                sku: data.sku || null,
                description: data.description || null,
                short_description: data.short_description || null,
                category_id: categoryId || data.category,
                brand_id: data.brand_id || null,
                product_type: data.product_type || 'standard',
                is_medicinal: data.is_medicinal || (data.requires_prescription ? 1 : 0),
                requires_prescription: data.requires_prescription ? 1 : 0,
                medical_category: data.medical_category || null,
                base_price: parseFloat(data.base_price || data.price || 0),
                stock_quantity: parseFloat(data.stock_quantity || data.stock || 0),
                stock_unit: data.stock_unit || 'unidades',
                unit_type: data.unit_type || null,
                base_unit: data.base_unit || null,
                unit_size: data.unit_size || null,
                cannabinoid_profile: data.cannabinoid_profile ? JSON.stringify(data.cannabinoid_profile) : null,
                terpene_profile: data.terpene_profile ? JSON.stringify(data.terpene_profile) : null,
                strain_info: data.strain_info ? JSON.stringify(data.strain_info) : null,
                therapeutic_info: data.therapeutic_info ? JSON.stringify(data.therapeutic_info) : null,
                usage_info: data.usage_info ? JSON.stringify(data.usage_info) : null,
                safety_info: data.safety_info ? JSON.stringify(data.safety_info) : null,
                specifications: data.specifications ? JSON.stringify(data.specifications) : null,
                attributes: data.attributes ? JSON.stringify(data.attributes) : null,
                featured: data.featured ? 1 : 0,
                status: data.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const fields = Object.keys(productData).join(', ');
            const placeholders = Object.keys(productData).map(() => '?').join(', ');
            const values = Object.values(productData);

            const sql = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;
            const result = await this.db.run(sql, values);
            
            const productId = result.lastID;
            
            // Guardar imágenes en product_images si existen
            const imagesToSave = [];
            if (data.image) {
                imagesToSave.push({ url: data.image, display_order: 0, is_primary: 1 });
            }
            if (data.productSecondImage) {
                imagesToSave.push({ url: data.productSecondImage, display_order: 1, is_primary: 0 });
            }
            
            if (imagesToSave.length > 0) {
                await this.updateProductImages(productId, imagesToSave);
            }
            
            // Guardar variantes de precio si existen
            if (data.price_variants && Array.isArray(data.price_variants) && data.price_variants.length > 0) {
                await this.updateProductPriceVariants(productId, data.price_variants);
            }
            
            return productId;
        } catch (error) {
            console.error('Error en Product.create:', error);
            throw error;
        }
    }
    
    async findAllWithFilters(filters = {}) {
        let sql = `SELECT p.*, c.name as category, c.slug as category_slug, 
                          s.id as supplier_id, s.name as supplier_name, s.code as supplier_code 
                   FROM ${this.tableName} p 
                   LEFT JOIN product_categories c ON p.category_id = c.id
                   LEFT JOIN suppliers s ON p.supplier_id = s.id`;
        const params = [];
        const conditions = [];

        if (filters.category) {
            conditions.push('p.category_id = ?');
            params.push(filters.category);
        }

        if (filters.minPrice !== undefined) {
            conditions.push('p.base_price >= ?');
            params.push(filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            conditions.push('p.base_price <= ?');
            params.push(filters.maxPrice);
        }

        if (filters.featured !== undefined) {
            conditions.push('p.featured = ?');
            params.push(filters.featured ? 1 : 0);
        }

        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                conditions.push('p.stock_quantity > 0');
            } else {
                conditions.push('p.stock_quantity = 0');
            }
        }

        if (filters.search) {
            conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (filters.excludeMedicinal) {
            conditions.push('p.requires_prescription = 0');
        }

        // Filtrar por status (solo activos por defecto, a menos que se especifique otro status)
        if (filters.status !== undefined) {
            conditions.push('p.status = ?');
            params.push(filters.status);
        } else if (filters.includeInactive === undefined || !filters.includeInactive) {
            // Por defecto, solo mostrar productos activos
            conditions.push('p.status = ?');
            params.push('active');
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ` ORDER BY p.${filters.orderBy || 'name'} ${filters.order || 'ASC'}`;

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
        }
        
        const products = await this.db.all(sql, params);
        
        // Cargar todas las imágenes de una vez para todos los productos
        const productIds = products.map(p => p.id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',');
            const imagesSql = `
                SELECT product_id, url, alt_text, display_order, is_primary
                FROM product_images
                WHERE product_id IN (${placeholders})
                ORDER BY is_primary DESC, display_order ASC
            `;
            const allImages = await this.db.all(imagesSql, productIds);
            
            // Organizar imágenes por product_id
            imagesMap = {};
            allImages.forEach(img => {
                if (!imagesMap[img.product_id]) {
                    imagesMap[img.product_id] = [];
                }
                imagesMap[img.product_id].push({
                    id: img.id || null,
                    url: img.url,
                    alt_text: img.alt_text || '',
                    display_order: img.display_order || 0,
                    is_primary: img.is_primary || 0
                });
            });
        }
        
        // Debug: Verificar supplier data antes del mapeo
        if (products.length > 0) {
            const firstProduct = products[0];
            console.log('🔍 [findAllWithFilters] Primer producto antes del mapeo:', {
                id: firstProduct.id,
                name: firstProduct.name,
                supplier_id: firstProduct.supplier_id,
                supplier_name: firstProduct.supplier_name,
                supplier_code: firstProduct.supplier_code,
                allKeys: Object.keys(firstProduct).filter(k => k.includes('supplier') || k.includes('Supplier'))
            });
            
            // Si supplier_id existe pero name/code son null, verificar directamente en la BD
            if (firstProduct.supplier_id && (!firstProduct.supplier_name || !firstProduct.supplier_code)) {
                console.warn('⚠️ [findAllWithFilters] supplier_id presente pero name/code son null, verificando en BD...');
                try {
                    const supplierCheck = await this.db.get('SELECT id, name, code FROM suppliers WHERE id = ?', [firstProduct.supplier_id]);
                    console.log('📦 Supplier desde BD:', supplierCheck);
                    if (supplierCheck) {
                        firstProduct.supplier_name = supplierCheck.name;
                        firstProduct.supplier_code = supplierCheck.code;
                        console.log('✅ Supplier name/code corregidos desde BD');
                    }
                } catch (err) {
                    console.error('❌ Error verificando supplier en BD:', err);
                }
            }
        }
        
        // Si hay productos con supplier_id pero sin name/code, cargar todos los suppliers de una vez
        const supplierIdsToCheck = [...new Set(products
            .filter(p => p.supplier_id && (!p.supplier_name || !p.supplier_code))
            .map(p => p.supplier_id)
        )];
        
        let suppliersMap = {};
        if (supplierIdsToCheck.length > 0) {
            console.log('⚠️ [findAllWithFilters] Cargando suppliers faltantes desde BD:', supplierIdsToCheck);
            try {
                const placeholders = supplierIdsToCheck.map(() => '?').join(',');
                const suppliersData = await this.db.all(
                    `SELECT id, name, code FROM suppliers WHERE id IN (${placeholders})`,
                    supplierIdsToCheck
                );
                suppliersData.forEach(s => {
                    suppliersMap[s.id] = { name: s.name, code: s.code };
                });
                console.log('✅ Suppliers cargados desde BD:', suppliersMap);
            } catch (err) {
                console.error('❌ Error cargando suppliers desde BD:', err);
            }
        }
        
        // Parsear campos JSON y normalizar campos
        return products.map(product => {
            // Normalizar campos para compatibilidad con frontend
            product.price = product.base_price;
            product.stock = product.stock_quantity;
            
            // Corregir supplier_name y supplier_code si están faltantes pero supplier_id existe
            if (product.supplier_id && (!product.supplier_name || !product.supplier_code)) {
                if (suppliersMap[product.supplier_id]) {
                    product.supplier_name = suppliersMap[product.supplier_id].name;
                    product.supplier_code = suppliersMap[product.supplier_id].code;
                }
            }
            
            // Agregar info del proveedor si existe (verificar supplier_id O supplier_name/code)
            if (product.supplier_id || product.supplier_name || product.supplier_code) {
                product.supplier = {
                    id: product.supplier_id || null,
                    name: product.supplier_name || null,
                    code: product.supplier_code || null
                };
                
                // Debug: Log del primer producto con supplier mapeado
                if (products.indexOf(product) === 0) {
                    console.log('✅ [findAllWithFilters] Supplier mapeado:', product.supplier);
                }
            } else {
                // Debug: Log si no hay supplier
                if (products.indexOf(product) === 0) {
                    console.log('⚠️ [findAllWithFilters] Producto sin supplier:', {
                        id: product.id,
                        name: product.name,
                        supplier_id: product.supplier_id,
                        supplier_name: product.supplier_name,
                        supplier_code: product.supplier_code
                    });
                }
            }
            
            // Limpiar campos temporales del JOIN
            delete product.supplier_id;
            delete product.supplier_name;
            delete product.supplier_code;
            
            // Agregar imágenes desde product_images
            if (imagesMap[product.id] && imagesMap[product.id].length > 0) {
                product.images = imagesMap[product.id];
            } else {
                // Si no hay imágenes, usar placeholder por defecto
                product.images = [{
                    id: null,
                    url: PLACEHOLDER_IMAGE_URL || './images/catalogo/placeholder.jpg',
                    alt_text: 'Imagen no disponible',
                    display_order: 0,
                    is_primary: 1
                }];
            }
            
            if (product.attributes && typeof product.attributes === 'string') {
                try {
                    product.attributes = JSON.parse(product.attributes);
                } catch (e) {
                    product.attributes = null;
                }
            }
            
            if (product.price_variants && typeof product.price_variants === 'string') {
                try {
                    product.price_variants = JSON.parse(product.price_variants);
                } catch (e) {
                    product.price_variants = null;
                }
            }
            
            if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                try {
                    product.medicinal_info = JSON.parse(product.medicinal_info);
                } catch (e) {
                    product.medicinal_info = null;
                }
            }
            
            return product;
        });
    }
    
    async getMedicinalProducts(limit = 50) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE requires_prescription = 1 AND stock_quantity > 0
            ORDER BY featured DESC, name ASC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async getPublicProducts(limit = 100) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE requires_prescription = 0
            ORDER BY featured DESC, created_at DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async search(query) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY name ASC
        `;
        const searchTerm = `%${query}%`;
        return await this.db.all(sql, [searchTerm, searchTerm]);
    }
    
    async getFeatured(limit = 6) {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.featured = 1 AND p.stock_quantity > 0
                ORDER BY p.created_at DESC 
                LIMIT ?
            `;
            const products = await this.db.all(sql, [limit]);
            
            // Cargar todas las imágenes de una vez (igual que findAll)
            const productIds = products.map(p => p.id);
            let imagesMap = {};
            
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const imagesSql = `
                    SELECT product_id, url, alt_text, display_order, is_primary
                    FROM product_images
                    WHERE product_id IN (${placeholders})
                    ORDER BY is_primary DESC, display_order ASC
                `;
                const allImages = await this.db.all(imagesSql, productIds);
                
                // Organizar imágenes por product_id
                allImages.forEach(img => {
                    if (!imagesMap[img.product_id]) {
                        imagesMap[img.product_id] = [];
                    }
                    imagesMap[img.product_id].push({
                        id: img.id || null,
                        url: img.url,
                        alt_text: img.alt_text || '',
                        display_order: img.display_order || 0,
                        is_primary: img.is_primary || 0
                    });
                });
            }
            
            // Normalizar campos y agregar imágenes
            return products.map(product => {
                // Normalizar campos para compatibilidad con frontend
                product.price = product.base_price;
                product.stock = product.stock_quantity;
                
                // Agregar imágenes desde product_images
                const productImages = imagesMap[product.id] || [];
                product.images = productImages.length > 0 ? productImages : [{
                    id: null,
                    url: PLACEHOLDER_IMAGE_URL,
                    alt_text: 'Imagen no disponible',
                    display_order: 0,
                    is_primary: 1
                }];
                
                // Parsear JSON fields
                if (product.attributes && typeof product.attributes === 'string') {
                    try {
                        product.attributes = JSON.parse(product.attributes);
                    } catch (e) {
                        product.attributes = null;
                    }
                }
                
                if (product.price_variants && typeof product.price_variants === 'string') {
                    try {
                        product.price_variants = JSON.parse(product.price_variants);
                    } catch (e) {
                        product.price_variants = null;
                    }
                }
                
                if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                    try {
                        product.medicinal_info = JSON.parse(product.medicinal_info);
                    } catch (e) {
                        product.medicinal_info = null;
                    }
                }
                
                return product;
            });
        } catch (error) {
            console.error('Error in Product.getFeatured:', error);
            throw error;
        }
    }
    
    async getCategories() {
        const sql = `
            SELECT DISTINCT category_id, c.name as category_name, c.slug as category_slug
            FROM ${this.tableName} p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.category_id IS NOT NULL
            ORDER BY c.name ASC
        `;
        const results = await this.db.all(sql);
        return results.map(row => row.category_name || 'Sin categoría');
    }
    
    async getAllAvailableCategories() {
        const sql = `
            SELECT name 
            FROM product_categories 
            WHERE status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        const results = await this.db.all(sql);
        // Devolver solo los nombres como strings para compatibilidad
        return results.map(row => row.name);
    }
    
    async getPublicCategories() {
        const sql = `
            SELECT DISTINCT category_id, c.name as category_name, c.slug as category_slug
            FROM ${this.tableName} p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.category_id IS NOT NULL 
              AND p.requires_prescription = 0
            ORDER BY c.name ASC
        `;
        const results = await this.db.all(sql);
        return results.map(row => row.category_name || 'Sin categoría');
    }
    
    async getBestSellers(limit = 10) {
        const sql = `
            SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold
            FROM ${this.tableName} p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC, p.created_at DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async updateStock(id, newStock) {
        const sql = `UPDATE ${this.tableName} SET stock_quantity = ?, updated_at = ? WHERE id = ?`;
        await this.db.run(sql, [newStock, new Date().toISOString(), id]);
        return await this.findById(id);
    }
    
    async decrementStock(id, quantity) {
        const product = await this.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const newStock = (product.stock_quantity || 0) - quantity;
        if (newStock < 0) {
            throw new Error('Stock insuficiente');
        }
        
        return await this.updateStock(id, newStock);
    }
    
    async incrementStock(id, quantity) {
        const product = await this.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const newStock = (product.stock_quantity || 0) + quantity;
        return await this.updateStock(id, newStock);
    }
    
    async getLowStock(threshold = 10) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE stock_quantity <= ? AND stock_quantity > 0
            ORDER BY stock_quantity ASC
        `;
        return await this.db.all(sql, [threshold]);
    }
    
    async getOutOfStock() {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE stock_quantity = 0
            ORDER BY name ASC
        `;
        return await this.db.all(sql);
    }
    
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock,
                COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN stock_quantity <= 10 AND stock_quantity > 0 THEN 1 END) as low_stock,
                COUNT(CASE WHEN featured = 1 THEN 1 END) as featured,
                COUNT(CASE WHEN requires_prescription = 1 THEN 1 END) as medicinal,
                SUM(stock_quantity * base_price) as total_value,
                AVG(base_price) as average_price,
                MIN(base_price) as min_price,
                MAX(base_price) as max_price
            FROM ${this.tableName}
        `;
        
        return await this.db.get(sql);
    }
    
    async getByCategory(category) {
        return await this.findAllWithFilters({ category_id: category });
    }
    
    async nameExists(name, excludeId = null) {
        let sql = `SELECT id FROM ${this.tableName} WHERE name = ?`;
        const params = [name];
        
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await this.db.get(sql, params);
        return !!result;
    }
    
    async getRecent(limit = 10) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    /**
     * Obtener productos activos medicinales para catálogo
     * Solo productos con status='active' e is_medicinal=1 o requires_prescription=1
     */
    async getActiveMedicinalProductsForCatalog() {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.status = 'active'
                  AND (p.is_medicinal = 1 OR p.requires_prescription = 1)
                ORDER BY p.featured DESC, p.name ASC
            `;
            
            const products = await this.db.all(sql);
            // Cargar imágenes para todos los productos
            const productIds = products.map(p => p.id);
            let imagesMap = {};
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const imagesSql = `
                    SELECT product_id, url, alt_text, display_order, is_primary
                    FROM product_images
                    WHERE product_id IN (${placeholders})
                    ORDER BY is_primary DESC, display_order ASC
                `;
                const allImages = await this.db.all(imagesSql, productIds);
                
                allImages.forEach(img => {
                    if (!imagesMap[img.product_id]) {
                        imagesMap[img.product_id] = [];
                    }
                    imagesMap[img.product_id].push({
                        id: img.id || null,
                        url: img.url,
                        alt_text: img.alt_text || '',
                        display_order: img.display_order || 0,
                        is_primary: img.is_primary || 0
                    });
                });
            }
            
            // Cargar variantes de precio para productos medicinales
            const priceVariantsMap = {};
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const priceVariantsSql = `
                    SELECT product_id, variant_name, quantity, unit, price, is_default
                    FROM product_price_variants
                    WHERE product_id IN (${placeholders})
                      AND status = 'active'
                    ORDER BY quantity ASC
                `;
                const allPriceVariants = await this.db.all(priceVariantsSql, productIds);
                
                allPriceVariants.forEach(pv => {
                    if (!priceVariantsMap[pv.product_id]) {
                        priceVariantsMap[pv.product_id] = [];
                    }
                    priceVariantsMap[pv.product_id].push({
                        name: pv.variant_name,
                        quantity: pv.quantity,
                        unit: pv.unit,
                        price: pv.price,
                        is_default: pv.is_default
                    });
                });
            }
            
            // Formatear productos para el catálogo
            return products.map(product => {
                // Normalizar campos
                product.price = product.base_price;
                product.stock = product.stock_quantity;
                
                // Agregar imágenes
                const productImages = imagesMap[product.id] || [];
                product.images = productImages.length > 0 ? productImages : [{
                    id: null,
                    url: PLACEHOLDER_IMAGE_URL,
                    alt_text: 'Imagen no disponible',
                    display_order: 0,
                    is_primary: 1
                }];
                
                // Construir objeto de precios desde variantes o usar base_price
                const priceVariants = priceVariantsMap[product.id] || [];
                const prices = {};
                
                if (priceVariants.length > 0) {
                    priceVariants.forEach(pv => {
                        const quantity = Number(pv.quantity);
                        const priceValue = Number(pv.price);
                        if (!Number.isFinite(quantity) || !Number.isFinite(priceValue)) {
                            return;
                        }
                        // Formatear key según el formato del catálogo (1g, 5g, 10g, 20g, etc.)
                        let key = '';
                        const unitNormalized = (pv.unit || '').toLowerCase();
                        if (unitNormalized === 'g' || unitNormalized === 'gramos') {
                            key = `${quantity}g`;
                        } else if (unitNormalized === 'ml' || unitNormalized === 'mililitros') {
                            key = `${quantity}ml`;
                        } else {
                            key = `${quantity}${pv.unit || ''}`;
                        }
                        // Formatear precio con punto como separador de miles
                        const formattedPrice = Math.round(priceValue).toLocaleString('es-CL').replace(/,/g, '.');
                        prices[key] = `$${formattedPrice}`;
                    });
                } else {
                    // Si no hay variantes, usar base_price y crear variantes comunes según el tipo
                    const unit = product.stock_unit || 'g';
                    if (unit === 'gramos' || unit === 'g') {
                        prices['1g'] = `$${Math.round(product.base_price).toLocaleString('es-CL').replace(/,/g, '.')}`;
                    } else if (unit === 'mililitros' || unit === 'ml') {
                        prices['1ml'] = `$${Math.round(product.base_price).toLocaleString('es-CL').replace(/,/g, '.')}`;
                    } else {
                        prices['1unid'] = `$${Math.round(product.base_price).toLocaleString('es-CL').replace(/,/g, '.')}`;
                    }
                }
                
                // Asegurar que el precio base esté presente y actualizado
                const basePriceValue = Number(product.base_price);
                if (Number.isFinite(basePriceValue) && basePriceValue > 0) {
                    const baseKey = (() => {
                        const unitType = (product.unit_type || '').toLowerCase();
                        const stockUnit = (product.stock_unit || '').toLowerCase();
                        const baseUnit = (product.base_unit || '').toLowerCase();
                        if (unitType === 'volume' || stockUnit === 'ml' || baseUnit === 'ml') {
                            return '1ml';
                        }
                        if (unitType === 'unit' || stockUnit === 'unidades') {
                            return '1unid';
                        }
                        return '1g';
                    })();
                    const formattedBasePrice = Math.round(basePriceValue).toLocaleString('es-CL').replace(/,/g, '.');
                    prices[baseKey] = `$${formattedBasePrice}`;
                }
                
                product.prices = prices;
                
                // Parsear strain_info para obtener strain
                let strainInfo = {};
                if (product.strain_info && typeof product.strain_info === 'string') {
                    try {
                        strainInfo = JSON.parse(product.strain_info);
                    } catch (e) {
                        console.error('Error parsing strain_info:', e);
                    }
                }
                product.strain = strainInfo.type || strainInfo.strain || '';
                
                // Parsear cannabinoid_profile para obtener concentration (para aceites)
                let cannabinoidProfile = {};
                if (product.cannabinoid_profile && typeof product.cannabinoid_profile === 'string') {
                    try {
                        cannabinoidProfile = JSON.parse(product.cannabinoid_profile);
                    } catch (e) {
                        console.error('Error parsing cannabinoid_profile:', e);
                    }
                }
                
                // Para aceites, usar CBD/THC como concentration
                if (product.product_type === 'oil' || (product.category_slug && product.category_slug.includes('aceite'))) {
                    const cbd = cannabinoidProfile.cbd || cannabinoidProfile.CBD || '';
                    const thc = cannabinoidProfile.thc || cannabinoidProfile.THC || '';
                    if (cbd || thc) {
                        product.concentration = `${cbd ? `CBD: ${cbd}%` : ''}${cbd && thc ? ' / ' : ''}${thc ? `THC: ${thc}%` : ''}`;
                    }
                }
                
                // Parsear JSON fields
                if (product.attributes && typeof product.attributes === 'string') {
                    try {
                        product.attributes = JSON.parse(product.attributes);
                    } catch (e) {
                        product.attributes = null;
                    }
                }
                
                return product;
            });
        } catch (error) {
            console.error('Error en getActiveMedicinalProductsForCatalog:', error);
            throw error;
        }
    }
}

module.exports = Product;