-- =============================================================================
-- ESQUEMA SQLITE PARA SISTEMA DE DOCENTES
-- Adaptado desde PostgreSQL para uso embebido sin servidor
-- =============================================================================

-- 1. TABLAS CATALOGO

CREATE TABLE IF NOT EXISTS cat_grado_academico (
    id INTEGER PRIMARY KEY,
    valor TEXT UNIQUE NOT NULL
);
INSERT OR IGNORE INTO cat_grado_academico (id, valor) VALUES 
(1, 'Licenciatura'), (2, 'Maestria'), (3, 'Doctorado'), (4, 'Técnico');

CREATE TABLE IF NOT EXISTS cat_estado_docente (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL,
    permite_asignacion INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO cat_estado_docente (id, codigo, valor, permite_asignacion) VALUES 
(1, 'DISP', 'Disponible', 1), 
(2, 'NODISP', 'No Disponible', 0), 
(3, 'CONTR', 'En Contrato', 0), 
(4, 'PEND', 'Pendiente', 0);

CREATE TABLE IF NOT EXISTS cat_disposicion_asignacion (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL
);
INSERT OR IGNORE INTO cat_disposicion_asignacion (id, codigo, valor) VALUES 
(10, 'VAC', 'Vacante'), 
(11, 'ASIG', 'Asignado'), 
(12, 'BLOQ_CONS', 'Bloqueado por Consecutividad'), 
(13, 'BLOQ_EXC', 'Bloqueado con Excepcion Pendiente'), 
(14, 'CANC', 'Cancelado');

CREATE TABLE IF NOT EXISTS cat_estado_ejecucion (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL,
    impacto_nomina TEXT NOT NULL
);
INSERT OR IGNORE INTO cat_estado_ejecucion (id, codigo, valor, impacto_nomina) VALUES 
(20, 'TERM', 'Terminada', 'Liquidacion final'), 
(21, 'CURS', 'Cursando', 'Dispersion periodica'), 
(22, 'INIC', 'Por Iniciar', 'Solo anticipo si politica lo permite'), 
(23, 'SUSP', 'Suspendida', 'Bloquea pagos hasta resolucion'), 
(24, 'ANUL', 'Anulada', 'Revierte cualquier pago previo');

CREATE TABLE IF NOT EXISTS cat_resultado_validacion (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL,
    accion TEXT NOT NULL
);
INSERT OR IGNORE INTO cat_resultado_validacion (id, codigo, valor, accion) VALUES 
(30, 'APROB', 'Aprobado', 'Permite transicion a PEND o CONTR'), 
(31, 'BLQ_CONS', 'Bloqueado Consecutividad', 'Fuerza estado 2, rechaza asignacion'), 
(32, 'BLQ_EXC_APROB', 'Excepcion Aprobada', 'Permite asignacion con override'), 
(33, 'BLQ_EXC_DENEG', 'Excepcion Denegada', 'Mantiene bloqueo'), 
(34, 'ERROR_DATOS', 'Error de Datos', 'Rechaza por inconsistencia');

CREATE TABLE IF NOT EXISTS cat_tipo_emergencia (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL,
    ejemplo TEXT
);
INSERT OR IGNORE INTO cat_tipo_emergencia (id, codigo, valor, ejemplo) VALUES 
(1, 'VAC_CRIT', 'Vacante Critica', 'No hay otro docente disponible con la especialidad'), 
(2, 'ESP_UNICA', 'Especialidad Unica', 'Solo este docente domina el tema'), 
(3, 'CONT_ADMIN', 'Continuidad Administrativa', 'Proceso academico en curso'), 
(4, 'EMERG_INST', 'Emergencia Institucional', 'Situacion excepcional aprobada por Rectoria');

CREATE TABLE IF NOT EXISTS cat_estado_asignacion_presupuesto (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    valor TEXT UNIQUE NOT NULL,
    equivalencia_disposicion INTEGER NOT NULL
);
INSERT OR IGNORE INTO cat_estado_asignacion_presupuesto (id, codigo, valor, equivalencia_disposicion) VALUES 
(40, 'VAC', 'Vacante', 10), 
(41, 'CONT', 'Contratado', 11), 
(42, 'PEND_APROB', 'Pendiente de Aprobacion', 12), 
(43, 'CANC', 'Cancelado', 14);

CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id TEXT PRIMARY KEY,
    nombre_usuario TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('ADMIN','GERENTE','RRHH','NOMINA','COORDINADOR','AUDITOR')),
    activo INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO usuarios_sistema (id, nombre_usuario, rol) VALUES 
('admin-001', 'admin', 'ADMIN'),
('gerente-001', 'gerente', 'GERENTE');

-- =============================================================================
-- 2. TABLAS PRINCIPALES
-- =============================================================================

CREATE TABLE IF NOT EXISTS docentes_base (
    id_docente TEXT PRIMARY KEY,
    campus_centro TEXT NOT NULL,
    programa_academico TEXT NOT NULL,
    seccion_promocion TEXT,
    grado_catedratico_id INTEGER NOT NULL REFERENCES cat_grado_academico(id),
    nombre_completo TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL,
    cuenta_bancaria_encriptada TEXT,
    estado_id INTEGER NOT NULL DEFAULT 1 REFERENCES cat_estado_docente(id),
    ultimo_periodo_secuencia INTEGER,
    fecha_alta_sistema TEXT NOT NULL DEFAULT (datetime('now')),
    version_lock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS asignaturas_periodos (
    id_asignacion TEXT PRIMARY KEY,
    id_docente TEXT REFERENCES docentes_base(id_docente),
    nombre_asignatura TEXT NOT NULL,
    periodo_codigo TEXT NOT NULL,
    periodo_secuencia INTEGER NOT NULL,
    disposicion_id INTEGER NOT NULL DEFAULT 10 REFERENCES cat_disposicion_asignacion(id),
    fecha_revision TEXT,
    estado_clase_id INTEGER NOT NULL DEFAULT 22 REFERENCES cat_estado_ejecucion(id),
    observaciones_asignacion TEXT,
    observaciones_subsanacion TEXT
);

CREATE TABLE IF NOT EXISTS registro_excepciones_gerenciales (
    id_excepcion TEXT PRIMARY KEY,
    id_docente TEXT NOT NULL REFERENCES docentes_base(id_docente),
    id_asignacion TEXT NOT NULL REFERENCES asignaturas_periodos(id_asignacion),
    periodo_secuencia_objetivo INTEGER NOT NULL,
    usuario_gerencial_id TEXT NOT NULL REFERENCES usuarios_sistema(id),
    tipo_emergencia_id INTEGER NOT NULL REFERENCES cat_tipo_emergencia(id),
    justificacion_detallada TEXT NOT NULL,
    fecha_aprobacion TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_vencimiento TEXT,
    activa INTEGER NOT NULL DEFAULT 1,
    hash_registro TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ejecucion_presupuestaria (
    id_ejecucion TEXT PRIMARY KEY,
    id_asignacion TEXT NOT NULL REFERENCES asignaturas_periodos(id_asignacion),
    ga TEXT NOT NULL,
    ue TEXT NOT NULL,
    prog TEXT NOT NULL,
    sub_prog TEXT NOT NULL,
    a_o TEXT NOT NULL,
    fuente TEXT NOT NULL,
    no_linea TEXT NOT NULL,
    importe_mensual REAL NOT NULL CHECK (importe_mensual > 0),
    antiguedad_meses INTEGER NOT NULL DEFAULT 1 CHECK (antiguedad_meses >= 1),
    salario_mensual_bruto REAL,
    total_salario_anual REAL,
    estado_actual_asignacion_id INTEGER NOT NULL REFERENCES cat_estado_asignacion_presupuesto(id),
    contrato_emitido REAL,
    diferencia REAL,
    excedente_clase REAL,
    pendiente_ejecutar REAL,
    id_validacion_consecutividad INTEGER REFERENCES cat_resultado_validacion(id),
    excepcion_id TEXT REFERENCES registro_excepciones_gerenciales(id_excepcion)
);

CREATE TABLE IF NOT EXISTS log_validacion_consecutividad (
    id_log TEXT PRIMARY KEY,
    id_docente TEXT NOT NULL REFERENCES docentes_base(id_docente),
    id_asignacion TEXT NOT NULL REFERENCES asignaturas_periodos(id_asignacion),
    periodo_anterior_secuencia INTEGER NOT NULL,
    periodo_objetivo_secuencia INTEGER NOT NULL,
    resultado_validacion_id INTEGER NOT NULL REFERENCES cat_resultado_validacion(id),
    excepcion_aplicada INTEGER NOT NULL DEFAULT 0,
    justificacion_excepcion TEXT,
    usuario_autorizador TEXT,
    timestamp_validacion TEXT NOT NULL DEFAULT (datetime('now')),
    hash_integridad TEXT NOT NULL,
    ip_origen TEXT
);

-- =============================================================================
-- 3. INDICES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_docentes_estado_periodo ON docentes_base (estado_id, ultimo_periodo_secuencia);
CREATE INDEX IF NOT EXISTS idx_docentes_dni ON docentes_base (dni);
CREATE INDEX IF NOT EXISTS idx_asignaciones_docente_periodo ON asignaturas_periodos (id_docente, periodo_secuencia, disposicion_id);
CREATE INDEX IF NOT EXISTS idx_ejecucion_presupuesto ON ejecucion_presupuestaria (ga, ue, prog, sub_prog, a_o, fuente);
CREATE INDEX IF NOT EXISTS idx_log_auditoria ON log_validacion_consecutividad (id_docente, timestamp_validacion);
CREATE INDEX IF NOT EXISTS idx_excepciones_vigentes ON registro_excepciones_gerenciales (id_docente, periodo_secuencia_objetivo, activa);

-- =============================================================================
-- 4. TRIGGER: Validacion de consecutividad y auditoria (Removido por parser)
-- =============================================================================

-- =============================================================================
-- 5. VISTAS DE REPORTE
-- =============================================================================

CREATE VIEW IF NOT EXISTS vw_formato_base_docentes_completo AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY d.id_docente) AS "N°",
    d.campus_centro AS "Campus o Centro de Estudio",
    d.programa_academico AS "Programa Academico",
    d.seccion_promocion AS "Seccion/ Promocion",
    cg.valor AS "Grado Academico del Catedratico",
    d.nombre_completo AS "Nombre del Catedratico",
    d.dni AS "N° de DNI",
    d.cuenta_bancaria_encriptada AS "N° de Cta Bancaria",
    ap.nombre_asignatura AS "Nombre de la Asignatura",
    ep.contrato_emitido AS "Valor del contrato",
    ap.periodo_codigo AS "Periodo de la Asignatura",
    ap.fecha_revision AS "Fecha de Revision",
    ap.observaciones_asignacion AS "Observaciones",
    ap.observaciones_subsanacion AS "Observaciones Subsanaciones",
    ced.valor AS "Estado Actual del Docente",
    cda.valor AS "Disposicion de Asignacion"
FROM docentes_base d
LEFT JOIN asignaturas_periodos ap ON d.id_docente = ap.id_docente
LEFT JOIN ejecucion_presupuestaria ep ON ap.id_asignacion = ep.id_asignacion
LEFT JOIN cat_grado_academico cg ON d.grado_catedratico_id = cg.id
LEFT JOIN cat_estado_docente ced ON d.estado_id = ced.id
LEFT JOIN cat_disposicion_asignacion cda ON ap.disposicion_id = cda.id;

CREATE VIEW IF NOT EXISTS vw_control_ejecucion_presupuestaria_completo AS
SELECT 
    ep.ga AS "GA",
    ep.ue AS "UE",
    ep.prog AS "Prog",
    ep.sub_prog AS "Sub Prog",
    ep.a_o AS "A/O",
    ep.fuente AS "Fuente",
    ep.no_linea AS "No.",
    ap.nombre_asignatura AS "Descripcion del Puesto- Asignatura",
    ceap.valor AS "Estado Actual",
    ep.importe_mensual AS "Importe Mensual",
    ep.antiguedad_meses AS "Antiguedad en meses",
    ep.salario_mensual_bruto AS "Salario Mensual Bruto",
    ep.total_salario_anual AS "Total Salario anual",
    d.nombre_completo AS "Docente",
    cee.valor AS "Estado de la Clase",
    ep.contrato_emitido AS "Contrato Emitido",
    ep.diferencia AS "Diferencia",
    ep.excedente_clase AS "Excedente por clase",
    ep.pendiente_ejecutar AS "Pendiente de Ejecutar",
    crv.valor AS "Validacion Consecutividad",
    CASE WHEN ep.excepcion_id IS NOT NULL THEN 'SI' ELSE 'NO' END AS "Excepcion Aplicada"
FROM ejecucion_presupuestaria ep
JOIN asignaturas_periodos ap ON ep.id_asignacion = ap.id_asignacion
JOIN cat_estado_asignacion_presupuesto ceap ON ep.estado_actual_asignacion_id = ceap.id
LEFT JOIN docentes_base d ON ap.id_docente = d.id_docente
LEFT JOIN cat_estado_ejecucion cee ON ap.estado_clase_id = cee.id
LEFT JOIN cat_resultado_validacion crv ON ep.id_validacion_consecutividad = crv.id;
