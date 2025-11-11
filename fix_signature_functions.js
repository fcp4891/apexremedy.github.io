const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'poder-cultivo-form.html');

console.log('📝 Leyendo archivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Actualizando funciones de obtención de firma...');

// 1. Actualizar generatePoderDocument
// Buscar donde se obtiene la firma del cedente
const generatePattern = /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?if \(!sigCedente\) \{[\s\S]*?alert\('Error: No se encontraron los canvas de firma'\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/;

if (generatePattern.test(content)) {
    content = content.replace(
        /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?if \(!sigCedente\) \{[\s\S]*?alert\('Error: No se encontraron los canvas de firma'\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/,
        `// Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');`
    );
    console.log('✅ generatePoderDocument actualizado');
} else {
    // Intentar patrón más simple
    content = content.replace(
        /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]{0,200}data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/,
        `// Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');`
    );
    console.log('✅ generatePoderDocument actualizado (patrón simple)');
}

// 2. Actualizar previewPoderDoc
const previewPattern = /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?if \(!sigCedente\) \{[\s\S]*?alert\('Error: No se encontraron los canvas de firma'\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/;

if (previewPattern.test(content)) {
    content = content.replace(
        /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]*?if \(!sigCedente\) \{[\s\S]*?alert\('Error: No se encontraron los canvas de firma'\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/,
        `// Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');`
    );
    console.log('✅ previewPoderDoc actualizado');
} else {
    // Intentar patrón más simple
    content = content.replace(
        /const sigCedente = document\.getElementById\('sigCedentePoder'\);[\s\S]{0,200}data\.firma_cedente = sigCedente\.toDataURL\('image\/png'\);/g,
        `// Obtener firma del cedente desde SignaturePad
    if (!signaturePadCedente || signaturePadCedente.isEmpty()) {
        alert('Por favor, ingrese su firma como cedente');
        return;
    }
    data.firma_cedente = signaturePadCedente.toDataURL('image/png');`
    );
    console.log('✅ previewPoderDoc actualizado (patrón simple)');
}

// 3. Buscar y reemplazar cualquier otra referencia a sigCedente.toDataURL
content = content.replace(
    /sigCedente\.toDataURL\(/g,
    'signaturePadCedente.toDataURL('
);

// 4. Buscar referencias a sigCesionarioPoder
// La firma del cesionario es fija (imagen del dispensario), así que no necesita SignaturePad
// Pero asegurémonos de que no haya referencias problemáticas
content = content.replace(
    /const sigCesionario = document\.getElementById\('sigCesionarioPoder'\);[\s\S]*?data\.firma_cesionario = sigCesionario\.toDataURL\('image\/png'\);/g,
    `// Firma del cesionario es fija (imagen del dispensario)
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
console.log('\n📋 Funciones actualizadas:');
console.log('   1. ✅ generatePoderDocument');
console.log('   2. ✅ previewPoderDoc');
console.log('   3. ✅ Referencias a toDataURL actualizadas');

