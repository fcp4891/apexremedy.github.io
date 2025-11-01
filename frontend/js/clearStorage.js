/**
 * Script para limpiar localStorage en producción
 * Úsalo si hay problemas con datos obsoletos de autenticación
 * 
 * Ejecutar en consola del navegador:
 * clearProductionStorage()
 */

function clearProductionStorage() {
    console.log('🧹 Limpiando almacenamiento local...');
    
    // Limpiar localStorage
    const localStorageKeys = [
        'authToken',
        'currentUser',
        'userData',
        'cart',
        'cartItems'
    ];
    
    localStorageKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Eliminado: ${key}`);
        }
    });
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    console.log('✅ SessionStorage limpiado');
    
    console.log('✅ Limpieza completada. Recargando página...');
    
    // Recargar página después de 1 segundo
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Hacer disponible globalmente
window.clearProductionStorage = clearProductionStorage;

// Auto-ejecutar si hay un parámetro en la URL
if (window.location.search.includes('clearStorage=true')) {
    clearProductionStorage();
}

console.log('💡 Para limpiar almacenamiento, ejecuta: clearProductionStorage()');

