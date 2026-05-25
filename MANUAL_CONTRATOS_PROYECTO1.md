# UDH - MANUAL DE USUARIO (DASHBOARD DE CONTRATOS - PROYECTO 1)
> **Rol Destinatario**: DREV (Root), Mesa Tecnica y Recursos Humanos (RR.HH.)

Este manual detalla el funcionamiento de la interfaz de control central de contratos, aprobaciones e historial de reportes.

---

## 1. Acceso e Inicio de Sesion
1. Abra su navegador web e ingrese a la direccion del sistema:
   * **Local**: http://localhost:5173
   * **En Red**: http://[IP_SERVIDOR_UDH]:5173
2. Seleccione su Rol Institucional en el menu desplegable:
   * **DREV**: Acceso absoluto a reportes de coordinadores y estado de contratos.
   * **Mesa Tecnica**: Autoridad para aprobar o rechazar propuestas academicas.
   * **Recursos Humanos**: Encargado de consolidar a los docentes aprobados en estado Contratado.
3. Ingrese la contrasena asignada (por defecto '123') y haga clic en **Ingresar al Portal**.

---

## 2. Flujo de Control de Contratos (Mesa Tecnica y RR.HH.)
El sistema implementa un ciclo de vida para garantizar la transparencia y el control de las horas de clase de los catedraticos:

### Paso 1: Revision de Propuestas (Mesa Tecnica)
* Al ingresar como **Mesa Tecnica**, vera todas las propuestas enviadas por los coordinadores de carrera en estado **PROPUESTO**.
* Haga clic en **Ver CV** para descargar y auditar el curriculum del docente.
* Puede tomar dos acciones sobre cada asignatura:
  * **Aprobar**: Pasa el contrato a estado **APROBADO**.
  * **Rechazar**: Requiere ingresar una observacion obligatoria del porque de la denegacion (ej. Horas duplicadas, perfil no apto).

### Paso 2: Contratacion (Recursos Humanos)
* Al ingresar como **Recursos Humanos**, visualizara unicamente los contratos que ya han sido **APROBADOS** por la Mesa Tecnica.
* Una vez revisada la documentacion fisica, haga clic en el boton verde **Contratar** para consolidar el contrato en estado final **CONTRATADO**.
* Se puede acceder a la pestana **Historial/Rechazados** para ver los registros que no pasaron los filtros.

---

## 3. Visualizacion de Reportes Estudiantiles Anonimos (Solo DREV)
Como usuario Root especial (**DREV**):
1. Vera una pestana exclusiva denominada **Reportes Estudiantiles**.
2. En esta pestana se listan todas las denuncias anonimas enviadas por los alumnos.
3. El sistema resalta los reportes sensibles y permite auditar las quejas presentadas contra catedras, insumos, infraestructura o coordinadores de carrera de manera confidencial.

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
