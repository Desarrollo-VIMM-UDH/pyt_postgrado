@echo off
title UDH - Detector de IP de Red
color 0B
cls

echo.
echo  ============================================================
echo    UDH - Informacion de Red para Acceso Remoto
echo  ============================================================
echo.
echo  Direcciones IP de este equipo:
echo.

ipconfig | findstr /i "IPv4"

echo.
echo  ============================================================
echo  Use la IP mostrada arriba para acceder desde otra
echo  computadora en la misma red. Ejemplo:
echo.
echo    http://[IP]:5173  -^> Dashboard de Contratos
echo    http://[IP]:3002  -^> Portal de Coordinadores
echo    http://[IP]:3003  -^> Portal Estudiantil
echo  ============================================================
echo.
pause
