# Instalador Windows — Sistema Integral UDH

Este directorio contiene el proyecto del instalador `.exe` usando **Inno Setup 6**.
Tambien funciona con **Inno Setup 7**.

## Compilar

1. Instalar Inno Setup 6:
   <https://jrsoftware.org/isinfo.php>

2. Ejecutar:

```bat
instalador_windows\compilar_instalador.bat
```

El `.exe` se genera en:

```text
instalador_windows\dist\Instalador_UDH_Sistema_Integral.exe
```

## Flujo del instalador

- **Host / Servidor**
  - Copia el sistema a `C:\Program Files\UDH\SISTEMA_MECA`.
  - Verifica Node.js.
  - Si falta Node.js, descarga desde `https://nodejs.org/download/release/latest-v22.x/` el MSI oficial x64 y lo instala silenciosamente.
  - Ejecuta `node instalador.js --modo=host`.
  - El instalador Node ejecuta los `npm install` necesarios para incorporar las dependencias faltantes.

- **Cliente / Esclavo**
  - Pide IP o nombre del servidor.
  - Crea accesos directos `.url` en el Escritorio.
  - No instala Node.js ni dependencias.

