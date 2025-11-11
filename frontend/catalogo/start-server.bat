@echo off
echo ========================================
echo   ApexRemedy Catálogo - Servidor Local
echo ========================================
echo.
echo Intentando iniciar servidor en http://localhost:8000
echo Presiona Ctrl+C para detener el servidor
echo.

REM Intentar Node.js primero
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [*] Usando Node.js...
    node server.js
    goto :end
)

REM Si no hay Node.js, intentar Python
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [*] Node.js no encontrado, usando Python...
    python -m http.server 8000
    goto :end
)

REM Si no hay ninguno, mostrar error
echo [ERROR] No se encontró Node.js ni Python
echo.
echo Por favor instala uno de los siguientes:
echo   - Node.js: https://nodejs.org/
echo   - Python: https://www.python.org/
echo.
pause
:end

