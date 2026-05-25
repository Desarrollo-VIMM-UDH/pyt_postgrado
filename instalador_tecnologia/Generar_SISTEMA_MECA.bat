@echo off
setlocal enabledelayedexpansion
title UDH - Generador de Paquete SISTEMA_MECA
color 0E
cls

echo.
echo  ============================================================
echo    UNIVERSIDAD DE DEFENSA DE HONDURAS
echo    Generador de Paquete de Despliegue - SISTEMA_MECA
echo  ============================================================
echo.
echo  Este script crea la carpeta SISTEMA_MECA con todo lo
echo  necesario para instalar el sistema en otra computadora.
echo  (Excluye node_modules, .git y bases de datos)
echo.
pause

set ORIGEN=%~dp0..
set DESTINO=%~dp0..\SISTEMA_MECA

echo.
echo  Limpiando paquete anterior si existe...
if exist "%DESTINO%" (
    rmdir /s /q "%DESTINO%"
    echo  [OK] Paquete anterior eliminado.
)

mkdir "%DESTINO%"
echo  [OK] Carpeta SISTEMA_MECA creada.

echo.
echo  [1/7] Copiando archivos raiz del Proyecto 1...
robocopy "%ORIGEN%" "%DESTINO%" ^
    "package.json" "package-lock.json" "vite.config.js" "eslint.config.js" "index.html" ^
    /njh /njs /ndl /nc /ns >nul 2>&1
echo  [OK] Archivos raiz copiados.

echo.
echo  [2/7] Copiando codigo fuente React (src)...
robocopy "%ORIGEN%\src" "%DESTINO%\src" /e ^
    /xd node_modules .git /njh /njs /ndl /nc /ns >nul 2>&1
echo  [OK] src/ copiado.

echo.
echo  [3/7] Copiando servidor backend (server)...
robocopy "%ORIGEN%\server" "%DESTINO%\server" /e ^
    /xd node_modules .git uploads /njh /njs /ndl /nc /ns >nul 2>&1
mkdir "%DESTINO%\server\uploads" >nul 2>&1
echo  [OK] server/ copiado (carpeta uploads creada vacia).

echo.
echo  [4/7] Copiando activos publicos (public)...
robocopy "%ORIGEN%\public" "%DESTINO%\public" /e ^
    /njh /njs /ndl /nc /ns >nul 2>&1
echo  [OK] public/ copiado (logos e imagenes incluidos).

echo.
echo  [5/7] Copiando Proyecto 2 - Portal de Coordinadores...
robocopy "%ORIGEN%\sistema_docentes" "%DESTINO%\sistema_docentes" /e ^
    /xd node_modules .git /njh /njs /ndl /nc /ns >nul 2>&1
mkdir "%DESTINO%\sistema_docentes\database" >nul 2>&1
echo  [OK] sistema_docentes/ copiado.

echo.
echo  [6/7] Copiando Proyecto 3 - Portal Estudiantil...
robocopy "%ORIGEN%\sistema_reportes" "%DESTINO%\sistema_reportes" /e ^
    /xd node_modules .git /njh /njs /ndl /nc /ns >nul 2>&1
echo  [OK] sistema_reportes/ copiado.

echo.
echo  [7/7] Copiando instalador y lanzador...
robocopy "%ORIGEN%\instalador_tecnologia" "%DESTINO%\instalador_tecnologia" /e ^
    /njh /njs /ndl /nc /ns >nul 2>&1
copy "%ORIGEN%\Iniciar_Todo_UDH.bat" "%DESTINO%\Iniciar_Todo_UDH.bat" >nul 2>&1
echo  [OK] Instalador y lanzador incluidos.

echo.
echo  ============================================================
echo    PAQUETE GENERADO EXITOSAMENTE
echo  ============================================================
echo.
echo  Ubicacion: %DESTINO%
echo.
echo  INSTRUCCIONES PARA LA OTRA COMPUTADORA:
echo  ----------------------------------------------------------
echo  1. Copie la carpeta SISTEMA_MECA a la otra PC
echo     (por USB, disco externo o red)
echo.
echo  2. Abra la subcarpeta: instalador_tecnologia
echo.
echo  3. Haga clic derecho sobre:
echo         Instalar_Sistema_Completo.bat
echo     y seleccione "Ejecutar como Administrador"
echo.
echo  4. Una vez instalado, ejecute desde la raiz:
echo         Iniciar_Todo_UDH.bat
echo.
echo  NOTA: La primera instalacion requiere internet para
echo        descargar Node.js y las dependencias de npm.
echo  ----------------------------------------------------------
echo.
pause
