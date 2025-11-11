#!/usr/bin/env node
// backend/scripts/show-environment.js
// Muestra la configuración actual del entorno y fuente de datos

require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log(`
╔════════════════════════════════════════════════════════════╗
║          🔍 CONFIGURACIÓN ACTUAL DEL ENTORNO             ║
╚════════════════════════════════════════════════════════════╝
`);

// Detectar entorno
const nodeEnv = process.env.NODE_ENV || 'development';
const dbType = process.env.DB_TYPE || 'sqlite';

console.log(`📋 Variables de Entorno:`);
console.log(`   NODE_ENV: ${nodeEnv}`);
console.log(`   DB_TYPE: ${dbType}`);

// Detectar fuente de datos
let dataSource = {
    type: dbType,
    description: '',
    location: '',
    status: 'unknown'
};

if (dbType.toLowerCase() === 'sqlite' || dbType.toLowerCase() === 'sqlite3') {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
    const exists = fs.existsSync(dbPath);
    
    dataSource = {
        type: 'sqlite',
        description: 'Base de datos SQLite local',
        location: dbPath,
        status: exists ? '✅ Existe' : '❌ No encontrada',
        fileSize: exists ? `${(fs.statSync(dbPath).size / 1024 / 1024).toFixed(2)} MB` : 'N/A'
    };
} else if (dbType.toLowerCase() === 'postgres' || dbType.toLowerCase() === 'postgresql') {
    dataSource = {
        type: 'postgres',
        description: 'Base de datos PostgreSQL',
        location: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'apexremedy'}`,
        status: '🔗 Configurado',
        user: process.env.DB_USER || 'postgres'
    };
} else {
    dataSource = {
        type: dbType,
        description: 'Tipo de base de datos desconocido',
        location: 'N/A',
        status: '⚠️ No soportado'
    };
}

console.log(`\n📦 Fuente de Datos:`);
console.log(`   Tipo: ${dataSource.type}`);
console.log(`   Descripción: ${dataSource.description}`);
console.log(`   Ubicación: ${dataSource.location}`);
console.log(`   Estado: ${dataSource.status}`);
if (dataSource.fileSize) {
    console.log(`   Tamaño: ${dataSource.fileSize}`);
}
if (dataSource.user) {
    console.log(`   Usuario: ${dataSource.user}`);
}

// Verificar archivos JSON
console.log(`\n📄 Archivos JSON (GitHub Pages):`);
const jsonPath = path.join(__dirname, '../../frontend/api/products.json');
const jsonExists = fs.existsSync(jsonPath);
console.log(`   products.json: ${jsonExists ? '✅ Existe' : '❌ No encontrado'}`);
if (jsonExists) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const productCount = jsonData?.data?.products?.length || 0;
        console.log(`   Productos en JSON: ${productCount}`);
    } catch (e) {
        console.log(`   ⚠️ Error al leer JSON: ${e.message}`);
    }
}

// Resumen
console.log(`\n${'═'.repeat(60)}`);
console.log(`📊 RESUMEN:`);
console.log(`   Entorno actual: ${nodeEnv}`);
console.log(`   Fuente de datos: ${dataSource.type}`);
console.log(`   Estado: ${dataSource.status}`);
console.log(`${'═'.repeat(60)}`);

// Recomendaciones
console.log(`\n💡 Recomendaciones:`);
if (nodeEnv === 'development' && dbType === 'sqlite') {
    console.log(`   ✅ Configuración correcta para desarrollo local`);
    console.log(`   📝 El frontend usará: Backend API → SQLite`);
} else if (nodeEnv === 'production' && dbType === 'postgres') {
    console.log(`   ✅ Configuración correcta para producción`);
    console.log(`   📝 El frontend usará: Backend API → PostgreSQL`);
} else if (nodeEnv === 'production' && dbType === 'sqlite') {
    console.log(`   ⚠️ No recomendado: SQLite en producción`);
    console.log(`   💡 Considera usar PostgreSQL en producción`);
}

console.log(`\n📚 Para más información, ver: backend/README-ENVIRONMENT.md\n`);









