// catalog-api.js - Cargar catálogo desde la API del backend o JSON estático

/**
 * Cargar catálogo desde JSON estático (GitHub Pages) o API dinámica (desarrollo)
 * Este archivo carga los productos activos medicinales y los formatea para el catálogo
 */
async function loadCatalogFromAPI() {
    try {
        // Usar detector de entorno si está disponible
        let env = 'unknown';
        let backendURL = null;
        let hasBackend = false;
        
        if (typeof window !== 'undefined' && window.envDetector) {
            env = window.envDetector.env;
            hasBackend = window.envDetector.dataSource.hasBackend;
            backendURL = window.envDetector.getBackendURL();
            console.log(`🌍 Entorno detectado: ${env} | Backend: ${hasBackend ? 'Sí' : 'No'}`);
        } else {
            // Fallback: detección básica
            const hostname = window.location.hostname;
            if (hostname.includes('github.io')) {
                env = 'github';
                hasBackend = false;
            } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
                env = 'local';
                hasBackend = true;
                backendURL = 'http://localhost:3000/api';
            } else {
                env = 'production';
                hasBackend = true;
                // Intentar usar CONFIG si está disponible
                if (window.CONFIG && window.CONFIG.API_BASE_URL) {
                    backendURL = window.CONFIG.API_BASE_URL;
                } else {
                    // Inferir desde el hostname
                    const protocol = window.location.protocol;
                    backendURL = `${protocol}//api.${hostname}/api`;
                }
            }
        }
        
        // Estrategia según entorno:
        // 1. GitHub Pages: Solo JSON estático
        // 2. Local: Intentar API dinámica, fallback a JSON estático
        // 3. Producción: Intentar API dinámica, fallback a JSON estático
        
        // Si hay backend disponible, intentar API dinámica primero
        if (hasBackend && backendURL) {
            console.log(`📡 Intentando cargar desde API dinámica: ${backendURL}/products/catalog/medicinal`);
            try {
                // Crear timeout manual para compatibilidad
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(`${backendURL}/products/catalog/medicinal`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Error al cargar catálogo: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Error al obtener catálogo');
                }
                
                const catalogData = result.data;
                const stats = result.stats;
                
                console.log('✅ Catálogo cargado desde API dinámica:', stats);
                
                // Formatear datos para el catálogo
                return formatCatalogData(catalogData);
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn('⚠️ Timeout al conectar con API dinámica, usando JSON estático...');
                } else {
                    console.warn(`⚠️ Error al cargar desde API dinámica (${error.message}), usando JSON estático como fallback...`);
                }
                // Continuar para intentar con JSON estático
            }
        }
        
        // Cargar desde JSON estático (GitHub Pages o fallback)
        console.log('📡 Cargando catálogo desde JSON estático');
        try {
            // Detectar la ruta correcta del JSON
            // En GitHub Pages: /apexremedy.github.io/api/products.json
            // En local desde catalogo/: ../api/products.json
            // En producción: /api/products.json o desde el mismo dominio
            
            let jsonPath = '/api/products.json';
            
            // Si estamos en GitHub Pages, puede estar en un subdirectorio del repo
            if (env === 'github') {
                // GitHub Pages puede servir desde la raíz del repo o desde /apexremedy.github.io/
                // Intentar primero desde la raíz
                jsonPath = '/api/products.json';
            } else if (window.location.pathname.includes('/catalogo/')) {
                // Si estamos en el subdirectorio catalogo/, usar ruta relativa
                jsonPath = '../api/products.json';
            }
            
            console.log(`📂 Intentando cargar JSON desde: ${jsonPath}`);
            const response = await fetch(jsonPath);
            
            if (!response.ok) {
                // Si falla, intentar con ruta alternativa
                if (jsonPath.startsWith('/')) {
                    const altPath = '../api/products.json';
                    console.log(`📂 Intentando ruta alternativa: ${altPath}`);
                    const altResponse = await fetch(altPath);
                    if (altResponse.ok) {
                        const altResult = await altResponse.json();
                        if (altResult.success && altResult.data && altResult.data.products) {
                            console.log('✅ JSON estático cargado desde ruta alternativa:', altResult.data.products.length, 'productos');
                            return transformProductsToCatalogFormat(altResult.data.products);
                        }
                    }
                }
                throw new Error(`Error al cargar JSON: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success || !result.data || !result.data.products) {
                throw new Error('Formato de JSON inválido');
            }
            
            console.log('✅ JSON estático cargado:', result.data.products.length, 'productos');
            
            // Transformar productos del formato JSON al formato del catálogo
            return transformProductsToCatalogFormat(result.data.products);
            
        } catch (error) {
            console.error('❌ Error al cargar JSON estático:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error al cargar catálogo:', error);
        console.warn('⚠️ Usando datos locales como fallback');
        return null; // Retornar null para usar datos locales
    }
}

/**
 * Transformar productos del formato JSON estático al formato del catálogo
 */
function transformProductsToCatalogFormat(products) {
    console.log(`📦 Total de productos recibidos: ${products.length}`);
    
    // Filtrar solo productos ACTIVOS y medicinales para el catálogo
    // IMPORTANTE: Solo mostrar productos activos (status = 'active' O active = true)
    const activeMedicinalProducts = products.filter(p => {
        // Verificar si el producto está activo
        // Puede ser: status === 'active' O active === true O active === 1
        const isActive = p.status === 'active' || 
                        p.active === true || 
                        p.active === 1;
        
        // Verificar si es medicinal
        const isMedicinal = p.is_medicinal === true || p.is_medicinal === 1;
        const requiresPrescription = p.requires_prescription === true || p.requires_prescription === 1;
        
        // SOLO mostrar productos que estén ACTIVOS Y sean medicinales
        return isActive && (isMedicinal || requiresPrescription);
    });
    
    console.log(`📦 Procesando ${activeMedicinalProducts.length} productos activos medicinales (de ${products.length} total)`);
    
    // Si no hay productos activos, mostrar información de diagnóstico
    if (activeMedicinalProducts.length === 0) {
        console.warn('⚠️ No se encontraron productos activos medicinales. Mostrando información de diagnóstico:');
        const sampleProduct = products[0];
        if (sampleProduct) {
            console.log('Ejemplo de producto:', {
                name: sampleProduct.name,
                active: sampleProduct.active,
                is_medicinal: sampleProduct.is_medicinal,
                requires_prescription: sampleProduct.requires_prescription,
                category_slug: sampleProduct.category_slug,
                product_type: sampleProduct.product_type
            });
        }
        // Mostrar conteo de productos por estado
        const activeCount = products.filter(p => p.active === true || p.active === 1).length;
        const medicinalCount = products.filter(p => p.is_medicinal === true || p.is_medicinal === 1).length;
        const prescriptionCount = products.filter(p => p.requires_prescription === true || p.requires_prescription === 1).length;
        console.log(`📊 Estadísticas: ${activeCount} activos, ${medicinalCount} medicinales, ${prescriptionCount} requieren receta`);
    }
    
    // Separar productos por categoría
    const flowers = [];
    const hash = [];
    const oils = [];
    
    activeMedicinalProducts.forEach(product => {
        const categorySlug = (product.category_slug || '').toLowerCase();
        const productType = (product.product_type || '').toLowerCase();
        
        // Formatear producto para el catálogo
        const catalogProduct = {
            name: product.name,
            strain: product.strain_info?.type || product.strain_info?.genetics || '',
            image: getProductImage(product),
            prices: formatPrices(product.price_variants, product.base_price, product.stock_unit),
            concentration: product.medicinal_info?.concentration || null
        };
        
        // Clasificar por categoría
        if (categorySlug.includes('aceite') || productType === 'oil') {
            oils.push(catalogProduct);
        } else if (
            categorySlug.includes('hash') ||
            categorySlug.includes('extracto') ||
            categorySlug.includes('concentrad') ||
            productType === 'concentrate'
        ) {
            hash.push(catalogProduct);
        } else if (
            categorySlug.includes('flor') ||
            productType === 'flower' ||
            !categorySlug // Por defecto, si no tiene categoría específica, es flor
        ) {
            flowers.push(catalogProduct);
        }
    });
    
    console.log(`✅ Productos clasificados: ${flowers.length} flores, ${hash.length} hash, ${oils.length} aceites`);
    
    // Formatear datos finales
    return formatCatalogData({
        flowers,
        hash,
        oils
    });
}

/**
 * Obtener imagen del producto (priorizar imagen primaria)
 */
function getProductImage(product) {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Buscar imagen primaria
        const primaryImage = product.images.find(img => img.is_primary === 1 || img.is_primary === true);
        if (primaryImage && primaryImage.url) {
            return primaryImage.url;
        }
        // Si no hay primaria, tomar la primera
        if (product.images[0].url) {
            return product.images[0].url;
        }
    }
    // Fallback a image directo
    if (product.image) {
        return product.image;
    }
    // Fallback por defecto
    return './images/catalogo/placeholder.jpg';
}

/**
 * Formatear precios desde price_variants o base_price
 */
function formatPrices(priceVariants, basePrice, stockUnit) {
    const prices = {};
    
    // Función auxiliar para formatear precio
    const formatPrice = (price) => {
        if (typeof price === 'number') {
            return `$${price.toLocaleString('es-CL')}`;
        }
        if (typeof price === 'string') {
            // Si ya está formateado, retornarlo
            if (price.startsWith('$')) {
                return price;
            }
            // Si es un número como string, formatearlo
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice)) {
                return `$${numPrice.toLocaleString('es-CL')}`;
            }
        }
        return price;
    };
    
    // Si hay variantes de precio, usarlas
    if (priceVariants && typeof priceVariants === 'object' && Object.keys(priceVariants).length > 0) {
        Object.keys(priceVariants).forEach(key => {
            const price = priceVariants[key];
            if (price !== null && price !== undefined) {
                prices[key] = formatPrice(price);
            }
        });
    }
    
    // Si no hay variantes pero hay precio base, crear variantes estándar para flores
    if (Object.keys(prices).length === 0 && basePrice) {
        const unit = (stockUnit || 'g').toLowerCase();
        const price = formatPrice(basePrice);
        
        // Crear variantes estándar para gramos
        if (unit === 'g' || unit === 'gramos') {
            prices['1g'] = price;
            // Calcular precios para otras cantidades comunes (opcional, si no hay variantes)
            // prices['3.5g'] = formatPrice(basePrice * 3.5 * 0.9); // 10% descuento
            // prices['7g'] = formatPrice(basePrice * 7 * 0.85); // 15% descuento
            // prices['14g'] = formatPrice(basePrice * 14 * 0.8); // 20% descuento
        } else {
            // Para otras unidades, usar directamente
            prices[`1${unit}`] = price;
        }
    }
    
    return prices;
}

/**
 * Formatear datos del catálogo en páginas
 */
function formatCatalogData(catalogData) {
    const formattedData = {
        terms: {
            title: "Términos y condiciones de envíos y entrega",
            content: `
                <p><strong>Política de Envíos:</strong></p>
                <ul>
                    <li>Los envíos se realizan de lunes a viernes en horario de 9:00 AM a 6:00 PM</li>
                    <li>Tiempo estimado de entrega: 24-48 horas dentro de la ciudad</li>
                    <li>Para entregas fuera de la ciudad: 3-5 días hábiles</li>
                    <li>Envío gratuito en compras superiores a $50.000</li>
                </ul>
                
                <p><strong>Condiciones de Entrega:</strong></p>
                <ul>
                    <li>Se requiere firma del destinatario al momento de la entrega</li>
                    <li>Es necesario presentar documento de identidad</li>
                    <li>El producto debe ser revisado en presencia del mensajero</li>
                    <li>Cualquier inconformidad debe reportarse de inmediato</li>
                </ul>
                
                <p><strong>Zonas de Cobertura:</strong></p>
                <ul>
                    <li>Cobertura total en zona metropolitana</li>
                    <li>Entregas a nivel nacional disponibles</li>
                    <li>Consultar disponibilidad para zonas rurales</li>
                </ul>
            `
        },
        policies: {
            content: `
                <h3>Políticas Generales</h3>
                <p>Uso exclusivo para socios con receta médica vigente.
El presente catálogo se enmarca en el resguardo del Artículo 8° de la Ley 20.000, que reconoce el uso medicinal del cannabis y autoriza el cultivo personal cuando existe prescripción médica válida.
Su desarrollo se realiza conforme a la Ley 20.500 sobre asociaciones y participación ciudadana, que ampara a las organizaciones sin fines de lucro orientadas a fines de salud.
</p><p>
Cada formato de dispensación informa su duración y pautas de uso conforme al Informe MINSAL 2024, que recomienda pausas de 28 días para disminuir la tolerancia fisiológica y optimizar la eficacia terapéutica.
Todo procedimiento está sujeto a control clínico-legal, trazabilidad verificable y resguardo ético de los datos personales.</p>
            `
        },
        policies2: { content: '' }
    };
    
    // Organizar productos en páginas (máximo 4 productos por página)
    const PRODUCTS_PER_PAGE = 4;
    
    // Flores
    if (catalogData.flowers && catalogData.flowers.length > 0) {
        const flowersPages = [];
        for (let i = 0; i < catalogData.flowers.length; i += PRODUCTS_PER_PAGE) {
            flowersPages.push(catalogData.flowers.slice(i, i + PRODUCTS_PER_PAGE));
        }
        flowersPages.forEach((page, index) => {
            formattedData[`productsPage${index + 1}`] = page;
        });
    }
    
    // Hash
    if (catalogData.hash && catalogData.hash.length > 0) {
        const hashPages = [];
        for (let i = 0; i < catalogData.hash.length; i += PRODUCTS_PER_PAGE) {
            hashPages.push(catalogData.hash.slice(i, i + PRODUCTS_PER_PAGE));
        }
        hashPages.forEach((page, index) => {
            formattedData[`hashPage${index + 1}`] = page;
        });
    }
    
    // Aceites
    if (catalogData.oils && catalogData.oils.length > 0) {
        const oilsPages = [];
        for (let i = 0; i < catalogData.oils.length; i += PRODUCTS_PER_PAGE) {
            oilsPages.push(catalogData.oils.slice(i, i + PRODUCTS_PER_PAGE));
        }
        oilsPages.forEach((page, index) => {
            formattedData[`oilPage${index + 1}`] = page;
        });
    }
    
    return formattedData;
}

/**
 * Inicializar catálogo desde API
 * Se ejecuta antes de cargar datos locales
 */
async function initCatalogFromAPI() {
    // Verificar si hay un parámetro en la URL que indique modo de visualización
    const urlParams = new URLSearchParams(window.location.search);
    const viewMode = urlParams.get('view') || urlParams.get('mode');
    
    // Si no es modo edición, intentar cargar desde API
    if (viewMode !== 'edit') {
        const apiData = await loadCatalogFromAPI();
        
        if (apiData && typeof catalogData !== 'undefined') {
            // Limpiar páginas previas para evitar datos obsoletos
            Object.keys(catalogData).forEach(key => {
                if (/^(productsPage|hashPage|oilPage)\d+$/i.test(key)) {
                    delete catalogData[key];
                }
            });
            if (catalogData.hashNotes) {
                Object.keys(catalogData.hashNotes).forEach(noteKey => {
                    if (/^hashPage\d+$/i.test(noteKey)) {
                        delete catalogData.hashNotes[noteKey];
                    }
                });
            }
            
            // Actualizar catalogData con datos de la API
            console.log('📋 Datos recibidos de la API:', Object.keys(apiData));
            console.log('📋 Páginas de productos en apiData:', Object.keys(apiData).filter(k => k.startsWith('productsPage')));
            console.log('📋 Páginas de hash en apiData:', Object.keys(apiData).filter(k => k.startsWith('hashPage')));
            console.log('📋 Páginas de aceites en apiData:', Object.keys(apiData).filter(k => k.startsWith('oilPage')));
            
            Object.assign(catalogData, apiData);
            
            // Verificar que los datos se asignaron correctamente
            const productPagesAfter = Object.keys(catalogData).filter(k => k.startsWith('productsPage'));
            console.log('✅ Páginas de productos después de asignar:', productPagesAfter.length, productPagesAfter);
            
            // Ocultar botón de edición
            const editBtn = document.getElementById('editBtn');
            if (editBtn) {
                editBtn.style.display = 'none';
            }
            
            // Marcar que el catálogo viene de la BD
            window.catalogFromDB = true;
            
            console.log('✅ Catálogo cargado desde base de datos. Total de páginas:', {
                products: productPagesAfter.length,
                hash: Object.keys(catalogData).filter(k => k.startsWith('hashPage')).length,
                oils: Object.keys(catalogData).filter(k => k.startsWith('oilPage')).length
            });
            
            return true;
        } else {
            console.log('⚠️ Usando datos locales (fallback)');
            window.catalogFromDB = false;
            return false;
        }
    } else {
        console.log('📝 Modo edición activado');
        window.catalogFromDB = false;
        return false;
    }
}

// Exponer función globalmente
window.catalogFromAPI = initCatalogFromAPI;

