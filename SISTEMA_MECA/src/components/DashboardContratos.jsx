import React, { useState } from 'react';

const ESTADOS = ['PROPUESTO', 'MESA TECNICA', 'RRHH', 'CONTRATADO', 'RECHAZADO'];

export const DashboardContratos = ({ store, userRole }) => {
  const [filtroRRHH, setFiltroRRHH] = useState('PENDIENTES');
  const [obsDrafts, setObsDrafts] = useState({});
  const [verificaciones, setVerificaciones] = useState({});
  const [activeTab, setActiveTab] = useState('contratos');
  const [reportesEstudiantiles, setReportesEstudiantiles] = useState([]);

  const fetchReportes = async () => {
    try {
      const res = await fetch(`${store.apiUrl}/reportes-estudiantes`);
      if (res.ok) {
        const data = await res.json();
        setReportesEstudiantiles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reportesVisibles = reportesEstudiantiles.filter(r => {
    if (r.tipo_reporte === 'Coordinador de Carrera') {
      return userRole === 'DREV';
    }
    return true;
  });

  React.useEffect(() => {
    if (userRole === 'Mesa Técnica' || userRole === 'DREV') {
      fetchReportes();
    }
  }, [userRole]);

  const updateReporteEstado = async (reportId, nuevoEstado) => {
    try {
      const res = await fetch(`${store.apiUrl}/reportes-estudiantes/${reportId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        fetchReportes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerificacionChange = (contratoId, field, value) => {
    const current = verificaciones[contratoId] || {
      rrhhChecked: false, rrhhDni: '',
      legalChecked: false, legalDni: '',
      controlChecked: false, controlDni: '',
      finanzasChecked: false, finanzasDni: ''
    };
    setVerificaciones({
      ...verificaciones,
      [contratoId]: {
        ...current,
        [field]: value
      }
    });
  };

  const isMesaTecnicaAprobado = (contratoId) => {
    const v = verificaciones[contratoId];
    if (!v) return false;
    return v.rrhhChecked && v.rrhhDni.trim() !== '' &&
           v.legalChecked && v.legalDni.trim() !== '' &&
           v.controlChecked && v.controlDni.trim() !== '' &&
           v.finanzasChecked && v.finanzasDni.trim() !== '';
  };
  
  const handleStatusChange = (contratoId, currentStatus, optionalObs) => {
    const currentIndex = ESTADOS.indexOf(currentStatus);
    if (currentIndex < ESTADOS.length - 2) {
      store.updateContratoEstado(contratoId, ESTADOS[currentIndex + 1], optionalObs);
    }
  };

  const handleFinalize = (contratoId, approved, optionalObs) => {
    store.updateContratoEstado(contratoId, approved ? 'CONTRATADO' : 'RECHAZADO', optionalObs);
  };

  const PERFILES_PREGRADO = ['IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV'];
  const isCoordinadorPrograma = userRole?.startsWith('Coordinador') && 
    PERFILES_PREGRADO.some(p => userRole.includes(p));
  
  const getValorHoraPostgrado = (docenteId, programa = '') => {
    const docObj = store.getDocenteById(docenteId);
    const titulo = (docObj ? docObj.titulo : '').toLowerCase();
    
    if (titulo.includes('doctorado') || titulo.includes('doctor') || titulo.includes('phd') || titulo.includes('dr.')) {
      return 550;
    }
    if (titulo.includes('maestría') || titulo.includes('maestria') || titulo.includes('master') || titulo.includes('msc')) {
      return 500;
    }

    const prog = (programa || '').toUpperCase();
    if (prog.includes('IMM') || prog.includes('LEM')) {
      return 375;
    }

    return 300; // default rate
  };

  const filteredContratos = store.contratos.filter(c => {
    if (!userRole) return true;
    
    if (userRole === 'DREV') {
      return true;
    }
    
    if (isCoordinadorPrograma) {
      const programa = userRole.replace('Coordinador ', '');
      const esDesuPrograma = c.programa === programa || c.academia?.includes(programa);
      return esDesuPrograma && (c.estado === 'MESA TECNICA' || c.estado === 'PROPUESTO' || c.estado === 'RRHH' || c.estado === 'RECHAZADO');
    }
    
    if (userRole === 'Dirección de Postgrado') {
      return c.proponente === userRole;
    }
    
    if (userRole === 'Mesa Técnica') {
      return c.estado === 'PROPUESTO' || c.estado === 'MESA TECNICA' || c.estado === 'RRHH';
    }
    
    if (userRole === 'RR.HH.') {
      if (filtroRRHH === 'PENDIENTES') {
        return c.estado === 'RRHH';
      } else if (filtroRRHH === 'HISTORIAL') {
        return c.estado === 'CONTRATADO';
      } else if (filtroRRHH === 'RECHAZADOS') {
        return c.estado === 'RECHAZADO';
      }
    }
    
    return true;
  });

  const totalDocentes = new Set(filteredContratos.map(c => c.docenteId)).size;
  const presTotal = filteredContratos.reduce((sum, c) => sum + (c.horas * getValorHoraPostgrado(c.docenteId, c.programa) * 12), 0);

  return (
    <div className="card">
      {(userRole === 'Mesa Técnica' || userRole === 'DREV') && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.8rem' }}>
          <button
            onClick={() => setActiveTab('contratos')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: activeTab === 'contratos' ? 'var(--primary-color)' : '#94a3b8',
              borderBottom: activeTab === 'contratos' ? '3px solid var(--primary-color)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Propuestas de Contratos
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: activeTab === 'reportes' ? 'var(--primary-color)' : '#94a3b8',
              borderBottom: activeTab === 'reportes' ? '3px solid var(--primary-color)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              position: 'relative'
            }}
          >
            <img src="/udh-tiger-icon.png" style={{ height: '20px', width: '20px', verticalAlign: 'middle', marginRight: '5px' }} /> Reportes Estudiantiles Anónimos
            {reportesVisibles.filter(r => r.estado === 'PENDIENTE').length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '-10px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.7rem',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {reportesVisibles.filter(r => r.estado === 'PENDIENTE').length}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === 'reportes' && (userRole === 'Mesa Técnica' || userRole === 'DREV') ? (
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><img src="/udh-tiger-icon.png" style={{ height: '35px', width: '35px' }} /> Canal de Denuncias y Reportes Anónimos</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
            A continuación se listan las quejas, reclamos e incidencias presentadas por los estudiantes de los programas de postgrado de forma 100% anónima. Revise cada caso objetivamente.
          </p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Programa</th>
                  <th>Dirigido A</th>
                  <th>Detalles de la Incidencia</th>
                  <th>Fecha Recepción</th>
                  <th>Estado / Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportesVisibles.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-color)' }}>{r.tipo_reporte}</strong>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: 'bold' }}>
                        {r.programa}
                      </span>
                    </td>
                    <td>
                      <strong>{r.dirigido_a}</strong>
                    </td>
                    <td>
                      <div style={{ maxWidth: '400px', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#334155' }}>
                        {r.detalles}
                      </div>
                    </td>
                    <td>
                      <small style={{ color: '#666' }}>
                        {new Date(r.fecha).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span className={`status-badge status-${r.estado.toLowerCase()}`}>
                          {r.estado}
                        </span>
                        {r.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => updateReporteEstado(r.id, 'REVISADO')}
                            className="btn-primary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#27ae60', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Marcar Revisado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reportesVisibles.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                      No se han recibido reportes anónimos de estudiantes en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderLeft: '4px solid var(--primary-color)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{totalDocentes}</div>
              <div className="stat-label" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Docentes Filtrados</div>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderLeft: '4px solid var(--secondary-color)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>{filteredContratos.length}</div>
              <div className="stat-label" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Propuestas en Lista</div>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderLeft: '4px solid var(--success)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div className="stat-number" style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--success)', paddingTop: '0.3rem' }}>
                Lps. {presTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="stat-label" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Presupuesto Anualizado</div>
            </div>
          </div>

          {isCoordinadorPrograma ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="card-title">Observaciones de Mesa Técnica — {userRole.replace('Coordinador ', '')}</h2>
              <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.85rem', color: '#92400e' }}>
                <strong>Modo de Revisión:</strong> Aquí visualiza los contratos de su programa que han sido revisados por la Mesa Técnica. 
                Si tiene observaciones, subsane la documentación con el área correspondiente y notifique al Coordinador Postgrado.
              </div>
            </div>
          ) : (
            <h2 className="card-title">Panel de Control y Seguimiento</h2>
          )}
          {userRole === 'RR.HH.' && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setFiltroRRHH('PENDIENTES')}
                className="btn-primary"
                style={{ 
                  background: filtroRRHH === 'PENDIENTES' ? 'var(--primary-color)' : 'transparent', 
                  color: filtroRRHH === 'PENDIENTES' ? 'white' : 'var(--primary-color)', 
                  border: '2px solid var(--primary-color)' 
                }}
              >
                Nuevas Propuestas
              </button>
              <button 
                onClick={() => setFiltroRRHH('HISTORIAL')}
                className="btn-primary"
                style={{ 
                  background: filtroRRHH === 'HISTORIAL' ? 'var(--primary-color)' : 'transparent', 
                  color: filtroRRHH === 'HISTORIAL' ? 'white' : 'var(--primary-color)', 
                  border: '2px solid var(--primary-color)' 
                }}
              >
                Historial de Contratados
              </button>
              <button 
                onClick={() => setFiltroRRHH('RECHAZADOS')}
                className="btn-primary"
                style={{ 
                  background: filtroRRHH === 'RECHAZADOS' ? 'var(--primary-color)' : 'transparent', 
                  color: filtroRRHH === 'RECHAZADOS' ? 'white' : 'var(--primary-color)', 
                  border: '2px solid var(--primary-color)' 
                }}
              >
                Historial de Rechazados
              </button>
            </div>
          )}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Periodo</th>
                  <th>Asignatura</th>
                  <th>Horas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredContratos.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.docenteNombre}</strong><br/>
                      <small style={{color: '#666'}}>{c.docenteId}</small>
                      {(userRole === 'Mesa Técnica' || userRole === 'RR.HH.') && (
                        <div style={{marginTop: '0.25rem'}}>
                          {store.getDocenteById(c.docenteId)?.fechaIngreso && (
                            <div style={{marginBottom: '0.2rem'}}>
                              <small style={{color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: 600}}>
                                Ingresado: {new Date(store.getDocenteById(c.docenteId).fechaIngreso).toLocaleDateString()}
                              </small>
                            </div>
                          )}
                          {c.cvPath && (
                            <div>
                              <a 
                                href={`${store.apiUrl.replace('/api', '')}${c.cvPath}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{display: 'inline-block', background: '#f1f5f9', color: 'var(--secondary-color)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #e2e8f0'}}
                              >
                                Ver CV Adjunto
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {c.excepcion === 'SI' && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#b45309', background: '#fffbeb', padding: '0.2rem 0.5rem', borderRadius: '4px', borderLeft: '3px solid #d97706', fontWeight: 'bold', display: 'inline-block' }}>
                          EXCEPCION GESTIONADA: {c.justificacionExcepcion}
                        </div>
                      )}
                      {c.estado === 'RECHAZADO' && c.observaciones && (
                        <div style={{marginTop: '0.4rem', fontSize: '0.75rem', color: '#7f1d1d', background: '#fef2f2', padding: '0.3rem 0.5rem', borderRadius: '4px', borderLeft: '3px solid #ef4444', maxWidth: '300px'}}>
                          <strong>Rechazo:</strong> {c.observaciones}
                        </div>
                      )}
                      {c.estado !== 'RECHAZADO' && c.observaciones && (
                        <div style={{marginTop: '0.4rem', fontSize: '0.75rem', color: '#1e293b', background: '#f8fafc', padding: '0.3rem 0.5rem', borderRadius: '4px', borderLeft: '3px solid #64748b', maxWidth: '300px'}}>
                          <strong>Obs:</strong> {c.observaciones}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.periodo}<br/>
                      <small style={{color: '#999'}}>{c.academia}</small>
                      {c.programa && (
                        <div style={{marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 'bold'}}>
                          {c.programa}
                        </div>
                      )}
                      {userRole === 'Mesa Técnica' && (
                        <div style={{marginTop: '0.3rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.2rem'}}>
                          <small style={{color: 'var(--secondary-color)', fontWeight: 'bold', fontSize: '0.65rem'}}>
                            Propuesto: {c.proponente.replace('Coordinador ', '')}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>{c.asignatura}</td>
                    <td>
                      {c.horas} hs
                      <div style={{marginTop: '0.25rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold'}}>
                        L. {getValorHoraPostgrado(c.docenteId, c.programa)}/hr
                      </div>
                      <div style={{fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 'bold'}}>
                        Total: L. {(c.horas * getValorHoraPostgrado(c.docenteId, c.programa) * 6).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${c.estado.toLowerCase().replace(' ', '')}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      {userRole === 'Mesa Técnica' && c.estado === 'PROPUESTO' && (
                        <button onClick={() => handleStatusChange(c.id, c.estado)} className="btn-primary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>
                          Recibir en Mesa
                        </button>
                      )}
                      {userRole === 'Mesa Técnica' && c.estado === 'MESA TECNICA' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '320px'}}>
                          <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.3rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem'}}>
                            VERIFICACIONES REQUERIDAS DE LA MESA
                          </div>
                          
                          {/* RR.HH */}
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between'}}>
                            <label style={{fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer'}}>
                              <input 
                                type="checkbox" 
                                checked={verificaciones[c.id]?.rrhhChecked || false} 
                                onChange={(e) => handleVerificacionChange(c.id, 'rrhhChecked', e.target.checked)}
                              />
                              <strong>RR.HH</strong>
                            </label>
                            <input 
                              type="text" 
                              placeholder="DNI Firmante"
                              value={verificaciones[c.id]?.rrhhDni || ''} 
                              onChange={(e) => handleVerificacionChange(c.id, 'rrhhDni', e.target.value)}
                              style={{fontSize: '0.7rem', padding: '0.2rem 0.4rem', width: '120px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                            />
                          </div>

                          {/* LEGAL */}
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between'}}>
                            <label style={{fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer'}}>
                              <input 
                                type="checkbox" 
                                checked={verificaciones[c.id]?.legalChecked || false} 
                                onChange={(e) => handleVerificacionChange(c.id, 'legalChecked', e.target.checked)}
                              />
                              <strong>LEGAL</strong>
                            </label>
                            <input 
                              type="text" 
                              placeholder="DNI Firmante"
                              value={verificaciones[c.id]?.legalDni || ''} 
                              onChange={(e) => handleVerificacionChange(c.id, 'legalDni', e.target.value)}
                              style={{fontSize: '0.7rem', padding: '0.2rem 0.4rem', width: '120px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                            />
                          </div>

                          {/* CONTROL INTERNO */}
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between'}}>
                            <label style={{fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer'}}>
                              <input 
                                type="checkbox" 
                                checked={verificaciones[c.id]?.controlChecked || false} 
                                onChange={(e) => handleVerificacionChange(c.id, 'controlChecked', e.target.checked)}
                              />
                              <strong>CONTROL INT.</strong>
                            </label>
                            <input 
                              type="text" 
                              placeholder="DNI Firmante"
                              value={verificaciones[c.id]?.controlDni || ''} 
                              onChange={(e) => handleVerificacionChange(c.id, 'controlDni', e.target.value)}
                              style={{fontSize: '0.7rem', padding: '0.2rem 0.4rem', width: '120px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                            />
                          </div>

                          {/* FINANZAS */}
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between'}}>
                            <label style={{fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer'}}>
                              <input 
                                type="checkbox" 
                                checked={verificaciones[c.id]?.finanzasChecked || false} 
                                onChange={(e) => handleVerificacionChange(c.id, 'finanzasChecked', e.target.checked)}
                              />
                              <strong>FINANZAS</strong>
                            </label>
                            <input 
                              type="text" 
                              placeholder="DNI Firmante"
                              value={verificaciones[c.id]?.finanzasDni || ''} 
                              onChange={(e) => handleVerificacionChange(c.id, 'finanzasDni', e.target.value)}
                              style={{fontSize: '0.7rem', padding: '0.2rem 0.4rem', width: '120px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                            />
                          </div>

                          <textarea
                            value={obsDrafts[c.id] !== undefined ? obsDrafts[c.id] : (c.observaciones || '')}
                            onChange={(e) => setObsDrafts({ ...obsDrafts, [c.id]: e.target.value })}
                            placeholder="Observaciones para RR.HH..."
                            rows="2"
                            style={{fontSize: '0.75rem', padding: '0.3rem', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical', marginTop: '0.3rem'}}
                          />
                          <button 
                            onClick={() => {
                              const v = verificaciones[c.id];
                              const customObs = `${obsDrafts[c.id] || ''} | Firmas Mesa: RRHH(${v.rrhhDni}), LEGAL(${v.legalDni}), CONTROL(${v.controlDni}), FINANZAS(${v.finanzasDni})`;
                              handleStatusChange(c.id, c.estado, customObs);
                            }} 
                            disabled={!isMesaTecnicaAprobado(c.id)}
                            className="btn-primary" 
                            style={{
                              padding: '0.5rem 0.8rem', 
                              fontSize: '0.8rem', 
                              background: isMesaTecnicaAprobado(c.id) ? '#27ae60' : '#cbd5e1',
                              color: isMesaTecnicaAprobado(c.id) ? 'white' : '#666',
                              cursor: isMesaTecnicaAprobado(c.id) ? 'pointer' : 'not-allowed',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              marginTop: '0.3rem'
                            }}
                          >
                            Enviar a RRHH
                          </button>
                        </div>
                      )}
                      {userRole === 'RR.HH.' && c.estado === 'RRHH' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '200px'}}>
                          <textarea
                            value={obsDrafts[c.id] !== undefined ? obsDrafts[c.id] : (c.observaciones || '')}
                            onChange={(e) => setObsDrafts({ ...obsDrafts, [c.id]: e.target.value })}
                            placeholder="Motivo del rechazo u observaciones..."
                            rows="2"
                            style={{fontSize: '0.75rem', padding: '0.3rem', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical'}}
                          />
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button 
                              onClick={() => handleFinalize(c.id, true, obsDrafts[c.id] !== undefined ? obsDrafts[c.id] : c.observaciones)} 
                              className="btn-primary" 
                              style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--success)'}}
                              disabled={store.calculateTotalHours(c.docenteId) > 40}
                            >
                              Contratar
                            </button>
                            <button 
                              onClick={() => handleFinalize(c.id, false, obsDrafts[c.id] !== undefined ? obsDrafts[c.id] : c.observaciones)} 
                              className="btn-primary" 
                              style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--danger)'}}
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}
                      {(userRole?.startsWith('Coordinador') || userRole?.includes('Dirección') || userRole?.includes('Direccion')) && userRole !== 'DREV' && c.estado !== 'CONTRATADO' && c.estado !== 'RECHAZADO' && (
                        <small style={{color: '#666'}}>En proceso: {c.estado}</small>
                      )}
                      {userRole === 'DREV' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>
                          <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>Supervisión</span>
                          <small style={{color: '#666', fontSize: '0.7rem'}}>Fase: <strong>{c.estado}</strong></small>
                        </div>
                      )}
                      {(c.estado === 'CONTRATADO' || c.estado === 'RECHAZADO') && userRole !== 'DREV' && (
                        <small style={{fontWeight: 'bold', color: c.estado === 'CONTRATADO' ? 'var(--success)' : 'var(--danger)'}}>Finalizado</small>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredContratos.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#999'}}>
                      No hay contratos disponibles para su perfil en este momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
