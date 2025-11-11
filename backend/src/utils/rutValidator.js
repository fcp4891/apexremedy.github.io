// backend/src/utils/rutValidator.js
// Validación de RUT chileno

/**
 * Validar formato y dígito verificador de RUT chileno
 * @param {string} rut - RUT a validar (puede tener o no puntos y guión)
 * @returns {boolean} - true si es válido, false si no
 */
function isValidRUT(rut) {
    if (!rut || typeof rut !== 'string') {
        console.log('❌ RUT inválido: no es string o está vacío', rut);
        return false;
    }
    
    // Limpiar RUT y normalizar formato (eliminar puntos y espacios)
    let cleanRUT = rut.trim().replace(/\./g, '').replace(/\s/g, '').toUpperCase();
    
    console.log('🔍 isValidRUT - RUT recibido:', rut, 'Limpiado:', cleanRUT);
    
    // Separar cuerpo y dígito verificador (puede tener guión o no)
    let body, dv;
    
    if (cleanRUT.includes('-')) {
        // Si tiene guión, separar por el guión
        const parts = cleanRUT.split('-');
        if (parts.length !== 2) {
            console.log('❌ RUT inválido: formato incorrecto (múltiples guiones)', cleanRUT);
            return false;
        }
        body = parts[0];
        dv = parts[1].toUpperCase();
    } else {
        // Si no tiene guión, el último carácter es el DV
        body = cleanRUT.slice(0, -1);
        dv = cleanRUT.slice(-1).toUpperCase();
    }
    
    // Verificar formato básico
    if (!/^\d{7,8}$/.test(body)) {
        console.log('❌ RUT inválido: body no tiene 7 u 8 dígitos', body);
        return false;
    }
    
    if (!/^[\dkK]$/.test(dv)) {
        console.log('❌ RUT inválido: DV inválido', dv);
        return false;
    }
    
    console.log('🔍 isValidRUT - Body:', body, 'DV:', dv);
    
    // Validar que el cuerpo tenga 7 u 8 dígitos
    if (body.length < 7 || body.length > 8) {
        console.log('❌ RUT inválido: longitud incorrecta', body.length);
        return false;
    }
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
    
    console.log('🔍 isValidRUT - Suma:', sum, 'Remainder:', remainder, 'DV calculado:', calculatedDV, 'DV recibido:', dv);
    
    const isValid = dv === calculatedDV;
    console.log('🔍 isValidRUT - Resultado:', isValid);
    
    return isValid;
}

/**
 * Formatear RUT chileno (agregar puntos y guión)
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado (ej: 12.345.678-9)
 */
function formatRUT(rut) {
    if (!rut) return '';
    const cleanRUT = rut.replace(/\./g, '').replace('-', '').toUpperCase();
    if (cleanRUT.length < 8) return rut;
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

module.exports = {
    isValidRUT,
    formatRUT
};


