# Cómo ejecutar el servidor local

**IMPORTANTE**: Para que la generación de PDF funcione correctamente, debes ejecutar el catálogo desde un servidor web local, NO abriendo el archivo `index.html` directamente.

## Opción 1: Python (Recomendada)

Si tienes Python instalado:

```bash
python -m http.server 8000
```

Luego abre en tu navegador: `http://localhost:8000`

O simplemente ejecuta:
```
start-server.bat
```

## Opción 2: Node.js

Si tienes Node.js instalado:

```bash
npm start
```

O directamente:
```bash
node server.js
```

Luego abre en tu navegador: `http://localhost:8000`

## Opción 3: Live Server (Visual Studio Code)

Si usas VS Code:

1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

## ¿Por qué es necesario?

El navegador bloquea la exportación de canvas cuando se cargan recursos usando el protocolo `file://` por razones de seguridad. Al usar un servidor web local (http://localhost), las restricciones de seguridad se relajan y html2pdf.js puede generar el PDF correctamente.

## Solución de problemas

Si todavía obtienes el error "Tainted canvas":
- Asegúrate de que el servidor esté corriendo
- Recarga la página en el navegador (F5)
- Limpia el caché del navegador
- Verifica que estás accediendo vía http://localhost:8000 y NO mediante file://

