# MANUAL DE INFRAESTRUCTURA Y DESPLIEGUE TECNICO (SISTEMAS UDH)
> **Destinatario**: Departamento de Tecnologia y Telecomunicaciones (IT)
> Universidad de Defensa de Honduras "Soberana del saber militar, primeros en centro america"

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

Este manual documenta la infraestructura, los requisitos de red, la arquitectura de puertos y los mecanismos de resiliencia del ecosistema de sistemas de contratos y reportes estudiantiles de la Universidad de Defensa de Honduras.

---

## 1. Arquitectura del Sistema e Integracion de Red

El ecosistema esta compuesto por tres (3) aplicaciones modulares e independientes basadas en Node.js, Express, React y SQLite3:

* **Proyecto 1**: Sistema de Gestion de Contratos y Dashboard Central (Backend Puerto 3001, Frontend Puerto 5173).
* **Proyecto 2**: Portal de Coordinadores y Docentes (Puerto 3002).
* **Proyecto 3**: Canal de Denuncias Estudiantiles Anonimas (Puerto 3003).

---

## 2. Mapa de Puertos y Direccionamiento de Red

| Servicio | Puerto por Defecto | Tipo de Acceso | Protocolo | Descripcion |
| :--- | :--- | :--- | :--- | :--- |
| **Proyecto 1 (Backend)** | 3001 | Intranet / Local | HTTP / TCP | API REST centralizadora de contratos y reportes. |
| **Proyecto 1 (Frontend)** | 5173 | Intranet / Local | HTTP / TCP | Dashboard de Contratos (Vite/React). |
| **Proyecto 2 (Docentes)** | 3002 | Intranet / Local | HTTP / TCP | Portal Web de Coordinadores de Carrera. |
| **Proyecto 3 (Reportes)** | 3003 | Extranet (Cualquier Red) | HTTP / TCP | Portal Estudiantil de Reportes Anonimos. |

**Requisito de Salida a Internet**:
El servidor central que aloja el Proyecto 1 (Backend - Puerto 3001) requiere salida HTTPS habilitada al puerto 443 de api.telegram.org sin interrupciones ni firewalls que bloqueen peticiones SSL. Esto permite al sistema recibir y procesar las alertas y el canal de contingencia de red.

---

## 3. Canal de Contingencia de Red (Failover)

El Proyecto 3 (Portal Estudiantil) esta disenado con un algoritmo de redundancia de comunicaciones:

1. **Ruta Principal**: El navegador del alumno realiza una solicitud POST a http://[IP_SERVIDOR_CENTRAL]:3001/api/reportes-estudiantes.
2. **Ruta de Contingencia**: Si la ruta principal falla porque el alumno accede desde fuera de la Intranet de la UDH, el sistema captura el fallo de red, serializa los datos en JSON y los envia mediante HTTPS a la API de Telegram usando la cabecera [STUDENT_REPORT_FALLBACK].
3. **Sincronizacion**: El backend del Proyecto 1 consulta mediante un proceso continuo (cada 5 segundos) a la API de Telegram. Al encontrar mensajes con esa cabecera, los procesa, verifica que no esten duplicados mediante el historial de update_id en processed_updates.json, e inserta la informacion en la base de datos local SQLite.

---

## 4. Estructura y Persistencia de Datos (SQLite)

El sistema utiliza bases de datos SQLite embebidas para facilitar el mantenimiento:

* **Base de datos central (Proyecto 1)**: Ubicada en Proyecto 1\server\database.db. Almacena las propuestas de contratos, perfiles de docentes, historial de estados y reportes de estudiantes.
* **Base de datos de docentes (Proyecto 2)**: Ubicada en Proyecto 2\database\sistema_docentes.db.

Politicas de Respaldo (Backups): Se recomienda realizar un respaldo diario de los archivos .db en un almacenamiento externo. Al ser SQLite, no requiere detener los servicios para copiar el archivo de forma segura.

---

## 5. Procedimiento de Despliegue con PM2 (Servicios Windows)

Para garantizar la disponibilidad del sistema frente a reinicios del servidor, se recomienda el uso de PM2:

1. **Instalacion Global de PM2**:
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```
2. **Registro de Servicios**:
   ```powershell
   pm2-startup install
   ```
3. **Inicio de Procesos** (ajuste las rutas segun donde coloque la carpeta):
   ```powershell
   cd "sistema UDH\Proyecto 1"
   pm2 start server/index.js --name "UDH-Backend"
   pm2 start npm --name "UDH-Frontend" -- run dev

   cd "..\Proyecto 2"
   pm2 start src/server.js --name "UDH-Docentes"

   cd "..\Proyecto 3"
   pm2 start src/server.js --name "UDH-Reportes"
   ```
4. **Persistencia del Estado**:
   ```powershell
   pm2 save
   ```

---

## 6. Monitoreo y Diagnostico

* **Ver logs en tiempo real**:
  ```powershell
  pm2 logs
  ```
* **Estado de los servicios**:
  ```powershell
  pm2 status
  ```
* **Limpieza de cola de Telegram** (si el bot no procesa mensajes nuevos):
  Detenga el servidor central y borre el contenido del archivo Proyecto 1\server\processed_updates.json, reemplazandolo con un array vacio [].

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
