import React, { useState } from 'react';
import { useDataStore } from './hooks/useDataStore';
import { FormularioContrato } from './components/FormularioContrato';
import { DashboardContratos } from './components/DashboardContratos';
import { ExcepcionesContrato } from './components/ExcepcionesContrato';

const ROLES_DB = [
  // Roles institucionales
  { role: 'Dirección de Postgrado', password: '123', group: 'institucional' },
  { role: 'Mesa Técnica', password: '123', group: 'institucional' },
  { role: 'RR.HH.', password: '123', group: 'institucional' },
  { role: 'DREV', password: '123', group: 'institucional' }
];

function App() {
  const store = useDataStore();
  const [view, setView] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(null);

  // Login State
  const [selectedRoleForLogin, setSelectedRoleForLogin] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const profile = ROLES_DB.find(r => r.role === selectedRoleForLogin);
    if (profile && profile.password === passwordInput) {
      setCurrentRole(profile.role);
      // Dirección de Postgrado starts on dashboard, others too
      setView('dashboard');
      setSelectedRoleForLogin(null);
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Credenciales incorrectas');
    }
  };

  if (!currentRole) {
    return (
      <div className="split-layout">
        <div className="split-left">
          <div className="tactical-pattern"></div>
          <div className="bg-logo-spin" style={{ pointerEvents: 'none' }}>
            {[...Array(30)].map((_, i) => (
              <img 
                key={i} 
                src="/udh-logo.png" 
                alt="" 
                className="logo-face" 
                draggable="false"
                style={{ 
                  /* i=0 is the back face (translateZ(-15px)), needs to be flipped to read correctly from behind. 
                     i=29 is the front face (translateZ(14px)), normal orientation. */
                  transform: i === 0 ? `translateZ(${i - 15}px) rotateY(180deg)` : `translateZ(${i - 15}px)`,
                  filter: (i > 0 && i < 29) 
                    ? 'brightness(0) invert(0.15)' 
                    : 'drop-shadow(0px 15px 25px rgba(0, 0, 0, 0.6))',
                  pointerEvents: 'none'
                }} 
              />
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '2rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '3px', fontSize: '0.8rem', fontWeight: 600 }}>
            SISTEMA DE CONTROL DE CONTRATOS
          </div>
        </div>
        <div className="split-right">
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {!selectedRoleForLogin ? (
              <>
                <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0', fontWeight: '800', lineHeight: 1.2 }}>INICIAR SESIÓN<br /></h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>Seleccione su perfil operativo</p>
                
                {/* Roles Institucionales */}
                <div style={{ marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                  Acceso Institucional
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  {ROLES_DB.filter(r => r.group === 'institucional').map(r => (
                    <button
                      key={r.role}
                      className="role-btn"
                      onClick={() => {
                        setSelectedRoleForLogin(r.role);
                        setLoginError('');
                      }}
                    >
                      {r.role}
                      <span className="role-btn-icon">→</span>
                    </button>
                  ))}
                </div>

              </>
            ) : (
              <form onSubmit={handleLogin} style={{ animation: 'fadeIn 0.3s' }}>
                <button
                  type="button"
                  onClick={() => { setSelectedRoleForLogin(null); setPasswordInput(''); setLoginError(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  ← Volver
                </button>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0', fontWeight: '800' }}>Autenticación</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>Perfil: <strong>{selectedRoleForLogin}</strong></p>

                <div className="form-group">
                  <label>Contraseña Operativa</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    autoFocus
                    style={{ marginBottom: '1rem' }}
                  />
                </div>
                {loginError && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 'bold' }}>{loginError}</div>}
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Ingresar al Sistema
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isPostgrado = currentRole === 'Dirección de Postgrado';

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/LOGO-FFAA.png" alt="FF.AA." style={{ height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>Sistema de Control de Contratos</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85, marginTop: '0.2rem' }}>Universidad de Defensa de Honduras | Perfil: <strong>{currentRole}</strong></p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          {isPostgrado && (
            <button 
              className={`btn-primary ${view === 'form' ? 'active' : ''}`}
              onClick={() => setView('form')}
              style={{ background: view === 'form' ? 'var(--secondary-color)' : 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Nueva Propuesta
            </button>
          )}
          <button 
            className={`btn-primary ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
            style={{ background: view === 'dashboard' ? 'var(--secondary-color)' : 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Panel de Gestión
          </button>
          {isPostgrado && (
            <button 
              className={`btn-primary ${view === 'excepciones' ? 'active' : ''}`}
              onClick={() => setView('excepciones')}
              style={{ background: view === 'excepciones' ? 'var(--secondary-color)' : 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Excepciones
            </button>
          )}
          <button onClick={() => setCurrentRole(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontWeight: 'bold' }}>
            Salir
          </button>
        </div>
      </header>

      <main>
        {view === 'form' && isPostgrado ? (
          <FormularioContrato store={store} userRole={currentRole} />
        ) : view === 'excepciones' && isPostgrado ? (
          <ExcepcionesContrato store={store} userRole={currentRole} />
        ) : (
          <DashboardContratos store={store} userRole={currentRole} />
        )}
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <img src="/LOGO-UDH.png" alt="UDH" style={{ height: '100px', objectFit: 'contain', opacity: 0.9 }} />
        <div>&copy; 2026 Universidad de Defensa de Honduras. Cumplimiento Legal de Contratación.</div>
      </footer>
    </div>
  );
}

export default App;
