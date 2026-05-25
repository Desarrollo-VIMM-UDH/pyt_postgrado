# UDH - MANUAL ADMINISTRATIVO PRIVADO (ROOT ACCESS)
> **Nivel de Clasificacion**: Confidencial / Solo Administrador
> **Para uso exclusivo de**: Rodolfo Zuniga - Orlin Gomez - Oscar Coello

Este manual contiene las llaves de acceso, contrasenas, comandos de contingencia y procedimientos de control del ecosistema de sistemas de la UDH. Mantenlo a salvo y no lo compartas con el personal general.

---

## 1. Comandos de Control y Despliegue Rapido

Para iniciar, reiniciar o apagar los servidores sin abrir la interfaz grafica de PM2 o si se requiere hacerlo de forma manual:

### A. Encendido Rapido
Haga doble clic en el archivo maestro **Iniciar_Sistema_UDH.bat** en la carpeta raiz. Este levantara tres ventanas de comando independientes para monitorear los logs en tiempo real.

### B. Comandos PM2 (Para Servidor de Produccion de Fondo)
Si el departamento de tecnologia instalo PM2 de fondo, ejecute los siguientes comandos en PowerShell de Administrador:

* **Ver estado de los servicios**:
  ```powershell
  pm2 status
  ```
* **Ver logs en tiempo real**:
  ```powershell
  pm2 logs
  ```
* **Reiniciar todo el ecosistema**:
  ```powershell
  pm2 restart all
  ```
* **Apagar todos los servicios**:
  ```powershell
  pm2 stop all
  ```

---

## 2. Gestion de Contrasenas y Roles Institucionales

Las contrasenas de acceso administrativo para los coordinadores, Mesa Tecnica, DREV y RR.HH. se encuentran en el codigo fuente.

### A. Ubicacion del archivo de contrasenas:
* **Ruta**: Sistema UDH\Proyecto 1\src\App.jsx
* **Constante a buscar**: ROLES_DB al inicio del archivo.
* **Estructura para modificar**:
  ```javascript
  const ROLES_DB = {
    'MESA TECNICA': '123',
    'RECURSOS HUMANOS': '123',
    'DREV': '123',
    'Coordinador IMM': '123',
    'Coordinador LEM': '123',
    'Coordinador TUMM': '123',
    'Coordinador TUTM': '123',
    'Coordinador CC.MM': '123',
    'Coordinador CC.AA': '123',
    'Coordinador CC.NV': '123'
  };
  ```
  Para cambiar la contrasena de cualquier rol, reemplace el texto '123' por la contrasena deseada y guarde el archivo.

### B. Contrasena de Estudiantes (Proyecto 3)
* **Ruta**: Sistema UDH\Proyecto 3\src\index.html
* **Validacion**: Busque el manejador del formulario studentLoginForm. Por defecto, se permite el acceso a cualquier codigo estudiantil de mas de 4 digitos con la contrasena maestra '123'.

---

## 3. Configuracion y Cambio del Token del Bot de Telegram

Si en el futuro se debe migrar el bot a un nuevo canal o cambiar el token API:

### A. En el Servidor Central (Backend - Proyecto 1)
* **Ruta**: Sistema UDH\Proyecto 1\server\index.js
* **Linea a modificar**:
  ```javascript
  const TELEGRAM_TOKEN = '8963440470:AAFLKuclWRMLDJNrkfGuAPcG0d6RTc3jb_U';
  ```

### B. En el Portal Estudiantil (Proyecto 3)
* **Ruta**: Sistema UDH\Proyecto 3\src\index.html
* **Linea a modificar** (dentro del catch de contingencia):
  ```javascript
  const TELEGRAM_TOKEN = '8963440470:AAFLKuclWRMLDJNrkfGuAPcG0d6RTc3jb_U';
  ```

---

## 4. Limpieza de Base de Datos (Inicio de Nuevo Ciclo Academico)

Si necesita purgar todos los contratos propuestos, aprobados o rechazados y arrancar el ciclo academico desde cero de forma limpia:

1. Abra PowerShell en la carpeta Sistema UDH\Proyecto 1.
2. Ejecute el script de limpieza automatizado:
   ```powershell
   npm run clean
   ```
3. Este script purgara la base de datos de contratos y eliminara todos los archivos PDF de curriculos de la carpeta server/uploads.

---

**Desarrollado por:** RODOLFO DAVID ZUNIGA RIVERA
**Carrera:** INGENIERIA MILITAR EN MECATRONICA
**Cuenta:** 220405023

**En Apoyo:**

Suboficial Orlin Gomez Lopez
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras "Soberana del saber militar, primeros en centro america"
Cuenta Universitaria N. 190803006

Oscar Andres Coello Avila
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras "Soberana del saber militar, primeros en centro america"
Cuenta Universitaria N. 190803006

---
Universidad de Defensa de Honduras "Soberana del saber militar, primeros en centro america" - Facultad de Ingenieria Mecatronica

HONOR, LEALTAD Y SACRIFICIO
