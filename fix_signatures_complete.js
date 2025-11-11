const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Actualizando funciones de firma completamente...');

// 1. En generatePoderDocument - reemplazar desde "Agregar firmas" hasta "data.firma_cesionario"
const generateMatch = content.match(/\/\/ Agregar firmas[\s\S]{0,500}data\.firma_cesionario = canvas\.toDataURL\('image\/png'\);[\s\S]{0,10}data\.firma_cedente = signaturePadCedente\.toDataURL/);
if (!generateMatch) {
    // Reemplazar en generatePoderDocument
    content = content.replace(
        /\/\/ Agregar firmas\s+const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]{0,200}data\.firma_cesionario = '';/,
        `// Agregar firmas
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
        data.firma_cesionario = '';`
    );
}

// 2. En previewPoderDoc - reemplazar desde sigCedente hasta data.firma_cesionario
content = content.replace(
    /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]{0,200}data\.firma_cesionario = '';/g,
    `// Obtener firma del cedente desde SignaturePad
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
        data.firma_cesionario = '';`
);

// 3. Asegurar que no queden referencias a sigCedente.toDataURL
content = content.replace(
    /sigCedente\.toDataURL\(/g,
    'signaturePadCedente.toDataURL('
);

console.log('💾 Guardando archivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Cambios aplicados!');
console.log('\nVerificando...');

// Verificar
const hasSignaturePad = content.includes('signaturePadCedente');
const hasOldCode = content.includes("const sigCedente = document.getElementById('sigCedentePoder')");

console.log(`SignaturePad implementado: ${hasSignaturePad ? '✅' : '❌'}`);
console.log(`Código antiguo eliminado: ${!hasOldCode ? '✅' : '⚠️ (algunas referencias pueden quedar)'}`);

