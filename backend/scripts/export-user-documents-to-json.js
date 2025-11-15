#!/usr/bin/env node
/**
 * Script para exportar documentos de usuarios a JSON estático (solo metadatos)
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de documentos
 * ⚠️ IMPORTANTE: Solo se exportan metadatos (tipo, nombre, fecha, tamaño, mime_type)
 * ⚠️ NO se exportan los datos reales (file_data) por seguridad - son datos encriptados
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');

async function exportUserDocuments() {
    try {
        console.log('🚀 Iniciando exportación de documentos de usuarios a JSON (solo metadatos)...');
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const documentsFile = path.join(apiDir, 'user-documents.json');
            const emptyData = {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    documents: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(documentsFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', documentsFile);
            return emptyData;
        }

        await initDatabase();
        const db = getDatabase();

        // Obtener todos los documentos (solo metadatos, sin file_data)
        console.log('📄 Obteniendo documentos de usuarios de la base de datos...');
        const documents = await db.all(`
            SELECT 
                id,
                user_id,
                document_type,
                file_name,
                file_size,
                mime_type,
                uploaded_at
            FROM user_documents
            ORDER BY user_id, uploaded_at DESC
        `);
        
        console.log(`📦 ${documents.length} documentos encontrados`);

        // Normalizar documentos (solo metadatos, sin file_data)
        const normalizedDocuments = documents.map(doc => ({
            id: doc.id,
            user_id: doc.user_id,
            document_type: doc.document_type,
            file_name: doc.file_name,
            file_size: doc.file_size || 0,
            mime_type: doc.mime_type || 'application/octet-stream',
            uploaded_at: doc.uploaded_at,
            // ⚠️ IMPORTANTE: NO exportar file_data (datos encriptados/sensibles)
            // En modo QA solo se muestran metadatos, los datos reales están solo en local
            file_data: null,
            has_data: true // Indicador de que hay datos, pero no están disponibles en QA
        }));

        // Agrupar documentos por user_id
        const documentsByUser = {};
        normalizedDocuments.forEach(doc => {
            if (!documentsByUser[doc.user_id]) {
                documentsByUser[doc.user_id] = [];
            }
            documentsByUser[doc.user_id].push(doc);
        });

        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Documentos de usuarios exportados correctamente (solo metadatos)',
            data: {
                documents: normalizedDocuments,
                documentsByUser: documentsByUser,
                total: normalizedDocuments.length,
                usersCount: Object.keys(documentsByUser).length,
                timestamp: new Date().toISOString()
            },
            warning: 'Los datos reales (file_data) no se exportan por seguridad. Solo metadatos disponibles en QA.'
        };

        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }

        // Exportar a JSON
        const documentsFile = path.join(apiDir, 'user-documents.json');
        fs.writeFileSync(documentsFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ ${normalizedDocuments.length} documentos exportados a: ${documentsFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Total documentos: ${normalizedDocuments.length}`);
        console.log(`   - Usuarios con documentos: ${Object.keys(documentsByUser).length}`);
        console.log(`   - Tipos de documentos: ${[...new Set(normalizedDocuments.map(d => d.document_type))].join(', ')}`);
        console.log(`   ⚠️ Solo metadatos exportados (sin file_data por seguridad)`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de documentos:', error);
        throw error;
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        if (getDatabase()) {
            await getDatabase().disconnect();
            console.log('🔌 Base de datos desconectada.');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    exportUserDocuments()
        .then(() => {
            console.log('✅ Exportación de documentos completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportUserDocuments;

