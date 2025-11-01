#!/usr/bin/env node
// backend/scripts/backup.js
// Script para crear backups automáticos de la base de datos

const fs = require('fs');
const path = require('path');
const config = require('../src/config/config');

class BackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '../database/backups');
        this.dbPath = path.join(__dirname, '..', config.database.sqlite.path);
    }

    // Crear directorio de backups si no existe
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('✅ Directorio de backups creado');
        }
    }

    // Generar nombre de archivo de backup
    generateBackupFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `backup_${year}${month}${day}_${hours}${minutes}${seconds}.db`;
    }

    // Crear backup
    async createBackup() {
        try {
            console.log('🔄 Iniciando backup de base de datos...\n');
            
            // Verificar que existe la BD
            if (!fs.existsSync(this.dbPath)) {
                throw new Error('Base de datos no encontrada');
            }

            // Asegurar directorio de backups
            this.ensureBackupDir();

            // Generar nombre y ruta
            const backupFilename = this.generateBackupFilename();
            const backupPath = path.join(this.backupDir, backupFilename);

            // Copiar archivo
            fs.copyFileSync(this.dbPath, backupPath);

            // Obtener tamaño del archivo
            const stats = fs.statSync(backupPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log('✅ Backup creado exitosamente');
            console.log(`📁 Ubicación: ${backupPath}`);
            console.log(`📊 Tamaño: ${sizeMB} MB`);
            console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}\n`);

            return backupPath;
        } catch (error) {
            console.error('❌ Error creando backup:', error.message);
            throw error;
        }
    }

    // Listar backups existentes
    listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                console.log('No hay backups disponibles');
                return [];
            }

            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.endsWith('.db'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        date: stats.mtime
                    };
                })
                .sort((a, b) => b.date - a.date);

            console.log('📋 Backups disponibles:\n');
            console.log('┌────┬──────────────────────────────┬──────────┬─────────────────────┐');
            console.log('│ #  │ Archivo                      │ Tamaño   │ Fecha               │');
            console.log('├────┼──────────────────────────────┼──────────┼─────────────────────┤');

            files.forEach((file, index) => {
                const num = String(index + 1).padEnd(2);
                const name = file.name.substring(0, 30).padEnd(30);
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                const size = `${sizeMB} MB`.padEnd(9);
                const date = file.date.toLocaleString('es-CL').substring(0, 21).padEnd(21);
                console.log(`│ ${num}│ ${name}│ ${size}│ ${date}│`);
            });

            console.log('└────┴──────────────────────────────┴──────────┴─────────────────────┘\n');

            return files;
        } catch (error) {
            console.error('❌ Error listando backups:', error.message);
            return [];
        }
    }

    // Restaurar backup
    async restoreBackup(backupPath) {
        try {
            console.log('🔄 Restaurando backup...\n');

            if (!fs.existsSync(backupPath)) {
                throw new Error('Archivo de backup no encontrado');
            }

            // Crear backup de la BD actual antes de restaurar
            console.log('📦 Creando backup de seguridad de BD actual...');
            const safetyBackup = path.join(this.backupDir, 'before_restore_' + this.generateBackupFilename());
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, safetyBackup);
                console.log('✅ Backup de seguridad creado\n');
            }

            // Restaurar
            fs.copyFileSync(backupPath, this.dbPath);

            console.log('✅ Base de datos restaurada exitosamente');
            console.log(`📁 Desde: ${backupPath}`);
            console.log(`📁 Hacia: ${this.dbPath}\n`);

            return true;
        } catch (error) {
            console.error('❌ Error restaurando backup:', error.message);
            throw error;
        }
    }

    // Limpiar backups antiguos (mantener últimos N)
    cleanOldBackups(keepLast = 10) {
        try {
            const backups = this.listBackups();
            
            if (backups.length <= keepLast) {
                console.log(`ℹ️  Solo hay ${backups.length} backups, no es necesario limpiar\n`);
                return;
            }

            const toDelete = backups.slice(keepLast);
            
            console.log(`🗑️  Eliminando ${toDelete.length} backups antiguos...\n`);

            toDelete.forEach(backup => {
                fs.unlinkSync(backup.path);
                console.log(`   ✅ Eliminado: ${backup.name}`);
            });

            console.log(`\n✅ Limpieza completada. Mantenidos: ${keepLast} backups más recientes\n`);
        } catch (error) {
            console.error('❌ Error limpiando backups:', error.message);
        }
    }

    // Programar backups automáticos
    scheduleAutoBackup(intervalHours = 24) {
        console.log(`⏰ Backups automáticos programados cada ${intervalHours} horas\n`);
        
        // Crear primer backup
        this.createBackup();

        // Programar siguientes
        setInterval(async () => {
            console.log('\n⏰ Ejecutando backup programado...');
            await this.createBackup();
            this.cleanOldBackups(10);
        }, intervalHours * 60 * 60 * 1000);
    }
}

// CLI
async function main() {
    const backupManager = new BackupManager();
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case 'create':
                await backupManager.createBackup();
                break;

            case 'list':
                backupManager.listBackups();
                break;

            case 'restore':
                const backupPath = args[1];
                if (!backupPath) {
                    console.error('❌ Especifica la ruta del backup');
                    console.log('Uso: npm run backup:db restore <ruta_backup>');
                    process.exit(1);
                }
                await backupManager.restoreBackup(backupPath);
                break;

            case 'clean':
                const keepLast = parseInt(args[1]) || 10;
                backupManager.cleanOldBackups(keepLast);
                break;

            case 'auto':
                const hours = parseInt(args[1]) || 24;
                backupManager.scheduleAutoBackup(hours);
                // Mantener el proceso corriendo
                process.on('SIGINT', () => {
                    console.log('\n👋 Deteniendo backups automáticos...');
                    process.exit(0);
                });
                break;

            default:
                console.log('📦 Backup Manager - Apexremedy\n');
                console.log('Comandos disponibles:');
                console.log('  npm run backup:db create           - Crear backup manual');
                console.log('  npm run backup:db list             - Listar backups');
                console.log('  npm run backup:db restore <path>   - Restaurar backup');
                console.log('  npm run backup:db clean [N]        - Limpiar backups (mantener últimos N)');
                console.log('  npm run backup:db auto [hours]     - Backups automáticos cada N horas');
                console.log('\nEjemplos:');
                console.log('  npm run backup:db create');
                console.log('  npm run backup:db restore database/backups/backup_20250115_120000.db');
                console.log('  npm run backup:db clean 5');
                console.log('  npm run backup:db auto 12\n');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = BackupManager;