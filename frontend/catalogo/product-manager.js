// product-manager.js - Gestión avanzada de productos
// Maneja: agregar, eliminar productos y guardar automáticamente en el servidor

/**
 * Agregar nuevo producto a la página actual
 */
function addNewProduct() {
    const editor = document.getElementById('dataEditor');
    
    try {
        const currentData = JSON.parse(editor.value);
        
        // Determinar el tab actual (products o hash)
        const currentTab = window.currentTab || 'products';
        
        // Template de producto nuevo (ajustar según el tipo)
        let newProduct;
        if (currentTab === 'hash') {
            newProduct = {
                name: "Live Rosin",
                strain: "Micrones",
                image: "images/catalogo/placeholder.jpg",
                prices: {
                    "0.5gr": "$0",
                    "1gr": "$0",
                    "2grs": "$0"
                }
            };
        } else if (currentTab === 'oil') {
            newProduct = {
                name: "Aceite CBD Full Spectrum",
                strain: "120 a 73 Micrones",
                concentration: "5000 mg. CBD por 30 ml.",
                image: "images/catalogo/placeholder.jpg",
                prices: {
                    "10ml": "$0",
                    "30ml": "$0",
                    "50ml": "$0"
                }
            };
        } else {
            newProduct = {
                name: "Nuevo Producto",
                strain: "Tipo de cepa",
                image: "./images/catalogo/catalogo_body.png",
                prices: {
                    "1g": "$0",
                    "3.5g": "$0",
                    "7g": "$0",
                    "14g": "$0"
                }
            };
        }
        
        // Agregar a la primera página visible (ignorar _notes si existe)
        const firstPage = Object.keys(currentData).find(key => key.startsWith('page') && Array.isArray(currentData[key]));
        if (firstPage && Array.isArray(currentData[firstPage])) {
            currentData[firstPage].push(newProduct);
            editor.value = JSON.stringify(currentData, null, 2);
            let tipo = 'Producto';
            if (currentTab === 'hash') tipo = 'Hash';
            else if (currentTab === 'oil') tipo = 'Aceite';
            showToast(`✅ ${tipo} agregado. Presiona "Guardar Cambios" para aplicar`, 'success');
        } else {
            showToast('❌ Error: No se pudo agregar el producto', 'error');
        }
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
}

/**
 * Agregar nueva página de productos
 */
function addNewProductPage() {
    const editor = document.getElementById('dataEditor');
    
    try {
        const currentData = JSON.parse(editor.value);
        
        // Determinar el tab actual (products o hash)
        const currentTab = window.currentTab || 'products';
        
        // Encontrar el número de la última página
        const pageKeys = Object.keys(currentData);
        const pageNumbers = pageKeys
            .filter(k => k.startsWith('page'))
            .map(k => parseInt(k.replace('page', '')))
            .filter(n => !isNaN(n));
        
        const nextPageNum = pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;
        const newPageKey = `page${nextPageNum}`;
        
        // Crear página con productos de ejemplo (ajustar según el tipo)
        if (currentTab === 'hash') {
            currentData[newPageKey] = [
                {
                    name: "Live Rosin",
                    strain: "120 a 73 Micrones",
                    image: "images/catalogo/placeholder.jpg",
                    prices: {
                        "0.5gr": "$40.000",
                        "1gr": "$70.000",
                        "2grs": "$130.000"
                    }
                }
            ];
            // Agregar nota para hash si no existe _notes
            if (!currentData._notes) {
                currentData._notes = {};
            }
            currentData._notes[newPageKey] = "Las genéticas y concentraciones pueden variar según disponibilidad y actualización de cultivo.";
        } else if (currentTab === 'oil') {
            currentData[newPageKey] = [
                {
                    name: "Aceite CBD Full Spectrum",
                    strain: "120 a 73 Micrones",
                    concentration: "5000 mg. CBD por 30 ml.",
                    image: "images/catalogo/placeholder.jpg",
                    prices: {
                        "10ml": "$40.000",
                        "30ml": "$70.000",
                        "50ml": "$130.000"
                    }
                }
            ];
            // Agregar nota para aceites si no existe _notes
            if (!currentData._notes) {
                currentData._notes = {};
            }
            currentData._notes[newPageKey] = "Aceite de CBD de espectro completo, ayuda con el dolor crónico, ansiedad e insomnio.";
        } else {
            currentData[newPageKey] = [
                {
                    name: "Producto Ejemplo 1",
                    strain: "Tipo de cepa",
                    image: "./images/catalogo/catalogo_body.png",
                    prices: {
                        "1g": "$15.000",
                        "3.5g": "$45.000",
                        "7g": "$85.000",
                        "14g": "$160.000"
                    }
                },
                {
                    name: "Producto Ejemplo 2",
                    strain: "Tipo de cepa",
                    image: "./images/catalogo/catalogo_body.png",
                    prices: {
                        "1g": "$16.000",
                        "3.5g": "$47.000",
                        "7g": "$90.000",
                        "14g": "$170.000"
                    }
                }
            ];
        }
        
        editor.value = JSON.stringify(currentData, null, 2);
        let tipo = 'Productos';
        if (currentTab === 'hash') tipo = 'Hash';
        else if (currentTab === 'oil') tipo = 'Aceites';
        showToast(`✅ Página de ${tipo} ${nextPageNum} creada. Presiona "Guardar Cambios" para aplicar`, 'success');
    } catch (error) {
        console.error('Error al agregar página:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
}

/**
 * Eliminar página actual del editor JSON
 */
async function deletePage() {
    try {
        const editor = document.getElementById('dataEditor');
        const currentTab = window.currentTab || 'products';
        
        if (!editor || !editor.value) {
            showToast('❌ No hay datos para eliminar', 'error');
            return;
        }
        
        const currentData = JSON.parse(editor.value);
        
        // Obtener todas las páginas
        const pages = Object.keys(currentData)
            .filter(key => key.startsWith('page'))
            .map(key => {
                const num = key.replace('page', '');
                return parseInt(num);
            })
            .sort((a, b) => a - b);
        
        if (pages.length <= 1) {
            showToast('❌ No puedes eliminar la última página', 'error');
            return;
        }
        
        // Encontrar la última página
        const lastPageNum = Math.max(...pages);
        const pageKey = `page${lastPageNum}`;
        
        // Confirmar eliminación
        let tipo = 'Productos';
        if (currentTab === 'hash') tipo = 'Hash';
        else if (currentTab === 'oil') tipo = 'Aceites';
        
        const confirmed = await window.showConfirm(`¿Estás seguro de eliminar la página ${lastPageNum} de ${tipo}? Esta acción no se puede deshacer.`);
        if (!confirmed) {
            return;
        }
        
        // Eliminar la página
        delete currentData[pageKey];
        
        // Eliminar nota si existe
        if (currentData._notes && currentData._notes[pageKey]) {
            delete currentData._notes[pageKey];
        }
        
        editor.value = JSON.stringify(currentData, null, 2);
        showToast(`✅ Página ${lastPageNum} eliminada. Presiona "Guardar Cambios" para aplicar`, 'success');
    } catch (error) {
        console.error('Error al eliminar página:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
}

/**
 * Guardar datos en el servidor (actualizar data.js)
 */
async function saveToServer(data) {
    const fileContent = `// data.js - Datos del catálogo
const catalogData = ${JSON.stringify(data, null, 4)};

// Exportar datos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = catalogData;
}`;

    try {
        const response = await fetch('/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: fileContent })
        });

        if (response.ok) {
            console.log('✅ data.js guardado en el servidor');
            return true;
        } else {
            console.error('❌ Error del servidor:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de red al guardar:', error);
        return false;
    }
}

/**
 * Guardar datos actualizados en catalogData, localStorage y servidor
 * Esta versión maneja agregar y eliminar productos/páginas automáticamente
 */
async function saveProductChanges(newData) {
    console.log('💾 Guardando cambios de productos...');
    console.log('Datos nuevos:', newData);
    
    // Obtener páginas actuales
    const currentPages = Object.keys(catalogData)
        .filter(k => k.startsWith('productsPage'))
        .map(k => k.replace('productsPage', ''));
    
    console.log('Páginas actuales:', currentPages);
    
    // Obtener páginas nuevas del editor
    const newPages = Object.keys(newData)
        .filter(k => k.startsWith('page'))
        .map(k => k.replace('page', ''));
    
    console.log('Páginas en editor:', newPages);
    
    // PASO 1: Eliminar páginas que ya no existen en newData
    currentPages.forEach(pageNum => {
        if (!newPages.includes(pageNum)) {
            const dataKey = `productsPage${pageNum}`;
            console.log(`🗑️ Eliminando página ${pageNum} (${dataKey})`);
            delete catalogData[dataKey];
            
            // Eliminar también la página HTML del DOM
            const pageElement = document.getElementById(`products${pageNum}`);
            if (pageElement) {
                console.log(`🗑️ Eliminando página HTML: products${pageNum}`);
                pageElement.remove();
            }
        }
    });
    
    // PASO 2: Actualizar/Agregar páginas del editor
    Object.keys(newData).forEach(key => {
        if (key.startsWith('page')) {
            const pageNum = key.replace('page', '');
            const dataKey = `productsPage${pageNum}`;
            catalogData[dataKey] = newData[key];
            console.log(`✅ ${currentPages.includes(pageNum) ? 'Actualizada' : 'Agregada'} página ${pageNum}:`, newData[key].length, 'productos');
        }
    });
    
    // PASO 3: Guardar en localStorage
    localStorage.setItem('catalogData', JSON.stringify(catalogData));
    
    // PASO 4: Guardar en el servidor (data.js)
    try {
        console.log('📤 Enviando datos al servidor...');
        const success = await saveToServer(catalogData);
        if (success) {
            console.log('✅ Archivo data.js actualizado en el servidor');
        } else {
            console.warn('⚠️ No se pudo actualizar data.js en el servidor');
        }
    } catch (error) {
        console.error('❌ Error al guardar en servidor:', error);
    }
    
    // PASO 5: Verificar
    const savedData = JSON.parse(localStorage.getItem('catalogData'));
    const savedPages = Object.keys(savedData)
        .filter(k => k.startsWith('productsPage'))
        .map(k => k.replace('productsPage', ''));
    
    console.log('✅ Guardado completo. Páginas finales:', savedPages);
    
    // PASO 6: Re-renderizar TODO
    console.log('🎨 Re-renderizando catálogo...');
    renderProducts();
    updatePageNumbers();
    
    // PASO 7: Actualizar contadores
    const totalPages = document.querySelectorAll('.catalog-page').length;
    document.getElementById('totalPages').textContent = totalPages;
    
    console.log('✅ Proceso completado. Total de páginas en catálogo:', totalPages);
    
    return savedPages.length;
}

/**
 * Inicializar botones del editor
 */
function initProductManager() {
    // Botón agregar producto
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', addNewProduct);
    }
    
    // Botón agregar página
    const addPageBtn = document.getElementById('addPageBtn');
    if (addPageBtn) {
        addPageBtn.addEventListener('click', addNewProductPage);
    }
    
    // Botón eliminar página
    const deletePageBtn = document.getElementById('deletePageBtn');
    if (deletePageBtn) {
        deletePageBtn.addEventListener('click', deletePage);
    }
    
    // Mostrar/ocultar toolbar según tab activo
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const toolbar = document.getElementById('editorToolbar');
            if (toolbar) {
                // Mostrar toolbar para products, hash y oil (todos usan la misma estructura de páginas)
                if (this.dataset.tab === 'products' || this.dataset.tab === 'hash' || this.dataset.tab === 'oil') {
                    toolbar.style.display = 'flex';
                } else {
                    toolbar.style.display = 'none';
                }
            }
        });
    });
    
    console.log('✅ Product Manager inicializado');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductManager);
} else {
    initProductManager();
}

// Exportar funciones
window.productManager = {
    addNewProduct,
    addNewProductPage,
    deletePage,
    saveProductChanges,
    saveToServer
};