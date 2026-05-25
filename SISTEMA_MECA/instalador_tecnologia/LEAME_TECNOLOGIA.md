# GUIA DE INSTALACION — SISTEMA INTEGRAL UDH
> Universidad de Defensa de Honduras "Soberana del saber militar, primeros en Centro America"
> Facultad de Ingenieria Mecatronica — Rodolfo David Zuniga Rivera (220405023)

---

## Requisitos

| Requisito | Detalle |
| :--- | :--- |
| Sistema Operativo | Windows 10 / Windows Server 2016 o superior (64 bits) |
| Node.js | Version LTS — descargar de https://nodejs.org |
| Conexion a Internet | Requerida solo en la PRIMERA instalacion |
| Espacio en disco | Minimo 600 MB disponibles |
| Red | Ambas computadoras deben estar en la misma red local (WiFi o cable) |

---

## ESCENARIO: USO EN 2 COMPUTADORAS

El sistema funciona en modo **servidor-cliente**:

```
[COMPUTADORA A — SERVIDOR]          [COMPUTADORA B — CLIENTE]
Ejecuta los 3 subsistemas           Solo necesita un navegador web
Puertos 3001, 3002, 3003, 5173      Accede via IP del Servidor
```

**Solo la Computadora A (servidor) necesita tener el sistema instalado.**
La Computadora B solo necesita abrir Google Chrome o Edge.

---

## PASO A PASO

### Computadora A — Instalacion del Servidor

1. Instale **Node.js** desde https://nodejs.org (boton verde LTS)
   - Acepte todas las opciones por defecto del instalador
   - Reinicie la computadora despues de instalar

2. Copie la carpeta completa del proyecto en esta computadora.
   Ejemplo: `C:\Aplicaciones\PYT_POSTGRADO`

3. Abra una **terminal** (Windows Terminal, PowerShell o CMD) en la carpeta del proyecto

4. Ejecute el instalador:
   ```
   node instalador.js
   ```
   > **NOTA:** Para que el firewall se configure automaticamente, ejecute la terminal
   > como Administrador (clic derecho → "Ejecutar como Administrador")

5. El instalador:
   - Descarga todas las dependencias de los 3 subsistemas
   - Crea las carpetas necesarias (uploads, database)
   - Abre los puertos en el Firewall de Windows automaticamente

6. Para conocer la IP del servidor:
   ```
   node ver_ip.js
   ```

### Computadora A — Inicio Diario

Abra una terminal en la carpeta del proyecto y ejecute:
```
node arrancar.js
```

Se iniciaran los 4 servicios simultaneamente y el sistema mostrara las URLs de acceso.

### Computadora B — Acceso desde la Red

- Abra Google Chrome o Microsoft Edge
- En la barra de direcciones escriba la IP del Servidor + el puerto:

| Sistema | URL de acceso |
| :--- | :--- |
| Dashboard de Contratos (Admin) | `http://[IP-SERVIDOR]:5173` |
| Portal de Coordinadores | `http://[IP-SERVIDOR]:3002` |
| Portal Estudiantil Anonimo | `http://[IP-SERVIDOR]:3003` |

**Ejemplo si la IP del servidor es `192.168.1.10`:**
```
http://192.168.1.10:5173   ← Dashboard principal
http://192.168.1.10:3002   ← Coordinadores
http://192.168.1.10:3003   ← Estudiantes
```

---

## Comandos Disponibles

| Comando | Proposito |
| :--- | :--- |
| `node instalador.js` | Primera instalacion (una vez, como Admin) |
| `node arrancar.js` | Arrancar el sistema cada dia |
| `node ver_ip.js` | Ver la IP para acceso en red |
| `node generar_paquete.js` | Crear paquete SISTEMA_MECA para otra PC |

### Equivalentes con npm (despues de instalar):

| Comando npm | Equivale a |
| :--- | :--- |
| `npm run setup` | `node instalador.js` |
| `npm run arrancar` | `node arrancar.js` |
| `npm run ver-ip` | `node ver_ip.js` |
| `npm run paquete` | `node generar_paquete.js` |
| `npm start` | Inicia los 4 servicios con concurrently |

---

## Puertos del Sistema

| Servicio | Puerto | Descripcion |
| :--- | :--- | :--- |
| API Contratos | 3001 | API REST interna |
| Dashboard Admin | 5173 | Gestion de contratos |
| Portal Coordinadores | 3002 | Coordinadores de carrera |
| Portal Estudiantil | 3003 | Reportes anonimos |

> El instalador habilita estos puertos en el Firewall automaticamente (cuando se ejecuta como Admin).
> Si la Computadora B no puede conectar, verifique que ambos equipos esten en la misma red.

---

## Ubicacion de Bases de Datos

- **Contratos (Proyecto 1):** `[ruta]\server\database.db`
- **Docentes (Proyecto 2):** `[ruta]\sistema_docentes\database\sistema_docentes.db`

> Se recomienda respaldar estos dos archivos diariamente.

---

## Generar Paquete para Otra Computadora

Si necesita instalar el sistema en una PC nueva:

```
node generar_paquete.js
```

Esto crea la carpeta `SISTEMA_MECA` con todo lo necesario (sin node_modules ni bases de datos).
Copie esa carpeta a la otra PC y siga las instrucciones del Paso a Paso.

---

## Solucion de Problemas

| Problema | Solucion |
| :--- | :--- |
| "No puedo conectar desde la otra PC" | Verifique que `node arrancar.js` este corriendo en el servidor |
| "La pagina no carga" | Confirme la IP con `node ver_ip.js` y que ambos equipos esten en la misma red |
| "Node.js no se instalo" | Descargue manualmente desde https://nodejs.org (version LTS) y reinicie |
| "Puerto ocupado" | Cierre otras instancias del sistema y vuelva a ejecutar |
| "Firewall no se configuro" | Ejecute la terminal como Administrador y corra `node instalador.js` de nuevo |

---

HONOR, LEALTAD Y SACRIFICIO
