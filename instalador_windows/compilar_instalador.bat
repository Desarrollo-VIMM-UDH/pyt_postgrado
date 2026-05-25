@echo off
setlocal
title Compilar Instalador UDH

set "SCRIPT=%~dp0UDH_Sistema_Integral.iss"
set "ISCC_7_X64=%ProgramFiles%\Inno Setup 7\ISCC.exe"
set "ISCC_7_X86=%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe"
set "ISCC_X86=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
set "ISCC_X64=%ProgramFiles%\Inno Setup 6\ISCC.exe"

if exist "%ISCC_7_X64%" (
  set "ISCC=%ISCC_7_X64%"
) else if exist "%ISCC_7_X86%" (
  set "ISCC=%ISCC_7_X86%"
) else if exist "%ISCC_X86%" (
  set "ISCC=%ISCC_X86%"
) else if exist "%ISCC_X64%" (
  set "ISCC=%ISCC_X64%"
) else (
  echo.
  echo [ERROR] No se encontro Inno Setup 7 ni Inno Setup 6.
  echo Descarguelo desde: https://jrsoftware.org/isinfo.php
  echo.
  pause
  exit /b 1
)

echo.
echo Compilando instalador...
echo Script: %SCRIPT%
echo.

"%ISCC%" "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo [ERROR] Fallo la compilacion del instalador.
  pause
  exit /b 1
)

echo.
echo [OK] Instalador generado en:
echo %~dp0dist\Instalador_UDH_Sistema_Integral.exe
echo.
pause
