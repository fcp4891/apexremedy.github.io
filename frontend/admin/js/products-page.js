// Funcion para actualizar las etiquetas de precio medicinal segun la unidad
function updateMedicinalPriceLabels() {
    const unit = document.getElementById('productUnit')?.value || 'gramos';
    const suffix = unit === 'mililitros' ? 'ml' : 'g';
    
    // Actualizar etiquetas
    const label5 = document.getElementById('label5');
    const label10 = document.getElementById('label10');
    const label20 = document.getElementById('label20');
    
    if (label5) label5.textContent = `Precio 5${suffix} *`;
    if (label10) label10.textContent = `Precio 10${suffix} *`;
    if (label20) label20.textContent = `Precio 20${suffix} *`;
    
    // También actualizar el label del precio principal si existe
    const priceLabel = document.querySelector('label[for="productPrice"]');
    if (priceLabel && document.getElementById('productCategory')?.value === 'medicinal') {
        priceLabel.textContent = `Precio 1${suffix} *`;
    }
    
    console.log('🏷️ Etiquetas actualizadas a:', suffix);
}

// FUNCIÓN REDIRIGIDA AL SISTEMA DE SELECCIÓN DE CATEGORÍAS
function openCreateModal() {
    console.log('🆕 Redirigiendo al selector de categorías (sistema mejorado)...');
    if (typeof window.openCreateModal === 'function' && window.openCreateModal !== openCreateModal) {
        window.openCreateModal();
    } else if (typeof window.openCategorySelector === 'function') {
        window.openCategorySelector();
    } else {
        console.error('❌ Sistema de modales mejorado no disponible');
        if (typeof notify !== 'undefined') {
            notify.error('No se pudo abrir el modal de creación');
        }
    }
}

// Función de fallback para el modal básico de creación
function openBasicCreateModal() {
    console.warn('openBasicCreateModal ya no está disponible. Usa el sistema mejorado de modales.');
}

// Configurar Drag and Drop para imagenes
document.addEventListener('DOMContentLoaded', function() {
    console.debug('Legacy modal hooks deshabilitados: se usa el sistema de modales mejorado.');
});

function setupImageDropzones() {
    console.debug('setupImageDropzones (legacy) -> no-op');
}

function setupDropzone() {
    console.debug('setupDropzone (legacy) -> no-op');
}

function removeImage() {
    console.debug('removeImage (legacy) -> no-op');
}

function handleImageUpload() {
    console.debug('handleImageUpload (legacy) -> no-op');
}

function handleImageFile(file, type) {
    if (!file.type.startsWith('image/')) {
        notify.error('Por favor selecciona un archivo de imagen valido');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // Aumentado a 5MB para el archivo original
        notify.error('La imagen no debe superar 5MB');
        return;
    }

    // Mostrar indicador de carga
    const dropzone = type === 'main' ? 
        document.getElementById('mainImageDropzone') : 
        document.getElementById('hoverImageDropzone');
    
    const originalContent = dropzone.innerHTML;
    dropzone.innerHTML = '<div class="text-green-600"><i class="fas fa-spinner fa-spin text-4xl mb-2"></i><p>Procesando imagen...</p></div>';

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Comprimir la imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tamaño máximo para las imágenes
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            
            let width = img.width;
            let height = img.height;
            
            // Calcular nuevas dimensiones manteniendo el aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a base64 con compresión (0.85 = 85% calidad)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            
            // Calcular tamaño de la imagen comprimida
            const compressedSize = Math.round((compressedBase64.length * 3) / 4);
            console.log(`Imagen ${type} comprimida: ${(compressedSize / 1024).toFixed(2)} KB (original: ${(file.size / 1024).toFixed(2)} KB)`);
            
            // Restaurar contenido original del dropzone
            dropzone.innerHTML = originalContent;
            
            // Actualizar UI
            if (type === 'main') {
                document.getElementById('previewImg').src = compressedBase64;
                document.getElementById('previewImg').classList.remove('hidden');
                document.getElementById('uploadPlaceholder').classList.add('hidden');
                document.getElementById('removeImageBtn').classList.remove('hidden');
                document.getElementById('productImage').value = compressedBase64;
            } else if (type === 'second') {
                document.getElementById('previewImgSecond').src = compressedBase64;
                document.getElementById('previewImgSecond').classList.remove('hidden');
                document.getElementById('uploadPlaceholderSecond').classList.add('hidden');
                document.getElementById('removeSecondImageBtn').classList.remove('hidden');
                document.getElementById('productSecondImage').value = compressedBase64;
            }
            
            notify.success('Imagen cargada correctamente');
        };
        
        img.onerror = function() {
            dropzone.innerHTML = originalContent;
            notify.error('Error al procesar la imagen');
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        dropzone.innerHTML = originalContent;
        notify.error('Error al leer el archivo de imagen');
    };
    
    reader.readAsDataURL(file);
}

// FUNCIÓN REDIRIGIDA AL SISTEMA DE MODALES PERSONALIZADOS
async function openEditModal(productId) {
    console.log('🔄 === PRODUCTS.HTML === openEditModal llamado con ID:', productId);
    
    // Usar la función del sistema de adminProductModals.js
    if (typeof window.adminOpenEditModal === 'function') {
        console.log('📞 Llamando a adminOpenEditModal del sistema...');
        return window.adminOpenEditModal(productId);
    }
    console.error('❌ adminOpenEditModal no disponible');
    if (typeof notify !== 'undefined') {
        notify.error('No se pudo abrir el modal de edición');
    }
}

// Función de fallback para el modal básico (la función original)
async function openBasicEditModal(productId) {
    try {
        console.log('🔍 === USANDO MODAL BÁSICO (FALLBACK) ===');
        console.log('Product ID:', productId);
        
        const response = await api.getProductById(productId);
        console.log('📦 RESPUESTA COMPLETA DEL BACKEND:');
        console.log(JSON.stringify(response, null, 2));
        
        if (!response.success) {
            throw new Error(response.message || 'Error al obtener el producto');
        }
        
        const product = response.data.product;
        console.log('📦 PRODUCTO EXTRAÍDO:');
        console.log(JSON.stringify(product, null, 2));
        
        // Actualizar título del modal
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('productId').value = product.id;
        
        // ===== INFORMACIÓN BÁSICA =====
        console.log('\n📝 CARGANDO INFORMACIÓN BÁSICA...');
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productFeatured').checked = product.featured || false;
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productBreeder').value = product.breeder || '';
        console.log('✅ Información básica cargada');
        
        // Actualizar campos según categoría
        console.log('\n🔄 EJECUTANDO updateFormFields()...');
        updateFormFields();
        
        // Verificar si la sección medicinal está visible
        const medicinalSection = document.getElementById('medicinalSection');
        console.log('Sección medicinal visible:', medicinalSection && !medicinalSection.classList.contains('hidden'));
        
        // ===== CARGAR IMÁGENES =====
        // Cargar imagen principal
        if (product.image || (product.images && product.images.length > 0)) {
            const imgUrl = product.image || product.images[0].url || '';
            if (imgUrl) {
                document.getElementById('previewImg').src = imgUrl;
                document.getElementById('previewImg').classList.remove('hidden');
                document.getElementById('uploadPlaceholder').classList.add('hidden');
                document.getElementById('removeImageBtn').classList.remove('hidden');
                document.getElementById('productImage').value = imgUrl;
            }
        }
        
        // Cargar segunda imagen si existe
        if (product.images && product.images.length > 1) {
            const secondImgUrl = product.images[1].url;
            if (secondImgUrl) {
                document.getElementById('previewImgSecond').src = secondImgUrl;
                document.getElementById('previewImgSecond').classList.remove('hidden');
                document.getElementById('uploadPlaceholderSecond').classList.add('hidden');
                document.getElementById('removeSecondImageBtn').classList.remove('hidden');
                document.getElementById('productSecondImage').value = secondImgUrl;
            }
        } else if (product.image_hover) {
            // Mantener compatibilidad con el sistema antiguo
            document.getElementById('previewImgSecond').src = product.image_hover;
            document.getElementById('previewImgSecond').classList.remove('hidden');
            document.getElementById('uploadPlaceholderSecond').classList.add('hidden');
            document.getElementById('removeSecondImageBtn').classList.remove('hidden');
            document.getElementById('productSecondImage').value = product.image_hover;
        }
        
        // ===== DATOS MEDICINALES =====
        if (product.category === 'medicinal') {
            console.log('\n💊 === CARGANDO DATOS MEDICINALES ===');
            
            // ESPERAR un momento para que updateFormFields termine
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verificar que los campos existan
            console.log('\n🔍 VERIFICANDO EXISTENCIA DE CAMPOS:');
            const camposMedicinales = {
                'productUnit': document.getElementById('productUnit'),
                'medicinalStrainType': document.getElementById('medicinalStrainType'),
                'price5g': document.getElementById('price5g'),
                'price10g': document.getElementById('price10g'),
                'price20g': document.getElementById('price20g'),
                'therapeuticUse': document.getElementById('therapeuticUse'),
                'dosageRecommendation': document.getElementById('dosageRecommendation'),
                'administrationMethod': document.getElementById('administrationMethod'),
                'contraindications': document.getElementById('contraindications'),
                'sideEffects': document.getElementById('sideEffects'),
                'medicinalThc': document.getElementById('medicinalThc'),
                'medicinalCbd': document.getElementById('medicinalCbd'),
                'medicinalCbn': document.getElementById('medicinalCbn'),
                'medicinalGenetics': document.getElementById('medicinalGenetics'),
                'medicinalOrigin': document.getElementById('medicinalOrigin'),
                'medicinalAromas': document.getElementById('medicinalAromas'),
                'medicinalEffects': document.getElementById('medicinalEffects'),
                'medicinalTerpenes': document.getElementById('medicinalTerpenes'),
                'medicinalFlavor': document.getElementById('medicinalFlavor')
            };
            
            let camposFaltantes = [];
            Object.keys(camposMedicinales).forEach(id => {
                if (!camposMedicinales[id]) {
                    console.error(`❌ Campo ${id} NO EXISTE`);
                    camposFaltantes.push(id);
                } else {
                    console.log(`✅ Campo ${id} existe`);
                }
            });
            
            if (camposFaltantes.length > 0) {
                console.error('⚠️ FALTAN ESTOS CAMPOS:', camposFaltantes);
                if (typeof notify !== 'undefined') {
                    notify.error('Faltan campos en el formulario. Revisa la consola.', 'Error de Validación');
                } else {
                    console.error('Error: Faltan campos en el formulario');
                }
                return;
            }
            
            // Helper para parsear JSON (definirlo antes de usar)
            const parseJSONField = (data) => {
                if (!data) return {};
                if (typeof data === 'string') {
                    try {
                        // Puede venir doblemente escapado
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
            
            // Parsear strain_info primero para usarlo más adelante
            let strainInfo = {};
            if (product.strain_info) {
                strainInfo = parseJSONField(product.strain_info);
                console.log('strain_info PARSEADO (temprano):', strainInfo);
                
                // Si strain_info tiene datos pero los campos directos están vacíos, usarlos
                if (!product.medicinal_genetics && strainInfo.genetics) {
                    product.medicinal_genetics = strainInfo.genetics;
                }
                if (!product.medicinal_origin && strainInfo.origin) {
                    product.medicinal_origin = strainInfo.origin;
                }
                if (!product.medicinal_strain_type && strainInfo.type) {
                    product.medicinal_strain_type = strainInfo.type;
                }
            }
            
            // Unidad y tipo de cepa
            console.log('\n📏 CARGANDO UNIDAD Y TIPO DE CEPA:');
            const unitSelect = document.getElementById('productUnit');
            if (unitSelect && product.unit) {
                unitSelect.value = product.unit;
                console.log('✅ Unidad establecida:', product.unit);
            } else {
                console.warn('⚠️ No hay unidad o el campo no existe');
            }
            
            const strainSelect = document.getElementById('medicinalStrainType');
            if (strainSelect && product.medicinal_strain_type) {
                strainSelect.value = product.medicinal_strain_type;
                console.log('✅ Tipo de cepa:', product.medicinal_strain_type);
            } else {
                console.warn('⚠️ No hay tipo de cepa o el campo no existe');
            }
            
            // Actualizar etiquetas
            updateMedicinalPriceLabels();
            
            // ===== PRECIOS MEDICINALES (VARIANTES) =====
            console.log('\n💰 CARGANDO VARIANTES DE PRECIO:');
            console.log('Variantes en BD:', product.price_variants);
            
            // Limpiar contenedor de variantes
            const priceVariantsContainer = document.getElementById('priceVariantsContainer');
            if (priceVariantsContainer) {
                priceVariantsContainer.innerHTML = '';
            }
            
            // Cargar variantes de precio desde product.price_variants
            if (product.price_variants && Array.isArray(product.price_variants) && product.price_variants.length > 0) {
                product.price_variants.forEach((variant, index) => {
                    addPriceVariant(variant.quantity, variant.unit || 'g', variant.price, index === 0);
                });
                console.log('✅ Variantes de precio cargadas:', product.price_variants.length);
            } else {
                // Si no hay variantes, agregar una por defecto con el base_price
                const defaultPrice = product.base_price || product.price || 0;
                addPriceVariant(1, 'g', defaultPrice, true);
                console.log('✅ Variante por defecto creada con precio:', defaultPrice);
            }
            
            // Establecer base_price en el campo productPrice (si existe) para referencia
            const priceField = document.getElementById('productPrice');
            if (priceField) {
                const firstVariant = product.price_variants && product.price_variants.length > 0 
                    ? product.price_variants[0].price 
                    : (product.base_price || product.price || 0);
                priceField.value = firstVariant;
            }
            
            // ===== CANNABINOIDES =====
            console.log('\n🧪 CARGANDO CANNABINOIDES:');
            
            // Parsear cannabinoid_profile si existe
            let cannabinoidProfile = {};
            if (product.cannabinoid_profile) {
                cannabinoidProfile = parseJSONField(product.cannabinoid_profile);
                console.log('cannabinoid_profile PARSEADO:', cannabinoidProfile);
            }
            
            // Usar valores de cannabinoid_profile si los campos directos están vacíos
            const thcValue = product.medicinal_thc || cannabinoidProfile.thc || '';
            const cbdValue = product.medicinal_cbd || cannabinoidProfile.cbd || '';
            const cbnValue = product.medicinal_cbn || cannabinoidProfile.cbn || '';
            
            console.log('Cannabinoides en BD:', {
                THC: thcValue,
                CBD: cbdValue,
                CBN: cbnValue,
                desde_cannabinoid_profile: Object.keys(cannabinoidProfile).length > 0
            });
            
            const thcInput = document.getElementById('medicinalThc');
            const cbdInput = document.getElementById('medicinalCbd');
            const cbnInput = document.getElementById('medicinalCbn');
            
            if (thcInput) {
                thcInput.value = thcValue;
                console.log('✅ THC asignado:', thcInput.value);
            }
            if (cbdInput) {
                cbdInput.value = cbdValue;
                console.log('✅ CBD asignado:', cbdInput.value);
            }
            if (cbnInput) {
                cbnInput.value = cbnValue;
                console.log('✅ CBN asignado:', cbnInput.value);
            }
            
            // ===== INFORMACIÓN DE LA CEPA =====
            console.log('\n🌱 CARGANDO INFORMACIÓN DE CEPA:');
            
            // Parsear terpene_profile si existe
            let terpeneProfile = {};
            if (product.terpene_profile) {
                terpeneProfile = parseJSONField(product.terpene_profile);
                console.log('terpene_profile PARSEADO:', terpeneProfile);
            }
            
            // Usar valores de strain_info si están disponibles (ya parseados arriba)
            const geneticsValue = product.medicinal_genetics || strainInfo.genetics || strainInfo.lineage || '';
            const originValue = product.medicinal_origin || strainInfo.origin || '';
            
            // Para terpenos, construir string desde el objeto si está en terpene_profile
            let terpenesString = product.medicinal_terpenes || '';
            if (!terpenesString && Object.keys(terpeneProfile).length > 0) {
                // Construir lista de terpenos desde el objeto
                terpenesString = Object.entries(terpeneProfile)
                    .filter(([name, value]) => value && value !== '' && value !== 0)
                    .map(([name, value]) => name)
                    .join(', ');
            }
            
            const strainData = {
                genetics: geneticsValue,
                origin: originValue,
                aromas: product.medicinal_aromas || '',
                effects: product.medicinal_effects || '',
                terpenes: terpenesString,
                flavor: product.medicinal_flavor || ''
            };
            console.log('Datos de cepa en BD:', strainData);
            
            const geneticsInput = document.getElementById('medicinalGenetics');
            const originInput = document.getElementById('medicinalOrigin');
            const aromasInput = document.getElementById('medicinalAromas');
            const effectsInput = document.getElementById('medicinalEffects');
            const terpenesInput = document.getElementById('medicinalTerpenes');
            const flavorInput = document.getElementById('medicinalFlavor');
            
            if (geneticsInput) {
                geneticsInput.value = geneticsValue;
                console.log('✅ Genética asignada:', geneticsInput.value);
            }
            if (originInput) {
                originInput.value = originValue;
                console.log('✅ Origen asignado:', originInput.value);
            }
            if (aromasInput) {
                aromasInput.value = product.medicinal_aromas || '';
                console.log('✅ Aromas asignados');
            }
            if (effectsInput) {
                effectsInput.value = product.medicinal_effects || '';
                console.log('✅ Efectos asignados');
            }
            if (terpenesInput) {
                terpenesInput.value = terpenesString;
                console.log('✅ Terpenos asignados');
            }
            if (flavorInput) {
                flavorInput.value = product.medicinal_flavor || '';
                console.log('✅ Sabor asignado');
            }
            
            // ===== INFORMACIÓN TERAPÉUTICA =====
            console.log('\n💊 CARGANDO INFORMACIÓN TERAPÉUTICA:');
            console.log('medicinal_info RAW:', product.medicinal_info);
            
            let medicinalInfo = parseJSONField(product.medicinal_info);
            console.log('medicinal_info PARSEADO:', medicinalInfo);
            
            const therapeuticInput = document.getElementById('therapeuticUse');
            const dosageInput = document.getElementById('dosageRecommendation');
            const administrationInput = document.getElementById('administrationMethod');
            const contraindicationsInput = document.getElementById('contraindications');
            const sideEffectsInput = document.getElementById('sideEffects');
            
            if (therapeuticInput) {
                therapeuticInput.value = medicinalInfo.therapeutic_use || '';
                console.log('✅ Uso terapéutico asignado:', therapeuticInput.value);
            }
            if (dosageInput) {
                dosageInput.value = medicinalInfo.dosage_recommendation || medicinalInfo.dosage?.beginner || '';
                console.log('✅ Dosificación asignada:', dosageInput.value);
            }
            if (administrationInput) {
                // Puede venir como array o string
                const adminValue = medicinalInfo.administration;
                if (Array.isArray(adminValue)) {
                    administrationInput.value = adminValue.join(', ');
                } else {
                    administrationInput.value = adminValue || '';
                }
                console.log('✅ Administración asignada:', administrationInput.value);
            }
            if (contraindicationsInput) {
                // Puede venir como array o string
                const contraValue = medicinalInfo.contraindications;
                if (Array.isArray(contraValue)) {
                    contraindicationsInput.value = contraValue.join(', ');
                } else {
                    contraindicationsInput.value = contraValue || '';
                }
                console.log('✅ Contraindicaciones asignadas:', contraindicationsInput.value);
            }
            if (sideEffectsInput) {
                // Puede venir como array o string
                const sideValue = medicinalInfo.side_effects;
                if (Array.isArray(sideValue)) {
                    sideEffectsInput.value = sideValue.join(', ');
                } else {
                    sideEffectsInput.value = sideValue || '';
                }
                console.log('✅ Efectos secundarios asignados:', sideEffectsInput.value);
            }
            
            console.log('\n✅ === DATOS MEDICINALES CARGADOS ===');
        }
        
        // Abrir modal
        document.getElementById('productModal').classList.remove('hidden');
        console.log('\n✅ === MODAL ABIERTO ===');
        
    } catch (error) {
        console.error('❌ === ERROR EN openEditModal ===');
        console.error('Error completo:', error);
        console.error('Stack:', error.stack);
        notify.error('Error al cargar el producto: ' + error.message);
    }
}

console.log('✅ Función openEditModal -> adminOpenEditModal cargada');


// Cerrar modal con overlay y ESC
(function () {
  function enableOverlayToClose(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        if (typeof window.closeModal === 'function') {
          window.closeModal(); // ✅ siempre usa la versión actual
        } else {
          modal.classList.add('hidden');
        }
      }
    });

    const dialog = modal.firstElementChild;
    if (dialog) {
      dialog.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }

  if (document.getElementById('productModal')) {
    enableOverlayToClose('productModal'); // ✅ sin pasar callback
  }

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const modalProduct = document.getElementById('productModal');
    if (modalProduct && !modalProduct.classList.contains('hidden')) {
      if (typeof window.closeModal === 'function') {
        window.closeModal(); // ✅ también dinámico
      } else {
        modalProduct.classList.add('hidden');
      }
    }
  });
})();

// Funcion para actualizar campos del formulario segun la categoria seleccionada
function updateFormFields() {
    console.debug('updateFormFields (legacy) -> no-op');
}

// Funcion para resetear el formulario al abrir el modal
function resetMedicinalLabels() {
    console.debug('resetMedicinalLabels (legacy) -> no-op');
}

function closeModal() {
    console.debug('closeModal (legacy) -> no-op');
}

function addPriceVariant() {
    console.debug('addPriceVariant (legacy) -> no-op');
}

function removePriceVariant() {
    console.debug('removePriceVariant (legacy) -> no-op');
}

function getPriceVariants() {
    console.debug('getPriceVariants (legacy) -> no-op');
    return [];
}

console.log('Funciones de modal cargadas correctamente');

// DEBUG: Verificar carga de sistemas de modales
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔍 === VERIFICACIÓN DE SISTEMAS DE MODALES ===');
        console.log('openMedicinalFlowerEditModal:', typeof openMedicinalFlowerEditModal);
        console.log('openMedicinalOilEditModal:', typeof openMedicinalOilEditModal);  
        console.log('showCategorySelector:', typeof showCategorySelector);
        console.log('adminProductModals cargado:', typeof window.openCreateModal);
        console.log('adminEditModals cargado:', typeof window.openMedicinalFlowerEditModal);
        
        if (typeof openMedicinalFlowerEditModal === 'function') {
            console.log('✅ Sistema de modales de administración listo');
        } else {
            console.warn('⚠️ Sistema de modales de administración no completamente cargado');
        }
    }, 1000);
    
    // Inicializar sistema después de verificaciones
    setTimeout(async () => {
        if (typeof window.manualInit === 'function') {
            console.log('🚀 Llamando a inicialización manual...');
            await window.manualInit();
        } else {
            console.warn('⚠️ manualInit no disponible');
        }
    }, 1500);
});

        // ============================================
        // TAB SWITCHING FUNCTIONS FOR PRODUCTS PAGE
        // ============================================
        let currentProductsTab = 'products';
        
        function switchProductsTab(tabName) {
            currentProductsTab = tabName;
            
            // Hide all tab contents
            document.querySelectorAll('.products-tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active', 'border-green-600', 'text-green-600');
                button.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById('content-' + tabName);
            if (selectedContent) {
                selectedContent.classList.remove('hidden');
            }
            
            // Add active class to selected tab
            const selectedTab = document.getElementById('tab-' + tabName);
            if (selectedTab) {
                selectedTab.classList.add('active', 'border-green-600', 'text-green-600');
                selectedTab.classList.remove('border-transparent', 'text-gray-500');
            }
            
            // Load data for each tab
            if (tabName === 'suppliers') {
                loadSuppliersForProducts();
            } else if (tabName === 'products') {
                // Forzar recarga de productos desde API al cambiar de pestaña
                if (window.allProducts && window.allProducts.length > 0 && 
                    !window.allProducts[0]?.supplier) {
                    console.log('⚠️ Cache sin supplier, forzando recarga...');
                    delete window.allProducts;
                }
                // Reload products with current filters
                if (typeof filterProducts === 'function') {
                    filterProducts();
                }
            }
        }
        
        // Función global para aplicar filtros según la pestaña activa
        window.applyGlobalFilters = function() {
            if (currentProductsTab === 'products') {
                if (typeof filterProducts === 'function') {
                    filterProducts();
                }
            } else if (currentProductsTab === 'suppliers') {
                applySupplierFilters();
            }
        };

        // ============================================
        // SUPPLIERS FUNCTIONS FOR PRODUCTS PAGE
        // ============================================
        let allSuppliersCache = [];
        
        async function loadSuppliersForProducts() {
            try {
                const response = await api.request('/suppliers', { method: 'GET' });
                allSuppliersCache = response.data.suppliers || [];
                applySupplierFilters();
            } catch (error) {
                console.error('Error cargando proveedores:', error);
                const container = document.getElementById('suppliersList');
                container.innerHTML = `
                    <div class="text-center py-8 text-red-400">
                        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                        <p>Error al cargar proveedores</p>
                    </div>
                `;
            }
        }
        
        async function applySupplierFilters() {
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            const selectedCategory = document.getElementById('categoryFilter')?.value || '';
            const selectedStatus = document.getElementById('statusFilter')?.value || '';
            const selectedSupplier = document.getElementById('supplierFilter')?.value || '';
            
            console.log('🔍 [applySupplierFilters] Filtros aplicados:', {
                searchTerm,
                selectedCategory,
                selectedStatus,
                selectedSupplier
            });
            
            // Cargar productos si necesitamos filtrar por categoría o estado
            let products = [];
            const needsProductsFilter = selectedCategory || selectedStatus;
            
            if (needsProductsFilter || selectedSupplier) {
                if (window.allProducts && Array.isArray(window.allProducts)) {
                    products = window.allProducts;
                } else {
                    try {
                        const response = await api.getProducts({ limit: 1000 });
                        if (response.success && response.data && Array.isArray(response.data.products)) {
                            products = response.data.products;
                            window.allProducts = products;
                        }
                    } catch (error) {
                        console.error('❌ Error cargando productos para filtros:', error);
                    }
                }
            }
            
            // Filtrar productos por categoría, estado y proveedor si es necesario
            let filteredProducts = products;
            if (needsProductsFilter || selectedSupplier) {
                filteredProducts = products.filter(product => {
                    // Filtro de categoría
                    let matchesCategory = true;
                    if (selectedCategory) {
                        const productCategoryFields = [
                            product.category_slug,
                            product.category,
                            product.category_name
                        ].filter(field => field && field !== '');
                        
                        matchesCategory = productCategoryFields.some(field => {
                            const exactMatch = field === selectedCategory;
                            const fieldContainsSelected = field.toLowerCase().includes(selectedCategory.toLowerCase());
                            const selectedContainsField = selectedCategory.toLowerCase().includes(field.toLowerCase());
                            return exactMatch || fieldContainsSelected || selectedContainsField;
                        });
                    }
                    
                    // Filtro de estado
                    let matchesStatus = true;
                    if (selectedStatus) {
                        switch (selectedStatus) {
                            case 'in_stock':
                                matchesStatus = (product.stock_quantity || 0) > 0;
                                break;
                            case 'out_of_stock':
                                matchesStatus = (product.stock_quantity || 0) === 0;
                                break;
                            case 'featured':
                                matchesStatus = product.featured == 1;
                                break;
                            case 'medicinal':
                                const isMedicinal = product.is_medicinal == 1 || product.is_medicinal === 1 || 
                                                  product.is_medicinal === '1' || product.is_medicinal === true ||
                                                  product.is_medicinal === 'true';
                                const requiresPrescription = product.requires_prescription == 1 || 
                                                           product.requires_prescription === 1 || 
                                                           product.requires_prescription === '1' || 
                                                           product.requires_prescription === true ||
                                                           product.requires_prescription === 'true';
                                const isMedicinalCategory = (product.category_slug && product.category_slug.includes('medicinal')) ||
                                                          (product.category && product.category.toLowerCase().includes('medicinal')) ||
                                                          (product.category_name && product.category_name.toLowerCase().includes('medicinal'));
                                matchesStatus = isMedicinal || requiresPrescription || isMedicinalCategory;
                                break;
                        }
                    }
                    
                    // Filtro de proveedor (para productos)
                    let matchesSupplier = true;
                    if (selectedSupplier) {
                        if (selectedSupplier === 'AR-PROD') {
                            const supplierCode = product.supplier?.code || product.supplier_code;
                            matchesSupplier = supplierCode === 'AR-PROD';
                        } else if (selectedSupplier === 'external') {
                            const supplierCode = product.supplier?.code || product.supplier_code;
                            matchesSupplier = supplierCode && supplierCode !== 'AR-PROD';
                        }
                    }
                    
                    return matchesCategory && matchesStatus && matchesSupplier;
                });
                
                console.log('📦 Productos filtrados:', filteredProducts.length);
            }
            
            // Obtener IDs de proveedores que tienen productos que cumplen los criterios
            let supplierIdsWithProducts = new Set();
            if (needsProductsFilter || selectedSupplier) {
                filteredProducts.forEach(p => {
                    // Usar product.supplier.id o product.supplier_id
                    const supplierId = p.supplier?.id || p.supplier_id;
                    if (supplierId) {
                        supplierIdsWithProducts.add(supplierId);
                    }
                });
                console.log('🏢 Proveedores con productos que cumplen criterios:', supplierIdsWithProducts.size);
            }
            
            // Filtrar proveedores
            let filteredSuppliers = allSuppliersCache.filter(supplier => {
                // Filtro de búsqueda
                const matchesSearch = !searchTerm || 
                    supplier.name?.toLowerCase().includes(searchTerm) ||
                    supplier.code?.toLowerCase().includes(searchTerm) ||
                    supplier.contact_name?.toLowerCase().includes(searchTerm) ||
                    supplier.email?.toLowerCase().includes(searchTerm) ||
                    supplier.city?.toLowerCase().includes(searchTerm);
                
                if (!matchesSearch) return false;
                
                // Filtro de proveedor (AR-PROD vs external)
                if (selectedSupplier) {
                    if (selectedSupplier === 'AR-PROD') {
                        if (supplier.code !== 'AR-PROD') return false;
                    } else if (selectedSupplier === 'external') {
                        if (!supplier.code || supplier.code === 'AR-PROD') return false;
                    }
                }
                
                // Filtro por productos (si hay filtros de categoría/estado/proveedor)
                if (needsProductsFilter || selectedSupplier) {
                    if (supplierIdsWithProducts.size > 0 && !supplierIdsWithProducts.has(supplier.id)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            console.log('✅ Proveedores filtrados:', filteredSuppliers.length);
            displaySuppliersForProducts(filteredSuppliers);
        }

        function displaySuppliersForProducts(suppliers) {
            const container = document.getElementById('suppliersList');
            
            if (!suppliers || suppliers.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-truck text-4xl mb-2"></i>
                        <p>No hay proveedores registrados</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = suppliers.map(supplier => {
                const isOurProduction = supplier.code === 'AR-PROD' || supplier.name.includes('Apex Remedy');
                return `
                <div class="border ${isOurProduction ? 'border-blue-500 border-2' : 'border-gray-200'} rounded-lg p-4 hover:bg-gray-50 transition ${isOurProduction ? 'bg-blue-50' : ''}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                ${isOurProduction ? '<i class="fas fa-star text-yellow-500"></i>' : ''}
                                <h4 class="font-bold text-gray-800">${supplier.name}</h4>
                                ${isOurProduction ? `
                                    <span class="px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold animate-pulse">
                                        <i class="fas fa-industry mr-1"></i>PRODUCCIÓN PROPIA
                                    </span>
                                ` : ''}
                                <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                    ${supplier.code || 'N/A'}
                                </span>
                                ${supplier.product_count ? `
                                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                        ${supplier.product_count} productos
                                    </span>
                                ` : ''}
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                ${supplier.contact_name ? `<p><i class="fas fa-user mr-1"></i>${supplier.contact_name}</p>` : ''}
                                ${supplier.email ? `<p><i class="fas fa-envelope mr-1"></i>${supplier.email}</p>` : ''}
                                ${supplier.phone ? `<p><i class="fas fa-phone mr-1"></i>${supplier.phone}</p>` : ''}
                                ${supplier.city && supplier.country ? `<p><i class="fas fa-map-marker-alt mr-1"></i>${supplier.city}, ${supplier.country}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="admin-btn admin-btn--accent admin-btn--compact" data-action="edit-supplier" data-supplier-id="${supplier.id}">
                                <i class="fas fa-edit admin-btn__icon"></i>Editar
                            </button>
                            <button class="admin-btn admin-btn--danger admin-btn--compact" data-action="delete-supplier" data-supplier-id="${supplier.id}">
                                <i class="fas fa-trash admin-btn__icon"></i>Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        async function editSupplier(supplierId) {
            try {
                const response = await api.request(`/suppliers/${supplierId}`, { method: 'GET' });
                const supplier = response.data.supplier;
                
                // Llenar modal con datos
                document.getElementById('supplierId').value = supplier.id;
                document.getElementById('supplierName').value = supplier.name || '';
                document.getElementById('supplierCode').value = supplier.code || '';
                document.getElementById('supplierContact').value = supplier.contact_name || '';
                document.getElementById('supplierEmail').value = supplier.email || '';
                document.getElementById('supplierPhone').value = supplier.phone || '';
                document.getElementById('supplierAddress').value = supplier.address || '';
                document.getElementById('supplierCity').value = supplier.city || '';
                document.getElementById('supplierRegion').value = supplier.region || '';
                document.getElementById('supplierCountry').value = supplier.country || 'Chile';
                document.getElementById('supplierWebsite').value = supplier.website || '';
                document.getElementById('supplierNotes').value = supplier.notes || '';
                document.getElementById('supplierStatus').value = supplier.status || 'active';
                document.getElementById('supplierModalTitle').textContent = 'Editar Proveedor';
                
                document.getElementById('supplierModal').classList.remove('hidden');
            } catch (error) {
                console.error('Error cargando proveedor:', error);
                notify.error('Error al cargar proveedor');
            }
        }

        function showSupplierModal() {
            // Limpiar modal
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierId').value = '';
            document.getElementById('supplierModalTitle').textContent = 'Nuevo Proveedor';
            
            document.getElementById('supplierModal').classList.remove('hidden');
        }

        function closeSupplierModal() {
            document.getElementById('supplierModal').classList.add('hidden');
        }

        async function saveSupplier(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const supplierId = document.getElementById('supplierId').value;
            const isEdit = supplierId !== '';
            
            const supplierData = {
                name: formData.get('name'),
                code: formData.get('code'),
                contact_name: formData.get('contact_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                city: formData.get('city'),
                region: formData.get('region'),
                country: formData.get('country'),
                website: formData.get('website'),
                notes: formData.get('notes'),
                status: formData.get('status')
            };
            
            try {
                const url = isEdit ? `/suppliers/${supplierId}` : '/suppliers';
                const method = isEdit ? 'PUT' : 'POST';
                
                await api.request(url, {
                    method,
                    body: JSON.stringify(supplierData)
                });
                
                notify.success(isEdit ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente');
                closeSupplierModal();
                loadSuppliersForProducts();
            } catch (error) {
                console.error('Error guardando proveedor:', error);
                notify.error('Error al guardar proveedor');
            }
        }

        async function deleteSupplier(supplierId) {
            const confirmed = await notify.confirmDelete('este proveedor');
            if (!confirmed) return;
            
            try {
                await api.request(`/suppliers/${supplierId}`, { method: 'DELETE' });
                notify.success('Proveedor eliminado exitosamente');
                loadSuppliersForProducts();
            } catch (error) {
                console.error('Error eliminando proveedor:', error);
                notify.error('Error al eliminar proveedor');
            }
        }

        /**
         * Generar/Actualizar catálogo
         * Abre el catálogo en una nueva ventana con los productos activos medicinales
         */
        async function generateCatalog() {
            try {
                // Obtener la URL base del catálogo usando BASE_PATH si está disponible
                let catalogUrl;
                
                if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) {
                    // GitHub Pages: usar BASE_PATH
                    catalogUrl = window.location.origin + window.BASE_PATH + 'catalogo/index.html';
                } else {
                    // Desarrollo local: usar ruta relativa
                    catalogUrl = window.location.origin + '/catalogo/index.html';
                }
                
                console.log('🔗 [generateCatalog] URL del catálogo:', catalogUrl);
                
                // Abrir catálogo en nueva ventana (sin modo edición)
                window.open(catalogUrl, '_blank');
                
                if (typeof notify !== 'undefined') {
                    notify.success('Catálogo abierto. El catálogo mostrará solo productos activos medicinales.');
                } else {
                    alert('Catálogo abierto. El catálogo mostrará solo productos activos medicinales.');
                }
            } catch (error) {
                console.error('Error al generar catálogo:', error);
                if (typeof notify !== 'undefined') {
                    notify.error('Error al abrir catálogo');
                } else {
                    alert('Error al abrir catálogo');
                }
            }
        }
        
        // Exportar función al scope global para uso desde admin/index.html
        window.generateCatalog = generateCatalog;

// Cerrar modal con overlay y ESC
    (function () {
        const supplierModal = document.getElementById('supplierModal');
        
        if (supplierModal) {
            supplierModal.addEventListener('click', function(e) {
                if (e.target === supplierModal) {
                    closeSupplierModal();
                }
            });

            const dialog = supplierModal.firstElementChild;
            if (dialog) {
                dialog.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const supplierModal = document.getElementById('supplierModal');
                if (supplierModal && !supplierModal.classList.contains('hidden')) {
                    closeSupplierModal();
                }
            }
        });
    })();

(function () {
    function handleActionClick(event) {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.action;
        if (!action) {
            return;
        }

        if (actionEl.tagName === 'BUTTON') {
            event.preventDefault();
        }

        switch (action) {
            case 'generate-catalog':
                if (typeof generateCatalog === 'function') {
                    generateCatalog();
                }
                break;
            case 'open-create-modal':
                if (typeof openCreateModal === 'function') {
                    openCreateModal();
                }
                break;
            case 'reset-filters':
                if (typeof resetFilters === 'function') {
                    resetFilters();
                }
                break;
            case 'test-medicinal-filter':
                if (typeof testMedicinalFilter === 'function') {
                    testMedicinalFilter();
                }
                break;
            case 'switch-tab':
                if (typeof switchProductsTab === 'function') {
                    const tab = actionEl.dataset.tab || 'products';
                    switchProductsTab(tab);
                }
                break;
            case 'prev-page':
                if (typeof goToPreviousPage === 'function') {
                    goToPreviousPage();
                }
                break;
            case 'next-page':
                if (typeof goToNextPage === 'function') {
                    goToNextPage();
                }
                break;
            case 'show-supplier-modal':
                if (typeof showSupplierModal === 'function') {
                    showSupplierModal();
                }
                break;
            case 'close-supplier-modal':
                if (typeof closeSupplierModal === 'function') {
                    closeSupplierModal();
                }
                break;
            case 'edit-supplier':
                if (typeof editSupplier === 'function') {
                    editSupplier(actionEl.dataset.supplierId);
                }
                break;
            case 'delete-supplier':
                if (typeof deleteSupplier === 'function') {
                    deleteSupplier(actionEl.dataset.supplierId);
                }
                break;
            case 'edit-product':
                if (actionEl.dataset.productId) {
                    const productId = parseInt(actionEl.dataset.productId);
                    if (typeof window.adminOpenEditModal === 'function') {
                        window.adminOpenEditModal(productId);
                    } else if (typeof openEditModal === 'function') {
                        openEditModal(productId);
                    }
                }
                break;
            case 'duplicate-product':
                if (actionEl.dataset.productId) {
                    const productId = parseInt(actionEl.dataset.productId);
                    if (typeof window.duplicateProduct === 'function') {
                        window.duplicateProduct(productId);
                    }
                }
                break;
            case 'delete-product':
                if (actionEl.dataset.productId) {
                    const productId = parseInt(actionEl.dataset.productId);
                    if (typeof window.deleteProduct === 'function') {
                        window.deleteProduct(productId);
                    }
                }
                break;
            case 'close-category-selector':
                if (typeof window.closeCategorySelector === 'function') {
                    window.closeCategorySelector();
                }
                break;
            case 'close-product-modal':
                if (typeof window.closeProductModal === 'function') {
                    window.closeProductModal();
                }
                break;
            case 'open-product-modal':
                if (actionEl.dataset.categorySlug) {
                    const categorySlug = actionEl.dataset.categorySlug;
                    if (typeof window.openProductModal === 'function') {
                        window.openProductModal(categorySlug, null);
                    }
                }
                break;
            case 'close-modal-overlay':
                // Cerrar modal cuando se hace click en el overlay (fondo oscuro)
                const modalId = actionEl.dataset.modalId;
                if (modalId && event.target.id === modalId) {
                    // Solo cerrar si el click es directamente en el overlay, no en el contenido
                    const container = actionEl.querySelector('.product-modal-container');
                    if (container && !container.contains(event.target)) {
                        if (modalId === 'categorySelectorModal' && typeof window.closeCategorySelector === 'function') {
                            window.closeCategorySelector();
                        } else if (modalId === 'productEditModal' && typeof window.closeProductModal === 'function') {
                            window.closeProductModal();
                        }
                    }
                }
                break;
            case 'stop-propagation':
                // Prevenir que el click en el contenedor del modal cierre el modal
                event.stopPropagation();
                break;
            case 'add-price-variant':
                if (typeof window.addPriceVariant === 'function') {
                    window.addPriceVariant();
                }
                break;
            case 'remove-price-variant':
                if (typeof window.removePriceVariant === 'function') {
                    // Pasar el evento para que la función pueda obtener el botón
                    window.removePriceVariant(event);
                }
                break;
            case 'delete-product-from-modal':
                if (typeof window.handleDeleteProduct === 'function') {
                    window.handleDeleteProduct();
                }
                break;
            default:
                break;
        }
    }

    // Manejar cambios en inputs/selects dentro de modales de productos (event delegation)
    function handleInputChangeEvent(event) {
        const target = event.target;
        // Solo manejar inputs/selects dentro de modales de productos
        const isInProductModal = target.closest('#productEditModal') || target.closest('#categorySelectorModal');
        if (!isInProductModal) return;

        // Si hay una función handleInputChange disponible, llamarla
        if (typeof window.handleInputChange === 'function') {
            window.handleInputChange(target);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('click', handleActionClick);

        // Manejar cambios en inputs/selects dentro de modales (event delegation)
        // Esto captura eventos incluso si tienen oninput/onchange inline
        document.addEventListener('input', handleInputChangeEvent, true);
        document.addEventListener('change', handleInputChangeEvent, true);

        // Manejar submit de formularios con data-action
        document.addEventListener('submit', (event) => {
            const form = event.target.closest('form[data-action]');
            if (!form) return;

            const action = form.dataset.action;
            event.preventDefault();

            switch (action) {
                case 'submit-product-form':
                    if (typeof window.handleProductSubmit === 'function') {
                        window.handleProductSubmit(event);
                    }
                    break;
                default:
                    // Si no se maneja aquí, permitir el submit normal
                    break;
            }
        });

        const supplierForm = document.getElementById('supplierForm');
        if (supplierForm) {
            supplierForm.addEventListener('submit', (event) => {
                if (typeof saveSupplier === 'function') {
                    saveSupplier(event);
                }
            });
        }
    });
})();