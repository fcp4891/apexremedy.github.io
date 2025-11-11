# Script para reiniciar el servidor backend
Write-Host "🔄 Reiniciando servidor backend..." -ForegroundColor Yellow

# Buscar procesos de Node.js que puedan ser el servidor backend
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "⚠️  Procesos Node.js encontrados: $($nodeProcesses.Count)" -ForegroundColor Yellow
    
    # Intentar detener procesos en el puerto 3000
    Write-Host "🔍 Buscando procesos en el puerto 3000..." -ForegroundColor Yellow
    try {
        $port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"
        if ($port3000) {
            Write-Host "⚠️  Hay procesos usando el puerto 3000" -ForegroundColor Yellow
            Write-Host "💡 Detén manualmente el proceso que esté usando el puerto 3000" -ForegroundColor Cyan
            Write-Host "   Puedes usar: netstat -ano | findstr ':3000'" -ForegroundColor Cyan
            Write-Host "   Luego: taskkill /PID <PID> /F" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "ℹ️  No se pudo verificar el puerto 3000" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No hay procesos Node.js corriendo" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Para reiniciar manualmente:" -ForegroundColor Cyan
Write-Host "   1. Abre una nueva terminal" -ForegroundColor White
Write-Host "   2. Ve al directorio del proyecto" -ForegroundColor White
Write-Host "   3. Ejecuta: npm --prefix ./backend start" -ForegroundColor White
Write-Host ""
Write-Host "💡 O usa el Administrador de tareas para detener el proceso Node.js" -ForegroundColor Cyan








