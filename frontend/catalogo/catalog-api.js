// catalog-api.js - Cargar catálogo desde la API del backend

/**
 * Cargar catálogo desde la API
 * Este archivo carga los productos activos medicinales desde la base de datos
 * y los formatea para el catálogo
 */
async function loadCatalogFromAPI() {
    try {
        // Detectar URL de la API
        const isProduction = window.location.hostname.includes('github.io') || 
                            (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
        const API_BASE_URL = isProduction 
            ? (window.CONFIG?.API_BASE_URL || 'https://tu-backend.com/api')
            : 'http://localhost:3000/api';
        
        console.log('📡 Cargando catálogo desde API:', `${API_BASE_URL}/products/catalog/medicinal`);
        
        const response = await fetch(`${API_BASE_URL}/products/catalog/medicinal`);
        
        if (!response.ok) {
            throw new Error(`Error al cargar catálogo: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Error al obtener catálogo');
        }
        
        const catalogData = result.data;
        const stats = result.stats;
        
        console.log('✅ Catálogo cargado:', stats);
        
        // Formatear datos para el catálogo
        const formattedData = {
            terms: catalogData.terms || catalogData.termsContent || {
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
            policies: catalogData.policies || catalogData.policiesContent || {
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
            policies2: catalogData.policies2 || { content: '' }
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
        
    } catch (error) {
        console.error('❌ Error al cargar catálogo desde API:', error);
        console.warn('⚠️ Usando datos locales como fallback');
        return null; // Retornar null para usar datos locales
    }
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

