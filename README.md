# Sistema de Gestión de Contratos - UDH

Este proyecto es el sistema de validación de horas y control de contratos para los catedráticos de la Universidad de Defensa de Honduras. Fue desarrollado usando React, Node.js y SQLite.

## Montaje en el Servidor (Para el equipo de Tecnología)

Muchachos, les preparé un script que hace todo el trabajo sucio para no quitarles tiempo. No hace falta que configuren bases de datos, ni levanten un IIS, ni instalen Node a mano. 

**Pasos para el despliegue:**
1. Pasen esta carpeta al servidor asignado (ej. `C:\Aplicaciones\UDH_Contratos`). Asegúrense de borrar la carpeta `node_modules` si se vino copiada.
2. Hagan clic derecho en el archivo `instalar_windows.bat` y denle a **"Ejecutar como Administrador"**.
3. El script va a chequear si falta algo (incluso instala Node.js por su cuenta si el servidor está limpio), descarga las librerías necesarias, y deja los procesos del sistema corriendo en segundo plano como un servicio (usando PM2) para que nunca se apaguen.

### Estructura del Proyecto (Qué es cada cosa)
Por si necesitan revisar la arquitectura de las carpetas, así está dividido el sistema:
- `/src/`: Aquí vive todo el código de la interfaz gráfica (Frontend en React). Es lo que ven los usuarios en la web.
- `/server/`: Aquí está el cerebro del sistema (Backend en Node.js). 
  - `server/database.db`: Es la base de datos SQLite donde se guardan todos los datos de catedráticos y contratos.
  - `server/uploads/`: Aquí es donde caen físicamente los PDFs de los currículums que suben los coordinadores.
- `instalar_windows.bat`: El script automático de instalación que preparé para ustedes.

### Red y Dominio
**El código ya viene listo para cualquier red, no tienen que reconfigurar archivos del sistema.**

Por defecto, la aplicación arranca en el **puerto 5173**. Lo ideal es que desde el router o IIS (si usan Windows Server) simplemente hagan un proxy inverso para que el dominio `contratos.udh.edu` apunte a este puerto interno (solo asegúrense de abrir el 5173 en el firewall).

**¿Quieren que corra directo en el puerto 80?**
Si no quieren configurar proxies y prefieren que el sistema use el puerto 80 nativo, pueden cambiarlo así antes de instalar:
1. Abran el archivo `package.json`.
2. Busquen donde dice `"dev": "vite --host"` y cámbienlo por `"dev": "vite --host --port 80"`.
3. Guarden y corran el `instalar_windows.bat` (recuerden que para el puerto 80 Windows exige que lo corran como Administrador).

### Manejo de Datos y Backups
El sistema no usa SQL Server ni motores externos para evitarles dolores de cabeza de mantenimiento y mantenerlo aislado en la Intranet.
Para salvaguardar todo el sistema, con que programen un **backup semanal de la carpeta `/server`**, estamos totalmente cubiertos ante cualquier desastre.

Cualquier duda técnica con la arquitectura, me avisan.

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
