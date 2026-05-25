import React, { useState, useEffect } from 'react';

const PERFILES_PREGRADO = ['IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV'];

// =========================================================================
// CONFIGURACIÓN DE DURACIÓN DE CONTRATOS EN MESES (EDITAR AQUÍ SI CAMBIAN)
// =========================================================================
const DURACION_MESES_POSTGRADO = 3;
const DURACION_MESES_PREGRADO = 3;
// =========================================================================

const getCentrosDeEstudioPorRol = (role) => {
  switch (role) {
    case 'Dirección de Postgrado':
      return ['UDH', 'ECEMFFA', 'CDN'];
    case 'Coordinador Educación Continua':
    case 'Direccion de Continua':
      return ['UDH', 'ECMI', 'EFSOFA', 'EFSON'];
    case 'Coordinador Educación a Distancia':
    case 'Direccion de Distancia':
      return ['UDH'];
    default:
      return ['UDH'];
  }
};

const getProgramasPorRolYCentro = (role, center) => {
  if (role === 'Dirección de Postgrado') {
    if (center === 'UDH') {
      return [
        'Doctorado en geopolitica y geoestrategia',
        'Maestria en politica exterior y diplomacia',
        'Maestria en gestion de operaciones logisticas',
        'Maestria en sistemas de seguridad social'
      ];
    }
    if (center === 'ECEMFFA') {
      return [
        'Maestria en administracion de los recursos',
        'Especialidad en altos estudios militares'
      ];
    }
    if (center === 'CDN') {
      return [
        'Maestria en seguridad y defensa nacional',
        'Especialidad en defensa nacional'
      ];
    }
    return [];
  }

  if (role === 'Coordinador Educación Continua' || role === 'Direccion de Continua') {
    return ['Diplomado en Gestión de Proyectos', 'Diplomado en Ciberseguridad', 'Taller de Liderazgo', 'Curso de Planificación'];
  }

  if (role === 'Coordinador Educación a Distancia' || role === 'Direccion de Distancia') {
    if (center === 'UDH') {
      return ['Licenciatura en Educación', 'Técnico en Logística', 'Técnico en Informática'];
    }
  }

  return null;
};

const MAX_HORAS = 40;
const UMBRAL_AVISO = 30;

export const FormularioContrato = ({ store, userRole }) => {
  const centros = getCentrosDeEstudioPorRol(userRole);
  const [searchId, setSearchId] = useState('');
  const [docenteExistente, setDocenteExistente] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  


  const currentYear = new Date().getFullYear();
  const isContinua = userRole.includes('Continua');
  
  // Period dropdown showing 4 options per year (PAC I-IV or Semestre I-II)
  const periodos = isContinua
    ? [`I Semestre ${currentYear}`, `II Semestre ${currentYear}`, `I Semestre ${currentYear + 1}`, `II Semestre ${currentYear + 1}`]
    : [`I PAC ${currentYear}`, `II PAC ${currentYear}`, `III PAC ${currentYear}`, `IV PAC ${currentYear}`];

  const initialProgramas = getProgramasPorRolYCentro(userRole, centros[0]);

  const [formData, setFormData] = useState({
    nombre: '',
    titulo: 'Master',
    telefono: '',
    correo: '',
    academia: centros[0],
    programa: initialProgramas ? initialProgramas[0] : '',
    asignatura: '',
    horas: 0,
    periodo: periodos[0],
    observaciones: ''
  });

  const handleIdSearch = (id) => {
    setSearchId(id);
    const found = store.getDocenteById(id);
    if (found) {
      setDocenteExistente(found);
      setFormData(prev => ({
        ...prev,
        nombre: found.nombre,
        titulo: found.titulo,
        telefono: found.telefono,
        correo: found.correo
      }));

      // Check if they taught in a previous period
      const activeContracts = store.getContratosActivos(id);
      if (activeContracts.length > 0) {
        showToast('El catedratico ya impartio clases en un periodo anterior.', 'warning');
      }
    } else {
      setDocenteExistente(null);
      setFormData(prev => ({
        ...prev,
        nombre: '',
        titulo: '',
        telefono: '',
        correo: ''
      }));
    }
  };

  const activeContracts = searchId ? store.getContratosActivos(searchId) : [];

  const totalHorasSimuladas = (docenteExistente ? store.calculateTotalHours(docenteExistente.id) : 0) + Number(formData.horas);

  const getSemaphoreClass = () => {
    if (totalHorasSimuladas > MAX_HORAS) return 'red';
    if (totalHorasSimuladas > UMBRAL_AVISO) return 'yellow';
    return 'green';
  };

  const getSemaphoreMessage = () => {
    if (totalHorasSimuladas > MAX_HORAS) return `Carga excede el limite legal de ${MAX_HORAS} horas.`;
    if (totalHorasSimuladas > UMBRAL_AVISO) return "Advertencia: Proximo al limite legal.";
    return "Apto: Carga horaria dentro del rango permitido.";
  };

  const [cvFile, setCvFile] = useState(null);
  const docenteTieneCV = docenteExistente && store.contratos.some(c => c.docenteId === docenteExistente.id && c.cvPath);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check limits (Pregrado max 4 contracts, Continua semestral limit)
    const isPregradoContract = formData.academia === 'Pregrado' || PERFILES_PREGRADO.includes(formData.programa);
    
    if (isPregradoContract) {
      const activePreContractsInPeriod = activeContracts.filter(c => c.tipo === 'Pregrado' && c.periodo === formData.periodo);
      if (activePreContractsInPeriod.length >= 4) {
        showToast('Limite superado: El docente ya tiene 4 contratos activos en este periodo de Pregrado.', 'error');
        return;
      }
    }

    if (isContinua) {
      // Semester check: "si ya dio clases el 1er semestre no podria el segundo"
      const selectedPeriod = formData.periodo; // e.g. "I Semestre 2026" or "II Semestre 2026"
      const matches = selectedPeriod.match(/(I|II) Semestre (\d{4})/);
      if (matches) {
        const semester = matches[1];
        const year = matches[2];
        const alternateSemester = semester === 'I' ? 'II' : 'I';
        const alternatePeriod = `${alternateSemester} Semestre ${year}`;

        const taughtInAlternateSemester = activeContracts.some(c => c.periodo === alternatePeriod);
        if (taughtInAlternateSemester) {
          showToast(`Limite semestral: El docente ya impartio clases en el ${alternatePeriod}. No puede impartir clases en el ${selectedPeriod}.`, 'error');
          return;
        }
      }
    }

    if (totalHorasSimuladas > MAX_HORAS) {
      showToast(`Excede el limite legal de ${MAX_HORAS} horas.`, 'error');
      return;
    }

    const docenteData = {
      id: searchId,
      nombre: formData.nombre,
      titulo: formData.titulo,
      telefono: formData.telefono,
      correo: formData.correo
    };

    const contratoData = {
      academia: formData.academia,
      programa: formData.programa || '',
      asignatura: formData.asignatura,
      horas: formData.horas,
      periodo: formData.periodo,
      observaciones: formData.observaciones,
      proponente: userRole
    };

    const success = await store.addPropuesta(docenteData, contratoData, cvFile);

    if (success) {
      const successProgramas = getProgramasPorRolYCentro(userRole, centros[0]);
      setFormData({
        nombre: '',
        titulo: 'Master',
        telefono: '',
        correo: '',
        academia: centros[0],
        programa: successProgramas ? successProgramas[0] : '',
        asignatura: '',
        horas: 0,
        periodo: periodos[0],
        observaciones: ''
      });
      setSearchId('');
      setDocenteExistente(null);
      setCvFile(null);


      const fileInput = document.getElementById('cv-upload');
      if (fileInput) fileInput.value = '';

      showToast('Propuesta enviada a Mesa Tecnica.', 'success');
    } else {
      showToast('Error al sincronizar con el servidor.', 'error');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Propuesta de contrato para {userRole.replace('Coordinador ', '')}</h2>
      <form onSubmit={handleSubmit} spellCheck="false" autoComplete="off">
        <div className="form-grid">
          <div className="form-group">
            <label>Identidad (Sin guiones)</label>
            <input
              type="text"
              name="identidad_random_id"
              autoComplete="new-password"
              spellCheck="false"
              value={searchId}
              onChange={(e) => handleIdSearch(e.target.value)}
              required
              placeholder="Ej: 0801199012345"
            />
          </div>

          <div className="form-group">
            <label>Secuencia de Periodo (Consecutividad)</label>
            <select disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', opacity: 0.8 }} required>
              {docenteExistente ? (
                <option>Secuencia {activeContracts.length + 1} ({activeContracts.length} contratos activos en {docenteExistente.academia || 'UDH'})</option>
              ) : (
                <option value="">-- Ingrese Identidad primero --</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre_docente_no_autofill_strict"
              autoComplete="new-password"
              spellCheck="false"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              disabled={!!docenteExistente}
            />
          </div>

          <div className="form-group">
            <label>Titulo Academico</label>
            <select
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              disabled={!!docenteExistente}
            >
              <option value="Master">Master</option>
              <option value="Doctor">Doctor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Telefono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={!!docenteExistente}
            />
          </div>

          <div className="form-group">
            <label>Centros de Estudio</label>
            <select
              value={formData.academia}
              onChange={(e) => {
                const nuevaAcademia = e.target.value;
                const programas = getProgramasPorRolYCentro(userRole, nuevaAcademia);
                setFormData({
                  ...formData,
                  academia: nuevaAcademia,
                  programa: programas ? programas[0] : ''
                });
              }}
            >
              {centros.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {getProgramasPorRolYCentro(userRole, formData.academia) && (
            <div className="form-group">
              <label>Programa Academico</label>
              <select
                value={formData.programa}
                onChange={(e) => setFormData({ ...formData, programa: e.target.value })}
              >
                {getProgramasPorRolYCentro(userRole, formData.academia).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Asignatura</label>
            <input
              type="text"
              value={formData.asignatura}
              onChange={(e) => setFormData({ ...formData, asignatura: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Horas Asignadas</label>
            <input
              type="number"
              value={formData.horas}
              onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
              required
              min="1"
            />
            {Number(formData.horas) > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.8rem', background: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '4px' }}>
                <strong style={{ color: '#166534', fontSize: '0.85rem' }}>Proyección Financiera:</strong>
                <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.3rem' }}>
                  {(() => {
                    const valorHora = formData.titulo === 'Doctor' ? 550 : 500;
                    const esPostgrado = userRole === 'Dirección de Postgrado';
                    const duracionMeses = esPostgrado ? DURACION_MESES_POSTGRADO : DURACION_MESES_PREGRADO;
                    const importeMensual = Number(formData.horas) * valorHora;
                    const importeTotal = importeMensual * duracionMeses;
                    return (
                      <>
                        Precio asignado: <strong>L. {valorHora}/hr</strong><br/>
                        Importe Mensual: <strong>L. {importeMensual.toLocaleString()}</strong><br/>
                        Total Contrato ({duracionMeses} meses): <strong>L. {importeTotal.toLocaleString()}</strong>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Periodo Academico</label>
            <select
              value={formData.periodo}
              onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
            >
              {periodos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {activeContracts.length > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 31, 63, 0.05)', borderLeft: '4px solid var(--primary-color)', borderRadius: '4px' }}>
            <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.9rem' }}>Contratos Activos Detectados ({activeContracts.length})</h4>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {activeContracts.map((c, i) => (
                <li key={i}>
                  {c.tipo} - {c.programa} ({c.periodo}) [{c.academia}]
                </li>
              ))}
            </ul>
          </div>
        )}



        <div className="form-group" style={{ marginTop: '2rem', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '8px', background: '#f8fafc', textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '1rem' }}>Adjuntar Curriculum Vitae (PDF)</label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files[0])}
            style={{ padding: '0.5rem', width: '100%', maxWidth: '300px', margin: '0 auto', cursor: 'pointer', border: 'none', background: 'white', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          />
          <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {docenteTieneCV
              ? "Este docente ya tiene un CV registrado. Suba un archivo solo si desea actualizarlo."
              : "Requerido unicamente para docentes de nuevo ingreso."}
          </small>
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label>Observaciones</label>
          <textarea
            rows="2"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          ></textarea>
        </div>

        {searchId && (
          <div className={`semaphore ${getSemaphoreClass()}`}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Carga Total Acumulada: {totalHorasSimuladas} hs</div>
              <div>{getSemaphoreMessage()}</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={!searchId}
          >
            Registrar Propuesta
          </button>
        </div>
      </form>

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
