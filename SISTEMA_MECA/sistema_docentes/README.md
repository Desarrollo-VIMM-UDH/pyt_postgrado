# Sistema de Gestion de Docentes y Asignaciones UDH

## Descripcion

Aplicacion desktop nativa para Windows que gestiona docentes, asignaciones de asignaturas, ejecucion presupuestaria, validacion de consecutividad con auditoria criptografica SHA-256, y registro de excepciones gerenciales. La aplicacion utiliza una base de datos SQLite embebida que opera localmente sin necesidad de servidores, puertos de red, ni contenedores Docker.

## Requisitos

- Windows 10 o superior (x64)
- Aproximadamente 200 MB de espacio en disco
- No requiere instalacion previa de ningun software adicional

## Instalacion

### Metodo 1: Instalador Ejecutable (Recomendado)

1. Extraer el contenido del ZIP en una carpeta.
2. Ejecutar `Sistema_Docentes_UDH_Setup.exe`.
3. El instalador configurara automaticamente todos los componentes necesarios.
4. Al finalizar, se creara un acceso directo en el escritorio.
5. Hacer doble clic en el acceso directo para iniciar la aplicacion.

### Metodo 2: Version Portable

1. Extraer el contenido del ZIP en una carpeta.
2. Ejecutar el archivo `Iniciar.bat` incluido.
3. La aplicacion se ejecuta directamente sin modificaciones en el sistema.

## Caracteristicas Principales

1. **Validacion de Consecutividad**: El sistema valida automaticamente que un docente no pueda ser asignado en periodos consecutivos sin una excepcion gerencial aprobada. Si se intenta asignar un docente a un periodo consecutivo, la asignacion se bloquea y se registra automaticamente en el log de auditoria.

2. **Auditoria Inmutable**: Cada operacion critica genera un hash SHA-256 que se almacena en el log de auditoria, garantizando la integridad de los datos. Los hashes se visualizan en la seccion Auditoria.

3. **Control Presupuestario**: Seguimiento completo de la ejecucion presupuestaria con campos calculados automaticamente (salario mensual bruto, salario anual, diferencias, excedentes, pendientes).

4. **Excepciones Gerenciales**: Sistema de aprobacion de excepciones para casos de emergencia institucional, especialidades unicas, y vacantes criticas. Las excepciones desbloquean automaticamente la asignacion bloqueada por consecutividad.

5. **Reportes**: Vistas de reporte que replican exactamente los formatos administrativos utilizados en la gestion de recursos humanos y presupuesto.

## Estructura del Proyecto

```
sistema_docentes/
├── src/                  # Codigo fuente de Electron
│   ├── main.js           # Proceso principal y logica de base de datos
│   ├── preload.js        # Puente IPC seguro
│   ├── renderer.html     # Interfaz de usuario
│   └── renderer.js       # Logica del frontend
├── database/             # Esquema SQLite
│   └── schema.sqlite.sql
├── assets/               # Iconos y recursos graficos
├── installer/            # Script NSIS para instalador
│   └── nsis_script.nsh
├── package.json          # Dependencias de Node.js
├── Iniciar.bat           # Lanzador portable
└── README.md             # Este archivo
```

## Notas Tecnicas

- Base de datos: SQLite 3 (embebida, sin servidor, sin puertos)
- Framework desktop: Electron
- Comunicacion: IPC interno (sin red, sin API REST)
- Hash de integridad: SHA-256 via modulo nativo crypto de Node.js
- Base de datos ubicada en: `%APPDATA%\SistemaDocentesUDH\sistema_docentes.db`

## Autor

Suboficial Orlin Gomez Lopez
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras
Cuenta Universitaria N. 190803006

## En Apoyo

Rodolfo David Zuniga Rivera
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras
Cuenta Universitaria N. 220405023


Oscar Andres Coello Avila
Facultad de Ingenieria Mecatronica
Universidad de Defensa de Honduras
Cuenta Universitaria N. 190803006

## Licencia

Proyecto academico. Uso autorizado para fines educativos.
