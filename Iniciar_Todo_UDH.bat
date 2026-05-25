@echo off
setlocal enabledelayedexpansion
title UDH - Sistema Integral Operativo
color 0A
cls

echo.
echo  ============================================================
echo    UNIVERSIDAD DE DEFENSA DE HONDURAS
echo    Iniciando Sistema Integral de Gestion Academica...
echo  ============================================================
echo.

:: Obtener IP local para mostrarla al usuario
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP_LOCAL=%%A
    set IP_LOCAL=!IP_LOCAL: =!
    goto :found_ip
)
:found_ip

echo  IP de este servidor: !IP_LOCAL!
echo.
echo  Iniciando los 3 servicios en paralelo...
echo  (Cada servicio se abre en su propia ventana)
echo.

:: Ir a la raiz del proyecto
cd /d "%~dp0.."

:: Iniciar Proyecto 1 - Backend API (Puerto 3001)
start "UDH [1] API-Contratos :3001" cmd /k "color 0B && echo [PROYECTO 1] Backend API Central de Contratos && echo Puerto: 3001 && echo. && node server/index.js"

:: Pequeña pausa para que el backend arranque primero
timeout /t 2 /nobreak >nul

:: Iniciar Proyecto 1 - Frontend Vite (Puerto 5173)
start "UDH [1] Dashboard-Admin :5173" cmd /k "color 0E && echo [PROYECTO 1] Dashboard Administrativo de Contratos && echo Puerto: 5173 && echo. && npx vite --host 0.0.0.0"

:: Iniciar Proyecto 2 - Portal Coordinadores (Puerto 3002)
start "UDH [2] Coordinadores :3002" cmd /k "color 0D && echo [PROYECTO 2] Portal de Coordinadores de Carrera && echo Puerto: 3002 && echo. && node sistema_docentes/src/server.js"

:: Iniciar Proyecto 3 - Portal Estudiantil (Puerto 3003)
start "UDH [3] Estudiantes :3003" cmd /k "color 09 && echo [PROYECTO 3] Portal Estudiantil Anonimo && echo Puerto: 3003 && echo. && node sistema_reportes/src/server.js"

:: Esperar que todos los servicios arranquen
timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo    TODOS LOS SERVICIOS OPERATIVOS
echo  ============================================================
echo.
echo  Acceso desde ESTE equipo:
echo  ----------------------------------------------------------
echo   Dashboard Contratos  -^> http://localhost:5173
echo   Portal Coordinadores -^> http://localhost:3002
echo   Portal Estudiantes   -^> http://localhost:3003
echo.
echo  Acceso desde OTRA computadora en la red:
echo  ----------------------------------------------------------
echo   Dashboard Contratos  -^> http://!IP_LOCAL!:5173
echo   Portal Coordinadores -^> http://!IP_LOCAL!:3002
echo   Portal Estudiantes   -^> http://!IP_LOCAL!:3003
echo.
echo  Para DETENER todos los servicios, cierre las ventanas
echo  de color o presione Ctrl+C en cada una.
echo.
echo  Presione cualquier tecla para abrir el Dashboard en el navegador...
pause >nul

start http://localhost:5173
