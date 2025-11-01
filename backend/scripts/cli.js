#!/usr/bin/env node
// backend/scripts/cli.js - Herramientas de línea de comandos

const readline = require('readline');
const { initDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function showMenu() {
    console.clear();
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   Apexremedy - Admin CLI v1.0        ║');
    console.log('╚═══════════════════════════════════════╝\n');
    console.log('1. Crear usuario admin');
    console.log('2. Listar todos los usuarios');
    console.log('3. Resetear base de datos');
    console.log('4. Ver estadísticas');
    console.log('5. Backup de base de datos');
    console.log('6. Listar productos');
    console.log('7. Actualizar stock masivo');
    console.log('8. Ver pedidos pendientes');
    console.log('9. Limpiar pedidos antiguos');
    console.log('0. Salir\n');
    
    const choice = await question('Selecciona una opción: ');
    return choice;
}

async function createAdmin() {
    console.log('\n=== Crear Usuario Administrador ===\n');
    
    const name = await question('Nombre completo: ');
    const email = await question('Email: ');
    const password = await question('Contraseña: ');
    const phone = await question('Teléfono (opcional): ');
    
    try {
        // Verificar si el email ya existe
        if (await User.emailExists(email)) {
            console.log('\n❌ Error: El email ya está registrado');
            return;
        }
        
        const user = await User.create({
            name,
            email,
            password,
            phone: phone || null,
            role: 'admin'
        });
        
        console.log('\n✅ Usuario admin creado exitosamente!');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Nombre: ${user.name}`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function listUsers() {
    console.log('\n=== Lista de Usuarios ===\n');
    
    try {
        const users = await User.findAllSafe();
        
        console.log('┌────┬──────────────────────┬────────────────────────────┬───────────┐');
        console.log('│ ID │ Nombre               │ Email                      │ Rol       │');
        console.log('├────┼──────────────────────┼────────────────────────────┼───────────┤');
        
        users.forEach(user => {
            const id = String(user.id).padEnd(3);
            const name = user.name.substring(0, 20).padEnd(20);
            const email = user.email.substring(0, 28).padEnd(28);
            const role = user.role.padEnd(9);
            console.log(`│ ${id}│ ${name}│ ${email}│ ${role}│`);
        });
        
        console.log('└────┴──────────────────────┴────────────────────────────┴───────────┘');
        console.log(`\nTotal: ${users.length} usuarios`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function resetDatabase() {
    console.log('\n⚠️  ADVERTENCIA: Esto eliminará TODOS los datos!\n');
    const confirm = await question('¿Estás seguro? (escribe "CONFIRMAR"): ');
    
    if (confirm !== 'CONFIRMAR') {
        console.log('\nOperación cancelada.');
        await question('Presiona Enter para continuar...');
        return;
    }
    
    try {
        const { getDatabase } = require('../src/config/database');
        const db = await getDatabase();
        
        // Eliminar todas las tablas
        await db.exec(`
            DROP TABLE IF EXISTS order_items;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS products;
            DROP TABLE IF EXISTS users;
        `);
        
        console.log('\n✅ Base de datos reseteada');
        console.log('Ejecuta "npm run seed" para poblar con datos de ejemplo');
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function showStats() {
    console.log('\n=== Estadísticas del Sistema ===\n');
    
    try {
        const userStats = await User.getStats();
        const productStats = await Product.getStats();
        const orderStats = await Order.getStats();
        
        console.log('👥 USUARIOS');
        console.log(`   Total: ${userStats.total}`);
        console.log(`   Clientes: ${userStats.customers}`);
        console.log(`   Admins: ${userStats.admins}\n`);
        
        console.log('📦 PRODUCTOS');
        console.log(`   Total: ${productStats.total}`);
        console.log(`   Destacados: ${productStats.featured}`);
        console.log(`   Stock bajo: ${productStats.lowStock}`);
        console.log(`   Agotados: ${productStats.outOfStock}`);
        console.log(`   Precio promedio: $${productStats.averagePrice}\n`);
        
        console.log('🛒 PEDIDOS');
        console.log(`   Total: ${orderStats.total}`);
        console.log(`   Pendientes: ${orderStats.byStatus.pending}`);
        console.log(`   Procesando: ${orderStats.byStatus.processing}`);
        console.log(`   Enviados: ${orderStats.byStatus.shipped}`);
        console.log(`   Entregados: ${orderStats.byStatus.delivered}`);
        console.log(`   Cancelados: ${orderStats.byStatus.cancelled}`);
        console.log(`   Revenue total: $${orderStats.totalRevenue}`);
        console.log(`   Valor promedio: $${orderStats.averageOrderValue}`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function backupDatabase() {
    console.log('\n=== Backup de Base de Datos ===\n');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dbPath = path.join(__dirname, '../database/apexremedy.db');
        const backupPath = path.join(__dirname, `../database/backup_${Date.now()}.db`);
        
        if (!fs.existsSync(dbPath)) {
            console.log('❌ Base de datos no encontrada');
            await question('\nPresiona Enter para continuar...');
            return;
        }
        
        fs.copyFileSync(dbPath, backupPath);
        
        console.log('✅ Backup creado exitosamente!');
        console.log(`Ubicación: ${backupPath}`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function listProducts() {
    console.log('\n=== Lista de Productos ===\n');
    
    try {
        const products = await Product.findAll();
        
        console.log('┌────┬────────────────────────────┬──────────┬───────┬────────────┐');
        console.log('│ ID │ Nombre                     │ Precio   │ Stock │ Categoría  │');
        console.log('├────┼────────────────────────────┼──────────┼───────┼────────────┤');
        
        products.forEach(p => {
            const id = String(p.id).padEnd(3);
            const name = p.name.substring(0, 28).padEnd(28);
            const price = `$${p.price}`.padEnd(9);
            const stock = String(p.stock).padEnd(6);
            const category = p.category.substring(0, 12).padEnd(12);
            console.log(`│ ${id}│ ${name}│ ${price}│ ${stock}│ ${category}│`);
        });
        
        console.log('└────┴────────────────────────────┴──────────┴───────┴────────────┘');
        console.log(`\nTotal: ${products.length} productos`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function updateBulkStock() {
    console.log('\n=== Actualización Masiva de Stock ===\n');
    console.log('Ingresa el incremento/decremento para todos los productos');
    console.log('(Ejemplo: 10 para agregar 10 unidades, -5 para quitar 5)\n');
    
    const quantity = await question('Cantidad: ');
    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum)) {
        console.log('\n❌ Cantidad inválida');
        await question('Presiona Enter para continuar...');
        return;
    }
    
    const confirm = await question(`\n¿Confirmas ${quantityNum > 0 ? 'agregar' : 'quitar'} ${Math.abs(quantityNum)} unidades a todos los productos? (s/n): `);
    
    if (confirm.toLowerCase() !== 's') {
        console.log('\nOperación cancelada');
        await question('Presiona Enter para continuar...');
        return;
    }
    
    try {
        const products = await Product.findAll();
        let updated = 0;
        
        for (const product of products) {
            try {
                await Product.updateStock(product.id, quantityNum);
                updated++;
            } catch (error) {
                console.log(`⚠️  Error en producto ${product.id}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ ${updated} productos actualizados`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function listPendingOrders() {
    console.log('\n=== Pedidos Pendientes ===\n');
    
    try {
        const orders = await Order.findByStatus('pending');
        
        if (orders.length === 0) {
            console.log('No hay pedidos pendientes');
        } else {
            console.log('┌────┬─────────────────────────┬────────────┬─────────────────────┐');
            console.log('│ ID │ Cliente                 │ Total      │ Fecha               │');
            console.log('├────┼─────────────────────────┼────────────┼─────────────────────┤');
            
            for (const order of orders) {
                const id = String(order.id).padEnd(3);
                const customer = order.customer_name.substring(0, 25).padEnd(25);
                const total = `$${order.total}`.padEnd(11);
                const date = new Date(order.created_at).toLocaleString('es-CL').substring(0, 21).padEnd(21);
                console.log(`│ ${id}│ ${customer}│ ${total}│ ${date}│`);
            }
            
            console.log('└────┴─────────────────────────┴────────────┴─────────────────────┘');
            console.log(`\nTotal: ${orders.length} pedidos pendientes`);
        }
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function cleanOldOrders() {
    console.log('\n=== Limpiar Pedidos Antiguos ===\n');
    console.log('Eliminar pedidos cancelados de más de 30 días\n');
    
    const confirm = await question('¿Continuar? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
        console.log('\nOperación cancelada');
        await question('Presiona Enter para continuar...');
        return;
    }
    
    try {
        const { getDatabase } = require('../src/config/database');
        const db = await getDatabase();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await db.run(
            `DELETE FROM orders 
             WHERE status = 'cancelled' 
             AND created_at < ?`,
            [thirtyDaysAgo.toISOString()]
        );
        
        console.log(`\n✅ ${result.changes} pedidos eliminados`);
    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
    
    await question('\nPresiona Enter para continuar...');
}

async function main() {
    try {
        await initDatabase();
        
        let running = true;
        
        while (running) {
            const choice = await showMenu();
            
            switch (choice) {
                case '1':
                    await createAdmin();
                    break;
                case '2':
                    await listUsers();
                    break;
                case '3':
                    await resetDatabase();
                    break;
                case '4':
                    await showStats();
                    break;
                case '5':
                    await backupDatabase();
                    break;
                case '6':
                    await listProducts();
                    break;
                case '7':
                    await updateBulkStock();
                    break;
                case '8':
                    await listPendingOrders();
                    break;
                case '9':
                    await cleanOldOrders();
                    break;
                case '0':
                    running = false;
                    console.log('\n👋 ¡Hasta luego!\n');
                    break;
                default:
                    console.log('\n❌ Opción inválida');
                    await question('Presiona Enter para continuar...');
            }
        }
        
        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal:', error);
        rl.close();
        process.exit(1);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = { main };