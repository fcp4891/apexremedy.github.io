@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Liberar Puerto 8000
echo ========================================
echo.
echo Buscando procesos que usan el puerto 8000...
echo.

set FOUND=0

REM Buscar el proceso que usa el puerto 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    set PID=%%a
    set FOUND=1
    echo [*] Proceso encontrado con PID: %%a
    echo [*] Terminando proceso...
    taskkill /PID %%a /F >nul 2>&1
    if !ERRORLEVEL! == 0 (
        echo [OK] Proceso terminado exitosamente
    ) else (
        echo [ERROR] No se pudo terminar el proceso. Puede requerir permisos de administrador.
        echo [*] Intentando con permisos elevados...
        powershell -Command "Start-Process taskkill -ArgumentList '/PID', '%%a', '/F' -Verb RunAs" >nul 2>&1
    )
)

if !FOUND! == 0 (
    echo [INFO] No se encontraron procesos usando el puerto 8000
    echo [INFO] El puerto 8000 está libre
) else (
    echo.
    echo [*] Esperando a que el puerto se libere...
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo   Estado del Puerto 8000:
echo ========================================
netstat -ano | findstr :8000 | findstr LISTENING >nul
if !ERRORLEVEL! == 0 (
    echo [ADVERTENCIA] El puerto 8000 aún está en uso
    echo.
    echo Si necesitas liberarlo manualmente:
    echo   1. Ejecuta: netstat -ano ^| findstr :8000
    echo   2. Identifica el PID
    echo   3. Ejecuta: taskkill /PID [PID] /F
) else (
    echo [OK] El puerto 8000 está libre
    echo [*] Ahora puedes ejecutar: npm start
)

echo.
pause

