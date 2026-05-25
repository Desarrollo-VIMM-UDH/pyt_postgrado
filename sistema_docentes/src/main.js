const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Base de datos SQLite embebida
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('better-sqlite3 no esta instalado. Ejecute: npm install');
  process.exit(1);
}

let db;
let mainWindow;

const DB_PATH = path.join(app.getPath('userData'), 'sistema_docentes.db');

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
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar cada sentencia individualmente
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      try {
        db.exec(stmt + ';');
      } catch (err) {
        // Ignorar errores de objetos ya existentes
        if (!err.message.includes('already exists')) {
          console.error('Error en schema:', err.message);
        }
      }
    }
    
    console.log('Base de datos inicializada en:', DB_PATH);
  } catch (err) {
    console.error('Error fatal al inicializar base de datos:', err);
    dialog.showErrorBox('Error', 'No se pudo inicializar la base de datos: ' + err.message);
    process.exit(1);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Sistema de Gestion de Docentes UDH',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
  
  // Abrir DevTools solo en desarrollo
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  inicializarBaseDatos();
  createWindow();
  
  // LEVANTAR EXPRESS WEB SERVER INTERNO
  const express = require('express');
  const expressApp = express();
  
  expressApp.use(express.json());
  expressApp.use(express.static(__dirname));
  
  // Servir el portal principal
  expressApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'renderer.html'));
  });

  // Endpoints de API SQLite
  expressApp.get('/api/docentes', (req, res) => {
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

  expressApp.post('/api/docente/crear', (req, res) => {
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

  expressApp.delete('/api/docente/eliminar/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM docentes_base WHERE id_docente = ?');
      const result = stmt.run(req.params.id);
      res.json({ changes: result.changes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.get('/api/asignaciones', (req, res) => {
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

  expressApp.post('/api/asignacion/crear', (req, res) => {
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
            WHERE id_docente = ? AND periodo_secuencia_objetivo = ? AND activa = 1 LIMIT 1
          `).get(datos.id_docente, objetivoSeq);
          
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

  expressApp.delete('/api/asignacion/eliminar/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM asignaturas_periodos WHERE id_asignacion = ?');
      const result = stmt.run(req.params.id);
      res.json({ changes: result.changes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.get('/api/ejecucion', (req, res) => {
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

  expressApp.post('/api/ejecucion/crear', (req, res) => {
    try {
      const datos = req.body;
      const id = generarUUID();
      const salario_mensual = datos.importe_mensual * datos.antiguedad_meses;
      const total_anual = salario_mensual * 12;
      const diferencia = total_anual - (datos.contrato_emitido || 0);
      
      const stmt = db.prepare(`
        INSERT INTO ejecucion_presupuestaria (id_ejecucion, id_asignacion, ga, ue, prog, sub_prog, a_o, fuente, 
          no_linea, importe_mensual, antiguedad_meses, salario_mensual_bruto, total_salario_anual, 
          estado_actual_asignacion_id, contrato_emitido, diferencia, excedente_clase, pendiente_ejecutar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, datos.id_asignacion, datos.ga, datos.ue, datos.prog, datos.sub_prog, datos.a_o,
        datos.fuente, datos.no_linea, datos.importe_mensual, datos.antiguedad_meses, salario_mensual,
        total_anual, datos.estado_actual_asignacion_id || 40, datos.contrato_emitido || 0, diferencia, diferencia, diferencia);
      res.json({ id_ejecucion: id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.get('/api/excepciones', (req, res) => {
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
      res.json(stmt.all());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.post('/api/excepcion/crear', (req, res) => {
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

  expressApp.get('/api/auditoria', (req, res) => {
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

  expressApp.get('/api/reporte/docentes', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM vw_formato_base_docentes_completo');
      res.json(stmt.all());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.get('/api/reporte/presupuesto', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM vw_control_ejecucion_presupuestaria_completo');
      res.json(stmt.all());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Levantar Express en puerto 3002
  const PORT = 3002;
  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log('\n  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36mhttp://localhost:3002/\x1b[0m');
    console.log('  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m \x1b[36mhttp://localhost:3002/\x1b[0m\n');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

// =============================================================================
// IPC HANDLERS - API INTERNA (sin puertos, sin red)
// =============================================================================

// CATALOGO
ipcMain.handle('db:catalogo', (event, tabla) => {
  const stmt = db.prepare(`SELECT * FROM ${tabla} ORDER BY id`);
  return stmt.all();
});

// DOCENTES
ipcMain.handle('db:docentes', () => {
  const stmt = db.prepare(`
    SELECT d.*, cg.valor as grado_academico, ced.valor as estado_docente
    FROM docentes_base d
    LEFT JOIN cat_grado_academico cg ON d.grado_catedratico_id = cg.id
    LEFT JOIN cat_estado_docente ced ON d.estado_id = ced.id
    ORDER BY d.fecha_alta_sistema DESC
  `);
  return stmt.all();
});

ipcMain.handle('db:docente:crear', (event, datos) => {
  const id = generarUUID();
  const stmt = db.prepare(`
    INSERT INTO docentes_base (id_docente, campus_centro, programa_academico, seccion_promocion, 
      grado_catedratico_id, nombre_completo, dni, cuenta_bancaria_encriptada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(id, datos.campus_centro, datos.programa_academico, datos.seccion_promocion,
    datos.grado_catedratico_id, datos.nombre_completo, datos.dni, datos.cuenta_bancaria_encriptada);
  return { id_docente: id, changes: result.changes };
});

ipcMain.handle('db:docente:eliminar', (event, id) => {
  const stmt = db.prepare('DELETE FROM docentes_base WHERE id_docente = ?');
  const result = stmt.run(id);
  return { changes: result.changes };
});

// ASIGNACIONES
ipcMain.handle('db:asignaciones', () => {
  const stmt = db.prepare(`
    SELECT ap.*, d.nombre_completo as docente, d.dni,
           cda.valor as disposicion, cee.valor as estado_ejecucion
    FROM asignaturas_periodos ap
    LEFT JOIN docentes_base d ON ap.id_docente = d.id_docente
    LEFT JOIN cat_disposicion_asignacion cda ON ap.disposicion_id = cda.id
    LEFT JOIN cat_estado_ejecucion cee ON ap.estado_clase_id = cee.id
    ORDER BY ap.periodo_secuencia DESC, ap.fecha_revision DESC
  `);
  return stmt.all();
});

ipcMain.handle('db:asignacion:crear', (event, datos) => {
  // Validacion de consecutividad
  const docente = db.prepare('SELECT ultimo_periodo_secuencia, estado_id FROM docentes_base WHERE id_docente = ?').get(datos.id_docente);
  let disposicion_id = 11; // ASIG
  let validacion_id = 30; // APROB
  let excepcion_id = null;
  let observacion = '';
  
  if (docente && docente.ultimo_periodo_secuencia !== null) {
    const ultimoSeq = docente.ultimo_periodo_secuencia;
    const objetivoSeq = parseInt(datos.periodo_secuencia);
    
    if (objetivoSeq === ultimoSeq + 1) {
      // Verificar si hay excepcion vigente
      const excepcion = db.prepare(`
        SELECT id_excepcion FROM registro_excepciones_gerenciales 
        WHERE id_docente = ? AND periodo_secuencia_objetivo = ? AND activa = 1 LIMIT 1
      `).get(datos.id_docente, objetivoSeq);
      
      if (excepcion) {
        disposicion_id = 11; // ASIG con excepcion
        validacion_id = 32; // Excepcion aprobada
        excepcion_id = excepcion.id_excepcion;
        observacion = 'Excepcion gerencial aplicada';
      } else {
        disposicion_id = 12; // BLOQ_CONS
        validacion_id = 31; // Bloqueado consecutividad
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
  
  // Log de auditoria
  const hash = generarSHA256({ id_asignacion: id, id_docente: datos.id_docente, periodo_secuencia: datos.periodo_secuencia, timestamp: new Date().toISOString() });
  db.prepare(`
    INSERT INTO log_validacion_consecutividad (id_log, id_docente, id_asignacion, periodo_anterior_secuencia, 
      periodo_objetivo_secuencia, resultado_validacion_id, excepcion_aplicada, justificacion_excepcion, 
      usuario_autorizador, hash_integridad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(generarUUID(), datos.id_docente, id, docente ? docente.ultimo_periodo_secuencia || 0 : 0,
    datos.periodo_secuencia, validacion_id, excepcion_id ? 1 : 0, observacion, 'SISTEMA', hash);
  
  // Actualizar docente
  if (disposicion_id === 11) {
    db.prepare('UPDATE docentes_base SET ultimo_periodo_secuencia = ?, estado_id = 3 WHERE id_docente = ?')
      .run(datos.periodo_secuencia, datos.id_docente);
  } else {
    db.prepare('UPDATE docentes_base SET estado_id = 2 WHERE id_docente = ?').run(datos.id_docente);
  }
  
  return { id_asignacion: id, disposicion_id, validacion_id, bloqueado: disposicion_id === 12 };
});

ipcMain.handle('db:asignacion:eliminar', (event, id) => {
  const stmt = db.prepare('DELETE FROM asignaturas_periodos WHERE id_asignacion = ?');
  const result = stmt.run(id);
  return { changes: result.changes };
});

// EJECUCION PRESUPUESTARIA
ipcMain.handle('db:ejecucion', () => {
  const stmt = db.prepare(`
    SELECT ep.*, ap.nombre_asignatura, ap.periodo_codigo,
           d.nombre_completo as docente, ceap.valor as estado_asignacion
    FROM ejecucion_presupuestaria ep
    JOIN asignaturas_periodos ap ON ep.id_asignacion = ap.id_asignacion
    LEFT JOIN docentes_base d ON ap.id_docente = d.id_docente
    JOIN cat_estado_asignacion_presupuesto ceap ON ep.estado_actual_asignacion_id = ceap.id
    ORDER BY ep.ga, ep.ue, ep.prog
  `);
  return stmt.all();
});

ipcMain.handle('db:ejecucion:crear', (event, datos) => {
  const id = generarUUID();
  const salario_mensual = datos.importe_mensual * datos.antiguedad_meses;
  const total_anual = salario_mensual * 12;
  const diferencia = total_anual - (datos.contrato_emitido || 0);
  
  const stmt = db.prepare(`
    INSERT INTO ejecucion_presupuestaria (id_ejecucion, id_asignacion, ga, ue, prog, sub_prog, a_o, fuente, 
      no_linea, importe_mensual, antiguedad_meses, salario_mensual_bruto, total_salario_anual, 
      estado_actual_asignacion_id, contrato_emitido, diferencia, excedente_clase, pendiente_ejecutar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, datos.id_asignacion, datos.ga, datos.ue, datos.prog, datos.sub_prog, datos.a_o,
    datos.fuente, datos.no_linea, datos.importe_mensual, datos.antiguedad_meses, salario_mensual,
    total_anual, datos.estado_actual_asignacion_id || 40, datos.contrato_emitido || 0, diferencia, diferencia, diferencia);
  return { id_ejecucion: id };
});

// EXCEPCIONES
ipcMain.handle('db:excepciones', () => {
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
  return stmt.all();
});

ipcMain.handle('db:excepcion:crear', (event, datos) => {
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
  return { id_excepcion: id };
});

// AUDITORIA
ipcMain.handle('db:auditoria', () => {
  const stmt = db.prepare(`
    SELECT l.*, d.nombre_completo as docente, crv.valor as resultado_validacion
    FROM log_validacion_consecutividad l
    LEFT JOIN docentes_base d ON l.id_docente = d.id_docente
    LEFT JOIN cat_resultado_validacion crv ON l.resultado_validacion_id = crv.id
    ORDER BY l.timestamp_validacion DESC
    LIMIT 1000
  `);
  return stmt.all();
});

// REPORTES
ipcMain.handle('db:reporte:docentes', () => {
  const stmt = db.prepare('SELECT * FROM vw_formato_base_docentes_completo');
  return stmt.all();
});

ipcMain.handle('db:reporte:presupuesto', () => {
  const stmt = db.prepare('SELECT * FROM vw_control_ejecucion_presupuestaria_completo');
  return stmt.all();
});

// ESTADISTICAS
ipcMain.handle('db:stats', () => {
  const docentes = db.prepare('SELECT COUNT(*) as c FROM docentes_base').get();
  const asignaciones = db.prepare('SELECT COUNT(*) as c FROM asignaturas_periodos').get();
  const ejecucion = db.prepare('SELECT COUNT(*) as c FROM ejecucion_presupuestaria').get();
  const excepciones = db.prepare('SELECT COUNT(*) as c FROM registro_excepciones_gerenciales').get();
  const auditoria = db.prepare('SELECT COUNT(*) as c FROM log_validacion_consecutividad').get();
  return {
    docentes: docentes.c,
    asignaciones: asignaciones.c,
    ejecucion: ejecucion.c,
    excepciones: excepciones.c,
    auditoria: auditoria.c
  };
});

// VALIDACION DE PAGO
ipcMain.handle('db:validar-pago', (event, docente_id, periodo_objetivo_seq) => {
  const log = db.prepare(`
    SELECT resultado_validacion_id, excepcion_aplicada 
    FROM log_validacion_consecutividad 
    WHERE id_docente = ? AND periodo_objetivo_secuencia = ?
    ORDER BY timestamp_validacion DESC LIMIT 1
  `).get(docente_id, periodo_objetivo_seq);
  
  const asignacion = db.prepare(`
    SELECT estado_clase_id FROM asignaturas_periodos 
    WHERE id_docente = ? AND periodo_secuencia = ? LIMIT 1
  `).get(docente_id, periodo_objetivo_seq);
  
  if (log && log.resultado_validacion_id === 31 && log.excepcion_aplicada === 0) {
    return { aprobado: 0, motivo: 'Bloqueado por regla de consecutividad sin excepcion aprobada.' };
  }
  if (asignacion && [22, 23, 24].includes(asignacion.estado_clase_id)) {
    return { aprobado: 0, motivo: 'Estado de ejecucion no permite dispersion.' };
  }
  return { aprobado: 1, motivo: 'Pago autorizado.' };
});
