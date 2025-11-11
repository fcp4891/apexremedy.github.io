// Simple HTTP server for local development
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const DEFAULT_PORT = 8000;

// Función para verificar si un puerto está disponible
function checkPort(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.listen(port, '127.0.0.1', () => {
            server.once('close', () => {
                // Esperar un poco para que el puerto esté completamente liberado
                setTimeout(() => resolve(true), 100);
            });
            server.close();
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                reject(err);
            }
        });
    });
}

// Función para encontrar un puerto disponible
async function findAvailablePort(startPort = DEFAULT_PORT, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const port = startPort + i;
        const isAvailable = await checkPort(port);
        if (isAvailable) {
            return port;
        }
    }
    throw new Error(`No se encontró un puerto disponible entre ${startPort} y ${startPort + maxAttempts - 1}`);
}

let PORT = DEFAULT_PORT;

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
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Función para servir página 404
function serve404(res) {
    fs.readFile('./404.html', (error, content) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(content || '404 Not Found', 'utf-8');
    });
}

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Manejar peticiones OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Manejar peticiones POST para guardar data.js
    if (req.method === 'POST' && req.url === '/save-data') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const fileContent = data.content;
                
                // Guardar el archivo data.js
                fs.writeFile('./data.js', fileContent, 'utf8', (err) => {
                    if (err) {
                        console.error('❌ Error al guardar data.js:', err);
                        res.writeHead(500, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    } else {
                        console.log('✅ data.js actualizado exitosamente');
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(JSON.stringify({ success: true, message: 'data.js guardado' }));
                    }
                });
            } catch (error) {
                console.error('❌ Error al procesar datos:', error);
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Función helper para intentar servir un archivo
    function tryServeFile(pathToTry, contentTypeToUse, callback) {
        fs.readFile(pathToTry, (err, fileContent) => {
            if (!err) {
                const headers = {
                    'Content-Type': contentTypeToUse || contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                };
                res.writeHead(200, headers);
                res.end(fileContent, 'utf-8');
                return true;
            }
            if (callback) callback();
            return false;
        });
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Si es una imagen y no se encuentra, intentar variaciones comunes
                if (filePath.includes('/images/') || filePath.includes('\\images\\')) {
                    let triedAlternatives = false;
                    
                    // Intentar placeholder.jpg.png si buscaba placeholder.jpg
                    if (filePath.includes('placeholder.jpg') && !filePath.endsWith('.png')) {
                        const placeholderPath = filePath.replace(/placeholder\.jpg/g, 'placeholder.jpg.png');
                        triedAlternatives = true;
                        tryServeFile(placeholderPath, 'image/png', () => {
                            // Si placeholder.jpg.png tampoco funciona, intentar .png si era .jpg
                            if (filePath.endsWith('.jpg')) {
                                const pngPath = filePath.replace(/\.jpg$/, '.png');
                                tryServeFile(pngPath, 'image/png', () => {
                                    serve404(res);
                                });
                            } else {
                                serve404(res);
                            }
                        });
                        return;
                    }
                    
                    // Intentar con .png si buscaba .jpg
                    if (filePath.endsWith('.jpg') && !triedAlternatives) {
                        const pngPath = filePath.replace(/\.jpg$/, '.png');
                        tryServeFile(pngPath, 'image/png', () => {
                            serve404(res);
                        });
                        return;
                    }
                }
                
                // Si no es una imagen o no se encontró variación, mostrar 404
                serve404(res);
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Agregar headers CORS para permitir crossorigin en imágenes
            const headers = {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            };
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

// Iniciar servidor
async function startServer() {
    try {
        // Verificar si el puerto por defecto está disponible
        const isDefaultPortAvailable = await checkPort(DEFAULT_PORT);
        
        if (!isDefaultPortAvailable) {
            console.log(`\n⚠️  El puerto ${DEFAULT_PORT} ya está en uso.`);
            console.log(`   Buscando puerto alternativo...\n`);
            
            PORT = await findAvailablePort(DEFAULT_PORT + 1);
            
            // Esperar un poco para asegurar que el puerto esté completamente disponible
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log(`\n✅ Puerto alternativo encontrado: ${PORT}`);
        } else {
            PORT = DEFAULT_PORT;
        }
        
        // Escuchar explícitamente en localhost (127.0.0.1)
        server.listen(PORT, '127.0.0.1', (err) => {
            if (err) {
                console.error(`\n❌ Error al iniciar el servidor:`, err.message);
                process.exit(1);
            }
            console.log(`\n${'='.repeat(50)}`);
            console.log(`   🌿 Servidor ApexRemedy Catálogo`);
            console.log(`${'='.repeat(50)}`);
            console.log(`   ✅ Servidor corriendo en: http://localhost:${PORT}`);
            console.log(`   ✅ También disponible en: http://127.0.0.1:${PORT}`);
            console.log(`   📄 Abre cualquiera de estas URLs en tu navegador`);
            console.log(`   ⏹️  Presiona Ctrl+C para detener\n`);
        });
        
        // Manejar errores de conexión
        server.on('connection', (socket) => {
            console.log(`[DEBUG] Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`);
        });
        
        // Asegurar que el servidor no se cierre
        server.on('close', () => {
            console.log('\n[INFO] Servidor cerrado');
        });
        
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
            console.error(`\n💡 Soluciones:`);
            console.error(`   1. Cierra otros servidores que puedan estar corriendo`);
            console.error(`   2. Mata el proceso que usa el puerto ${PORT}:`);
            console.error(`      Windows: netstat -ano | findstr :${PORT}`);
            console.error(`      Luego: taskkill /PID <PID> /F`);
            console.error(`   3. Usa otro puerto ejecutando: PORT=8001 node server.js\n`);
            process.exit(1);
        } else {
            console.error(`\n❌ Error al iniciar el servidor:`, error.message);
            process.exit(1);
        }
    }
}

// Manejar errores no capturados
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
        console.error(`\n💡 Soluciones:`);
        console.error(`   1. Cierra otros servidores que puedan estar corriendo`);
        console.error(`   2. Espera unos segundos y vuelve a intentar`);
        console.error(`   3. Reinicia tu terminal/computadora\n`);
        process.exit(1);
    } else {
        console.error(`\n❌ Error del servidor:`, error.message);
        process.exit(1);
    }
});

// Iniciar el servidor
startServer();