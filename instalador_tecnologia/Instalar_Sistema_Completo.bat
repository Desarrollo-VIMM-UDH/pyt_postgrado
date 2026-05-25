@echo off
setlocal
title UDH - Instalador Unificado
color 0A
cls

echo.
echo  ============================================================
echo    UNIVERSIDAD DE DEFENSA DE HONDURAS
echo    Instalador Unificado
echo  ============================================================
echo.
echo  Este lanzador ejecuta el instalador principal:
echo      node instalador.js
echo.
echo  Para modo Host/Servidor, ejecute como Administrador si desea
echo  configurar el Firewall automaticamente.
echo.

cd /d "%~dp0.."
node instalador.js

echo.
pause
