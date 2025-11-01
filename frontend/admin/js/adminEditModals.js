// frontend/admin/js/adminEditModals.js
// Modales de edición específicos por categoría

// Variable global para almacenar el producto actual
let currentProductForEditing = null;

/**
 * MODAL DE EDICIÓN - FLORES MEDICINALES
 */
function openMedicinalFlowerEditModal(product) {
    console.log('🌿 Abriendo modal de edición de Flores Medicinales');
    
    // Guardar el producto en variable global
    currentProductForEditing = product;
    console.log('💾 Producto guardado en variable global:', {
        name: product?.name,
        base_price: product?.base_price,
        stock_quantity: product?.stock_quantity
    });
    
    const isEdit = product !== null;
    
    // Debug: Verificar valores que se van a usar
    console.log('📦 Valores del producto para el modal:');
    console.log('  - name:', product?.name);
    console.log('  - base_price:', product?.base_price);
    console.log('  - stock_quantity:', product?.stock_quantity);
    console.log('  - short_description:', product?.short_description);
    const cannabinoids = product ? parseJSON(product.cannabinoid_profile) : {thc: '', cbd: '', cbn: '', cbg: '', thcv: ''};
    const terpenes = product ? parseJSON(product.terpene_profile) : {Mirceno: '', Cariofileno: '', Limoneno: '', Pineno: ''};
    const strainInfo = product ? parseJSON(product.strain_info) : {type: '', genetics: '', lineage: '', flowering_time: '', origin: ''};
    const therapeuticInfo = product ? parseJSON(product.therapeutic_info) : {conditions: [], benefits: [], effects: []};
    const usageInfo = product ? parseJSON(product.usage_info) : {recommended_time: '', dosage: {beginner: '', intermediate: '', advanced: ''}, administration: [], onset: '', duration: ''};
    const safetyInfo = product ? parseJSON(product.safety_info) : {contraindications: [], side_effects: [], interactions: []};
    const attrs = product ? parseJSON(product.attributes) : {aroma: '', flavor: '', appearance: ''};
    
    const modalHTML = `
    <style>
        .modal-scroll::-webkit-scrollbar {width: 8px;}
        .modal-scroll::-webkit-scrollbar-track {background: rgba(0, 0, 0, 0.1); border-radius: 4px;}
        .modal-scroll::-webkit-scrollbar-thumb {background: rgba(0, 0, 0, 0.3); border-radius: 4px;}
        .modal-scroll::-webkit-scrollbar-thumb:hover {background: rgba(0, 0, 0, 0.5);}
    </style>
    <div id="editProductModal" data-product='${JSON.stringify(product)}' class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Flor Medicinal</h2>
                        <p class="text-green-100 text-sm mt-1">🌿 Cannabis Medicinal</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="medicinal-flores">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-green-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-green-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-green-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="0.1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="gramos" ${product?.stock_unit === 'gramos' ? 'selected' : ''}>Gramos</option>
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Unidad</label>
                                <select id="productUnitType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="weight" ${product?.unit_type === 'weight' ? 'selected' : ''}>Peso</option>
                                    <option value="unit" ${product?.unit_type === 'unit' ? 'selected' : ''}>Unidad</option>
                                    <option value="volume" ${product?.unit_type === 'volume' ? 'selected' : ''}>Volumen</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad Base</label>
                                <input type="text" id="productBaseUnit" value="${product?.base_unit || 'g'}" placeholder="Ej: g, ml, unidad"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Unidad</label>
                                <input type="number" id="productUnitSize" step="0.1" min="0" value="${product?.unit_size || 1}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div class="md:col-span-3">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Categoría Médica</label>
                                <select id="productMedicalCategory" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="thc" ${product?.medical_category === 'thc' ? 'selected' : ''}>THC Dominante</option>
                                    <option value="cbd" ${product?.medical_category === 'cbd' ? 'selected' : ''}>CBD Dominante</option>
                                    <option value="balanced" ${product?.medical_category === 'balanced' ? 'selected' : ''}>Balanceado (THC/CBD)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Perfil de Cannabinoides -->
                    <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                        <h3 class="text-lg font-bold text-green-800 mb-4 flex items-center">
                            <i class="fas fa-cannabis mr-2"></i>Perfil de Cannabinoides (%)
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC</label>
                                <input type="number" id="cannabinoid_thc" step="0.1" min="0" max="100" value="${cannabinoids.thc || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBD</label>
                                <input type="number" id="cannabinoid_cbd" step="0.1" min="0" max="100" value="${cannabinoids.cbd || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBN</label>
                                <input type="number" id="cannabinoid_cbn" step="0.1" min="0" max="100" value="${cannabinoids.cbn || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBG</label>
                                <input type="number" id="cannabinoid_cbg" step="0.1" min="0" max="100" value="${cannabinoids.cbg || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THCV</label>
                                <input type="number" id="cannabinoid_thcv" step="0.1" min="0" max="100" value="${cannabinoids.thcv || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Perfil de Terpenos -->
                    <div class="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                        <h3 class="text-lg font-bold text-purple-800 mb-4 flex items-center">
                            <i class="fas fa-flask mr-2"></i>Perfil de Terpenos (%)
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Mirceno</label>
                                <input type="number" id="terpene_mirceno" step="0.1" min="0" value="${terpenes.Mirceno || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Cariofileno</label>
                                <input type="number" id="terpene_cariofileno" step="0.1" min="0" value="${terpenes.Cariofileno || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Limoneno</label>
                                <input type="number" id="terpene_limoneno" step="0.1" min="0" value="${terpenes.Limoneno || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Pineno</label>
                                <input type="number" id="terpene_pineno" step="0.1" min="0" value="${terpenes.Pineno || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Cepa -->
                    <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center">
                            <i class="fas fa-dna mr-2"></i>Información de Cepa
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                                <select id="strain_type" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccionar</option>
                                    <option value="Indica" ${strainInfo.type === 'Indica' ? 'selected' : ''}>Indica</option>
                                    <option value="Sativa" ${strainInfo.type === 'Sativa' ? 'selected' : ''}>Sativa</option>
                                    <option value="Híbrido" ${strainInfo.type === 'Híbrido' ? 'selected' : ''}>Híbrido</option>
                                    <option value="Indica dominante" ${strainInfo.type === 'Indica dominante' ? 'selected' : ''}>Indica dominante</option>
                                    <option value="Sativa dominante" ${strainInfo.type === 'Sativa dominante' ? 'selected' : ''}>Sativa dominante</option>
                                    <option value="CBD dominante" ${strainInfo.type === 'CBD dominante' ? 'selected' : ''}>CBD dominante</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Genética</label>
                                <input type="text" id="strain_genetics" value="${strainInfo.genetics || ''}"
                                    placeholder="Ej: 70% Indica / 30% Sativa"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Linaje</label>
                                <input type="text" id="strain_lineage" value="${strainInfo.lineage || ''}"
                                    placeholder="Ej: Parent 1 x Parent 2"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Floración</label>
                                <input type="text" id="strain_flowering_time" value="${strainInfo.flowering_time || ''}"
                                    placeholder="Ej: 8-9 semanas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Origen</label>
                                <input type="text" id="strain_origin" value="${strainInfo.origin || ''}"
                                    placeholder="Ej: California, USA"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información Terapéutica -->
                    <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                        <h3 class="text-lg font-bold text-green-800 mb-4 flex items-center">
                            <i class="fas fa-heartbeat mr-2"></i>Información Terapéutica
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Condiciones Tratadas</label>
                                <textarea id="therapeutic_conditions" rows="2" placeholder="Separar con comas: Dolor crónico, Insomnio, Ansiedad"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${(therapeuticInfo.conditions || []).join(', ')}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Beneficios</label>
                                <textarea id="therapeutic_benefits" rows="2" placeholder="Separar con comas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${(therapeuticInfo.benefits || []).join(', ')}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos</label>
                                <textarea id="therapeutic_effects" rows="2" placeholder="Separar con comas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${(therapeuticInfo.effects || []).join(', ')}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Uso -->
                    <div class="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                        <h3 class="text-lg font-bold text-amber-800 mb-4 flex items-center">
                            <i class="fas fa-clock mr-2"></i>Información de Uso
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Horario Recomendado</label>
                                    <select id="usage_recommended_time" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                        <option value="">Seleccionar</option>
                                        <option value="Matutino" ${usageInfo.recommended_time === 'Matutino' ? 'selected' : ''}>Matutino</option>
                                        <option value="Diurno" ${usageInfo.recommended_time === 'Diurno' ? 'selected' : ''}>Diurno</option>
                                        <option value="Nocturno" ${usageInfo.recommended_time === 'Nocturno' ? 'selected' : ''}>Nocturno</option>
                                        <option value="Cualquier hora" ${usageInfo.recommended_time === 'Cualquier hora' ? 'selected' : ''}>Cualquier hora</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Administración</label>
                                    <input type="text" id="usage_administration" value="${(usageInfo.administration || []).join(', ')}"
                                        placeholder="Ej: Vaporización 175-185°C"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dosificación</label>
                                <div class="grid grid-cols-3 gap-4">
                                    <input type="text" id="dosage_beginner" value="${usageInfo.dosage?.beginner || ''}"
                                        placeholder="Principiante"
                                        class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                    <input type="text" id="dosage_intermediate" value="${usageInfo.dosage?.intermediate || ''}"
                                        placeholder="Intermedio"
                                        class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                    <input type="text" id="dosage_advanced" value="${usageInfo.dosage?.advanced || ''}"
                                        placeholder="Avanzado"
                                        class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Seguridad -->
                    <div class="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                        <h3 class="text-lg font-bold text-red-800 mb-4 flex items-center">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Información de Seguridad
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Contraindicaciones</label>
                                <textarea id="safety_contraindications" rows="2" placeholder="Separar con comas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${(safetyInfo.contraindications || []).join(', ')}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos Secundarios</label>
                                <textarea id="safety_side_effects" rows="2" placeholder="Separar con comas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${(safetyInfo.side_effects || []).join(', ')}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Interacciones</label>
                                <textarea id="safety_interactions" rows="2" placeholder="Separar con comas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${(safetyInfo.interactions || []).join(', ')}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Atributos -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-tags mr-2 text-gray-600"></i>Atributos Adicionales
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Aroma</label>
                                <input type="text" id="attr_aroma" value="${attrs.aroma || ''}"
                                    placeholder="Ej: Terroso, Dulce, Cítrico"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Sabor</label>
                                <input type="text" id="attr_flavor" value="${attrs.flavor || ''}"
                                    placeholder="Ej: Frutal, Herbal"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Apariencia</label>
                                <input type="text" id="attr_appearance" value="${attrs.appearance || ''}"
                                    placeholder="Ej: Cogollos densos, tricomas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Estado -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-toggle-on mr-2 text-gray-600"></i>Estado del Producto
                        </h3>
                        
                        <div class="flex items-center space-x-6">
                            <label class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''}
                                    class="w-5 h-5 text-green-600 rounded focus:ring-green-500">
                                <span class="ml-2 text-sm font-medium text-gray-700">Producto Destacado</span>
                            </label>
                            
                            <label class="flex items-center">
                                <input type="checkbox" id="productActive" ${product?.status === 'active' || !product ? 'checked' : ''}
                                    class="w-5 h-5 text-green-600 rounded focus:ring-green-500">
                                <span class="ml-2 text-sm font-medium text-gray-700">Producto Activo</span>
                            </label>
                        </div>
                    </div>
                    
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-50 px-6 py-4 flex justify-end gap-4 flex-shrink-0 border-t">
                <button type="button" onclick="closeEditModal()" 
                    class="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition">
                    Cancelar
                </button>
                <button type="button" onclick="saveMedicinalFlowerProduct()" 
                    class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition">
                    <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Producto
                </button>
            </div>
            
        </div>
    </div>
    `;
    
    console.log('🔧 Insertando modal en el DOM...');
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Flor Medicinal
 */
async function saveMedicinalFlowerProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        console.log('🧩 saveConcentrateProduct - productId detectado:', productId, 'isEdit:', !!isEdit);
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });
        
        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }
        
        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };
        
        // Parsear therapeutic_info existente
        const existingTherapeuticInfo = existingProduct ? parseJSONField(existingProduct.therapeutic_info) : {};
        // Parsear attributes existente
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};
        
        // Leer valores del formulario
        const conditionsValue = document.getElementById('therapeutic_conditions')?.value || '';
        const benefitsValue = document.getElementById('therapeutic_benefits')?.value || '';
        const effectsValue = document.getElementById('therapeutic_effects')?.value || '';
        
        // Preservar valores existentes si los campos están vacíos
        const getTherapeuticArray = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                // Si el campo está vacío, usar valores existentes
                if (Array.isArray(existingValue)) {
                    return existingValue;
                } else if (existingValue && typeof existingValue === 'string') {
                    // Si es string, intentar parsearlo
                    try {
                        const parsed = parseJSONField(existingValue);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return [];
            }
            // Si hay nuevo valor, parsearlo
            return newValue.split(',').map(s => s.trim()).filter(Boolean);
        };
        
        // Datos básicos del producto - usar valores del DOM o valores originales de la variable global
        const productData = {
            name: document.getElementById('productName')?.value || currentProductForEditing?.name || '',
            slug: generateSlug(document.getElementById('productName')?.value || currentProductForEditing?.name || ''),
            sku: document.getElementById('productSku')?.value || currentProductForEditing?.sku || '',
            description: document.getElementById('productDescription')?.value || currentProductForEditing?.description || '',
            short_description: document.getElementById('productShortDescription')?.value || currentProductForEditing?.short_description || '',
            category_slug: 'medicinal-flores',
            product_type: 'flower',
            is_medicinal: 1,
            requires_prescription: 1,
            medical_category: document.getElementById('productMedicalCategory')?.value || '',
            base_price: parseFloat(document.getElementById('productPrice')?.value) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(document.getElementById('productStock')?.value) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: document.getElementById('productStockUnit')?.value,
            unit_type: document.getElementById('productUnitType')?.value, // NUEVO
            base_unit: document.getElementById('productBaseUnit')?.value, // NUEVO
            unit_size: parseFloat(document.getElementById('productUnitSize')?.value), // NUEVO
            brand_id: document.getElementById('productBrand')?.value || null,
            featured: document.getElementById('productFeatured')?.checked ? 1 : 0,
            status: document.getElementById('productActive')?.checked ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            cannabinoid_profile: {
                thc: parseFloat(document.getElementById('cannabinoid_thc')?.value) || 0,
                cbd: parseFloat(document.getElementById('cannabinoid_cbd')?.value) || 0,
                cbn: parseFloat(document.getElementById('cannabinoid_cbn')?.value) || 0,
                cbg: parseFloat(document.getElementById('cannabinoid_cbg')?.value) || 0,
                thcv: parseFloat(document.getElementById('cannabinoid_thcv')?.value) || 0
            },
            
            terpene_profile: {
                'Mirceno': parseFloat(document.getElementById('terpene_mirceno')?.value) || 0,
                'Cariofileno': parseFloat(document.getElementById('terpene_cariofileno')?.value) || 0,
                'Limoneno': parseFloat(document.getElementById('terpene_limoneno')?.value) || 0,
                'Pineno': parseFloat(document.getElementById('terpene_pineno')?.value) || 0
            },
            
            strain_info: {
                type: document.getElementById('strain_type')?.value,
                genetics: document.getElementById('strain_genetics')?.value,
                lineage: document.getElementById('strain_lineage')?.value,
                flowering_time: document.getElementById('strain_flowering_time')?.value,
                origin: document.getElementById('strain_origin')?.value
            },
            
            therapeutic_info: {
                conditions: getTherapeuticArray(conditionsValue, existingTherapeuticInfo.conditions),
                benefits: getTherapeuticArray(benefitsValue, existingTherapeuticInfo.benefits),
                effects: getTherapeuticArray(effectsValue, existingTherapeuticInfo.effects)
            },
            
            usage_info: {
                recommended_time: document.getElementById('usage_recommended_time')?.value,
                dosage: {
                    beginner: document.getElementById('dosage_beginner')?.value,
                    intermediate: document.getElementById('dosage_intermediate')?.value,
                    advanced: document.getElementById('dosage_advanced')?.value
                },
                administration: document.getElementById('usage_administration')?.value.split(',').map(s => s.trim()).filter(Boolean),
                onset: '', // Campo del seed (opcional)
                duration: '' // Campo del seed (opcional)
            },
            
            safety_info: {
                contraindications: document.getElementById('safety_contraindications')?.value.split(',').map(s => s.trim()).filter(Boolean),
                side_effects: document.getElementById('safety_side_effects')?.value.split(',').map(s => s.trim()).filter(Boolean),
                interactions: document.getElementById('safety_interactions')?.value.split(',').map(s => s.trim()).filter(Boolean)
            },
            
            attributes: {
                aroma: (document.getElementById('attr_aroma')?.value || '').trim() || existingAttributes.aroma || '',
                flavor: (document.getElementById('attr_flavor')?.value || '').trim() || existingAttributes.flavor || '',
                appearance: (document.getElementById('attr_appearance')?.value || '').trim() || existingAttributes.appearance || ''
            }
        };
        
        console.log('🔍 VALORES LEÍDOS DEL FORMULARIO:');
        console.log('  - name:', productData.name);
        console.log('  - base_price:', productData.base_price);
        console.log('  - stock_quantity:', productData.stock_quantity);
        console.log('  - short_description:', productData.short_description);
        
        // Validar campos requeridos
        if (!productData.name || productData.name.trim() === '') {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor completa el nombre del producto');
            }
            return;
        }
        
        if (!productData.base_price || productData.base_price <= 0 || isNaN(productData.base_price)) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor ingresa un precio válido mayor a cero');
            }
            return;
        }
        
        if (!productData.stock_quantity || productData.stock_quantity <= 0 || isNaN(productData.stock_quantity)) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor ingresa una cantidad de stock válida mayor a cero');
            }
            return;
        }
        
        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];
        console.log('🧩 Inputs de imagen encontrados:', {
            imageInputFound: !!imageInputEl,
            secondImageInputFound: !!secondImageInputEl
        });

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
            console.log('📷 Imagen principal procesada:', imageBase64.substring(0, 50) + '...');
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
            console.log('📷 Segunda imagen procesada:', secondImageBase64.substring(0, 50) + '...');
        }

        // Obtener URLs de imágenes existentes (del producto cargado o del existingProduct)
        const productImages = existingProduct?.images || currentProductForEditing?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;
        
        console.log('📸 Información de imágenes:');
        console.log('  - Nueva imagen principal seleccionada:', !!imageFile);
        console.log('  - Nueva segunda imagen seleccionada:', !!secondImageFile);
        console.log('  - URLs existentes encontradas:', {
            primary: existingPrimaryUrl ? 'Sí' : 'No',
            second: existingSecondUrl ? 'Sí' : 'No'
        });
        console.log('  - Product images array length:', productImages.length);
        
        // Preparar imágenes para backend update
        // SIEMPRE enviar imágenes: nuevas (base64) o existentes (URLs)
        if (imageBase64) {
            productData.image = imageBase64;
            console.log('  ✅ Enviando nueva imagen principal (base64)');
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
            console.log('  ✅ Preservando imagen principal existente:', existingPrimaryUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay imagen principal (nueva ni existente)');
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
            console.log('  ✅ Enviando nueva segunda imagen (base64)');
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
            console.log('  ✅ Preservando segunda imagen existente:', existingSecondUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay segunda imagen (nueva ni existente)');
        }

        console.log('🌿 Guardando flor medicinal...');
        console.log('📦 Datos a enviar (incluye imágenes):', {
            tieneImage: !!productData.image,
            tieneSecondImage: !!productData.productSecondImage
        });
        
        // Forzar PUT si tenemos id en currentProductForEditing (fallback extra)
        let url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        let method = isEdit ? 'PUT' : 'POST';
        if (!isEdit && currentProductForEditing?.id) {
            url = `http://localhost:3000/api/products/${currentProductForEditing.id}`;
            method = 'PUT';
            console.log('🛠️ Forzando PUT usando currentProductForEditing.id:', currentProductForEditing.id);
        }
        
        console.log('🛰️ Request concentrado:', { method, url, hasId: !!productId, usingCurrentId: !!currentProductForEditing?.id });

        let response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });

        // Fallback: si fue POST y falló, reintentar PUT si tenemos id
        if (!response.ok && method === 'POST') {
            const fallbackId = productId || currentProductForEditing?.id;
            if (fallbackId) {
                const putUrl = `http://localhost:3000/api/products/${fallbackId}`;
                console.warn('♻️ Reintentando como PUT →', putUrl);
                response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(productData)
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const result = await response.json();
        console.log('✅ Flor medicinal guardada:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Flor medicinal ${isEdit ? 'actualizada' : 'creada'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error guardando flor medicinal:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar la flor medicinal: ' + error.message);
        }
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            reject(new Error('El archivo debe ser una imagen'));
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('La imagen no debe superar 5MB'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Generate slug from name
 */
function generateSlug(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Show edit modal
 */
function showEditModal(html) {
    const oldModal = document.getElementById('editProductModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Verificar que los valores se cargaron correctamente en el DOM
    setTimeout(() => {
        const nameInput = document.getElementById('productName');
        const priceInput = document.getElementById('productPrice');
        const stockInput = document.getElementById('productStock');
        
        console.log('🔍 Verificando valores en el DOM después de cargar el modal:');
        console.log('  - productName:', nameInput?.value);
        console.log('  - productPrice:', priceInput?.value);
        console.log('  - productStock:', stockInput?.value);
    }, 100);
}

// Exportar funciones
window.openMedicinalFlowerEditModal = openMedicinalFlowerEditModal;
/**
 * MODAL DE EDICIÓN - ACEITES MEDICINALES
 */
function openMedicinalOilEditModal(product) {
    console.log('💧 Abriendo modal de edición de Aceites Medicinales');
    
    // Guardar producto en variable global (igual que flores medicinales)
    currentProductForEditing = product;
    console.log('💾 Producto guardado en variable global:', {
        name: product?.name,
        base_price: product?.base_price,
        stock_quantity: product?.stock_quantity
    });
    
    const isEdit = product !== null;
    const cannabinoids = product ? parseJSON(product.cannabinoid_profile) : {thc: '', cbd: '', cbn: '', cbg: '', cbc: ''};
    const therapeuticInfo = product ? parseJSON(product.therapeutic_info) : {conditions: [], benefits: [], effects: []};
    const usageInfo = product ? parseJSON(product.usage_info) : {recommended_time: '', dosage: {beginner: '', intermediate: '', advanced: ''}, administration: [], onset: '', duration: ''};
    const safetyInfo = product ? parseJSON(product.safety_info) : {contraindications: [], side_effects: [], interactions: []};
    const specifications = product ? parseJSON(product.specifications) : {volume: '', concentration: '', extraction_method: '', base_oil: '', bottle_type: ''};
    const attrs = product ? parseJSON(product.attributes) : {color: '', texture: '', taste: '', smell: ''};
    
    const modalHTML = `
    <style>
        .modal-scroll::-webkit-scrollbar {width: 8px;}
        .modal-scroll::-webkit-scrollbar-track {background: rgba(0, 0, 0, 0.1); border-radius: 4px;}
        .modal-scroll::-webkit-scrollbar-thumb {background: rgba(0, 0, 0, 0.3); border-radius: 4px;}
        .modal-scroll::-webkit-scrollbar-thumb:hover {background: rgba(0, 0, 0, 0.5);}
    </style>
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Aceite Medicinal</h2>
                        <p class="text-blue-100 text-sm mt-1">💧 Aceites y Tinturas</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="medicinal-aceites">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-blue-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}" placeholder="Ej: CBD 10% para ansiedad e inflamación"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-blue-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-blue-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                    <option value="frascos" ${product?.stock_unit === 'frascos' ? 'selected' : ''}>Frascos</option>
                                    <option value="ml" ${product?.stock_unit === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Unidad</label>
                                <select id="productUnitType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="volume" ${product?.unit_type === 'volume' ? 'selected' : ''}>Volumen</option>
                                    <option value="weight" ${product?.unit_type === 'weight' ? 'selected' : ''}>Peso</option>
                                    <option value="unit" ${product?.unit_type === 'unit' ? 'selected' : ''}>Unidad</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad Base</label>
                                <input type="text" id="productBaseUnit" value="${product?.base_unit || 'ml'}" placeholder="Ej: ml, g, unidad"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Unidad</label>
                                <input type="number" id="productUnitSize" step="0.1" min="0" value="${product?.unit_size || 30}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div class="md:col-span-3">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Categoría Médica</label>
                                <select id="productMedicalCategory" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="cbd" ${product?.medical_category === 'cbd' ? 'selected' : ''}>CBD Dominante</option>
                                    <option value="thc" ${product?.medical_category === 'thc' ? 'selected' : ''}>THC Dominante</option>
                                    <option value="balanced" ${product?.medical_category === 'balanced' ? 'selected' : ''}>Balanceado (THC/CBD)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Especificaciones Técnicas -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-flask mr-2 text-blue-600"></i>Especificaciones Técnicas
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Volumen</label>
                                <input type="text" id="spec_volume" value="${specifications.volume || ''}" placeholder="Ej: 30ml"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Concentración</label>
                                <input type="text" id="spec_concentration" value="${specifications.concentration || ''}" placeholder="Ej: 100mg/ml"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Total CBD</label>
                                <input type="text" id="spec_total_cbd" value="${specifications.total_cbd || ''}" placeholder="Ej: 3000mg"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC</label>
                                <input type="text" id="spec_thc" value="${specifications.thc || ''}" placeholder="Ej: <0.2%"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Perfil Cannabinoide -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-leaf mr-2 text-green-600"></i>Perfil Cannabinoide (%)
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC (%)</label>
                                <input type="number" id="cannabinoid_thc" step="0.01" min="0" max="100" value="${cannabinoids.thc || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBD (%)</label>
                                <input type="number" id="cannabinoid_cbd" step="0.01" min="0" max="100" value="${cannabinoids.cbd || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBN (%)</label>
                                <input type="number" id="cannabinoid_cbn" step="0.01" min="0" max="100" value="${cannabinoids.cbn || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBG (%)</label>
                                <input type="number" id="cannabinoid_cbg" step="0.01" min="0" max="100" value="${cannabinoids.cbg || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBC (%)</label>
                                <input type="number" id="cannabinoid_cbc" step="0.01" min="0" max="100" value="${cannabinoids.cbc || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Perfil de Terpenos -->
                    <div class="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                        <h3 class="text-lg font-bold text-purple-800 mb-4 flex items-center">
                            <i class="fas fa-flask mr-2"></i>Perfil de Terpenos (%)
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Mirceno</label>
                                <input type="number" id="terpene_mirceno" step="0.1" min="0" value="${product ? parseJSON(product.terpene_profile)?.Mirceno || '' : ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Pineno</label>
                                <input type="number" id="terpene_pineno" step="0.1" min="0" value="${product ? parseJSON(product.terpene_profile)?.Pineno || '' : ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Limoneno</label>
                                <input type="number" id="terpene_limoneno" step="0.1" min="0" value="${product ? parseJSON(product.terpene_profile)?.Limoneno || '' : ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Linalool</label>
                                <input type="number" id="terpene_linalool" step="0.1" min="0" value="${product ? parseJSON(product.terpene_profile)?.Linalool || '' : ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Cepa -->
                    <div class="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                        <h3 class="text-lg font-bold text-indigo-800 mb-4 flex items-center">
                            <i class="fas fa-dna mr-2"></i>Información de Cepa
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                                <input type="text" id="strain_type" value="${product ? parseJSON(product.strain_info)?.type || '' : ''}" placeholder="Ej: CBD Full Spectrum"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Extracción</label>
                                <input type="text" id="strain_extraction" value="${product ? parseJSON(product.strain_info)?.extraction || '' : ''}" placeholder="Ej: CO2 Supercrítico"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Aceite Transportador</label>
                                <input type="text" id="strain_carrier_oil" value="${product ? parseJSON(product.strain_info)?.carrier_oil || '' : ''}" placeholder="Ej: MCT orgánico"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información Terapéutica -->
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-heartbeat mr-2 text-purple-600"></i>Información Terapéutica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Condiciones Tratadas</label>
                                <textarea id="therapeutic_conditions" rows="3" placeholder="Ej: Ansiedad, Dolor crónico, Insomnio"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.conditions ? therapeuticInfo.conditions.join(', ') : ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Beneficios</label>
                                <textarea id="therapeutic_benefits" rows="3" placeholder="Ej: Relajación, Antiinflamatorio"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.benefits ? therapeuticInfo.benefits.join(', ') : ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos</label>
                                <textarea id="therapeutic_effects" rows="2" placeholder="Ej: Sedante, Eufórico, Concentración"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.effects ? therapeuticInfo.effects.join(', ') : ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Información de Uso -->
                    <div class="bg-amber-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-tint mr-2 text-amber-600"></i>Guía de Dosificación
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Momento Recomendado</label>
                                <select id="usage_recommended_time" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                    <option value="mañana" ${usageInfo.recommended_time === 'mañana' ? 'selected' : ''}>Mañana</option>
                                    <option value="tarde" ${usageInfo.recommended_time === 'tarde' ? 'selected' : ''}>Tarde</option>
                                    <option value="noche" ${usageInfo.recommended_time === 'noche' ? 'selected' : ''}>Noche</option>
                                    <option value="cualquier_momento" ${usageInfo.recommended_time === 'cualquier_momento' ? 'selected' : ''}>Cualquier momento</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Efecto</label>
                                <input type="text" id="usage_onset" value="${usageInfo.onset || ''}" placeholder="Ej: 15-45 minutos"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Duración</label>
                                <input type="text" id="usage_duration" value="${usageInfo.duration || ''}" placeholder="Ej: 4-6 horas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dosis Principiante (gotas)</label>
                                <input type="text" id="dosage_beginner" value="${usageInfo.dosage?.beginner || ''}" placeholder="Ej: 1-2 gotas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dosis Intermedio (gotas)</label>
                                <input type="text" id="dosage_intermediate" value="${usageInfo.dosage?.intermediate || ''}" placeholder="Ej: 3-5 gotas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dosis Avanzado (gotas)</label>
                                <input type="text" id="dosage_advanced" value="${usageInfo.dosage?.advanced || ''}" placeholder="Ej: 6-10 gotas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información de Seguridad -->
                    <div class="bg-red-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>Información de Seguridad
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Contraindicaciones</label>
                                <textarea id="safety_contraindications" rows="3" placeholder="Ej: Embarazo, Lactancia"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${safetyInfo.contraindications ? safetyInfo.contraindications.join(', ') : ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos Secundarios</label>
                                <textarea id="safety_side_effects" rows="3" placeholder="Ej: Somnolencia, Sequedad bucal"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${safetyInfo.side_effects ? safetyInfo.side_effects.join(', ') : ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Interacciones Medicamentosas</label>
                                <textarea id="safety_interactions" rows="2" placeholder="Ej: Anticoagulantes, Sedantes"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">${safetyInfo.interactions ? safetyInfo.interactions.join(', ') : ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Características Físicas -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-eye mr-2 text-gray-600"></i>Características Físicas
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                <input type="text" id="attr_color" value="${attrs.color || ''}" placeholder="Ej: Ámbar dorado"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Textura</label>
                                <input type="text" id="attr_texture" value="${attrs.texture || ''}" placeholder="Ej: Viscoso, Fluido"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Sabor</label>
                                <input type="text" id="attr_taste" value="${attrs.taste || ''}" placeholder="Ej: Herbal, Dulce"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Aroma</label>
                                <input type="text" id="attr_smell" value="${attrs.smell || ''}" placeholder="Ej: Terroso, Cítrico"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${(!product || product.status === 'active' || product.status === 1) ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-100 px-6 py-4 flex-shrink-0">
                <div class="flex gap-3">
                    <button onclick="saveMedicinalOilProduct()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                        <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Aceite
                    </button>
                    <button onclick="closeEditModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    console.log('🔧 Insertando modal en el DOM...');
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar (igual que flores medicinales)
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Aceite Medicinal
 */
async function saveMedicinalOilProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback (igual que flores medicinales)
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear therapeutic_info existente
        const existingTherapeuticInfo = existingProduct ? parseJSONField(existingProduct.therapeutic_info) : {};
        // Parsear attributes existente
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};

        // Preservar valores existentes si los campos están vacíos
        const getTherapeuticArray = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                if (Array.isArray(existingValue)) {
                    return existingValue;
                } else if (existingValue && typeof existingValue === 'string') {
                    try {
                        const parsed = parseJSONField(existingValue);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return [];
            }
            return newValue.split(',').map(s => s.trim()).filter(Boolean);
        };
        
        // Datos básicos del producto - usar valores del DOM o valores originales de la variable global
        const productData = {
            name: document.getElementById('productName')?.value || currentProductForEditing?.name || '',
            slug: generateSlug(document.getElementById('productName')?.value || currentProductForEditing?.name || ''),
            sku: document.getElementById('productSku')?.value || currentProductForEditing?.sku || '',
            description: document.getElementById('productDescription')?.value || currentProductForEditing?.description || '',
            short_description: document.getElementById('productShortDescription')?.value || currentProductForEditing?.short_description || '',
            category_slug: 'medicinal-aceites',
            product_type: 'oil',
            is_medicinal: 1,
            requires_prescription: 1,
            medical_category: document.getElementById('productMedicalCategory')?.value || '',
            base_price: parseFloat(document.getElementById('productPrice')?.value) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(document.getElementById('productStock')?.value) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: document.getElementById('productStockUnit')?.value,
            unit_type: document.getElementById('productUnitType')?.value, // NUEVO
            base_unit: document.getElementById('productBaseUnit')?.value, // NUEVO
            unit_size: parseFloat(document.getElementById('productUnitSize')?.value), // NUEVO
            brand_id: document.getElementById('productBrand')?.value || null,
            featured: document.getElementById('productFeatured')?.checked ? 1 : 0,
            status: document.getElementById('productActive')?.checked ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            cannabinoid_profile: {
                thc: parseFloat(document.getElementById('cannabinoid_thc')?.value) || 0,
                cbd: parseFloat(document.getElementById('cannabinoid_cbd')?.value) || 0,
                cbn: parseFloat(document.getElementById('cannabinoid_cbn')?.value) || 0,
                cbg: parseFloat(document.getElementById('cannabinoid_cbg')?.value) || 0,
                cbc: parseFloat(document.getElementById('cannabinoid_cbc')?.value) || 0 // Cambio: cbc en lugar de thcv
            },
            
            terpene_profile: {
                'Mirceno': parseFloat(document.getElementById('terpene_mirceno')?.value) || 0,
                'Pineno': parseFloat(document.getElementById('terpene_pineno')?.value) || 0,
                'Limoneno': parseFloat(document.getElementById('terpene_limoneno')?.value) || 0,
                'Linalool': parseFloat(document.getElementById('terpene_linalool')?.value) || 0
            },
            
            strain_info: {
                type: document.getElementById('strain_type')?.value,
                extraction: document.getElementById('strain_extraction')?.value,
                carrier_oil: document.getElementById('strain_carrier_oil')?.value
            },
            
            specifications: {
                volume: document.getElementById('spec_volume')?.value,
                concentration: document.getElementById('spec_concentration')?.value,
                total_cbd: document.getElementById('spec_total_cbd')?.value, // NUEVO
                thc: document.getElementById('spec_thc')?.value // NUEVO
            },
            
            therapeutic_info: {
                conditions: getTherapeuticArray(document.getElementById('therapeutic_conditions')?.value || '', existingTherapeuticInfo.conditions),
                benefits: getTherapeuticArray(document.getElementById('therapeutic_benefits')?.value || '', existingTherapeuticInfo.benefits),
                effects: getTherapeuticArray(document.getElementById('therapeutic_effects')?.value || '', existingTherapeuticInfo.effects)
            },
            
            usage_info: {
                recommended_time: document.getElementById('usage_recommended_time')?.value,
                dosage: {
                    initial: document.getElementById('dosage_beginner')?.value, // Cambio según seed
                    standard: document.getElementById('dosage_intermediate')?.value, // Cambio según seed
                    maximum: document.getElementById('dosage_advanced')?.value // Cambio según seed
                },
                administration: document.getElementById('usage_administration')?.value.split(',').map(s => s.trim()).filter(Boolean),
                onset: document.getElementById('usage_onset')?.value,
                duration: document.getElementById('usage_duration')?.value
            },
            
            safety_info: {
                contraindications: document.getElementById('safety_contraindications')?.value.split(',').map(s => s.trim()).filter(s => s),
                side_effects: document.getElementById('safety_side_effects')?.value.split(',').map(s => s.trim()).filter(s => s),
                interactions: document.getElementById('safety_interactions')?.value.split(',').map(s => s.trim()).filter(s => s)
            },
            
            attributes: {
                color: (document.getElementById('attr_color')?.value || '').trim() || existingAttributes.color || '',
                taste: (document.getElementById('attr_taste')?.value || '').trim() || existingAttributes.taste || '',
                texture: (document.getElementById('attr_texture')?.value || '').trim() || existingAttributes.texture || ''
            }
        };
        
        console.log('💧 Datos del aceite medicinal a guardar:', productData);
        
        // Validar campos requeridos (igual que flores medicinales)
        if (!productData.name || productData.name.trim() === '') {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor completa el nombre del producto');
            }
            return;
        }
        
        if (!productData.base_price || productData.base_price <= 0 || isNaN(productData.base_price)) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor ingresa un precio válido mayor a cero');
            }
            return;
        }
        
        if (!productData.stock_quantity || productData.stock_quantity <= 0 || isNaN(productData.stock_quantity)) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor ingresa una cantidad de stock válida mayor a cero');
            }
            return;
        }
        
        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
        }

        // Obtener URLs de imágenes existentes
        const productImages = existingProduct?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;

        // Preparar imágenes para backend update
        if (imageBase64) {
            productData.image = imageBase64;
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
        }

        // Guardar por JSON (como en flores)
        console.log('💧 Guardando aceite medicinal...');
        const url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el producto');
        }
        
        const result = await response.json();
        console.log('✅ Aceite medicinal guardado:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Aceite medicinal ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error guardando aceite medicinal:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar el aceite medicinal: ' + error.message);
        }
    }
}

/**
 * MODAL DE EDICIÓN - CONCENTRADOS MEDICINALES
 */
function openMedicinalConcentrateEditModal(product) {
    console.log('💎 Abriendo modal de edición de Concentrados Medicinales');
    
    const isEdit = product !== null;
    const cannabinoids = product ? parseJSON(product.cannabinoid_profile) : {thc: '', cbd: '', cbn: '', cbg: '', thcv: ''};
    const strainInfo = product ? parseJSON(product.strain_info) : {type: '', genetics: '', lineage: '', origin: ''};
    const therapeuticInfo = product ? parseJSON(product.therapeutic_info) : {conditions: [], benefits: [], effects: []};
    const usageInfo = product ? parseJSON(product.usage_info) : {recommended_time: '', dosage: {beginner: '', intermediate: '', advanced: ''}, administration: [], onset: '', duration: ''};
    const attrs = product ? parseJSON(product.attributes) : {consistency: '', color: '', extraction_method: '', purity: ''};
    
    const modalHTML = `
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-violet-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Concentrado Medicinal</h2>
                        <p class="text-purple-100 text-sm mt-1">💎 Concentrados de Alta Potencia</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="medicinal-concentrados">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-purple-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${product?.description || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-purple-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-purple-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="0.1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="g" ${product?.stock_unit === 'g' ? 'selected' : ''}>Gramos (g)</option>
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Perfil Cannabinoide -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-leaf mr-2 text-green-600"></i>Perfil Cannabinoide (%) - Alta Potencia
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC (%)</label>
                                <input type="number" id="cannabinoid_thc" step="0.01" min="0" max="100" value="${cannabinoids.thc || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBD (%)</label>
                                <input type="number" id="cannabinoid_cbd" step="0.01" min="0" max="100" value="${cannabinoids.cbd || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBN (%)</label>
                                <input type="number" id="cannabinoid_cbn" step="0.01" min="0" max="100" value="${cannabinoids.cbn || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBG (%)</label>
                                <input type="number" id="cannabinoid_cbg" step="0.01" min="0" max="100" value="${cannabinoids.cbg || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THCV (%)</label>
                                <input type="number" id="cannabinoid_thcv" step="0.01" min="0" max="100" value="${cannabinoids.thcv || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información Genética -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dna mr-2 text-blue-600"></i>Información Genética
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Cepa</label>
                                <select id="strain_type" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="indica" ${strainInfo.type === 'indica' ? 'selected' : ''}>Indica</option>
                                    <option value="sativa" ${strainInfo.type === 'sativa' ? 'selected' : ''}>Sativa</option> 
                                    <option value="hybrid" ${strainInfo.type === 'hybrid' ? 'selected' : ''}>Híbrida</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Genética</label>
                                <input type="text" id="strain_genetics" value="${strainInfo.genetics || ''}" placeholder="Ej: OG Kush x Gelato"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Linaje</label>
                                <input type="text" id="strain_lineage" value="${strainInfo.lineage || ''}" placeholder="Ej: California genetics"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Origen</label>
                                <input type="text" id="strain_origin" value="${strainInfo.origin || ''}" placeholder="Ej: California, USA"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Características del Concentrado -->
                    <div class="bg-amber-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-gem mr-2 text-amber-600"></i>Características del Concentrado
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Consistencia</label>
                                <select id="attr_consistency" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                    <option value="">Seleccionar...</option>
                                    <option value="shatter" ${attrs.consistency === 'shatter' ? 'selected' : ''}>Shatter</option>
                                    <option value="wax" ${attrs.consistency === 'wax' ? 'selected' : ''}>Wax</option>
                                    <option value="live_resin" ${attrs.consistency === 'live_resin' ? 'selected' : ''}>Live Resin</option>
                                    <option value="rosin" ${attrs.consistency === 'rosin' ? 'selected' : ''}>Rosin</option>
                                    <option value="budder" ${attrs.consistency === 'budder' ? 'selected' : ''}>Budder</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                <input type="text" id="attr_color" value="${attrs.color || ''}" placeholder="Ej: Ámbar dorado, Cristalino"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Método de Extracción</label>
                                <select id="attr_extraction" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                                    <option value="">Seleccionar...</option>
                                    <option value="CO2" ${attrs.extraction_method === 'CO2' ? 'selected' : ''}>CO2 Supercrítico</option>
                                    <option value="BHO" ${attrs.extraction_method === 'BHO' ? 'selected' : ''}>BHO (Butano)</option>
                                    <option value="Rosin" ${attrs.extraction_method === 'Rosin' ? 'selected' : ''}>Rosin Press</option>
                                    <option value="Ice_Water" ${attrs.extraction_method === 'Ice_Water' ? 'selected' : ''}>Ice Water Hash</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Pureza (%)</label>
                                <input type="number" id="attr_purity" step="0.1" min="0" max="100" value="${attrs.purity || ''}" placeholder="Ej: 95.5"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información Terapéutica -->
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-heartbeat mr-2 text-purple-600"></i>Información Terapéutica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Condiciones Tratadas</label>
                                <textarea id="therapeutic_conditions" rows="3" placeholder="Ej: Dolor severo, Cáncer, PTSD"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.conditions ? therapeuticInfo.conditions.join(', ') : ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Beneficios</label>
                                <textarea id="therapeutic_benefits" rows="3" placeholder="Ej: Alivio intenso, Sedación profunda"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.benefits ? therapeuticInfo.benefits.join(', ') : ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos</label>
                                <textarea id="therapeutic_effects" rows="2" placeholder="Ej: Potente sedación, Euforia intensa"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${therapeuticInfo.effects ? therapeuticInfo.effects.join(', ') : ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Advertencia de Seguridad -->
                    <div class="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-red-900 mb-4 flex items-center">
                            <i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>⚠️ ADVERTENCIA - ALTA POTENCIA
                        </h3>
                        
                        <div class="bg-red-100 p-4 rounded-lg mb-4">
                            <p class="text-red-800 font-semibold text-sm">
                                Los concentrados tienen potencias extremadamente altas (70-95% THC/CBD).
                                Solo para usuarios muy experimentados. Comenzar con dosis microscópicas.
                            </p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dosis Recomendadas</label>
                                <div class="space-y-2 text-sm">
                                    <p><strong>Principiante:</strong> 0.01-0.02g (tamaño cabeza de alfiler)</p>
                                    <p><strong>Intermedio:</strong> 0.03-0.05g</p>
                                    <p><strong>Avanzado:</strong> 0.1g máximo</p>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Administración</label>
                                <div class="space-y-2 text-sm">
                                    <p><strong>Dabbing:</strong> 350-400°F</p>
                                    <p><strong>Vaporización:</strong> 180-220°C</p>
                                    <p><strong>Onset:</strong> Inmediato</p>
                                    <p><strong>Duración:</strong> 2-4 horas</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${(!product || product.status === 'active' || product.status === 1) ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-100 px-6 py-4 flex-shrink-0">
                <div class="flex gap-3">
                    <button onclick="saveMedicinalConcentrateProduct()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition">
                        <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Concentrado
                    </button>
                    <button onclick="closeEditModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Concentrado Medicinal  
 */
async function saveMedicinalConcentrateProduct() {
    try {
        // Scope del modal para evitar conflictos de IDs
        const modalScopeEl = document.getElementById('editProductModal');
        // Obtener productId del DOM (scoped) o desde variable global
        let productId = modalScopeEl ? modalScopeEl.querySelector('#productId')?.value : document.getElementById('productId')?.value;
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        const isEdit = productId && productId !== '' && productId !== 'undefined';

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear therapeutic_info existente
        const existingTherapeuticInfo = existingProduct ? parseJSONField(existingProduct.therapeutic_info) : {};
        // Parsear attributes existente
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};

        // Preservar valores existentes si los campos están vacíos
        const getTherapeuticArray = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                if (Array.isArray(existingValue)) {
                    return existingValue;
                } else if (existingValue && typeof existingValue === 'string') {
                    try {
                        const parsed = parseJSONField(existingValue);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return [];
            }
            return newValue.split(',').map(s => s.trim()).filter(Boolean);
        };

        const formData = {
            name: document.getElementById('productName')?.value,
            slug: generateSlug(document.getElementById('productName')?.value),
            sku: document.getElementById('productSku')?.value,
            description: document.getElementById('productDescription')?.value,
            category_slug: 'medicinal-concentrados',
            product_type: 'concentrate',
            is_medicinal: 1,
            requires_prescription: 1,
            medical_category: document.getElementById('cannabinoid_thc')?.value > document.getElementById('cannabinoid_cbd')?.value ? 'thc' : 'cbd',
            base_price: parseFloat(document.getElementById('productPrice')?.value),
            stock_quantity: parseFloat(document.getElementById('productStock')?.value),
            stock_unit: document.getElementById('productStockUnit')?.value,
            brand_id: document.getElementById('productBrand')?.value || null,
            featured: document.getElementById('productFeatured')?.checked ? 1 : 0,
            status: document.getElementById('productActive')?.checked ? 'active' : 'inactive',
            
            cannabinoid_profile: {
                thc: parseFloat(document.getElementById('cannabinoid_thc')?.value) || 0,
                cbd: parseFloat(document.getElementById('cannabinoid_cbd')?.value) || 0,
                cbn: parseFloat(document.getElementById('cannabinoid_cbn')?.value) || 0,
                cbg: parseFloat(document.getElementById('cannabinoid_cbg')?.value) || 0,
                thcv: parseFloat(document.getElementById('cannabinoid_thcv')?.value) || 0
            },
            
            strain_info: {
                type: document.getElementById('strain_type')?.value,
                genetics: document.getElementById('strain_genetics')?.value,
                lineage: document.getElementById('strain_lineage')?.value,
                origin: document.getElementById('strain_origin')?.value
            },
            
            therapeutic_info: {
                conditions: getTherapeuticArray(document.getElementById('therapeutic_conditions')?.value || '', existingTherapeuticInfo.conditions),
                benefits: getTherapeuticArray(document.getElementById('therapeutic_benefits')?.value || '', existingTherapeuticInfo.benefits),
                effects: getTherapeuticArray(document.getElementById('therapeutic_effects')?.value || '', existingTherapeuticInfo.effects)
            },
            
            attributes: {
                consistency: (document.getElementById('attr_consistency')?.value || '').trim() || existingAttributes.consistency || '',
                color: (document.getElementById('attr_color')?.value || '').trim() || existingAttributes.color || '',
                extraction_method: (document.getElementById('attr_extraction')?.value || '').trim() || existingAttributes.extraction_method || '',
                purity: (document.getElementById('attr_purity')?.value || '').trim() || existingAttributes.purity || ''
            }
        };

        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const imageFile = imageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        // Obtener URLs de imágenes existentes
        const productImages = existingProduct?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;

        // Preparar imágenes para backend update
        if (imageBase64) {
            formData.image = imageBase64;
        } else if (existingPrimaryUrl) {
            formData.image = existingPrimaryUrl;
        }
        
        console.log('💎 Datos del concentrado a guardar:', formData);
        
        const url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Error al guardar el producto');
        
        const result = await response.json();
        console.log('✅ Concentrado medicinal guardado:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Concentrado medicinal ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') await loadProducts();
        
    } catch (error) {
        console.error('Error guardando concentrado medicinal:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar el concentrado: ' + error.message);
        }
    }
}

/**
 * MODAL DE EDICIÓN - SEMILLAS
 */
function openSeedEditModal(product) {
    console.log('🌱 Abriendo modal de edición de Semillas');
    // Guardar en variable global para fallbacks (igual que flores/aceites/concentrados)
    currentProductForEditing = product;
    
    const isEdit = product !== null;
    const strainInfo = product ? parseJSON(product.strain_info) : {type: '', genetics: '', flowering_time: '', yield: '', thc: '', cbd: ''};
    const attrs = product ? parseJSON(product.attributes) : {harvest_time: '', aroma: '', effects: ''};
    
    const modalHTML = `
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Semilla</h2>
                        <p class="text-green-100 text-sm mt-1">🌱 Genética de Calidad</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="semillas">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-green-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Cepa *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Breeder</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="">Sin breeder</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}" placeholder="Ej: Auto indica clásica para principiantes"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-green-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-green-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="packs" ${product?.stock_unit === 'packs' ? 'selected' : ''}>Packs</option>
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Semillas</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Unidad</label>
                                <select id="productUnitType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="unit" ${product?.unit_type === 'unit' ? 'selected' : ''}>Unidad</option>
                                    <option value="weight" ${product?.unit_type === 'weight' ? 'selected' : ''}>Peso</option>
                                    <option value="volume" ${product?.unit_type === 'volume' ? 'selected' : ''}>Volumen</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad Base</label>
                                <input type="text" id="productBaseUnit" value="${product?.base_unit || 'pack'}" placeholder="Ej: pack, unidad, g"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Unidad</label>
                                <input type="number" id="productUnitSize" step="1" min="1" value="${product?.unit_size || 3}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información Genética -->
                    <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center">
                            <i class="fas fa-dna mr-2"></i>Información Genética
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Cepa</label>
                                <input type="text" id="strain_type" value="${strainInfo.type || ''}" placeholder="Ej: Indica Auto"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Genética</label>
                                <input type="text" id="strain_genetics" value="${strainInfo.genetics || ''}" placeholder="Ej: Northern Lights x Ruderalis"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Floración</label>
                                <input type="text" id="strain_flowering_time" value="${strainInfo.flowering_time || ''}" placeholder="Ej: 65-75 días desde semilla"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Rendimiento</label>
                                <input type="text" id="strain_yield" value="${strainInfo.yield || ''}" placeholder="Ej: 400-450g/m²"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC (%)</label>
                                <input type="text" id="strain_thc" value="${strainInfo.thc || ''}" placeholder="Ej: 14-18%"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBD (%)</label>
                                <input type="text" id="strain_cbd" value="${strainInfo.cbd || ''}" placeholder="Ej: <1%"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Especificaciones -->
                    <div class="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                        <h3 class="text-lg font-bold text-purple-800 mb-4 flex items-center">
                            <i class="fas fa-cogs mr-2"></i>Especificaciones
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Semillas por Pack</label>
                                <input type="number" id="spec_seeds_per_pack" value="${product ? parseJSON(product.specifications)?.seeds_per_pack || '' : ''}" placeholder="3"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Feminizada</label>
                                <select id="spec_feminized" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="Sí" ${product && parseJSON(product.specifications)?.feminized === 'Sí' ? 'selected' : ''}>Sí</option>
                                    <option value="No" ${product && parseJSON(product.specifications)?.feminized === 'No' ? 'selected' : ''}>No</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Autofloreciente</label>
                                <select id="spec_autoflowering" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="Sí" ${product && parseJSON(product.specifications)?.autoflowering === 'Sí' ? 'selected' : ''}>Sí</option>
                                    <option value="No" ${product && parseJSON(product.specifications)?.autoflowering === 'No' ? 'selected' : ''}>No</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dificultad</label>
                                <select id="spec_difficulty" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="Fácil" ${product && parseJSON(product.specifications)?.difficulty === 'Fácil' ? 'selected' : ''}>Fácil</option>
                                    <option value="Intermedio" ${product && parseJSON(product.specifications)?.difficulty === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
                                    <option value="Difícil" ${product && parseJSON(product.specifications)?.difficulty === 'Difícil' ? 'selected' : ''}>Difícil</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Altura</label>
                                <input type="text" id="spec_height" value="${product ? parseJSON(product.specifications)?.height || '' : ''}" placeholder="Ej: 90-120cm"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Clima</label>
                                <input type="text" id="spec_climate" value="${product ? parseJSON(product.specifications)?.climate || '' : ''}" placeholder="Ej: Interior/Exterior"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Características -->
                    <div class="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                        <h3 class="text-lg font-bold text-amber-800 mb-4 flex items-center">
                            <i class="fas fa-seedling mr-2"></i>Características
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Cosecha</label>
                                <input type="text" id="attr_harvest_time" value="${attrs.harvest_time || ''}" placeholder="Ej: Todo el año"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Aroma</label>
                                <input type="text" id="attr_aroma" value="${attrs.aroma || ''}" placeholder="Ej: Dulce, Terroso"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos</label>
                                <input type="text" id="attr_effects" value="${attrs.effects || ''}" placeholder="Ej: Relajante, Sedante"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                        </div>
                    </div>

                    <!-- Información de Cultivo -->
                    <div class="bg-emerald-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-leaf mr-2 text-emerald-600"></i>Información de Cultivo
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Floración</label>
                                <input type="text" id="attr_flowering" value="${attrs.flowering_time || ''}" placeholder="Ej: 8-9 semanas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Altura</label>
                                <input type="text" id="attr_height" value="${attrs.height || ''}" placeholder="Ej: 80-120cm"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Rendimiento Indoor</label>
                                <input type="text" id="attr_yield_indoor" value="${attrs.yield_indoor || ''}" placeholder="Ej: 400-500g/m²"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Rendimiento Outdoor</label>
                                <input type="text" id="attr_yield_outdoor" value="${attrs.yield_outdoor || ''}" placeholder="Ej: 600-800g/planta"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Dificultad de Cultivo</label>
                                <select id="strain_difficulty" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                    <option value="easy" ${strainInfo.difficulty === 'easy' ? 'selected' : ''}>Fácil</option>
                                    <option value="medium" ${strainInfo.difficulty === 'medium' ? 'selected' : ''}>Intermedio</option>
                                    <option value="hard" ${strainInfo.difficulty === 'hard' ? 'selected' : ''}>Avanzado</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Clima Preferido</label>
                                <select id="attr_climate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                    <option value="temperate" ${attrs.climate === 'temperate' ? 'selected' : ''}>Templado</option>
                                    <option value="dry" ${attrs.climate === 'dry' ? 'selected' : ''}>Seco</option>
                                    <option value="humid" ${attrs.climate === 'humid' ? 'selected' : ''}>Húmedo</option>
                                    <option value="cold" ${attrs.climate === 'cold' ? 'selected' : ''}>Frío</option>
                                    <option value="hot" ${attrs.climate === 'hot' ? 'selected' : ''}>Caluroso</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${(!product || product.status === 'active' || product.status === 1) ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-100 px-6 py-4 flex-shrink-0">
                <div class="flex gap-3">
                    <button onclick="saveSeedProduct()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
                        <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Semilla
                    </button>
                    <button onclick="closeEditModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Semilla
 */
async function saveSeedProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        console.log('🧩 saveSeedProduct - productId detectado:', productId, 'isEdit:', !!isEdit);
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear datos existentes
        const existingStrainInfo = existingProduct ? parseJSONField(existingProduct.strain_info) : {};
        const existingSpecs = existingProduct ? parseJSONField(existingProduct.specifications) : {};
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};

        // Helper para preservar valores
        const preserveValue = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                return existingValue !== undefined ? existingValue : '';
            }
            return newValue;
        };
        
        // Datos básicos del producto con fallbacks, scoped al modal
        const modalScopeEl = document.getElementById('editProductModal');
        const getVal = (sel) => (modalScopeEl ? modalScopeEl.querySelector(sel)?.value : document.querySelector(sel)?.value);
        const productData = {
            name: getVal('#productName') || currentProductForEditing?.name || '',
            slug: generateSlug((getVal('#productName') || currentProductForEditing?.name || '')),
            sku: getVal('#productSku') || currentProductForEditing?.sku || '',
            description: getVal('#productDescription') || currentProductForEditing?.description || '',
            short_description: getVal('#productShortDescription') || currentProductForEditing?.short_description || '',
            category_slug: 'semillas',
            product_type: 'seed',
            is_medicinal: 0,
            requires_prescription: 0,
            base_price: parseFloat(getVal('#productPrice')) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(getVal('#productStock')) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: getVal('#productStockUnit'),
            unit_type: getVal('#productUnitType'),
            base_unit: getVal('#productBaseUnit'),
            unit_size: parseFloat(getVal('#productUnitSize')),
            brand_id: getVal('#productBrand') || null,
            featured: (modalScopeEl ? modalScopeEl.querySelector('#productFeatured')?.checked : document.getElementById('productFeatured')?.checked) ? 1 : 0,
            status: (modalScopeEl ? modalScopeEl.querySelector('#productActive')?.checked : document.getElementById('productActive')?.checked) ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            strain_info: {
                type: preserveValue(getVal('#strain_type'), existingStrainInfo.type),
                genetics: preserveValue(getVal('#strain_genetics'), existingStrainInfo.genetics),
                flowering_time: preserveValue(getVal('#strain_flowering_time'), existingStrainInfo.flowering_time),
                yield: preserveValue(getVal('#strain_yield'), existingStrainInfo.yield),
                thc: preserveValue(getVal('#strain_thc'), existingStrainInfo.thc),
                cbd: preserveValue(getVal('#strain_cbd'), existingStrainInfo.cbd)
            },
            
            specifications: {
                seeds_per_pack: parseInt(getVal('#spec_seeds_per_pack')) || existingSpecs.seeds_per_pack || 3,
                feminized: preserveValue(getVal('#spec_feminized'), existingSpecs.feminized),
                autoflowering: preserveValue(getVal('#spec_autoflowering'), existingSpecs.autoflowering),
                difficulty: preserveValue(getVal('#spec_difficulty'), existingSpecs.difficulty),
                height: preserveValue(getVal('#spec_height'), existingSpecs.height),
                climate: preserveValue(getVal('#spec_climate'), existingSpecs.climate)
            },
            
            attributes: {
                harvest_time: preserveValue(getVal('#attr_harvest_time'), existingAttributes.harvest_time),
                aroma: preserveValue(getVal('#attr_aroma'), existingAttributes.aroma),
                effects: preserveValue(getVal('#attr_effects'), existingAttributes.effects)
            }
        };
        
        console.log('🌱 Datos de la semilla a guardar:', productData);
        
        // Validar campos requeridos
        if (!productData.name || !productData.base_price || !productData.stock_quantity) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor completa los campos requeridos');
            }
            return;
        }

        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
        }

        // Obtener URLs de imágenes existentes (del producto cargado o del existingProduct)
        const productImages = existingProduct?.images || currentProductForEditing?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;
        
        console.log('📸 Información de imágenes:');
        console.log('  - Nueva imagen principal seleccionada:', !!imageFile);
        console.log('  - Nueva segunda imagen seleccionada:', !!secondImageFile);
        console.log('  - URLs existentes encontradas:', {
            primary: existingPrimaryUrl ? 'Sí' : 'No',
            second: existingSecondUrl ? 'Sí' : 'No'
        });
        console.log('  - Product images array length:', productImages.length);
        
        // Preparar imágenes para backend update
        // SIEMPRE enviar imágenes: nuevas (base64) o existentes (URLs)
        if (imageBase64) {
            productData.image = imageBase64;
            console.log('  ✅ Enviando nueva imagen principal (base64)');
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
            console.log('  ✅ Preservando imagen principal existente:', existingPrimaryUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay imagen principal (nueva ni existente)');
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
            console.log('  ✅ Enviando nueva segunda imagen (base64)');
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
            console.log('  ✅ Preservando segunda imagen existente:', existingSecondUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay segunda imagen (nueva ni existente)');
        }
        
        console.log('🌱 Guardando semilla...');
        console.log('📦 Datos a enviar (incluye imágenes):', {
            tieneImage: !!productData.image,
            tieneSecondImage: !!productData.productSecondImage
        });
        
        // Forzar PUT si tenemos id en currentProductForEditing (fallback extra)
        let url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        let method = isEdit ? 'PUT' : 'POST';
        if (!isEdit && currentProductForEditing?.id) {
            url = `http://localhost:3000/api/products/${currentProductForEditing.id}`;
            method = 'PUT';
            console.log('🛠️ Forzando PUT usando currentProductForEditing.id:', currentProductForEditing.id);
        }
        
        console.log('🛰️ Request semilla:', { method, url, hasId: !!productId, usingCurrentId: !!currentProductForEditing?.id });

        let response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });

        // Fallback: si fue POST y falló, reintentar PUT si tenemos id
        if (!response.ok && method === 'POST') {
            const fallbackId = productId || currentProductForEditing?.id;
            if (fallbackId) {
                const putUrl = `http://localhost:3000/api/products/${fallbackId}`;
                console.warn('♻️ Reintentando como PUT →', putUrl);
                response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(productData)
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const result = await response.json();
        console.log('✅ Semilla guardada:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Semilla ${isEdit ? 'actualizada' : 'creada'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error guardando semilla:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar la semilla: ' + error.message);
        }
    }
}

/**
 * MODAL DE EDICIÓN - VAPORIZADORES
 */
function openVaporizerEditModal(product) {
    console.log('💨 Abriendo modal de edición de Vaporizadores');
    // Guardar en variable global para fallbacks (igual que otras categorías)
    currentProductForEditing = product;
    
    const isEdit = product !== null;
    const specs = product ? parseJSON(product.specifications) : {material: '', heating: '', temp_range: '', battery: '', warranty: ''};
    const attrs = product ? parseJSON(product.attributes) : {color: '', size: '', weight: '', features: ''};
    
    const modalHTML = `
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Vaporizador</h2>
                        <p class="text-orange-100 text-sm mt-1">💨 Tecnología de Vaporización</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="vaporizadores">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-orange-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}" placeholder="Ej: Premium dual use con app"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-green-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-orange-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                    <option value="piezas" ${product?.stock_unit === 'piezas' ? 'selected' : ''}>Piezas</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Unidad</label>
                                <select id="productUnitType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                    <option value="unit" ${product?.unit_type === 'unit' ? 'selected' : ''}>Unidad</option>
                                    <option value="weight" ${product?.unit_type === 'weight' ? 'selected' : ''}>Peso</option>
                                    <option value="volume" ${product?.unit_type === 'volume' ? 'selected' : ''}>Volumen</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad Base</label>
                                <input type="text" id="productBaseUnit" value="${product?.base_unit || 'unidad'}" placeholder="Ej: unidad, gramo, ml"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Unidad</label>
                                <input type="number" id="productUnitSize" step="0.1" min="0" value="${product?.unit_size || 1}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            </div>
                        </div>
                    </div>

                    <!-- Especificaciones Técnicas -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cogs mr-2 text-blue-600"></i>Especificaciones Técnicas
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Material Compatible</label>
                                <select id="spec_material" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccionar...</option>
                                    <option value="Hierbas secas" ${specs.material === 'Hierbas secas' ? 'selected' : ''}>Hierbas secas</option>
                                    <option value="Concentrados" ${specs.material === 'Concentrados' ? 'selected' : ''}>Concentrados</option>
                                    <option value="Hierbas secas y concentrados" ${specs.material === 'Hierbas secas y concentrados' ? 'selected' : ''}>Dual Use (Hierbas + Concentrados)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Método de Calentamiento</label>
                                <select id="spec_heating" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccionar...</option>
                                    <option value="Convección" ${specs.heating === 'Convección' ? 'selected' : ''}>Convección</option>
                                    <option value="Conducción" ${specs.heating === 'Conducción' ? 'selected' : ''}>Conducción</option>
                                    <option value="Híbrido" ${specs.heating === 'Híbrido' ? 'selected' : ''}>Híbrido</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Rango de Temperatura</label>
                                <input type="text" id="spec_temp_range" value="${specs.temp_range || ''}" placeholder="Ej: 182-215°C"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Información de Batería</label>
                                <input type="text" id="spec_battery" value="${specs.battery || ''}" placeholder="Ej: 8-10 sesiones"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Garantía</label>
                                <input type="text" id="spec_warranty" value="${specs.warranty || ''}" placeholder="Ej: 10 años"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Características del Producto -->
                    <div class="bg-amber-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cube mr-2 text-amber-600"></i>Características del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                <input type="text" id="attr_color" value="${attrs.color || ''}" placeholder="Ej: Negro mate"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño</label>
                                <input type="text" id="attr_size" value="${attrs.size || ''}" placeholder="Ej: Portátil 9.8x3x2.1cm"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Peso</label>
                                <input type="text" id="attr_weight" value="${attrs.weight || ''}" placeholder="Ej: 93g"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Características Especiales</label>
                                <input type="text" id="attr_features" value="${attrs.features || ''}" placeholder="Ej: Control App, Vibraciones"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${(!product || product.status === 'active' || product.status === 1) ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-100 px-6 py-4 flex-shrink-0">
                <div class="flex gap-3">
                    <button onclick="saveVaporizerProduct()" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition">
                        <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Vaporizador
                    </button>
                    <button onclick="closeEditModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Vaporizador
 */
async function saveVaporizerProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        console.log('🧩 saveVaporizerProduct - productId detectado:', productId, 'isEdit:', !!isEdit);
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear datos existentes
        const existingSpecs = existingProduct ? parseJSONField(existingProduct.specifications) : {};
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};

        // Helper para preservar valores
        const preserveValue = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                return existingValue !== undefined ? existingValue : '';
            }
            return newValue;
        };
        
        // Scope del modal y helper para obtener valores
        const modalScopeEl = document.getElementById('editProductModal');
        const getVal = (sel) => (modalScopeEl ? modalScopeEl.querySelector(sel)?.value : document.querySelector(sel)?.value);

        // Datos básicos del producto
        const productData = {
            name: getVal('#productName') || currentProductForEditing?.name || '',
            slug: generateSlug(getVal('#productName') || currentProductForEditing?.name || ''),
            sku: getVal('#productSku') || currentProductForEditing?.sku || '',
            description: getVal('#productDescription') || currentProductForEditing?.description || '',
            short_description: getVal('#productShortDescription') || currentProductForEditing?.short_description || '',
            category_slug: 'vaporizadores',
            product_type: 'accessory',
            is_medicinal: 0,
            requires_prescription: 0,
            base_price: parseFloat(getVal('#productPrice')) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(getVal('#productStock')) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: getVal('#productStockUnit'),
            unit_type: getVal('#productUnitType'),
            base_unit: getVal('#productBaseUnit'),
            unit_size: parseFloat(getVal('#productUnitSize')),
            brand_id: getVal('#productBrand') || null,
            featured: (modalScopeEl ? modalScopeEl.querySelector('#productFeatured')?.checked : document.getElementById('productFeatured')?.checked) ? 1 : 0,
            status: (modalScopeEl ? modalScopeEl.querySelector('#productActive')?.checked : document.getElementById('productActive')?.checked) ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            specifications: {
                material: preserveValue(getVal('#spec_material'), existingSpecs.material),
                heating: preserveValue(getVal('#spec_heating'), existingSpecs.heating),
                temp_range: preserveValue(getVal('#spec_temp_range'), existingSpecs.temp_range),
                battery: preserveValue(getVal('#spec_battery'), existingSpecs.battery),
                warranty: preserveValue(getVal('#spec_warranty'), existingSpecs.warranty)
            },
            
            attributes: {
                color: preserveValue(getVal('#attr_color'), existingAttributes.color),
                size: preserveValue(getVal('#attr_size'), existingAttributes.size),
                weight: preserveValue(getVal('#attr_weight'), existingAttributes.weight),
                features: preserveValue(getVal('#attr_features'), existingAttributes.features)
            }
        };
        
        console.log('💨 Datos del vaporizador a guardar:', productData);

        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
        }

        // Obtener URLs de imágenes existentes (del producto cargado o del existingProduct)
        const productImages = existingProduct?.images || currentProductForEditing?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;
        
        console.log('📸 Información de imágenes:');
        console.log('  - Nueva imagen principal seleccionada:', !!imageFile);
        console.log('  - Nueva segunda imagen seleccionada:', !!secondImageFile);
        console.log('  - URLs existentes encontradas:', {
            primary: existingPrimaryUrl ? 'Sí' : 'No',
            second: existingSecondUrl ? 'Sí' : 'No'
        });
        console.log('  - Product images array length:', productImages.length);
        
        // Preparar imágenes para backend update
        // SIEMPRE enviar imágenes: nuevas (base64) o existentes (URLs)
        if (imageBase64) {
            productData.image = imageBase64;
            console.log('  ✅ Enviando nueva imagen principal (base64)');
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
            console.log('  ✅ Preservando imagen principal existente:', existingPrimaryUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay imagen principal (nueva ni existente)');
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
            console.log('  ✅ Enviando nueva segunda imagen (base64)');
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
            console.log('  ✅ Preservando segunda imagen existente:', existingSecondUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay segunda imagen (nueva ni existente)');
        }
        
        console.log('💨 Guardando vaporizador...');
        console.log('📦 Datos a enviar (incluye imágenes):', {
            tieneImage: !!productData.image,
            tieneSecondImage: !!productData.productSecondImage
        });
        
        // Forzar PUT si tenemos id en currentProductForEditing (fallback extra)
        let url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        let method = isEdit ? 'PUT' : 'POST';
        if (!isEdit && currentProductForEditing?.id) {
            url = `http://localhost:3000/api/products/${currentProductForEditing.id}`;
            method = 'PUT';
            console.log('🛠️ Forzando PUT usando currentProductForEditing.id:', currentProductForEditing.id);
        }
        
        console.log('🛰️ Request vaporizador:', { method, url, hasId: !!productId, usingCurrentId: !!currentProductForEditing?.id });

        let response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });

        // Fallback: si fue POST y falló, reintentar PUT si tenemos id
        if (!response.ok && method === 'POST') {
            const fallbackId = productId || currentProductForEditing?.id;
            if (fallbackId) {
                const putUrl = `http://localhost:3000/api/products/${fallbackId}`;
                console.warn('♻️ Reintentando como PUT →', putUrl);
                response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(productData)
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const result = await response.json();
        console.log('✅ Vaporizador guardado:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Vaporizador ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') await loadProducts();
        
    } catch (error) {
        console.error('Error guardando vaporizador:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar el vaporizador: ' + error.message);
        }
    }
}

/**
 * MODAL DE EDICIÓN - ROPA
 */
function openApparelEditModal(product) {
    console.log('👕 Abriendo modal de edición de Ropa');
    // Guardar en variable global para fallbacks (igual que flores/aceites/concentrados/semillas)
    currentProductForEditing = product;
    
    const isEdit = product !== null;
    const specs = product ? parseJSON(product.specifications) : {material: '', weight: '', sizes: '', care: ''};
    const attrs = product ? parseJSON(product.attributes) : {color: '', fit: '', print: ''};
    
    const modalHTML = `
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-pink-600 to-purple-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Prenda</h2>
                        <p class="text-pink-100 text-sm mt-1">👕 Estilo y Comodidad</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="ropa">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-pink-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}" placeholder="Ej: Polera clásica negra"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-pink-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-pink-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-pink-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Especificaciones -->
                    <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center">
                            <i class="fas fa-tags mr-2"></i>Especificaciones
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                                <input type="text" id="spec_material" value="${specs.material || ''}" placeholder="Ej: Algodón peinado 100%"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Gramaje</label>
                                <input type="text" id="spec_weight" value="${specs.weight || ''}" placeholder="Ej: 180 GSM"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tallas Disponibles</label>
                                <input type="text" id="spec_sizes" value="${specs.sizes || ''}" placeholder="Ej: S, M, L, XL, XXL"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Cuidado</label>
                                <input type="text" id="spec_care" value="${specs.care || ''}" placeholder="Ej: Lavar a máquina agua fría"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Atributos -->
                    <div class="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                        <h3 class="text-lg font-bold text-purple-800 mb-4 flex items-center">
                            <i class="fas fa-palette mr-2"></i>Atributos
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                <input type="text" id="attr_color" value="${attrs.color || ''}" placeholder="Ej: Negro"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Ajuste</label>
                                <input type="text" id="attr_fit" value="${attrs.fit || ''}" placeholder="Ej: Regular unisex"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Estampado</label>
                                <input type="text" id="attr_print" value="${attrs.print || ''}" placeholder="Ej: Logo bordado pecho"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${(!product || product.status === 'active' || product.status === 1) ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-100 px-6 py-4 flex-shrink-0">
                <div class="flex gap-3">
                    <button onclick="saveApparelProduct()" class="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-semibold transition">
                        <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Prenda
                    </button>
                    <button onclick="closeEditModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    showEditModal(modalHTML);
    
    // Verificar valores después de insertar
    setTimeout(() => {
        const inputs = {
            productName: document.getElementById('productName'),
            productPrice: document.getElementById('productPrice'),
            productStock: document.getElementById('productStock'),
            productShortDescription: document.getElementById('productShortDescription')
        };
        
        console.log('✅ Modal insertado. Valores en DOM:');
        console.log('  - productName:', inputs.productName?.value, '(elemento:', inputs.productName !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productPrice:', inputs.productPrice?.value, '(elemento:', inputs.productPrice !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productStock:', inputs.productStock?.value, '(elemento:', inputs.productStock !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
        console.log('  - productShortDescription:', inputs.productShortDescription?.value, '(elemento:', inputs.productShortDescription !== null ? 'encontrado' : 'NO ENCONTRADO', ')');
    }, 200);
}

/**
 * Guardar Ropa
 */
async function saveApparelProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        console.log('🧩 saveApparelProduct - productId detectado:', productId, 'isEdit:', !!isEdit);
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear datos existentes
        const existingSpecs = existingProduct ? parseJSONField(existingProduct.specifications) : {};
        const existingAttributes = existingProduct ? parseJSONField(existingProduct.attributes) : {};

        // Helper para preservar valores
        const preserveValue = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                return existingValue !== undefined ? existingValue : '';
            }
            return newValue;
        };
        
        // Scope del modal y helper para leer valores (evita conflictos de IDs)
        const modalScopeEl = document.getElementById('editProductModal');
        const getVal = (sel) => (modalScopeEl ? modalScopeEl.querySelector(sel)?.value : document.querySelector(sel)?.value);

        // Datos básicos del producto
        const productData = {
            name: getVal('#productName') || currentProductForEditing?.name || '',
            slug: generateSlug(getVal('#productName') || currentProductForEditing?.name || ''),
            sku: getVal('#productSku') || currentProductForEditing?.sku || '',
            description: getVal('#productDescription') || currentProductForEditing?.description || '',
            short_description: getVal('#productShortDescription') || currentProductForEditing?.short_description || '',
            category_slug: 'ropa',
            product_type: 'apparel',
            is_medicinal: 0,
            requires_prescription: 0,
            base_price: parseFloat(getVal('#productPrice')) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(getVal('#productStock')) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: getVal('#productStockUnit'),
            brand_id: getVal('#productBrand') || null,
            featured: (modalScopeEl ? modalScopeEl.querySelector('#productFeatured')?.checked : document.getElementById('productFeatured')?.checked) ? 1 : 0,
            status: (modalScopeEl ? modalScopeEl.querySelector('#productActive')?.checked : document.getElementById('productActive')?.checked) ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            specifications: {
                material: preserveValue(getVal('#spec_material'), existingSpecs.material),
                weight: preserveValue(getVal('#spec_weight'), existingSpecs.weight),
                sizes: preserveValue(getVal('#spec_sizes'), existingSpecs.sizes),
                care: preserveValue(getVal('#spec_care'), existingSpecs.care)
            },
            
            attributes: {
                color: preserveValue(getVal('#attr_color'), existingAttributes.color),
                fit: preserveValue(getVal('#attr_fit'), existingAttributes.fit),
                print: preserveValue(getVal('#attr_print'), existingAttributes.print)
            }
        };
        
        console.log('👕 Datos de la prenda a guardar:', productData);
        
        // Validar campos requeridos
        if (!productData.name || !productData.base_price || !productData.stock_quantity) {
            if (typeof notify !== 'undefined') {
                notify.error('Por favor completa los campos requeridos');
            }
            return;
        }

        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
        }

        // Obtener URLs de imágenes existentes (del producto cargado o del existingProduct)
        const productImages = existingProduct?.images || currentProductForEditing?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;
        
        console.log('📸 Información de imágenes:');
        console.log('  - Nueva imagen principal seleccionada:', !!imageFile);
        console.log('  - Nueva segunda imagen seleccionada:', !!secondImageFile);
        console.log('  - URLs existentes encontradas:', {
            primary: existingPrimaryUrl ? 'Sí' : 'No',
            second: existingSecondUrl ? 'Sí' : 'No'
        });
        console.log('  - Product images array length:', productImages.length);
        
        // Preparar imágenes para backend update
        // SIEMPRE enviar imágenes: nuevas (base64) o existentes (URLs)
        if (imageBase64) {
            productData.image = imageBase64;
            console.log('  ✅ Enviando nueva imagen principal (base64)');
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
            console.log('  ✅ Preservando imagen principal existente:', existingPrimaryUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay imagen principal (nueva ni existente)');
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
            console.log('  ✅ Enviando nueva segunda imagen (base64)');
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
            console.log('  ✅ Preservando segunda imagen existente:', existingSecondUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay segunda imagen (nueva ni existente)');
        }
        
        console.log('👕 Guardando prenda...');
        console.log('📦 Datos a enviar (incluye imágenes):', {
            tieneImage: !!productData.image,
            tieneSecondImage: !!productData.productSecondImage
        });
        
        // Forzar PUT si tenemos id en currentProductForEditing (fallback extra)
        let url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        let method = isEdit ? 'PUT' : 'POST';
        if (!isEdit && currentProductForEditing?.id) {
            url = `http://localhost:3000/api/products/${currentProductForEditing.id}`;
            method = 'PUT';
            console.log('🛠️ Forzando PUT usando currentProductForEditing.id:', currentProductForEditing.id);
        }
        
        console.log('🛰️ Request prenda:', { method, url, hasId: !!productId, usingCurrentId: !!currentProductForEditing?.id });

        let response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });

        // Fallback: si fue POST y falló, reintentar PUT si tenemos id
        if (!response.ok && method === 'POST') {
            const fallbackId = productId || currentProductForEditing?.id;
            if (fallbackId) {
                const putUrl = `http://localhost:3000/api/products/${fallbackId}`;
                console.warn('♻️ Reintentando como PUT →', putUrl);
                response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(productData)
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const result = await response.json();
        console.log('✅ Prenda guardada:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Prenda ${isEdit ? 'actualizada' : 'creada'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error guardando prenda:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar la prenda: ' + error.message);
        }
    }
}

/**
 * MODAL DE EDICIÓN - CONCENTRADOS MEDICINALES
 */
function openConcentrateEditModal(product) {
    console.log('💎 Abriendo modal de edición de Concentrados');
    // Guardar en variable global para fallbacks (igual que flores/aceites)
    currentProductForEditing = product;
    
    const isEdit = product !== null;
    const cannabinoids = product ? parseJSON(product.cannabinoid_profile) : {thc: '', cbd: '', cbn: '', cbg: ''};
    const strainInfo = product ? parseJSON(product.strain_info) : {type: '', genetics: '', extraction: ''};
    const therapeuticInfo = product ? parseJSON(product.therapeutic_info) : {conditions: [], benefits: [], effects: []};
    const usageInfo = product ? parseJSON(product.usage_info) : {recommended_time: '', dosage: {beginner: '', intermediate: '', advanced: ''}, administration: [], onset: '', duration: ''};
    
    const modalHTML = `
    <div id="editProductModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeEditModal(event)">
        <div class="bg-white rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Editar' : 'Crear'} Concentrado Medicinal</h2>
                        <p class="text-purple-100 text-sm mt-1">💎 Extracción de Alta Pureza</p>
                    </div>
                    <button onclick="closeEditModal()" class="text-white hover:text-red-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto modal-scroll p-6">
                <form id="productEditForm" class="space-y-6">
                    <input type="hidden" id="productId" value="${product?.id || ''}">
                    <input type="hidden" id="categorySlug" value="medicinal-concentrados">
                    
                    <!-- Información Básica -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-purple-600"></i>Información Básica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre del Concentrado *</label>
                                <input type="text" id="productName" required value="${product?.name || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                                <input type="text" id="productSku" value="${product?.sku || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                                <select id="productBrand" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="">Sin marca</option>
                                    ${allBrands.map(brand => `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="productDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${product?.description || ''}</textarea>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción Corta</label>
                                <input type="text" id="productShortDescription" value="${product?.short_description || ''}" placeholder="Ej: Wax 85% THC para dolor severo"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imagen del Producto -->
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-image mr-2 text-purple-600"></i>Imagen del Producto
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Imagen Principal -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen Principal *</label>
                                <input type="file" id="productImage" accept="image/*" onchange="previewImage(this, 'imagePreview')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreview" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.image_url || (product?.images && product.images.length > 0 && product.images[0]?.url) ? 
                                        `<img src="${product.image_url || product.images[0].url}" alt="Preview" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin imagen</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Segunda Imagen -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Segunda Imagen (opcional)</label>
                                <input type="file" id="productSecondImage" accept="image/*" onchange="previewImage(this, 'imagePreviewSecond')"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <p class="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, WebP (máx. 5MB)</p>
                                
                                <div id="imagePreviewSecond" class="w-full h-32 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    ${product?.images && product.images.length > 1 && product.images[1]?.url ? 
                                        `<img src="${product.images[1].url}" alt="Preview Second" class="max-h-full max-w-full object-contain rounded">` :
                                        '<span class="text-gray-400 text-xs"><i class="fas fa-image mr-2"></i>Sin segunda imagen</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Precio y Stock -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-dollar-sign mr-2 text-purple-600"></i>Precio y Stock
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Base (CLP) *</label>
                                <input type="number" id="productPrice" required step="1" min="0" value="${product?.base_price || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock Cantidad *</label>
                                <input type="number" id="productStock" required step="1" min="0" value="${product?.stock_quantity || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad de Stock</label>
                                <select id="productStockUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="gramos" ${product?.stock_unit === 'gramos' ? 'selected' : ''}>Gramos</option>
                                    <option value="ml" ${product?.stock_unit === 'ml' ? 'selected' : ''}>ML</option>
                                    <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Unidad</label>
                                <select id="productUnitType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="weight" ${product?.unit_type === 'weight' ? 'selected' : ''}>Peso</option>
                                    <option value="volume" ${product?.unit_type === 'volume' ? 'selected' : ''}>Volumen</option>
                                    <option value="unit" ${product?.unit_type === 'unit' ? 'selected' : ''}>Unidad</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad Base</label>
                                <input type="text" id="productBaseUnit" value="${product?.base_unit || 'g'}" placeholder="Ej: g, ml, unidad"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tamaño Unidad</label>
                                <input type="number" id="productUnitSize" step="0.1" min="0.1" value="${product?.unit_size || 1}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Categoría Médica</label>
                                <select id="productMedicalCategory" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="thc" ${product?.medical_category === 'thc' ? 'selected' : ''}>THC</option>
                                    <option value="cbd" ${product?.medical_category === 'cbd' ? 'selected' : ''}>CBD</option>
                                    <option value="balanced" ${product?.medical_category === 'balanced' ? 'selected' : ''}>Balanceado</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Perfil de Cannabinoides -->
                    <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                        <h3 class="text-lg font-bold text-green-800 mb-4 flex items-center">
                            <i class="fas fa-leaf mr-2"></i>Perfil de Cannabinoides (%)
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">THC (%)</label>
                                <input type="number" id="cannabinoid_thc" step="0.1" min="0" max="100" value="${cannabinoids.thc || ''}" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBD (%)</label>
                                <input type="number" id="cannabinoid_cbd" step="0.1" min="0" max="100" value="${cannabinoids.cbd || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBN (%)</label>
                                <input type="number" id="cannabinoid_cbn" step="0.1" min="0" max="100" value="${cannabinoids.cbn || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">CBG (%)</label>
                                <input type="number" id="cannabinoid_cbg" step="0.1" min="0" max="100" value="${cannabinoids.cbg || ''}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Cepa -->
                    <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center">
                            <i class="fas fa-dna mr-2"></i>Información de Cepa
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                                <input type="text" id="strain_type" value="${strainInfo.type || ''}" placeholder="Ej: Indica dominant concentrate"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Genética</label>
                                <input type="text" id="strain_genetics" value="${strainInfo.genetics || ''}" placeholder="Ej: Purple Punch"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Extracción</label>
                                <input type="text" id="strain_extraction" value="${strainInfo.extraction || ''}" placeholder="Ej: BHO purificado"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información Terapéutica -->
                    <div class="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                        <h3 class="text-lg font-bold text-amber-800 mb-4 flex items-center">
                            <i class="fas fa-medkit mr-2"></i>Información Terapéutica
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Condiciones</label>
                                <textarea id="therapeutic_conditions" rows="3" placeholder="Ej: Dolor crónico severo, Insomnio severo, Espasticidad"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">${therapeuticInfo.conditions ? therapeuticInfo.conditions.join(', ') : ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Beneficios</label>
                                <textarea id="therapeutic_benefits" rows="3" placeholder="Ej: Analgesia intensa, Sedación profunda"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">${therapeuticInfo.benefits ? therapeuticInfo.benefits.join(', ') : ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Efectos</label>
                                <textarea id="therapeutic_effects" rows="3" placeholder="Ej: Relajación profunda, Sedación, Euforia"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">${therapeuticInfo.effects ? therapeuticInfo.effects.join(', ') : ''}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Uso -->
                    <div class="bg-rose-50 rounded-lg p-6 border-2 border-rose-200">
                        <h3 class="text-lg font-bold text-rose-800 mb-4 flex items-center">
                            <i class="fas fa-clock mr-2"></i>Información de Uso
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tiempo Recomendado</label>
                                <select id="usage_recommended_time" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                                    <option value="Diurno" ${usageInfo.recommended_time === 'Diurno' ? 'selected' : ''}>Diurno</option>
                                    <option value="Nocturno" ${usageInfo.recommended_time === 'Nocturno' ? 'selected' : ''}>Nocturno</option>
                                    <option value="Cualquier momento" ${usageInfo.recommended_time === 'Cualquier momento' ? 'selected' : ''}>Cualquier momento</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Administración</label>
                                <input type="text" id="usage_administration" value="${usageInfo.administration ? usageInfo.administration.join(', ') : ''}" 
                                    placeholder="Ej: Vaporización 315-370°C, Dabbing"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Inicio de Efectos</label>
                                <input type="text" id="usage_onset" value="${usageInfo.onset || ''}" placeholder="Ej: Inmediato"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Duración</label>
                                <input type="text" id="usage_duration" value="${usageInfo.duration || ''}" placeholder="Ej: 2-4 horas"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                            </div>
                        </div>
                        
                        <!-- Guía de Dosificación -->
                        <div class="mt-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Guía de Dosificación</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Principiante</label>
                                    <input type="text" id="dosage_beginner" value="${usageInfo.dosage?.beginner || ''}" placeholder="Ej: 0.01-0.02g"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Intermedio</label>
                                    <input type="text" id="dosage_intermediate" value="${usageInfo.dosage?.intermediate || ''}" placeholder="Ej: 0.02-0.05g"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Avanzado</label>
                                    <input type="text" id="dosage_advanced" value="${usageInfo.dosage?.advanced || ''}" placeholder="Ej: 0.05-0.1g"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configuración -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cog mr-2 text-gray-600"></i>Configuración
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="productFeatured" ${product?.featured ? 'checked' : ''} class="mr-2">
                                <label for="productFeatured" class="text-sm font-semibold text-gray-700">Producto Destacado</label>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="productActive" ${product?.status === 'active' ? 'checked' : ''} class="mr-2">
                                <label for="productActive" class="text-sm font-semibold text-gray-700">Producto Activo</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer con botones -->
            <div class="bg-gray-100 p-6 flex justify-end space-x-4 flex-shrink-0">
                <button type="button" onclick="closeEditModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                    Cancelar
                </button>
                <button type="button" onclick="saveConcentrateProduct()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar' : 'Crear'} Concentrado
                </button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Verificar y forzar inicialización de campos básicos
    setTimeout(() => {
        const modalEl = document.getElementById('editProductModal');
        const nameEl = modalEl ? modalEl.querySelector('#productName') : document.getElementById('productName');
        const skuEl = modalEl ? modalEl.querySelector('#productSku') : document.getElementById('productSku');
        const priceEl = modalEl ? modalEl.querySelector('#productPrice') : document.getElementById('productPrice');
        const stockEl = modalEl ? modalEl.querySelector('#productStock') : document.getElementById('productStock');
        const shortDescEl = modalEl ? modalEl.querySelector('#productShortDescription') : document.getElementById('productShortDescription');

        if (nameEl && (!nameEl.value || nameEl.value.trim() === '')) nameEl.value = currentProductForEditing?.name || '';
        if (skuEl && (!skuEl.value || skuEl.value.trim() === '')) skuEl.value = currentProductForEditing?.sku || '';
        if (priceEl && (!priceEl.value || parseFloat(priceEl.value) <= 0)) priceEl.value = (currentProductForEditing?.base_price || currentProductForEditing?.price || 0);
        if (stockEl && (!stockEl.value || parseFloat(stockEl.value) <= 0)) stockEl.value = (currentProductForEditing?.stock_quantity || currentProductForEditing?.stock || 0);
        if (shortDescEl && (!shortDescEl.value || shortDescEl.value.trim() === '')) shortDescEl.value = currentProductForEditing?.short_description || '';

        console.log('🔍 Verificando valores en el DOM después de cargar el modal:');
        console.log('  - productName:', nameEl?.value);
        console.log('  - productPrice:', priceEl?.value);
        console.log('  - productStock:', stockEl?.value);
        console.log('  - productShortDescription:', shortDescEl?.value);
    }, 200);
}

/**
 * Guardar Concentrado Medicinal
 */
async function saveConcentrateProduct() {
    try {
        // Obtener productId del DOM o de la variable global como fallback
        let productId = document.getElementById('productId')?.value;
        
        // Si no se encuentra en el DOM, usar la variable global
        if (!productId && currentProductForEditing) {
            productId = currentProductForEditing.id;
            console.log('⚠️ productId no encontrado en DOM, usando variable global:', productId);
        }
        
        const isEdit = productId && productId !== '' && productId !== 'undefined';
        console.log('🧩 saveConcentrateProduct - productId detectado:', productId, 'isEdit:', !!isEdit);
        
        console.log('💾 Guardando producto:', {
            productId,
            isEdit,
            fromDOM: !!document.getElementById('productId')?.value,
            fromGlobal: !!currentProductForEditing?.id,
            currentProductName: currentProductForEditing?.name,
            currentProductPrice: currentProductForEditing?.base_price
        });

        // Si estamos editando, obtener datos existentes para preservar valores vacíos
        let existingProduct = null;
        if (isEdit) {
            try {
                const existingResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }).then(res => res.json());
                if (existingResponse.success && existingResponse.data?.product) {
                    existingProduct = existingResponse.data.product;
                    console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                }
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                // Usar variable global como fallback
                if (currentProductForEditing) {
                    existingProduct = currentProductForEditing;
                }
            }
        }

        // Helper para parsear JSON desde string o objeto
        const parseJSONField = (data) => {
            if (!data) return {};
            if (typeof data === 'string') {
                try {
                    let parsed = data;
                    if (parsed.startsWith('"') && parsed.endsWith('"')) {
                        parsed = JSON.parse(parsed);
                    }
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    return parsed;
                } catch (e) {
                    try {
                        return JSON.parse(data);
                    } catch (e2) {
                        console.warn('Error parseando JSON:', e2);
                        return {};
                    }
                }
            }
            return data || {};
        };

        // Parsear therapeutic_info existente
        const existingTherapeuticInfo = existingProduct ? parseJSONField(existingProduct.therapeutic_info) : {};

        // Preservar valores existentes si los campos están vacíos
        const getTherapeuticArray = (newValue, existingValue) => {
            if (!newValue || newValue.trim() === '') {
                if (Array.isArray(existingValue)) {
                    return existingValue;
                } else if (existingValue && typeof existingValue === 'string') {
                    try {
                        const parsed = parseJSONField(existingValue);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return [];
            }
            return newValue.split(',').map(s => s.trim()).filter(Boolean);
        };
        
        // Scope del modal y helper para obtener valores
        const modalScopeEl = document.getElementById('editProductModal');
        const getVal = (sel) => (modalScopeEl ? modalScopeEl.querySelector(sel)?.value : document.querySelector(sel)?.value);

        // Datos básicos del producto
        const productData = {
            name: getVal('#productName') || currentProductForEditing?.name || '',
            slug: generateSlug(getVal('#productName') || currentProductForEditing?.name || ''),
            sku: getVal('#productSku') || currentProductForEditing?.sku || '',
            description: getVal('#productDescription') || currentProductForEditing?.description || '',
            short_description: getVal('#productShortDescription') || currentProductForEditing?.short_description || '',
            category_slug: 'medicinal-concentrados',
            product_type: 'concentrate',
            is_medicinal: 1,
            requires_prescription: 1,
            medical_category: getVal('#productMedicalCategory') || '',
            base_price: parseFloat(getVal('#productPrice')) || parseFloat(currentProductForEditing?.base_price || currentProductForEditing?.price) || 0,
            stock_quantity: parseFloat(getVal('#productStock')) || parseFloat(currentProductForEditing?.stock_quantity || currentProductForEditing?.stock) || 0,
            stock_unit: (modalScopeEl ? modalScopeEl.querySelector('#productStockUnit')?.value : document.getElementById('productStockUnit')?.value),
            unit_type: (modalScopeEl ? modalScopeEl.querySelector('#productUnitType')?.value : document.getElementById('productUnitType')?.value),
            base_unit: (modalScopeEl ? modalScopeEl.querySelector('#productBaseUnit')?.value : document.getElementById('productBaseUnit')?.value),
            unit_size: parseFloat(getVal('#productUnitSize')),
            brand_id: (modalScopeEl ? modalScopeEl.querySelector('#productBrand')?.value : document.getElementById('productBrand')?.value) || null,
            featured: (modalScopeEl ? modalScopeEl.querySelector('#productFeatured')?.checked : document.getElementById('productFeatured')?.checked) ? 1 : 0,
            status: (modalScopeEl ? modalScopeEl.querySelector('#productActive')?.checked : document.getElementById('productActive')?.checked) ? 'active' : 'inactive',
            
            // JSONs como objetos (el backend hace JSON.stringify)
            cannabinoid_profile: {
                thc: parseFloat(document.getElementById('cannabinoid_thc')?.value) || 0,
                cbd: parseFloat(document.getElementById('cannabinoid_cbd')?.value) || 0,
                cbn: parseFloat(document.getElementById('cannabinoid_cbn')?.value) || 0,
                cbg: parseFloat(document.getElementById('cannabinoid_cbg')?.value) || 0
            },
            
            strain_info: {
                type: getVal('#strain_type'),
                genetics: getVal('#strain_genetics'),
                extraction: getVal('#strain_extraction')
            },
            
            therapeutic_info: {
                conditions: getTherapeuticArray(document.getElementById('therapeutic_conditions')?.value || '', existingTherapeuticInfo.conditions),
                benefits: getTherapeuticArray(document.getElementById('therapeutic_benefits')?.value || '', existingTherapeuticInfo.benefits),
                effects: getTherapeuticArray(document.getElementById('therapeutic_effects')?.value || '', existingTherapeuticInfo.effects)
            },
            
            usage_info: {
                recommended_time: getVal('#usage_recommended_time'),
                dosage: {
                    beginner: getVal('#dosage_beginner'),
                    intermediate: getVal('#dosage_intermediate'),
                    advanced: getVal('#dosage_advanced')
                },
                administration: getVal('#usage_administration')
                    .split(',').map(s => s.trim()).filter(s => s),
                onset: getVal('#usage_onset'),
                duration: getVal('#usage_duration')
            }
        };
        
        console.log('💎 Datos del concentrado a guardar:', productData);
        
        // Validar campos requeridos (igual que flores)
        if (!productData.name || productData.name.trim() === '') {
            if (typeof notify !== 'undefined') notify.error('Por favor completa el nombre del producto');
            return;
        }
        if (!productData.base_price || productData.base_price <= 0 || isNaN(productData.base_price)) {
            if (typeof notify !== 'undefined') notify.error('Por favor ingresa un precio válido mayor a cero');
            return;
        }
        if (!productData.stock_quantity || productData.stock_quantity <= 0 || isNaN(productData.stock_quantity)) {
            if (typeof notify !== 'undefined') notify.error('Por favor ingresa una cantidad de stock válida mayor a cero');
            return;
        }

        // Verificar si hay imágenes para subir y convertirlas a base64 (scoped al modal)
        const modalEl = document.getElementById('editProductModal');
        const imageInputEl = modalEl ? modalEl.querySelector('#productImage') : document.getElementById('productImage');
        const secondImageInputEl = modalEl ? modalEl.querySelector('#productSecondImage') : document.getElementById('productSecondImage');
        const imageFile = imageInputEl?.files?.[0];
        const secondImageFile = secondImageInputEl?.files?.[0];

        // Procesar imágenes
        let imageBase64 = null;
        let secondImageBase64 = null;

        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        }

        if (secondImageFile) {
            secondImageBase64 = await fileToBase64(secondImageFile);
        }

        // Obtener URLs de imágenes existentes (del producto cargado o del existingProduct)
        const productImages = existingProduct?.images || currentProductForEditing?.images || [];
        const existingPrimaryUrl = productImages[0]?.url || null;
        const existingSecondUrl = productImages[1]?.url || null;
        
        console.log('📸 Información de imágenes:');
        console.log('  - Nueva imagen principal seleccionada:', !!imageFile);
        console.log('  - Nueva segunda imagen seleccionada:', !!secondImageFile);
        console.log('  - URLs existentes encontradas:', {
            primary: existingPrimaryUrl ? 'Sí' : 'No',
            second: existingSecondUrl ? 'Sí' : 'No'
        });
        console.log('  - Product images array length:', productImages.length);
        
        // Preparar imágenes para backend update
        // SIEMPRE enviar imágenes: nuevas (base64) o existentes (URLs)
        if (imageBase64) {
            productData.image = imageBase64;
            console.log('  ✅ Enviando nueva imagen principal (base64)');
        } else if (existingPrimaryUrl) {
            productData.image = existingPrimaryUrl;
            console.log('  ✅ Preservando imagen principal existente:', existingPrimaryUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay imagen principal (nueva ni existente)');
        }

        if (secondImageBase64) {
            productData.productSecondImage = secondImageBase64;
            console.log('  ✅ Enviando nueva segunda imagen (base64)');
        } else if (existingSecondUrl) {
            productData.productSecondImage = existingSecondUrl;
            console.log('  ✅ Preservando segunda imagen existente:', existingSecondUrl.substring(0, 50) + '...');
        } else {
            console.log('  ⚠️ No hay segunda imagen (nueva ni existente)');
        }
        
        console.log('💎 Guardando concentrado...');
        console.log('📦 Datos a enviar (incluye imágenes):', {
            tieneImage: !!productData.image,
            tieneSecondImage: !!productData.productSecondImage
        });
        
        // Forzar PUT si tenemos id en currentProductForEditing (fallback extra)
        let url = isEdit ? `http://localhost:3000/api/products/${productId}` : 'http://localhost:3000/api/products';
        let method = isEdit ? 'PUT' : 'POST';
        if (!isEdit && currentProductForEditing?.id) {
            url = `http://localhost:3000/api/products/${currentProductForEditing.id}`;
            method = 'PUT';
            console.log('🛠️ Forzando PUT usando currentProductForEditing.id:', currentProductForEditing.id);
        }
        
        console.log('🛰️ Request concentrado:', { method, url, hasId: !!productId, usingCurrentId: !!currentProductForEditing?.id });

        let response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify(productData)
        });

        // Fallback: si fue POST y falló, reintentar PUT si tenemos id
        if (!response.ok && method === 'POST') {
            const fallbackId = productId || currentProductForEditing?.id;
            if (fallbackId) {
                const putUrl = `http://localhost:3000/api/products/${fallbackId}`;
                console.warn('♻️ Reintentando como PUT →', putUrl);
                response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(productData)
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const result = await response.json();
        console.log('✅ Concentrado guardado:', result);
        
        if (typeof notify !== 'undefined') {
            notify.success(`Concentrado ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
        }
        
        closeEditModal();
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error guardando concentrado:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al guardar el concentrado: ' + error.message);
        }
    }
}

/**
 * FUNCIÓN AUXILIAR - PREVISUALIZAR IMAGEN
 */
function previewImage(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (typeof notify !== 'undefined') {
                notify.error('La imagen debe ser menor a 5MB');
            } else {
                alert('La imagen debe ser menor a 5MB');
            }
            input.value = '';
            return;
        }
        
        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            if (typeof notify !== 'undefined') {
                notify.error('Formato no válido. Use JPG, PNG o WebP');
            } else {
                alert('Formato no válido. Use JPG, PNG o WebP');
            }
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="max-h-full max-w-full object-contain rounded">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<span class="text-gray-400"><i class="fas fa-image mr-2"></i>Sin imagen</span>';
    }
}

// Exportar funciones
window.previewImage = previewImage;
window.openApparelEditModal = openApparelEditModal;
window.saveApparelProduct = saveApparelProduct;
window.openVaporizerEditModal = openVaporizerEditModal;
window.saveVaporizerProduct = saveVaporizerProduct;
window.openSeedEditModal = openSeedEditModal;
window.saveSeedProduct = saveSeedProduct;
window.openMedicinalOilEditModal = openMedicinalOilEditModal;
window.saveMedicinalOilProduct = saveMedicinalOilProduct;
window.saveMedicinalFlowerProduct = saveMedicinalFlowerProduct;
window.openConcentrateEditModal = openConcentrateEditModal;
window.saveConcentrateProduct = saveConcentrateProduct;
window.generateSlug = generateSlug;

// ============================================
// FUNCIÓN AUXILIAR PARA GUARDAR IMÁGENES
// ============================================

/**
 * Guarda una imagen en la tabla product_images
 * @param {number} productId - ID del producto
 * @param {string} imageBase64 - Imagen en formato base64
 * @param {boolean} isPrimary - Si es la imagen principal
 * @param {number} displayOrder - Orden de visualización
 */
async function saveProductImage(productId, imageBase64, isPrimary, displayOrder) {
    try {
        console.log(`📤 Guardando imagen para producto ${productId}...`);
        
        const response = await fetch('http://localhost:3000/api/products/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                product_id: productId,
                url: imageBase64,
                alt_text: `Imagen del producto ${productId}`,
                is_primary: isPrimary ? 1 : 0,
                display_order: displayOrder
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Imagen guardada exitosamente:`, result);
            return result;
        } else {
            const errorData = await response.json();
            console.error('❌ Error al guardar imagen:', errorData);
            throw new Error(errorData.message || 'Error al guardar imagen');
        }
        
    } catch (error) {
        console.error('❌ Error en saveProductImage:', error);
        // No lanzamos el error para no interrumpir el flujo
        // La imagen simplemente no se guardará
        if (typeof notify !== 'undefined') {
            notify.warning('Producto guardado pero hubo un error al guardar la imagen');
        }
    }
}

// Exponer función global
window.saveProductImage = saveProductImage;

console.log('✅ Modales de edición cargados: Flores, Aceites, Concentrados, Semillas, Vaporizadores, Ropa');