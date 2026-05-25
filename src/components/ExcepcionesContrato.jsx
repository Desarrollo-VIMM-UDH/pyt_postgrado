import React, { useState } from 'react';

export const ExcepcionesContrato = ({ store, userRole }) => {
  const [selectedDocenteId, setSelectedDocenteId] = useState('');
  const [selectedContratoId, setSelectedContratoId] = useState('');
  const [tipoExcepcion, setTipoExcepcion] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Contratos que tienen excepción registrada
  const contratosConExcepcion = store.contratos.filter(c => c.excepcion === 'SI');

  // Todos los contratos proponentes
  const todosContratos = store.contratos.filter(c => c.proponente === 'Dirección de Postgrado');

  // Docentes únicos con contratos registrados para el dropdown
  const docentesConContratos = Array.from(
    new Map(store.contratos.map(c => [c.docenteId, { id: c.docenteId, nombre: c.docenteNombre }])).values()
  );

  // Contratos del docente seleccionado
  const contratosDelDocente = store.contratos.filter(c => c.docenteId === selectedDocenteId);

  // Contratos que superan umbrales (posibles candidatos a excepción)
  const contratosAlerta = todosContratos.filter(c => {
    const totalHoras = store.calculateTotalHours(c.docenteId);
    return totalHoras > 30;
  });

  const handleDocenteChange = (docenteId) => {
    setSelectedDocenteId(docenteId);
    const firstContrato = store.contratos.find(c => c.docenteId === docenteId);
    setSelectedContratoId(firstContrato ? firstContrato.id : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContratoId) {
      showToast('Seleccione un contrato válido.', 'error');
      return;
    }

    const fullJustificacion = `TIPO: ${tipoExcepcion} | ${justificacion} | Vence: ${fechaVencimiento}`;
    const success = await store.updateContratoExcepcion(selectedContratoId, 'SI', fullJustificacion);

    if (success) {
      showToast('Excepción registrada exitosamente. Se aplicará en las siguientes auditorías.');
      setSelectedDocenteId('');
      setSelectedContratoId('');
      setTipoExcepcion('');
      setJustificacion('');
      setFechaVencimiento('');
    } else {
      showToast('Error al registrar la excepción.', 'error');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Excepciones Registradas — {userRole}</h2>

      {/* Formulario de registro, idéntico al de pregrado */}
      <div className="view-card" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '1.2rem', marginTop: 0, fontWeight: 'bold' }}>
          Registrar Excepción de Consecutividad / Carga Horaria
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            <div className="form-group">
              <label>Docente Afectado</label>
              <select 
                value={selectedDocenteId} 
                onChange={(e) => handleDocenteChange(e.target.value)} 
                required
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="">-- Seleccione un Docente --</option>
                {docentesConContratos.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre} ({d.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Asignación Objetivo</label>
              <select 
                value={selectedContratoId} 
                onChange={(e) => setSelectedContratoId(e.target.value)} 
                required
                disabled={!selectedDocenteId}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="">-- Seleccione un Contrato --</option>
                {contratosDelDocente.map(c => (
                  <option key={c.id} value={c.id}>{c.asignatura} ({c.programa || 'Sin programa'}) - {c.periodo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Excepción</label>
              <input 
                type="text" 
                placeholder="Escriba el tipo de excepción" 
                value={tipoExcepcion}
                onChange={(e) => setTipoExcepcion(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>

            <div className="form-group">
              <label>Justificación Detallada</label>
              <input 
                type="text" 
                placeholder="Motivo que autoriza el traslape" 
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>

            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input 
                type="date" 
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>

          </div>
          <div style={{ textAlign: 'right', marginTop: '1.2rem' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              Registrar y Validar Excepción
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de excepciones vigentes */}
      <h3 style={{ color: 'var(--primary-color)', borderLeft: '4px solid var(--secondary-color)', paddingLeft: '0.8rem', fontSize: '1rem', marginBottom: '1rem' }}>
        Excepciones Registradas y Vigentes
      </h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Docente</th>
              <th>Programa</th>
              <th>Asignatura</th>
              <th>Periodo</th>
              <th>Horas Asignadas</th>
              <th>Estado Contrato</th>
              <th>Justificación</th>
            </tr>
          </thead>
          <tbody>
            {contratosConExcepcion.map(c => (
              <tr key={c.id}>
                <td>
                  <strong>{c.docenteNombre}</strong><br />
                  <small style={{ color: '#666' }}>{c.docenteId}</small>
                </td>
                <td>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{c.programa || 'N/A'}</span>
                </td>
                <td>{c.asignatura}</td>
                <td>{c.periodo}</td>
                <td>{c.horas} hs</td>
                <td>
                  <span className={`status-badge status-${(c.estado || '').toLowerCase().replace(' ', '')}`}>
                    {c.estado}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', background: '#fffbeb', padding: '0.3rem 0.5rem', borderRadius: '4px', borderLeft: '3px solid #d97706', maxWidth: '300px' }}>
                    {c.justificacionExcepcion || '(Sin descripción)'}
                  </div>
                </td>
              </tr>
            ))}
            {contratosConExcepcion.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#999', fontStyle: 'italic' }}>
                  No hay excepciones cargadas en el sistema de control.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tabla de docentes con carga alta */}
      {contratosAlerta.length > 0 && (
        <>
          <h3 style={{ color: '#ef4444', borderLeft: '4px solid #ef4444', paddingLeft: '0.8rem', fontSize: '1rem', marginBottom: '1rem', marginTop: '2.5rem' }}>
            Docentes con Carga Horaria Elevada
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Total Horas Acumuladas</th>
                  <th>Asignatura Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {contratosAlerta.map(c => {
                  const totalHoras = store.calculateTotalHours(c.docenteId);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.docenteNombre}</strong><br />
                        <small style={{ color: '#666' }}>{c.docenteId}</small>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 'bold',
                          color: totalHoras > 40 ? '#ef4444' : '#d97706',
                          fontSize: '1.1rem'
                        }}>
                          {totalHoras} hs
                        </span>
                        {totalHoras > 40 && (
                          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold' }}>EXCEDE LÍMITE LEGAL</div>
                        )}
                      </td>
                      <td>{c.asignatura}</td>
                      <td>
                        <span className={`status-badge status-${(c.estado || '').toLowerCase().replace(' ', '')}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`} style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
