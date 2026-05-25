# UDH - MANUAL DE INFRAESTRUCTURA Y DESPLIEGUE TÉCNICO (SISTEMAS UDH)
> **Destinatario**: Departamento de Tecnología y Telecomunicaciones (IT) - UDH  
> **Autor/Arquitecto**: RODOLFO DAVID ZUNIGA RIVERA
**Carrera:** INGENIERIA MILITAR EN MECATRONICA
**Cuenta:** 220405023

**En Apoyo:**

Suboficial Orlin Gomez Lopez
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras
Cuenta Universitaria N. 190803006

Oscar Andres Coello Avila
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras
Cuenta Universitaria N. 190803006


Este manual documenta de forma exhaustiva la infraestructura, los requisitos de red, la arquitectura de puertos y los mecanismos de resiliencia del ecosistema de sistemas de contratos y reportes estudiantiles de la Universidad de las Fuerzas Armadas UDH.

---

## 1. Arquitectura del Sistema e Integración de Red

El ecosistema está compuesto por tres (3) aplicaciones modulares e independientes basadas en **Node.js, Express, React y SQLite3**:

* **Proyecto 1**: Sistema de Gestión de Contratos y Dashboard Central (Backend Puerto 3001, Frontend Puerto 5173).
* **Proyecto 2**: Portal de Coordinadores y Docentes (Puerto 3002).
* **Proyecto 3**: Canal de Denuncias Estudiantiles Anónimas (Puerto 3003).

---

## 2. Mapa de Puertos y Direccionamiento de Red

| Servicio | Puerto por Defecto | Tipo de Acceso | Protocolo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Proyecto 1 (Backend)** | `3001` | Intranet / Local | HTTP / TCP | API REST centralizadora de contratos y reportes. |
| **Proyecto 1 (Frontend)** | `5173` | Intranet / Local | HTTP / TCP | Dashboard de Contratos (Vite/React). |
| **Proyecto 2 (Docentes)** | `3002` | Intranet / Local | HTTP / TCP | Portal Web de Coordinadores de Carrera. |
| **Proyecto 3 (Reportes)** | `3003` | Extranet (Cualquier Red) | HTTP / TCP | Portal Estudiantil de Reportes Anónimos. |

### ️ Requisito Crítico de Salida a Internet
El servidor central que aloja el **Proyecto 1 (Backend - Puerto 3001)** requiere **salida HTTPS habilitada al puerto 443 de `api.telegram.org`** sin interrupciones ni firewalls que bloqueen peticiones SSL entrantes/salientes. Esto permite al bot recibir y procesar las alertas instantáneas y el canal por contingencia de red.

---

## 3. Especificaciones del Canal por contingencia de red (Failover)

El **Proyecto 3 (Portal Estudiantil)** está diseñado con un algoritmo de redundancia por contingencia de red:
1. **Ruta Principal**: El cliente (navegador del alumno) realiza una solicitud POST a `http://<IP_SERVIDOR_CENTRAL>:3001/api/reportes-estudiantes`.
2. **Ruta de Contingencia**: Si la ruta principal falla (debido a que el alumno accede desde fuera de la Intranet de la UDH), el sistema captura el fallo de red, serializa los datos en JSON y los envía mediante HTTPS a `https://api.telegram.org/bot<TOKEN>/sendMessage` usando una cabecera especial `[STUDENT_REPORT_FALLBACK]`.
3. **Sincronización**: El backend del Proyecto 1 consulta mediante un hilo de ejecución continuo (polling de 5s) a la API de Telegram. Al encontrar mensajes con la cabecera, los procesa de forma asíncrona, verifica que no estén duplicados (mediante historial de `update_id` en `processed_updates.json`) e inserta de forma transparente la información en la base de datos local SQLite.

---

## 4. Estructura y Persistencia de Datos (SQLite)

El sistema utiliza bases de datos SQLite empotradas para facilitar el mantenimiento y evitar la sobrecarga de un motor DBMS pesado:
* **Base de datos central (Proyecto 1)**: Ubicada en `c:\Users\dolfo\PYT_POSTGRADO\server\database.db`. Almacena las propuestas de contratos, perfiles de docentes, historial de estados y reportes de estudiantes.
* **Base de datos de docentes (Proyecto 2)**: Ubicada en `C:\Users\dolfo\sistema_docentes\database\sistema_docentes.db`.

> [!IMPORTANT]
> **Políticas de Respaldo Recomendadas (Backups)**  
> Se recomienda realizar un respaldo diario en caliente (Hot Backup) de los archivos `.db` en un almacenamiento externo. Al ser SQLite, no requiere detener los servicios para copiar el archivo de base de datos de forma segura.

---

## 5. Procedimiento de Despliegue con PM2 (Servicios Windows)

Para garantizar la disponibilidad del sistema frente a reinicios inesperados del servidor, el despliegue está configurado mediante **PM2** y la integración nativa de Windows:

1. **Instalación Global de PM2**:
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```
2. **Registro de Servicios**:
   ```powershell
   pm2-startup install
   ```
3. **Inicio de Procesos**:
   ```powershell
   cd c:\Users\dolfo\PYT_POSTGRADO
   pm2 start server/index.js --name "UDH-Backend"
   pm2 start npm --name "UDH-Frontend" -- run dev
   
   cd C:\Users\dolfo\sistema_docentes
   pm2 start src/server.js --name "UDH-Docentes"
   
   cd C:\Users\dolfo\sistema_reportes
   pm2 start src/server.js --name "UDH-Reportes"
   ```
4. **Persistencia del Estado**:
   ```powershell
   pm2 save
   ```

---

## 6. Monitoreo y Diagnóstico (Troubleshooting)

* **Visualización de Logs de Producción**:
  ```powershell
  pm2 logs
  ```
* **Estado de los Servicios**:
  ```powershell
  pm2 status
  ```
* **Limpieza de Caché de Telegram**:
  Si por algún motivo el bot no procesa nuevos mensajes, detenga el servidor central y limpie el archivo `c:\Users\dolfo\PYT_POSTGRADO\server\processed_updates.json` (solo borre su contenido e ingrese un array vacío `[]`).

---
> **Universidad de las Fuerzas Armadas UDH**  
> *Sistemas diseñados bajo estándares militares de alta disponibilidad y tolerancia a fallos.*
