# PowerShell script to start a local HTTP server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ApexRemedy Catálogo - Servidor Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try Node.js first (recommended)
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "[*] Usando Node.js..." -ForegroundColor Green
    Write-Host "[*] Si el puerto 8000 está ocupado, se usará uno alternativo automáticamente" -ForegroundColor Yellow
    Write-Host ""
    node server.js
    exit
}

# Try Python as fallback
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host "[*] Node.js no encontrado, usando Python..." -ForegroundColor Yellow
    Write-Host "[*] Iniciando servidor en http://localhost:8000" -ForegroundColor Green
    Write-Host "[*] Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
    Write-Host ""
    python -m http.server 8000
    exit
}

# If neither is available, show error
Write-Host "[ERROR] No se encontró Node.js ni Python" -ForegroundColor Red
Write-Host ""
Write-Host "Por favor instala uno de los siguientes:" -ForegroundColor Yellow
Write-Host "  - Node.js: https://nodejs.org/" -ForegroundColor Cyan
Write-Host "  - Python: https://www.python.org/" -ForegroundColor Cyan
Write-Host ""
pause


