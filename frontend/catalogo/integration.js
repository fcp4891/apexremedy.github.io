// integration.js - Integración del Editor Visual con el Sistema Existente

/**
 * Sobrescribir la función openModal para inicializar el editor visual
 */
const originalOpenModal = window.openModal || function openModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('active');
    
    // Asegurar que catalogData esté sincronizado con localStorage antes de cargar
    const savedData = localStorage.getItem('catalogData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            Object.assign(catalogData, parsedData);
        } catch (error) {
            console.error('Error al cargar datos al abrir modal:', error);
        }
    }
    
    loadEditorData('products');
};

window.openModal = function() {
    // Ejecutar la función original
    originalOpenModal();
    
    // Inicializar el editor visual en modo visual por defecto
    if (window.visualEditor) {
        window.visualEditor.switchMode('visual');
        window.visualEditor.updateTab('products');
    }
};

/**
 * Sobrescribir la función switchTab para sincronizar con el editor visual
 */
const originalSwitchTab = window.switchTab || function switchTab(tab) {
    currentTab = tab;
    
    // Actualizar botones de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // Cargar datos del tab
    loadEditorData(tab);
};

window.switchTab = function(tab) {
    // Ejecutar la función original
    originalSwitchTab(tab);
    
    // Actualizar el editor visual
    if (window.visualEditor) {
        window.visualEditor.updateTab(tab);
    }
};

/**
 * Sobrescribir la función saveChanges para manejar ambos modos
 */
const originalSaveChanges = window.saveChanges || function saveChanges() {
    const editor = document.getElementById('dataEditor');
    
    try {
        if (!editor.value || editor.value.trim() === '') {
            showToast('Error: El editor está vacío', 'error');
            return;
        }
        
        const newData = JSON.parse(editor.value);
        
        // Actualizar datos según el tab actual
        switch(currentTab) {
            case 'products':
                if (typeof window.productManager !== 'undefined' && window.productManager.saveProductChanges) {
                    const pageCount = window.productManager.saveProductChanges(newData);
                    showToast(`✅ Cambios guardados. ${pageCount} página(s) de productos`, 'success');
                } else {
                    Object.keys(newData).forEach(key => {
                        if (key.startsWith('page')) {
                            const pageNum = key.replace('page', '');
                            const dataKey = `productsPage${pageNum}`;
                            catalogData[dataKey] = newData[key];
                        }
                    });
                    localStorage.setItem('catalogData', JSON.stringify(catalogData));
                    renderProducts();
                    updatePageNumbers();
                    showToast('✅ Cambios guardados', 'success');
                }
                break;
            case 'hash':
                // Similar handling for hash
                Object.keys(newData).forEach(key => {
                    if (key.startsWith('page') && key !== '_notes') {
                        const pageNum = key.replace('page', '');
                        catalogData[`hashPage${pageNum}`] = newData[key];
                    }
                });
                if (newData._notes) {
                    catalogData.hashNotes = {};
                    Object.keys(newData._notes).forEach(key => {
                        const pageNum = key.replace('page', '');
                        catalogData.hashNotes[`hashPage${pageNum}`] = newData._notes[key];
                    });
                }
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderHash();
                showToast('✅ Cambios guardados', 'success');
                break;
            case 'oil':
                catalogData.oils = newData;
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderOils();
                showToast('✅ Cambios guardados', 'success');
                break;
            case 'terms':
                catalogData.terms = newData;
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderTerms();
                showToast('✅ Cambios guardados', 'success');
                break;
            case 'policies':
                catalogData.policies = newData;
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderPolicies();
                showToast('✅ Cambios guardados', 'success');
                break;
        }
        
        closeModal();
    } catch (error) {
        console.error('Error al guardar:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
};

window.saveChanges = async function() {
    const currentMode = window.visualEditor?.state?.currentMode || 'visual';
    const currentTab = window.visualEditor?.state?.currentTab || window.currentTab || 'products';
    
    try {
        if (currentMode === 'visual') {
            // En modo visual, los cambios ya están en catalogData
            // Solo necesitamos guardar en localStorage y en el servidor
            
            console.log('💾 Guardando desde modo visual...');
            
            // Guardar en localStorage
            localStorage.setItem('catalogData', JSON.stringify(catalogData));
            
            // Guardar en el servidor si está disponible
            if (window.productManager?.saveToServer) {
                try {
                    await window.productManager.saveToServer(catalogData);
                    console.log('✅ Datos guardados en servidor');
                } catch (serverError) {
                    console.warn('⚠️ No se pudo guardar en servidor:', serverError);
                }
            }
            
            // Re-renderizar TODAS las secciones para asegurar que todo esté actualizado
            // No solo la sección actual, porque los cambios pueden afectar a otras
            if (typeof renderProducts === 'function') renderProducts();
            if (typeof renderHash === 'function') renderHash();
            if (typeof renderOils === 'function') renderOils();
            if (typeof renderTerms === 'function') renderTerms();
            if (typeof renderPolicies === 'function') renderPolicies();
            
            // Actualizar números de página y contadores
            if (typeof updatePageNumbers === 'function') updatePageNumbers();
            if (typeof updatePageCounter === 'function') updatePageCounter();
            if (typeof updateNavigationButtons === 'function') updateNavigationButtons();
            
            // Actualizar la vista actual con scroll suave (solo forzar reflow, ya renderizamos arriba)
            if (typeof refreshCurrentPageView === 'function') refreshCurrentPageView(false);
            
            showToast('✅ Cambios guardados exitosamente', 'success');
            
            // Marcar cambios como guardados
            if (window.visualEditor?.state) {
                window.visualEditor.state.isDirty = false;
                // Actualizar el editor visual también
                if (typeof window.visualEditor.render === 'function') {
                    window.visualEditor.render();
                }
            }
            
            // Cerrar el modal después de guardar exitosamente
            setTimeout(() => {
                if (typeof closeModal === 'function') {
                    closeModal();
                }
                // Actualización adicional después de cerrar para asegurar que todo se vea
                setTimeout(() => {
                    if (typeof refreshCurrentPageView === 'function') {
                        refreshCurrentPageView(false);
                    }
                    // Actualizar editor visual si está abierto
                    if (window.visualEditor && typeof window.visualEditor.render === 'function') {
                        window.visualEditor.render();
                    }
                }, 200);
            }, 500);
            
        } else {
            // Modo JSON: usar la función original (ya cierra el modal)
            originalSaveChanges();
        }
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
};

/**
 * Inicializar la integración cuando el DOM esté listo
 */
function initIntegration() {
    console.log('🔗 Inicializando integración del editor visual...');
    
    // Event listeners para los tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            window.switchTab(tab);
        });
    });
    
    // Event listener para el botón de guardar
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.removeEventListener('click', originalSaveChanges);
        saveBtn.addEventListener('click', window.saveChanges);
    }
    
    console.log('✅ Integración inicializada');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntegration);
} else {
    initIntegration();
}

// Exportar
window.editorIntegration = {
    init: initIntegration
};