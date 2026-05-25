# UDH - MANUAL ADMINISTRATIVO PRIVADO (ROOT ACCESS)
> **Nivel de Clasificación**: Confidencial / Solo Administrador  
> **Para uso exclusivo de**: Rodolfo David Zúniga Rivera 

Hermano, este manual contiene las llaves de acceso, contraseñas, comandos de contingencia y procedimientos de control del ecosistema de sistemas de la UDH. Mantenlo a salvo y no lo compartas con el personal general.

---

## 1. Comandos de Control y Despliegue Rápido

Para iniciar, reiniciar o apagar los servidores sin abrir la interfaz gráfica de PM2 o si querés hacerlo de forma manual:

### A. Encendido Rápido
Simplemente hacé doble clic en el archivo maestro **`Iniciar_Todo_UDH.bat`** en la carpeta raíz. Este levantará tres ventanas de comando independientes para que monitorees los logs en tiempo real.

### B. Comandos PM2 (Para Servidor de Producción de Fondo)
Si el departamento de tecnología instaló PM2 de fondo, usá los siguientes comandos en PowerShell de Administrador:

* **Ver estado de los servicios**:
  ```powershell
  pm2 status
  ```
* **Ver logs en tiempo real (ideal para depurar Telegram)**:
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

## 2. Gestión de Contraseñas y Roles Institucionales

Las contraseñas de acceso administrativo para los coordinadores, Mesa Técnica, DREV y RR.HH. se encuentran hardcodeadas de forma segura y controlada en el código fuente.

### A. Ubicación del archivo de contraseñas:
* **Ruta**: `c:\Users\dolfo\PYT_POSTGRADO\src\App.jsx`
* **Líneas de la base de datos de roles**: Buscá la constante `ROLES_DB` al inicio del script.
* **Estructura para modificar**:
  ```javascript
  const ROLES_DB = {
    'MESA TÉCNICA': '123',
    'RECURSOS HUMANOS': '123',
    'DREV': '123', // Tu usuario Root especial
    'Coordinador IMM': '123',
    'Coordinador LEM': '123',
    'Coordinador TUMM': '123',
    'Coordinador TUTM': '123',
    'Coordinador CC.MM': '123',
    'Coordinador CC.AA': '123',
    'Coordinador CC.NV': '123'
  };
  ```
> [!TIP]
> Si deseás cambiar la contraseña de cualquier rol, simplemente modificá el texto `'123'` por la contraseña deseada y guardá el archivo. El HMR de Vite refrescará la seguridad de forma instantánea.

### B. Contraseña de Estudiantes (Proyecto 3)
* **Ruta**: `C:\Users\dolfo\sistema_reportes\src\index.html`
* **Validación**: Buscá el manejador del formulario de login (`studentLoginForm`). Por defecto, se permite el acceso a cualquier DNI estudiantil de más de 4 dígitos con la contraseña maestra `'123'`.

---

## 3. Configuración y Cambio del Token del Bot de Telegram

Si en el futuro se debe migrar el bot a un nuevo canal o cambiar el token API:

### A. En el Servidor Central (Backend - Proyecto 1)
* **Ruta**: `c:\Users\dolfo\PYT_POSTGRADO\server\index.js`
* **Línea a modificar**:
  ```javascript
  const TELEGRAM_TOKEN = '8963440470:AAFLKuclWRMLDJNrkfGuAPcG0d6RTc3jb_U';
  ```

### B. En el Cliente Estudiantil (Portal de Denuncias - Proyecto 3)
* **Ruta**: `C:\Users\dolfo\sistema_reportes\src\index.html`
* **Línea a modificar** (dentro del catch de contingencia):
  ```javascript
  const TELEGRAM_TOKEN = '8963440470:AAFLKuclWRMLDJNrkfGuAPcG0d6RTc3jb_U';
  ```

---

## 4. Limpieza de Base de Datos para un Inicio Limpio (Fresh Start)

Si necesitás purgar todos los contratos propuestos, aprobados o rechazados y arrancar el ciclo académico desde cero de forma limpia:

1. Abrí la consola en `c:\Users\dolfo\PYT_POSTGRADO`.
2. Ejecutá el script de limpieza automatizado:
   ```powershell
   npm run clean
   ```
3. Este script purgará la base de datos de contratos y eliminará físicamente todos los archivos PDF/Word de currículums (CVs) de la carpeta de subidas (`server/uploads`) para no dejar basura residual en el disco duro.

---
> **Universidad de las Fuerzas Armadas UDH**  
> *Disciplina, Lealtad y Excelencia Tecnológica Militar.*
