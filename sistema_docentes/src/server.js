const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Base de datos SQLite
const DB_DIR = path.join(__dirname, '..', 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'sistema_docentes.db');
let db;

function generarUUID() {
  return crypto.randomUUID();
}

function generarSHA256(datos) {
  return crypto.createHash('sha256').update(JSON.stringify(datos)).digest('hex');
}

function inicializarBaseDatos() {
  try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sqlite.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema.split(';').filter(s => s.trim().length > 0);
      for (const stmt of statements) {
        try {
          db.exec(stmt + ';');
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.error('Error en schema:', err.message);
          }
        }
      }
    }
    console.log('Base de datos SQLite inicializada en:', DB_PATH);
  } catch (err) {
    console.error('Error fatal al inicializar base de datos:', err);
  }
}

inicializarBaseDatos();

// RUTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'renderer.html'));
});

// API: DOCENTES
app.get('/api/docentes', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT d.*, cg.valor as grado_academico, ced.valor as estado_docente
      FROM docentes_base d
      LEFT JOIN cat_grado_academico cg ON d.grado_catedratico_id = cg.id
      LEFT JOIN cat_estado_docente ced ON d.estado_id = ced.id
      ORDER BY d.fecha_alta_sistema DESC
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/docente/crear', (req, res) => {
  try {
    const datos = req.body;
    const id = generarUUID();
    const stmt = db.prepare(`
      INSERT INTO docentes_base (id_docente, campus_centro, programa_academico, seccion_promocion, 
        grado_catedratico_id, nombre_completo, dni, cuenta_bancaria_encriptada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id, datos.campus_centro, datos.programa_academico, datos.seccion_promocion,
      datos.grado_catedratico_id, datos.nombre_completo, datos.dni, datos.cuenta_bancaria_encriptada);
    res.json({ id_docente: id, changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/docente/eliminar/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM docentes_base WHERE id_docente = ?');
    const result = stmt.run(req.params.id);
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: ASIGNACIONES
app.get('/api/asignaciones', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT ap.*, d.nombre_completo as docente, d.dni,
             cda.valor as disposicion, cee.valor as estado_ejecucion
      FROM asignaturas_periodos ap
      LEFT JOIN docentes_base d ON ap.id_docente = d.id_docente
      LEFT JOIN cat_disposicion_asignacion cda ON ap.disposicion_id = cda.id
      LEFT JOIN cat_estado_ejecucion cee ON ap.estado_clase_id = cee.id
      ORDER BY ap.periodo_secuencia DESC, ap.fecha_revision DESC
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/asignacion/crear', (req, res) => {
  try {
    const datos = req.body;
    const docente = db.prepare('SELECT ultimo_periodo_secuencia, estado_id FROM docentes_base WHERE id_docente = ?').get(datos.id_docente);
    let disposicion_id = 11; // ASIG
    let validacion_id = 30; // APROB
    let excepcion_id = null;
    let observacion = '';
    
    if (docente && docente.ultimo_periodo_secuencia !== null) {
      const ultimoSeq = docente.ultimo_periodo_secuencia;
      const objetivoSeq = parseInt(datos.periodo_secuencia);
      
      if (objetivoSeq === ultimoSeq + 1) {
        const excepcion = db.prepare(`
          SELECT id_excepcion FROM registro_excepciones_gerenciales 
          WHERE id_docente = ? AND activa = 1 LIMIT 1
        `).get(datos.id_docente);
        
        if (excepcion) {
          disposicion_id = 11;
          validacion_id = 32;
          excepcion_id = excepcion.id_excepcion;
          observacion = 'Excepcion gerencial aplicada';
        } else {
          disposicion_id = 12;
          validacion_id = 31;
          observacion = 'Bloqueado por descanso obligatorio. Docente ya contratado en periodo consecutivo.';
        }
      }
    }
    
    const id = generarUUID();
    const stmt = db.prepare(`
      INSERT INTO asignaturas_periodos (id_asignacion, id_docente, nombre_asignatura, periodo_codigo, 
        periodo_secuencia, disposicion_id, fecha_revision, estado_clase_id, observaciones_asignacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, datos.id_docente, datos.nombre_asignatura, datos.periodo_codigo,
      datos.periodo_secuencia, disposicion_id, datos.fecha_revision || null, 22, datos.observaciones_asignacion || null);
    
    // Log
    const hash = generarSHA256({ id_asignacion: id, id_docente: datos.id_docente, periodo_secuencia: datos.periodo_secuencia, timestamp: new Date().toISOString() });
    db.prepare(`
      INSERT INTO log_validacion_consecutividad (id_log, id_docente, id_asignacion, periodo_anterior_secuencia, 
        periodo_objetivo_secuencia, resultado_validacion_id, excepcion_aplicada, justificacion_excepcion, 
        usuario_autorizador, hash_integridad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generarUUID(), datos.id_docente, id, docente ? docente.ultimo_periodo_secuencia || 0 : 0,
      datos.periodo_secuencia, validacion_id, excepcion_id ? 1 : 0, observacion, 'SISTEMA', hash);
    
    if (disposicion_id === 11) {
      db.prepare('UPDATE docentes_base SET ultimo_periodo_secuencia = ?, estado_id = 3 WHERE id_docente = ?')
        .run(datos.periodo_secuencia, datos.id_docente);
    } else {
      db.prepare('UPDATE docentes_base SET estado_id = 2 WHERE id_docente = ?').run(datos.id_docente);
    }
    
    res.json({ success: true, id_asignacion: id, disposicion_id, validacion_id, bloqueado: disposicion_id === 12 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/asignacion/eliminar/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM asignaturas_periodos WHERE id_asignacion = ?');
    const result = stmt.run(req.params.id);
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: EJECUCION
app.get('/api/ejecucion', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT ep.*, ap.nombre_asignatura, ap.periodo_codigo,
             d.nombre_completo as docente, ceap.valor as estado_asignacion
      FROM ejecucion_presupuestaria ep
      JOIN asignaturas_periodos ap ON ep.id_asignacion = ap.id_asignacion
      LEFT JOIN docentes_base d ON ap.id_docente = d.id_docente
      JOIN cat_estado_asignacion_presupuesto ceap ON ep.estado_actual_asignacion_id = ceap.id
      ORDER BY ep.ga, ep.ue, ep.prog
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ejecucion/crear', (req, res) => {
  try {
    const datos = req.body;
    const id = generarUUID();
    const salario_mensual = datos.importe_mensual;
    const total_anual = datos.importe_mensual * 12;
    const contrato_emitido = datos.importe_mensual * datos.antiguedad_meses;
    const diferencia = total_anual - contrato_emitido;
    
    const stmt = db.prepare(`
      INSERT INTO ejecucion_presupuestaria (id_ejecucion, id_asignacion, ga, ue, prog, sub_prog, a_o, fuente, 
        no_linea, importe_mensual, antiguedad_meses, salario_mensual_bruto, total_salario_anual, 
        estado_actual_asignacion_id, contrato_emitido, diferencia, excedente_clase, pendiente_ejecutar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, datos.id_asignacion, datos.ga, datos.ue, datos.prog, datos.sub_prog, datos.a_o,
      datos.fuente, datos.no_linea, datos.importe_mensual, datos.antiguedad_meses, salario_mensual,
      total_anual, datos.estado_actual_asignacion_id || 40, contrato_emitido, diferencia, diferencia, diferencia);
    res.json({ id_ejecucion: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: EXCEPCIONES
app.get('/api/excepciones', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT re.*, d.nombre_completo as docente, ap.nombre_asignatura,
             cte.valor as tipo_emergencia, us.nombre_usuario as usuario_gerencial
      FROM registro_excepciones_gerenciales re
      LEFT JOIN docentes_base d ON re.id_docente = d.id_docente
      LEFT JOIN asignaturas_periodos ap ON re.id_asignacion = ap.id_asignacion
      LEFT JOIN cat_tipo_emergencia cte ON re.tipo_emergencia_id = cte.id
      LEFT JOIN usuarios_sistema us ON re.usuario_gerencial_id = us.id
      ORDER BY re.fecha_aprobacion DESC
    `);
    
    const rows = stmt.all();
    const parsedRows = rows.map(r => {
      if (r.justificacion_detallada && r.justificacion_detallada.startsWith('TIPO: ')) {
        const parts = r.justificacion_detallada.split(' | ');
        r.tipo_emergencia = parts[0].replace('TIPO: ', '');
        r.justificacion_detallada = parts.slice(1).join(' | ');
      }
      return r;
    });
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/excepcion/crear', (req, res) => {
  try {
    const datos = req.body;
    const id = generarUUID();
    const hash = generarSHA256({ id, id_docente: datos.id_docente, justificacion: datos.justificacion_detallada, timestamp: new Date().toISOString() });
    
    const stmt = db.prepare(`
      INSERT INTO registro_excepciones_gerenciales (id_excepcion, id_docente, id_asignacion, 
        periodo_secuencia_objetivo, usuario_gerencial_id, tipo_emergencia_id, justificacion_detallada, 
        fecha_vencimiento, hash_registro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, datos.id_docente, datos.id_asignacion, datos.periodo_secuencia_objetivo,
      datos.usuario_gerencial_id || 'admin-001', datos.tipo_emergencia_id, datos.justificacion_detallada,
      datos.fecha_vencimiento || null, hash);
    res.json({ id_excepcion: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: AUDITORIA
app.get('/api/auditoria', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT l.*, d.nombre_completo as docente, crv.valor as resultado_validacion
      FROM log_validacion_consecutividad l
      LEFT JOIN docentes_base d ON l.id_docente = d.id_docente
      LEFT JOIN cat_resultado_validacion crv ON l.resultado_validacion_id = crv.id
      ORDER BY l.timestamp_validacion DESC
      LIMIT 1000
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: REPORTES
app.get('/api/reporte/docentes', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM vw_formato_base_docentes_completo');
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reporte/presupuesto', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM vw_control_ejecucion_presupuestaria_completo');
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const os = require('os');
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  let networkIP = '127.0.0.1';
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkIP = iface.address;
        break;
      }
    }
  }

  console.log(`========================================================`);
  console.log(`  Portal Direcciones (Proyecto 2 Web) Activo!`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://${networkIP}:${PORT}/`);
  console.log(`========================================================`);
});
