const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Actualizando funciones de firma...');

// 1. Reemplazar en generatePoderDocument
content = content.replace(
    `    // Agregar firmas
    const sigCedente = document.getElementById('sigCedentePoder');
    const sigCesionario = document.getElementById('sigCesionarioPoder');
    
    if (!sigCedente || !sigCesionario) {
        alert('Error: No se encontraron los canvas de firma');
        return;
    }
    
    data.firma_cedente = sigCedente.toDataURL('image/png');
    data.firma_cesionario = sigCesionario.toDataURL('image/png');`,
    `    // Agregar firmas
    // Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');
    
    // Firma del cesionario es fija (imagen del dispensario)
    const sigCesionarioImg = document.getElementById('sigCesionarioPoderImg');
    if (sigCesionarioImg && sigCesionarioImg.src) {
        // Convertir imagen a base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = sigCesionarioImg.naturalWidth || 300;
        canvas.height = sigCesionarioImg.naturalHeight || 220;
        ctx.drawImage(sigCesionarioImg, 0, 0);
        data.firma_cesionario = canvas.toDataURL('image/png');
    } else {
        data.firma_cesionario = '';
    }`
);

// 2. Reemplazar en previewPoderDoc
content = content.replace(
    `    const sigCedente = document.getElementById('sigCedentePoder');
    const sigCesionario = document.getElementById('sigCesionarioPoder');
    
    if (!sigCedente || !sigCesionario) {
        alert('Error: No se encontraron los canvas de firma');
        return;
    }
    
    data.firma_cedente = sigCedente.toDataURL('image/png');
    data.firma_cesionario = sigCesionario.toDataURL('image/png');`,
    `    // Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');
    
    // Firma del cesionario es fija (imagen del dispensario)
    const sigCesionarioImg = document.getElementById('sigCesionarioPoderImg');
    if (sigCesionarioImg && sigCesionarioImg.src) {
        // Convertir imagen a base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = sigCesionarioImg.naturalWidth || 300;
        canvas.height = sigCesionarioImg.naturalHeight || 220;
        ctx.drawImage(sigCesionarioImg, 0, 0);
        data.firma_cesionario = canvas.toDataURL('image/png');
    } else {
        data.firma_cesionario = '';
    }`
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');

