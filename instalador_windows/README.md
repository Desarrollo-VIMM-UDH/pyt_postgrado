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
  - Copia el sistema a `C:\ProgramData\UDH\SISTEMA_MECA`.
  - Usa una ruta escribible porque Vite, npm, SQLite y uploads necesitan crear archivos en ejecucion.
  - Verifica Node.js.
  - Si falta Node.js, descarga desde `https://nodejs.org/download/release/latest-v22.x/` el MSI oficial x64 y lo instala silenciosamente.
  - Ejecuta `node instalador.js --modo=host`.
  - El instalador Node ejecuta los `npm install` necesarios para incorporar las dependencias faltantes.
  - Crea el acceso de escritorio `Iniciar Sistema UDH`, que abre una ventana con el sistema corriendo y las URLs de acceso.

- **Cliente / Esclavo**
  - Pide IP o nombre del servidor.
  - Crea accesos directos `.url` en el Escritorio.
  - No instala Node.js ni dependencias.

## Desinstalacion

El desinstalador elimina accesos directos y residuos generados por instalacion de dependencias:

- `node_modules`
- accesos directos del Escritorio
- archivos auxiliares del instalador

Por seguridad, no elimina automaticamente bases de datos ni archivos cargados por usuarios.

> Importante: no instalar en `C:\Program Files`. Vite crea cache temporal dentro de `node_modules` y Windows puede bloquear escritura con errores `EPERM`.

