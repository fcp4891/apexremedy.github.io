// catalog-api.js - Cargar catálogo desde la API del backend o JSON estático

/**
 * Cargar catálogo desde JSON estático (GitHub Pages) o API dinámica (desarrollo)
 * Este archivo carga los productos activos medicinales y los formatea para el catálogo
 */
async function loadCatalogFromAPI() {
    try {
        // Detectar entorno
        const isProduction = window.location.hostname.includes('github.io') || 
                            (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
        
        let result = null;
        
        // En producción, usar JSON estático
        if (isProduction) {
            console.log('📡 Cargando catálogo desde JSON estático: /api/products.json');
            try {
                const response = await fetch('/api/products.json');
                if (!response.ok) {
                    throw new Error(`Error al cargar JSON: ${response.status}`);
                }
                result = await response.json();
                
                if (!result.success || !result.data || !result.data.products) {
                    throw new Error('Formato de JSON inválido');
                }
                
                console.log('✅ JSON estático cargado:', result.data.products.length, 'productos');
                
                // Transformar productos del formato JSON al formato del catálogo
                return transformProductsToCatalogFormat(result.data.products);
                
            } catch (error) {
                console.error('❌ Error al cargar JSON estático:', error);
                console.warn('⚠️ Intentando con API dinámica como fallback...');
                // Continuar para intentar con API dinámica
            }
        }
        
        // En desarrollo o si falló el JSON estático, intentar API dinámica
        const API_BASE_URL = 'http://localhost:3000/api';
        console.log('📡 Cargando catálogo desde API dinámica:', `${API_BASE_URL}/products/catalog/medicinal`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/products/catalog/medicinal`);
            
            if (!response.ok) {
                throw new Error(`Error al cargar catálogo: ${response.status}`);
            }
            
            result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al obtener catálogo');
            }
            
            const catalogData = result.data;
            const stats = result.stats;
            
            console.log('✅ Catálogo cargado desde API dinámica:', stats);
            
            // Formatear datos para el catálogo
            return formatCatalogData(catalogData);
            
        } catch (error) {
            console.error('❌ Error al cargar catálogo desde API dinámica:', error);
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
    // Filtrar solo productos activos y medicinales
    const activeMedicinalProducts = products.filter(p => 
        p.active === true && 
        (p.is_medicinal === true || p.requires_prescription === true)
    );
    
    console.log(`📦 Procesando ${activeMedicinalProducts.length} productos activos medicinales`);
    
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
            Object.assign(catalogData, apiData);
            
            // Ocultar botón de edición
            const editBtn = document.getElementById('editBtn');
            if (editBtn) {
                editBtn.style.display = 'none';
            }
            
            // Marcar que el catálogo viene de la BD
            window.catalogFromDB = true;
            
            console.log('✅ Catálogo cargado desde base de datos');
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

