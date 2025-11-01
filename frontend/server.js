const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 5500;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'font/woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Manejar rutas de admin
    if (req.url.startsWith('/admin/')) {
        filePath = '.' + req.url;
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    // Forzar tipo MIME correcto para archivos HTML
    if (extname === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Configurar CORS para permitir peticiones del frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Archivo no encontrado
                if (extname === '.jpg' || extname === '.jpeg' || extname === '.png' || extname === '.gif') {
                    // Placeholder para imágenes
                    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                    res.end(`
                        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#f3f4f6"/>
                            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
                                  fill="#666666" text-anchor="middle" dy=".3em">
                                Imagen no disponible
                            </text>
                        </svg>
                    `);
                    return;
                }
                
                // Página 404 personalizada
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>404 - Página no encontrada</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                            }
                            .container {
                                text-align: center;
                                padding: 40px;
                                background: rgba(255, 255, 255, 0.1);
                                border-radius: 20px;
                                backdrop-filter: blur(10px);
                            }
                            h1 { font-size: 6rem; margin: 0; }
                            p { font-size: 1.5rem; margin: 20px 0; }
                            a {
                                display: inline-block;
                                margin-top: 20px;
                                padding: 12px 30px;
                                background: white;
                                color: #667eea;
                                text-decoration: none;
                                border-radius: 25px;
                                font-weight: bold;
                                transition: transform 0.3s;
                            }
                            a:hover { transform: scale(1.05); }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>404</h1>
                            <p>Página no encontrada</p>
                            <p style="font-size: 1rem; opacity: 0.8;">
                                El archivo <code>${req.url}</code> no existe
                            </p>
                            <a href="/">Ir al Inicio</a>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                // Error del servidor
                res.writeHead(500);
                res.end('Error del servidor: ' + error.code);
            }
        } else {
            // Archivo encontrado - enviarlo
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log('\n🚀 FRONTEND SERVER - Apexremedy');
    console.log('═'.repeat(50));
    console.log(`📂 Sirviendo archivos desde: ${__dirname}`);
    console.log(`🌐 Servidor corriendo en: http://localhost:${port}`);
    console.log(`🔗 Abre tu navegador en: http://localhost:${port}`);
    console.log('═'.repeat(50));
    console.log('💡 Presiona Ctrl+C para detener el servidor\n');
    console.log('📋 Archivos disponibles:');
    console.log('   → http://localhost:5500/index.html');
    console.log('   → http://localhost:5500/tienda.html');
    console.log('   → http://localhost:5500/carrito.html');
    console.log('   → http://localhost:5500/login.html');
    console.log('   → http://localhost:5500/registro.html');
    console.log('   → http://localhost:5500/nosotros.html');
    console.log('   → http://localhost:5500/contacto.html');
    console.log('   → http://localhost:5500/admin/checkout.html');
    console.log('   → http://localhost:5500/admin/carrito.html');
    console.log('   → http://localhost:5500/admin/dashboard.html');
    console.log('\n⏰ Servidor iniciado:', new Date().toLocaleString('es-CL'));
    console.log('');
});

// Manejo de errores
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: El puerto ${port} ya está en uso`);
        console.error('💡 Soluciones:');
        console.error('   1. Cierra el proceso que usa el puerto 5500');
        console.error('   2. O cambia el puerto en este archivo\n');
    } else {
        console.error('❌ Error del servidor:', error);
    }
    process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n\n👋 Cerrando servidor frontend...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});