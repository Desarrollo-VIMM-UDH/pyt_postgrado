# UDH - MANUAL DE USUARIO (DASHBOARD DE CONTRATOS - PROYECTO 1)
> **Rol Destinatario**: DREV (Root), Mesa Técnica y Recursos Humanos (RR.HH.)

Este manual detalla el funcionamiento de la interfaz de control central de contratos, aprobaciones e historial de reportes.

---

## 1. Acceso e Inicio de Sesión
1. Abra su navegador web e ingrese a la dirección del sistema:
   * **Local**: `http://localhost:5173`
   * **En Red**: `http://<IP_SERVIDOR_UDH>:5173`
2. Seleccione su Rol Institucional en el menú desplegable:
   * **DREV**: Acceso absoluto a reportes de coordinadores y estado de contratos.
   * **Mesa Técnica**: Autoridad para aprobar o rechazar propuestas académicas.
   * **Recursos Humanos**: Encargado de consolidar a los docentes aprobados en estado "Contratado".
3. Ingrese la contraseña asignada (por defecto `'123'`) y haga clic en **Ingresar al Portal**.

---

## 2. Flujo de Control de Contratos (Mesa Técnica y RR.HH.)
El sistema implementa un ciclo de vida para garantizar la transparencia y el control de las horas de clase de los catedráticos:

### Paso 1: Revisión de Propuestas (Mesa Técnica)
* Al ingresar como **Mesa Técnica**, verá todas las propuestas enviadas por los coordinadores de carrera en estado **PROPUESTO**.
* Haga clic en **Ver CV** para descargar y auditar el currículum del docente.
* Puede tomar dos acciones sobre cada asignatura:
  * **Aprobar**: Pasa el contrato a estado **APROBADO**.
  * **Rechazar**: Requiere ingresar una observación obligatoria del porqué de la denegación (ej. *Horas duplicadas, perfil no apto*).

### Paso 2: Contratación (Recursos Humanos)
* Al ingresar como **Recursos Humanos**, visualizará únicamente los contratos que ya han sido **APROBADOS** por la Mesa Técnica.
* Una vez revisada la documentación física, haga clic en el botón verde **Contratar** para consolidar el contrato en estado final **CONTRATADO**.
* Se puede acceder a la pestaña **Historial/Rechazados** para ver los registros que no pasaron los filtros.

---

## 3. Visualización de Reportes Estudiantiles Anónimos (Solo DREV)
Como usuario Root especial (**DREV**):
1. Verá una pestaña exclusiva denominada **Reportes Estudiantiles**.
2. En esta pestaña se listan todas las denuncias anónimas enviadas por los alumnos.
3. El sistema resalta los reportes sensibles y permite auditar las quejas presentadas contra cátedras, insumos, infraestructura o coordinadores de carrera de manera confidencial.

---
> **Universidad de las Fuerzas Armadas UDH**  
> *Excelencia y Rigor Académico Militar.*
