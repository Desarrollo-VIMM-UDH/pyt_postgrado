// =============================================================================
// RENDERER - PORTAL DE DIRECCIONES (SISTEMA DOCENTES)
// Integración 100% nativa con SQLite mediante electronAPI preservando todos los
// datos, columnas, auditorías y consecutividad originales de better-sqlite3.
// =============================================================================

// Fallback de Electron API para entorno Web
if (typeof window !== 'undefined' && !window.electronAPI) {
  window.electronAPI = {
    getDocentes: () => fetch('/api/docentes').then(r => r.json()),
    crearDocente: (datos) => fetch('/api/docente/crear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }).then(r => r.json()),
    eliminarDocente: (id) => fetch(`/api/docente/eliminar/${id}`, { method: 'DELETE' }).then(r => r.json()),
    
    getAsignaciones: () => fetch('/api/asignaciones').then(r => r.json()),
    crearAsignacion: (datos) => fetch('/api/asignacion/crear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }).then(r => r.json()),
    eliminarAsignacion: (id) => fetch(`/api/asignacion/eliminar/${id}`, { method: 'DELETE' }).then(r => r.json()),
    
    getEjecucion: () => fetch('/api/ejecucion').then(r => r.json()),
    crearEjecucion: (datos) => fetch('/api/ejecucion/crear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }).then(r => r.json()),
    
    getExcepciones: () => fetch('/api/excepciones').then(r => r.json()),
    crearExcepcion: (datos) => fetch('/api/excepcion/crear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }).then(r => r.json()),
    
    getAuditoria: () => fetch('/api/auditoria').then(r => r.json()),
    getReporteDocentes: () => fetch('/api/reporte/docentes').then(r => r.json()),
    getReportePresupuesto: () => fetch('/api/reporte/presupuesto').then(r => r.json()),
  };
}

// Estados locales de la aplicación
let selectedRoleForLogin = null;
let currentRole = localStorage.getItem('direcciones_role') || null;
let activeTab = 'dashboard';

// Centros de Estudio y Programas Académicos por Rol de Dirección
function getCentrosYProgramasPorRol(rol) {
  if (rol && rol.startsWith('Coordinador')) {
    const prog = rol.replace('Coordinador ', '').trim();
    let centro = 'UDH';
    if (prog === 'CC.MM') centro = 'AMHGFM';
    else if (prog === 'CC.AA') centro = 'AMAH';
    else if (prog === 'CC.NV') centro = 'AMNVH';
    return {
      centros: [centro],
      programas: [prog]
    };
  }
  if (rol === 'Direccion de Pregrado') {
    return {
      centros: ['UDH'],
      programas: ['IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV']
    };
  } else if (rol === 'Direccion de Continua') {
    return {
      centros: ['UDH', 'ECMI', 'EFSOFA', 'EFSON'],
      programas: ['a', 'b', 'c', 'd']
    };
  } else if (rol === 'Direccion de Distancia') {
    return {
      centros: ['UDH'],
      programas: ['a', 'b', 'c', 'd']
    };
  }
  return {
    centros: ['UDH'],
    programas: ['a', 'b', 'c', 'd']
  };
}

// Cache de base de datos
let docentesList = [];
let asignacionesList = [];
let excepcionesList = [];
let logsList = [];
let presupuestosList = [];
let contratosProyecto1 = [];

// Elementos del DOM
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const displayRole = document.getElementById('displayRole');
const btnLogout = document.getElementById('btnLogout');
const tabLinks = document.querySelectorAll('.tab-link');
const mainContent = document.getElementById('mainContent');

// Elementos del Login Form
const roleSelectionBox = document.getElementById('roleSelectionBox');
const coordinadorSelectionBox = document.getElementById('coordinadorSelectionBox');
const btnBackToRolesFromCoord = document.getElementById('btnBackToRolesFromCoord');
const passwordBox = document.getElementById('passwordBox');
const btnBackToRoles = document.getElementById('btnBackToRoles');
const selectedRoleName = document.getElementById('selectedRoleName');
const loginForm = document.getElementById('loginForm');
const pPassword = document.getElementById('pPassword');

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
}

// =============================================================================
// LOGIN & SESSION MANAGEMENT (CON CONTRASEÑA "123")
// =============================================================================
// Main role buttons
document.querySelectorAll('#roleSelectionBox .role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const role = btn.dataset.role;
    pPassword.value = '';
    
    if (role === 'Direccion de Pregrado') {
      roleSelectionBox.classList.add('hidden');
      coordinadorSelectionBox.classList.remove('hidden');
    } else {
      selectedRoleForLogin = role;
      selectedRoleName.textContent = selectedRoleForLogin;
      roleSelectionBox.classList.add('hidden');
      passwordBox.classList.remove('hidden');
    }
  });
});

// Coordinator buttons selection
document.querySelectorAll('.coord-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRoleForLogin = btn.dataset.coord;
    selectedRoleName.textContent = selectedRoleForLogin;
    pPassword.value = '';
    
    coordinadorSelectionBox.classList.add('hidden');
    passwordBox.classList.remove('hidden');
  });
});

btnBackToRolesFromCoord.addEventListener('click', () => {
  selectedRoleForLogin = null;
  coordinadorSelectionBox.classList.add('hidden');
  roleSelectionBox.classList.remove('hidden');
});

btnBackToRoles.addEventListener('click', () => {
  pPassword.value = '';
  if (selectedRoleForLogin && selectedRoleForLogin.startsWith('Coordinador')) {
    passwordBox.classList.add('hidden');
    coordinadorSelectionBox.classList.remove('hidden');
  } else {
    selectedRoleForLogin = null;
    passwordBox.classList.add('hidden');
    roleSelectionBox.classList.remove('hidden');
  }
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = pPassword.value;
  
  if (password === '123') {
    login(selectedRoleForLogin);
  } else {
    showToast('Contraseña operativa incorrecta.', 'error');
    pPassword.value = '';
  }
});

btnLogout.addEventListener('click', () => {
  logout();
});

function login(role) {
  currentRole = role;
  localStorage.setItem('direcciones_role', role);
  
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  
  // Restaurar vista de roles por si cierra sesión
  roleSelectionBox.classList.remove('hidden');
  passwordBox.classList.add('hidden');
  
  displayRole.textContent = role;

  // Adaptar tabs según el rol (cada Dirección tiene su flujo)
  const allTabs = document.querySelectorAll('.tab-link');
  allTabs.forEach(t => t.style.display = '');

  if (role.startsWith('Coordinador')) {
    // Coordinadores no manejan presupuesto/auditoria/reportes oficiales
    const hiddenTabs = ['presupuesto', 'auditoria', 'reportes'];
    allTabs.forEach(t => {
      if (hiddenTabs.includes(t.dataset.tab)) {
        t.style.display = 'none';
        if (t.classList.contains('active')) {
          t.classList.remove('active');
          document.querySelector('.tab-link[data-tab="dashboard"]').classList.add('active');
          activeTab = 'dashboard';
        }
      }
    });
  } else if (role === 'Direccion de Continua' || role === 'Direccion de Distancia') {
    // Continua y Distancia no manejan presupuesto/auditoria
    const hiddenTabs = ['presupuesto', 'auditoria'];
    allTabs.forEach(t => {
      if (hiddenTabs.includes(t.dataset.tab)) {
        t.style.display = 'none';
        if (t.classList.contains('active')) {
          // Cambiar al dashboard si el tab activo fue ocultado
          t.classList.remove('active');
          document.querySelector('.tab-link[data-tab="dashboard"]').classList.add('active');
          activeTab = 'dashboard';
        }
      }
    });
  }
  
  // Cargar datos de SQLite y renderizar
  fetchDatabaseData().then(() => {
    renderTabContent();
  });
}

function logout() {
  currentRole = null;
  localStorage.removeItem('direcciones_role');
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

// =============================================================================
// SQLite DATABASE SYNC
// =============================================================================
async function fetchDatabaseData() {
  try {
    if (window.electronAPI) {
      docentesList = await window.electronAPI.getDocentes() || [];
      asignacionesList = await window.electronAPI.getAsignaciones() || [];
      excepcionesList = await window.electronAPI.getExcepciones() || [];
      logsList = await window.electronAPI.getAuditoria() || []; // Corregido: getAuditoria
      presupuestosList = await window.electronAPI.getEjecucion() || []; // Corregido: getEjecucion
    } else {
      console.warn('electronAPI no está disponible en este entorno.');
    }

    // Cargar contratos de Proyecto 1 para ver el estado de aprobaciones y observaciones
    try {
      // =========================================================================
      // RESOLUCIÓN DE URL DEL SERVIDOR CENTRAL DE CONTRATOS (PROYECTO 1)
      //
      // NOTA: Por defecto es dinámico y usa el mismo hostname que cargó la página.
      // Si necesita forzar un dominio fijo o una IP fija intranet, cambie la constante abajo.
      // Ejemplo: const pro1Url = 'http://contratosespecializados.udh.edu.hn';
      // o: const pro1Url = 'http://192.168.0.2:3001';
      // =========================================================================
      const pro1Url = (typeof window !== 'undefined' && window.location) 
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : 'http://localhost:3001';
      const r = await fetch(`${pro1Url}/api/contratos`);
      if (r.ok) {
        contratosProyecto1 = await r.json() || [];
      }
    } catch (apiErr) {
      console.warn('⚠️ No se pudo sincronizar contratos de Proyecto 1:', apiErr.message);
      contratosProyecto1 = [];
    }
  } catch (err) {
    console.error('Error cargando base de datos SQLite:', err);
    showToast('Error al leer la base de datos local SQLite.', 'error');
  }
}

// =============================================================================
// TAB ROUTING & RENDERING
// =============================================================================
tabLinks.forEach(tab => {
  tab.addEventListener('click', () => {
    tabLinks.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    renderTabContent();
  });
});

async function renderTabContent() {
  await fetchDatabaseData();
  
  if (activeTab === 'dashboard') {
    renderDashboard();
  } else if (activeTab === 'docentes') {
    renderDocentes();
  } else if (activeTab === 'asignaciones') {
    renderAsignaciones();
  } else if (activeTab === 'presupuesto') {
    renderPresupuesto();
  } else if (activeTab === 'excepciones') {
    renderExcepciones();
  } else if (activeTab === 'auditoria') {
    renderAuditoria();
  } else if (activeTab === 'reportes') {
    renderReportes();
  } else if (activeTab === 'estudiantes') {
    renderEstudiantes();
  }
}

// =============================================================================
// 1. DASHBOARD VIEW
// =============================================================================
function renderDashboard() {
  const excActivas = excepcionesList.filter(e => e.activa === 1).length;
  
  // Calcular consumo presupuestario estimado
  const presTotal = presupuestosList.reduce((sum, p) => sum + (parseFloat(p.total_salario_anual) || 0), 0);

  // Filtrar contratos de Proyecto 1 para este portal
  const p1ContratosFiltered = contratosProyecto1.filter(c => {
    if (currentRole && currentRole.startsWith('Coordinador')) {
      const prog = currentRole.replace('Coordinador ', '').trim();
      return c.programa === prog;
    } else if (currentRole === 'Direccion de Pregrado') {
      const PERFILES_PREGRADO = ['IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV'];
      return PERFILES_PREGRADO.includes(c.programa);
    } else if (currentRole === 'Direccion de Continua') {
      return c.proponente === 'Direccion de Continua';
    } else if (currentRole === 'Direccion de Distancia') {
      return c.proponente === 'Direccion de Distancia';
    }
    return true;
  });

  mainContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${docentesList.length}</div>
        <div class="stat-label">Docentes Registrados</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${asignacionesList.length}</div>
        <div class="stat-label">Asignaciones Activas</div>
      </div>
      <div class="stat-card" style="border-left-color: var(--secondary-color);">
        <div class="stat-number">${excActivas}</div>
        <div class="stat-label">Excepciones Vigentes</div>
      </div>
      <div class="stat-card" style="border-left-color: var(--success);">
        <div class="stat-number" style="font-size: 1.4rem; padding-top: 0.5rem; color: var(--success);">Lps. ${presTotal.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        <div class="stat-label">Presupuesto Anualizado</div>
      </div>
    </div>

    <div class="view-card">
      <h3 class="card-title">Validaciones Recientes de Auditoría</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Docente</th>
              <th>Periodo Obj.</th>
              <th>Resultado</th>
              <th>Hash SHA-256</th>
            </tr>
          </thead>
          <tbody>
            ${logsList.slice(0, 6).map(l => {
              const resBadge = l.resultado_validacion === 'Aprobado' 
                ? '<span class="badge badge-ok">APROBADO</span>' 
                : (l.resultado_validacion.includes('Excepcion') ? '<span class="badge badge-warn">EXCEPCIÓN</span>' : '<span class="badge badge-err">BLOQUEADO</span>');
              return `
                <tr>
                  <td>${escapeHTML(l.timestamp_validacion)}</td>
                  <td><strong>${escapeHTML(l.docente)}</strong></td>
                  <td>Secuencia: ${escapeHTML(l.periodo_objetivo_secuencia)}</td>
                  <td>${resBadge}</td>
                  <td class="hash-cell">${escapeHTML(l.hash_integridad.substring(0, 16))}...</td>
                </tr>
              `;
            }).join('')}
            ${logsList.length === 0 ? '<tr><td colspan="5" class="text-center" style="color:#999; padding: 2rem;">No hay registros de validaciones recientes.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="view-card" style="margin-top: 1.5rem;">
      <h3 class="card-title" style="border-left-color: var(--secondary-color);">🔔 Observaciones y Seguimiento de Mesa Técnica & RR.HH.</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
        Estado en tiempo real de las propuestas enviadas al Proyecto 1, con las correspondientes firmas y observaciones de contratación.
      </p>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Programa</th>
              <th>Asignatura</th>
              <th>Horas</th>
              <th>Fase / Estado</th>
              <th>Observaciones / Firmas</th>
            </tr>
          </thead>
          <tbody>
            ${p1ContratosFiltered.map(c => {
              let badgeClass = 'badge-info';
              if (c.estado === 'CONTRATADO') badgeClass = 'badge-ok';
              else if (c.estado === 'RECHAZADO') badgeClass = 'badge-err';
              else if (c.estado === 'MESA TECNICA') badgeClass = 'badge-warn';
              
              return `
                <tr>
                  <td><strong>${escapeHTML(c.docenteNombre)}</strong><br/><small style="color:#666">${escapeHTML(c.docenteId)}</small></td>
                  <td><span style="font-weight:bold; color:var(--primary-color)">${escapeHTML(c.programa || 'N/A')}</span></td>
                  <td>${escapeHTML(c.asignatura)}</td>
                  <td>${c.horas} hs</td>
                  <td><span class="badge ${badgeClass}">${escapeHTML(c.estado)}</span></td>
                  <td>
                    <div style="font-size: 0.8rem; color: #1a1a1a; max-width: 320px; line-height: 1.4;">
                      ${escapeHTML(c.observaciones || 'Sin observaciones registradas.')}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            ${p1ContratosFiltered.length === 0 ? '<tr><td colspan="6" class="text-center" style="color:#999; padding: 2rem;">No hay propuestas activas enviadas a Proyecto 1 desde este portal.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =============================================================================
// 2. DOCENTES VIEW
// =============================================================================
function renderDocentes() {
  const isCoord = currentRole && currentRole.startsWith('Coordinador');
  let campusValue = 'UDH';
  let progCode = '';
  let gradoValue = 'Licenciatura';

  if (isCoord) {
    progCode = currentRole.replace('Coordinador ', '').trim();
    if (['IMM', 'LEM', 'TUMM', 'TUTM'].includes(progCode)) {
      campusValue = 'UDH';
    } else if (progCode === 'CC.MM') {
      campusValue = 'AMHGFM';
    } else if (progCode === 'CC.AA') {
      campusValue = 'AMAH';
    } else if (progCode === 'CC.NV') {
      campusValue = 'AMNVH';
    }

    if (progCode === 'TUMM' || progCode === 'TUTM') {
      gradoValue = 'Técnico';
    } else {
      gradoValue = 'Licenciatura';
    }
  }

  const options = getCentrosYProgramasPorRol(currentRole);

  const campusFieldHtml = isCoord 
    ? `<input type="text" id="docCampus" value="${campusValue}" readonly style="background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); cursor: not-allowed;" required>`
    : `<select id="docCampus" required>
         ${options.centros.map(c => `<option value="${c}">${c}</option>`).join('')}
       </select>`;

  const progFieldHtml = isCoord
    ? `<input type="text" id="docPrograma" value="${progCode}" readonly style="background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); cursor: not-allowed;" required>`
    : `<select id="docPrograma" required>
         ${options.programas.map(p => `<option value="${p}">${p}</option>`).join('')}
       </select>`;

  const gradoFieldHtml = isCoord
    ? `<input type="text" id="docGrado" value="${gradoValue}" readonly style="background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); cursor: not-allowed;" required>`
    : `<select id="docGrado" required>
         <option value="Licenciatura">Licenciatura</option>
         <option value="Técnico">Técnico</option>
         <option value="Maestría">Maestría</option>
         <option value="Doctorado">Doctorado</option>
       </select>`;

  const filteredDocentes = isCoord 
    ? docentesList.filter(d => d.programa_academico === progCode)
    : docentesList;

  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Registrar Docente del Programa</h3>
      <form id="docenteForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Campus o Centro de Estudio</label>
            ${campusFieldHtml}
          </div>
          <div class="form-group">
            <label>Programa Académico / Perfil</label>
            ${progFieldHtml}
          </div>
          <div class="form-group">
            <label>Sección / Promoción</label>
            <input type="text" id="docSeccion" placeholder="Ej. Sección A - Prom 42" required>
          </div>
          <div class="form-group">
            <label>Grado Académico</label>
            ${gradoFieldHtml}
          </div>
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" id="docNombre" placeholder="Nombre y Apellidos" required>
          </div>
          <div class="form-group">
            <label>Número de DNI</label>
            <input type="text" id="docDni" placeholder="DNI sin guiones" required>
          </div>
          <div class="form-group">
            <label>Cuenta Bancaria</label>
            <input type="text" id="docCuenta" placeholder="Número de cuenta de banco" required>
          </div>
        </div>
        <div class="mt-1 text-right">
          <button type="submit" class="btn btn-primary">Registrar Docente</button>
        </div>
      </form>
    </div>

    <div class="view-card">
      <h3 class="card-title">Docentes Registrados</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>DNI</th>
              <th>Campus</th>
              <th>Programa</th>
              <th>Grado</th>
              <th>Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDocentes.map(d => `
              <tr>
                <td><strong>${escapeHTML(d.nombre_completo)}</strong></td>
                <td>${escapeHTML(d.dni)}</td>
                <td>${escapeHTML(d.campus_centro)}</td>
                <td>${escapeHTML(d.programa_academico)}</td>
                <td>${escapeHTML(d.grado_academico)}</td>
                <td><span class="badge badge-ok">${escapeHTML(d.estado_docente || 'Disponible')}</span></td>
                <td class="text-center">
                  <button class="btn btn-danger btn-sm" onclick="handleEliminarDocente('${d.id_docente}')">Eliminar</button>
                </td>
              </tr>
            `).join('')}
            ${filteredDocentes.length === 0 ? '<tr><td colspan="7" class="text-center" style="color:#999; padding: 2rem;">No hay docentes registrados en la base de datos local.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Automatic toggle for Técnico / Licenciatura based on program selected
  const docProgEl = document.getElementById('docPrograma');
  const docGradoEl = document.getElementById('docGrado');
  if (docProgEl && docGradoEl) {
    const updateGrado = () => {
      const prog = docProgEl.value;
      if (prog === 'TUMM' || prog === 'TUTM') {
        docGradoEl.value = 'Técnico';
      } else {
        docGradoEl.value = 'Licenciatura';
      }
    };
    docProgEl.addEventListener('change', updateGrado);
    updateGrado(); // Run initially
  }

  // Submit Handler
  document.getElementById('docenteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const campus_centro = document.getElementById('docCampus').value;
    const programa_academico = document.getElementById('docPrograma').value;
    const seccion_promocion = document.getElementById('docSeccion').value.trim();
    const grado_academico = document.getElementById('docGrado').value;
    const grado_catedratico_id = grado_academico === 'Licenciatura' ? 1 : (grado_academico === 'Maestría' ? 2 : (grado_academico === 'Técnico' ? 4 : 3));
    const nombre_completo = document.getElementById('docNombre').value.trim();
    const dni = document.getElementById('docDni').value.trim();
    const cuenta_bancaria_encriptada = document.getElementById('docCuenta').value.trim();

    try {
      const res = await window.electronAPI.crearDocente({ 
        campus_centro, 
        programa_academico, 
        seccion_promocion, 
        grado_catedratico_id,
        grado_academico,
        nombre_completo, 
        dni, 
        cuenta_bancaria_encriptada 
      });
      if (res.changes > 0) {
        showToast('Docente registrado de manera exitosa.');
        renderDocentes();
      } else {
        showToast('Error al guardar docente.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error interno del sistema.', 'error');
    }
  });
}

window.handleEliminarDocente = async (id) => {
  if (confirm('¿Está seguro de que desea eliminar este docente? Se borrarán sus asignaciones vinculadas.')) {
    try {
      const res = await window.electronAPI.eliminarDocente(id);
      if (res.changes > 0) {
        showToast('Docente eliminado correctamente.');
        renderDocentes();
      } else {
        showToast('No se pudo eliminar.', 'error');
      }
    } catch (err) {
      showToast('Error de ejecución en SQLite.', 'error');
    }
  }
};

// =============================================================================
// 3. ASIGNACIONES VIEW
// =============================================================================
function renderAsignaciones() {
  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Crear Nueva Asignación</h3>
      <form id="asignacionForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Docente</label>
            <select id="asDocente" required>
              <option value="">-- Seleccione un Docente --</option>
              ${docentesList.map(d => `<option value="${d.id_docente}">${escapeHTML(d.nombre_completo)} (DNI: ${d.dni})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Nombre de la Asignatura</label>
            <input type="text" id="asAsignatura" placeholder="Ej. Control de Servomecanismos" required>
          </div>
          <div class="form-group">
            <label>Código de Periodo</label>
            <input type="text" id="asPeriodo" placeholder="Ej. I PAC 2026" required>
          </div>
          <div class="form-group">
            <label>Secuencia de Periodo (Consecutividad)</label>
            <select id="asSecuencia" required>
              <option value="">-- Seleccione un Docente primero --</option>
            </select>
          </div>
          <div class="form-group">
            <label>Horas Asignadas</label>
            <input type="number" id="asHoras" min="1" placeholder="Ej. 40" required>
          </div>
          <div class="form-group">
            <label>Fecha de Revisión</label>
            <input type="date" id="asFecha" required>
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <input type="text" id="asObs" placeholder="Anotaciones operacionales">
          </div>
        </div>
        <div id="costoCalculado" style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-left: 4px solid #16a34a; display: none;">
          <strong style="color: #166534;">Proyección Financiera:</strong>
          <div style="font-size: 0.9rem; color: #15803d; margin-top: 0.5rem;" id="costoDetalle"></div>
        </div>
        <div class="mt-1 text-right">
          <button type="submit" class="btn btn-primary">Validar y Registrar Asignación</button>
        </div>
      </form>
    </div>

    <div class="view-card">
      <h3 class="card-title">Listado de Asignaciones y Control de Clases</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Docente</th>
              <th>Periodo</th>
              <th>Secuencia</th>
              <th>Disposición Legal</th>
              <th>Estado Clase</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${asignacionesList.map(a => {
              const dispBadge = a.disposicion === 'Asignado' 
                ? '<span class="badge badge-ok">ASIGNADO</span>' 
                : '<span class="badge badge-err">BLOQUEADO CONSECUTIVIDAD</span>';
              
              const claseBadge = a.estado_ejecucion === 'Por Iniciar'
                ? '<span class="badge badge-info">POR INICIAR</span>'
                : `<span class="badge badge-ok">${escapeHTML(a.estado_ejecucion)}</span>`;

              return `
                <tr>
                  <td><strong>${escapeHTML(a.nombre_asignatura)}</strong></td>
                  <td>${escapeHTML(a.docente)}</td>
                  <td>${escapeHTML(a.periodo_codigo)}</td>
                  <td>${escapeHTML(a.periodo_secuencia)}</td>
                  <td>${dispBadge}</td>
                  <td>${claseBadge}</td>
                  <td class="text-center">
                    <button class="btn btn-danger btn-sm" onclick="handleEliminarAsignacion('${a.id_asignacion}')">Eliminar</button>
                  </td>
                </tr>
              `;
            }).join('')}
            ${asignacionesList.length === 0 ? '<tr><td colspan="7" class="text-center" style="color:#999; padding: 2rem;">No hay asignaciones registradas localmente.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Dinamismo para Secuencia
  const docSelect = document.getElementById('asDocente');
  const secSelect = document.getElementById('asSecuencia');
  
  if (docSelect && secSelect) {
    // Dynamic Calculation Logic
    const horasInput = document.getElementById('asHoras');
    const costoDiv = document.getElementById('costoCalculado');
    const costoDetalle = document.getElementById('costoDetalle');

    const updateCalculo = () => {
      const docenteId = docSelect.value;
      const horas = parseInt(horasInput.value) || 0;
      if (!docenteId || horas <= 0) {
        costoDiv.style.display = 'none';
        return;
      }
      const docenteObj = docentesList.find(d => d.id_docente === docenteId);
      let valorHora = 300;
      if (docenteObj) {
        const titulo = (docenteObj.titulo || '').toLowerCase();
        if (titulo.includes('doctorado') || titulo.includes('doctor') || titulo.includes('phd') || titulo.includes('dr.')) {
          valorHora = 550;
        } else if (titulo.includes('maestría') || titulo.includes('maestria') || titulo.includes('master') || titulo.includes('msc')) {
          valorHora = 500;
        } else {
          const prog = (docenteObj.programa_academico || '').toUpperCase();
          if (prog.includes('IMM') || prog.includes('LEM')) {
            valorHora = 375;
          }
        }
      }
      const importeMensual = horas * valorHora;
      const importeTotal = importeMensual * 6; // Proyección de 6 meses
      
      costoDetalle.innerHTML = `
        Precio asignado según título/programa: <strong>L. ${valorHora}/hr</strong><br/>
        Horas asignadas: <strong>${horas} hs</strong><br/>
        Importe Mensual (Simulado): <strong>L. ${importeMensual.toLocaleString()}</strong><br/>
        Total Contrato (Simulado 6 meses): <strong>L. ${importeTotal.toLocaleString()}</strong>
      `;
      costoDiv.style.display = 'block';
    };

    docSelect.addEventListener('change', () => {
      const docenteId = docSelect.value;
      if (!docenteId) {
        secSelect.innerHTML = '<option value="">-- Seleccione un Docente primero --</option>';
        updateCalculo();
        return;
      }
      
      const docAsignaciones = asignacionesList.filter(a => a.id_docente === docenteId);
      const docenteObj = docentesList.find(d => d.id_docente === docenteId);
      const centro = docenteObj ? docenteObj.campus_centro : 'N/A';
      
      const nextSeq = docAsignaciones.length + 1;
      
      secSelect.innerHTML = `<option value="${nextSeq}">Secuencia ${nextSeq} (${docAsignaciones.length} contratos activos en ${centro})</option>`;
      updateCalculo();
    });
    
    horasInput.addEventListener('input', updateCalculo);

    // Trigger on load if there's a selected value
    docSelect.dispatchEvent(new Event('change'));
  }

  // Submit Handler
  document.getElementById('asignacionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_docente = document.getElementById('asDocente').value;
    const nombre_asignatura = document.getElementById('asAsignatura').value.trim();
    const periodo_codigo = document.getElementById('asPeriodo').value.trim();
    const periodo_secuencia = parseInt(document.getElementById('asSecuencia').value);
    const fecha_revision = document.getElementById('asFecha').value;
    const observaciones_asignacion = document.getElementById('asObs').value.trim();

    try {
      const res = await window.electronAPI.crearAsignacion({ 
        id_docente, 
        nombre_asignatura, 
        periodo_codigo, 
        periodo_secuencia, 
        fecha_revision, 
        observaciones_asignacion 
      });
      
      if (res.bloqueado) {
        showToast('Validación fallida: Ruptura de consecutividad detectada. Bloqueo aplicado.', 'error');
      } else if (res.validacion_id === 32) {
        showToast('Alerta: Ruptura autorizada bajo excepción de mecatrónica.', 'warning');
      } else {
        showToast('Asignación validada y registrada perfectamente.');
      }
      
      // Auto-generar línea de ejecución presupuestaria para mantener consistencia
      const docenteObj = docentesList.find(d => d.id_docente === id_docente);
      let valorHora = 300;
      if (docenteObj) {
        const titulo = (docenteObj.titulo || '').toLowerCase();
        if (titulo.includes('doctorado') || titulo.includes('doctor') || titulo.includes('phd') || titulo.includes('dr.')) {
          valorHora = 550;
        } else if (titulo.includes('maestría') || titulo.includes('maestria') || titulo.includes('master') || titulo.includes('msc')) {
          valorHora = 500;
        } else {
          const prog = (docenteObj.programa_academico || '').toUpperCase();
          if (prog.includes('IMM') || prog.includes('LEM')) {
            valorHora = 375;
          }
        }
      }
      const horasInputVal = parseInt(document.getElementById('asHoras').value) || 40;
      const calculatedImporte = horasInputVal * valorHora;
      const calculatedContrato = calculatedImporte * 6;

      await window.electronAPI.crearEjecucion({
        id_asignacion: res.id_asignacion,
        ga: '001',
        ue: 'UDH',
        prog: '01',
        sub_prog: '00',
        a_o: '2026',
        fuente: '11',
        no_linea: '101',
        importe_mensual: calculatedImporte,
        antiguedad_meses: 6,
        contrato_emitido: calculatedContrato,
        estado_actual_asignacion_id: res.bloqueado ? 42 : 41
      });

      // Alimentar Proyecto 1 (Mesa Técnica y RR.HH) de forma automática y dinámica
      try {
        if (docenteObj) {
          // =========================================================================
          // RESOLUCIÓN DE URL DEL SERVIDOR CENTRAL DE CONTRATOS (PROYECTO 1)
          //
          // NOTA: Por defecto es dinámico y usa el mismo hostname que cargó la página.
          // Si necesita forzar un dominio fijo o una IP fija intranet, cambie la constante abajo.
          // Ejemplo: const pro1Url = 'http://contratosespecializados.udh.edu.hn';
          // o: const pro1Url = 'http://192.168.0.2:3001';
          // =========================================================================
          const pro1Url = (typeof window !== 'undefined' && window.location) 
            ? `${window.location.protocol}//${window.location.hostname}:3001`
            : 'http://localhost:3001';
          
          // programa_academico ya contiene 'IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV'
          const payload = {
            docenteId: docenteObj.dni,
            nombre: docenteObj.nombre_completo,
            titulo: docenteObj.grado_academico || 'Licenciatura',
            telefono: docenteObj.telefono || 'N/A',
            correo: docenteObj.correo || 'N/A',
            academia: docenteObj.campus_centro,
            programa: docenteObj.programa_academico, // 'IMM', 'LEM', 'TUMM', 'TUTM', 'CC.MM', 'CC.AA', 'CC.NV'
            asignatura: nombre_asignatura,
            horas: 40,
            periodo: periodo_codigo,
            observaciones: observaciones_asignacion || '',
            proponente: currentRole === 'Direccion de Pregrado' ? 'Dirección de Pregrado' : currentRole
          };
          
          fetch(`${pro1Url}/api/contratos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(r => r.json())
          .then(data => {
            console.log('✅ Sincronización con Mesa Técnica / RR.HH exitosa:', data);
          })
          .catch(err => {
            console.warn('⚠️ No se pudo sincronizar con Proyecto 1 (puede no estar corriendo):', err.message);
          });
        }
      } catch (syncErr) {
        console.error('Error de red al sincronizar:', syncErr);
      }

      renderAsignaciones();
    } catch (err) {
      console.error(err);
      showToast('Error interno de comunicación con el motor SQLite.', 'error');
    }
  });
}

window.handleEliminarAsignacion = async (id) => {
  if (confirm('¿Desea dar de baja esta asignación? Se recalculará el consumo presupuestario.')) {
    try {
      const res = await window.electronAPI.eliminarAsignacion(id);
      if (res.changes > 0) {
        showToast('Asignación removida correctamente del control.');
        renderAsignaciones();
      } else {
        showToast('No se pudo eliminar.', 'error');
      }
    } catch (err) {
      showToast('Error de ejecución en SQLite.', 'error');
    }
  }
};

// =============================================================================
// 4. PRESUPUESTO VIEW
// =============================================================================
function renderPresupuesto() {
  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Control Presupuestario y Ejecución de Gastos</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>GA</th>
              <th>UE</th>
              <th>Prog</th>
              <th>Línea</th>
              <th>Docente</th>
              <th>Asignatura</th>
              <th>Sueldo Base</th>
              <th>Antigüedad (Meses)</th>
              <th>Sueldo Neto</th>
              <th>Total Anual</th>
              <th>Contrato</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${presupuestosList.map(p => {
              const estBadge = p.estado_asignacion === 'Contratado'
                ? '<span class="badge badge-ok">CONTRATADO</span>'
                : '<span class="badge badge-warn">PENDIENTE</span>';

              return `
                <tr>
                  <td>${escapeHTML(p.ga)}</td>
                  <td>${escapeHTML(p.ue)}</td>
                  <td>${escapeHTML(p.prog)}</td>
                  <td>${escapeHTML(p.no_linea)}</td>
                  <td><strong>${escapeHTML(p.docente)}</strong></td>
                  <td>${escapeHTML(p.nombre_asignatura)}</td>
                  <td>L. ${parseFloat(p.importe_mensual).toFixed(2)}</td>
                  <td>${p.antiguedad_meses} meses</td>
                  <td style="font-weight:bold; color:var(--primary-color);">L. ${parseFloat(p.salario_mensual_bruto).toFixed(2)}</td>
                  <td>L. ${parseFloat(p.total_salario_anual).toFixed(2)}</td>
                  <td>L. ${parseFloat(p.contrato_emitido).toFixed(2)}</td>
                  <td>L. ${parseFloat(p.diferencia).toFixed(2)}</td>
                  <td>${estBadge}</td>
                </tr>
              `;
            }).join('')}
            ${presupuestosList.length === 0 ? '<tr><td colspan="13" class="text-center" style="color:#999; padding: 2rem;">No hay registros de control presupuestario vinculados a asignaciones activas.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =============================================================================
// 5. EXCEPCIONES VIEW
// =============================================================================
function renderExcepciones() {
  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Registrar Excepción de Consecutividad</h3>
      <form id="excepcionForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Docente Afectado</label>
            <select id="excDocente" required>
              <option value="">-- Seleccione un Docente --</option>
              ${docentesList.map(d => `<option value="${d.id_docente}">${escapeHTML(d.nombre_completo)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Asignación Objetivo</label>
            <select id="excAsignacion" required>
              <option value="">-- Seleccione una Asignación --</option>
              ${asignacionesList.map(a => `<option value="${a.id_asignacion}">${escapeHTML(a.nombre_asignatura)} (${escapeHTML(a.docente)})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Tipo de Excepción</label>
            <input type="text" id="excTipo" placeholder="Escriba el tipo de excepción" required>
          </div>
          <div class="form-group">
            <label>Justificación Detallada</label>
            <input type="text" id="excJust" placeholder="Motivo que autoriza el traslape" required>
          </div>
          <div class="form-group">
            <label>Fecha de Vencimiento de Excepción</label>
            <input type="date" id="excVence" required>
          </div>
        </div>
        <div class="mt-1 text-right">
          <button type="submit" class="btn btn-primary">Registrar y Validar Excepción</button>
        </div>
      </form>
    </div>

    <div class="view-card">
      <h3 class="card-title">Excepciones Registradas y Vigentes</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Asignatura</th>
              <th>Tipo</th>
              <th>Justificación</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Hash SHA-256</th>
            </tr>
          </thead>
          <tbody>
            ${excepcionesList.map(e => {
              const actBadge = e.activa === 1
                ? '<span class="badge badge-ok">ACTIVA</span>'
                : '<span class="badge badge-err">VENCIDA</span>';

              return `
                <tr>
                  <td><strong>${escapeHTML(e.docente)}</strong></td>
                  <td>${escapeHTML(e.nombre_asignatura)}</td>
                  <td>${escapeHTML(e.tipo_emergencia)}</td>

                  <td>${escapeHTML(e.justificacion_detallada)}</td>
                  <td>${escapeHTML(e.fecha_vencimiento || 'N/A')}</td>
                  <td>${actBadge}</td>
                  <td class="hash-cell">${escapeHTML(e.hash_registro.substring(0, 16))}...</td>
                </tr>
              `;
            }).join('')}
            ${excepcionesList.length === 0 ? '<tr><td colspan="8" class="text-center" style="color:#999; padding: 2rem;">No hay excepciones cargadas en el sistema de control.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Submit Handler
  document.getElementById('excepcionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_docente = document.getElementById('excDocente').value;
    const id_asignacion = document.getElementById('excAsignacion').value;
    const excTipoText = document.getElementById('excTipo').value.trim();
    const excJustText = document.getElementById('excJust').value.trim();
    const justificacion_detallada = 'TIPO: ' + excTipoText + ' | ' + excJustText;

    try {
      const res = await window.electronAPI.crearExcepcion({ 
        id_docente, 
        id_asignacion, 
        periodo_secuencia_objetivo: 0, 
        tipo_emergencia_id: 4, 
        justificacion_detallada, 
        fecha_vencimiento 
      });
      if (res.id_excepcion) {
        showToast('Excepción registrada exitosamente. Se aplicará en las siguientes auditorías.');
        renderExcepciones();
      } else {
        showToast('Error guardando excepción.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error interno de base de datos.', 'error');
    }
  });
}

// =============================================================================
// 6. AUDITORIA VIEW
// =============================================================================
function renderAuditoria() {
  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Log Completo de Auditoría - Consecutividad</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha/Hora</th>
              <th>Docente</th>
              <th>Periodo Ant.</th>
              <th>Periodo Obj.</th>
              <th>Resultado</th>
              <th>Excepción</th>
              <th>Autorizador</th>
              <th>Hash SHA-256</th>
            </tr>
          </thead>
          <tbody>
            ${logsList.map(l => {
              const resBadge = l.resultado_validacion === 'Aprobado' 
                ? '<span class="badge badge-ok">APROBADO</span>' 
                : (l.resultado_validacion.includes('Excepcion') ? '<span class="badge badge-warn">EXCEPCIÓN</span>' : '<span class="badge badge-err">BLOQUEADO</span>');
              
              const excBadge = l.excepcion_aplicada === 1
                ? '<span class="badge badge-info">SI</span>'
                : '<span class="badge badge-err">NO</span>';

              return `
                <tr>
                  <td>${l.id_log.substring(0, 8)}...</td>
                  <td>${escapeHTML(l.timestamp_validacion)}</td>
                  <td><strong>${escapeHTML(l.docente)}</strong></td>
                  <td>Secuencia: ${l.periodo_anterior_secuencia}</td>
                  <td>Secuencia: ${l.periodo_objetivo_secuencia}</td>
                  <td>${resBadge}</td>
                  <td>${excBadge}</td>
                  <td>${escapeHTML(l.usuario_autorizador || 'SISTEMA')}</td>
                  <td class="hash-cell">${escapeHTML(l.hash_integridad)}</td>
                </tr>
              `;
            }).join('')}
            ${logsList.length === 0 ? '<tr><td colspan="9" class="text-center" style="color:#999; padding: 2rem;">El registro de auditoría de consecutividad está vacío.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Cache local para reportes
let activeReportType = null;
let activeReportData = [];

function renderReportes() {
  mainContent.innerHTML = `
    <div class="view-card">
      <h3 class="card-title">Generación y Visualización de Reportes Oficiales</h3>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Haga clic en cualquiera de las siguientes opciones para consultar la base de datos en tiempo real, visualizar la planilla directamente en pantalla y exportar el reporte oficial firmado digitalmente.
      </p>
      
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <button class="btn btn-primary" onclick="visualizarReporte('docentes')" style="padding: 1rem 2rem; font-size: 1rem;">
          📋 Ver Formato Base Catedráticos
        </button>
        <button class="btn btn-primary" onclick="visualizarReporte('presupuesto')" style="padding: 1rem 2rem; font-size: 1rem; background-color: var(--secondary-color);">
          📊 Ver Ejecución Presupuestaria
        </button>
      </div>

      <div id="reportActionBox" class="hidden" style="margin-bottom: 1.5rem; text-align: right;">
        <button class="btn btn-success" onclick="descargarReporteActivo()" style="padding: 0.8rem 1.5rem;">
          📥 Descargar Reporte en Excel (CSV)
        </button>
      </div>

      <div id="reportTableContainer" class="table-container" style="max-height: 500px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">
        <p style="color: #999; padding: 2rem; text-align: center;">Seleccione un reporte de arriba para visualizar sus datos correspondientes.</p>
      </div>
    </div>

    <div class="view-card">
      <h3 class="card-title">Integridad Digital HASH</h3>
      <p style="font-size: 0.85rem; line-height: 1.6;">
        Cada archivo exportado y fila visualizada contiene firmas digitales enlazadas criptográficamente (SHA-256) a la base de datos local SQLite de mecatrónica de la Universidad de Defensa de Honduras.
      </p>
    </div>
  `;
}

window.visualizarReporte = async (tipo) => {
  activeReportType = tipo;
  const container = document.getElementById('reportTableContainer');
  const actionBox = document.getElementById('reportActionBox');
  container.innerHTML = '<p style="color:#999; padding:2rem; text-align:center;">Consultando base de datos SQLite...</p>';
  actionBox.classList.add('hidden');

  try {
    const data = tipo === 'docentes' 
      ? await window.electronAPI.getReporteDocentes() 
      : await window.electronAPI.getReportePresupuesto();
    
    activeReportData = data || [];
    
    if (activeReportData.length === 0) {
      container.innerHTML = '<p style="color:#999; padding:2rem; text-align:center;">No hay registros cargados para este reporte.</p>';
      return;
    }

    actionBox.classList.remove('hidden');
    const headers = Object.keys(activeReportData[0]);

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${escapeHTML(h.replace(/_/g, ' ').toUpperCase())}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${activeReportData.map(row => `
            <tr>
              ${headers.map(h => `<td>${escapeHTML(row[h] !== null && row[h] !== undefined ? row[h] : '')}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:var(--danger); padding:2rem; text-align:center;">Error consultando las vistas de la base de datos SQLite.</p>';
  }
};

window.descargarReporteActivo = () => {
  if (activeReportData.length === 0) return;
  if (activeReportType === 'docentes') {
    exportToCSV(activeReportData, `vw_formato_base_docentes_completo_${new Date().toISOString().substring(0,10)}.csv`);
    showToast('Reporte Base de Docentes exportado de manera exitosa.');
  } else {
    exportToCSV(activeReportData, `vw_control_ejecucion_presupuestaria_completo_${new Date().toISOString().substring(0,10)}.csv`);
    showToast('Reporte Ejecución Presupuestaria exportado perfectamente.');
  }
};

// =============================================================================
// CSV HIGH-FIDELITY EXPORTER (UTF-8 WITH BOM FOR PERFECT EXCEL ALIGNMENT)
// =============================================================================
function exportToCSV(data, filename) {
  if (data.length === 0) {
    showToast('No hay datos disponibles para exportar en este periodo.', 'error');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName].toString();
      cell = cell.replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(','))
  ].join('\r\n');

  // Agregar el BOM UTF-8 (0xEF, 0xBB, 0xBF) para que Excel abra la eñe y acentos correctamente
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =============================================================================
// STUDENT REPORT VIEW - DOCENTE SEARCH SYSTEM
// =============================================================================
async function renderEstudiantes() {
  mainContent.innerHTML = `
    <div class="view-card" style="position: relative; overflow: hidden; padding: 2.5rem; border-radius: 16px; background: linear-gradient(135deg, rgba(20,20,35,0.85) 0%, rgba(10,10,20,0.95) 100%); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%); filter: blur(50px); pointer-events: none;"></div>
      
      <h2 style="font-size: 1.8rem; font-weight: 700; background: linear-gradient(90deg, #fff 0%, var(--primary-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.8rem;">
        <img src="udh-tiger-icon.png" style="height: 35px; width: 35px; vertical-align: middle; filter: drop-shadow(0 0 5px var(--primary-color));"> Reportes Estudiantiles Anónimos Recibidos
      </h2>
      <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; max-width: 650px;">
        Incidencias, quejas y propuestas enviadas de forma 100% anónima por los estudiantes de pregrado desde el Portal Estudiantil (Proyecto 3).
      </p>

      <div id="studentReportsTableContainer">
        <p style="color: #999; padding: 2rem; text-align: center;">Consultando reportes estudiantiles en el servidor central...</p>
      </div>
    </div>
  `;

  try {
    // =========================================================================
    // RESOLUCIÓN DE URL DEL SERVIDOR CENTRAL DE CONTRATOS (PROYECTO 1)
    //
    // NOTA: Por defecto es dinámico y usa el mismo hostname que cargó la página.
    // Si necesita forzar un dominio fijo o una IP fija intranet, cambie la constante abajo.
    // Ejemplo: const pro1Url = 'http://contratosespecializados.udh.edu.hn';
    // o: const pro1Url = 'http://192.168.0.2:3001';
    // =========================================================================
    const pro1Url = (typeof window !== 'undefined' && window.location) 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';
    const res = await fetch(`${pro1Url}/api/reportes-estudiantes`);
    if (!res.ok) throw new Error('Error al conectar con la API central');
    const allReports = await res.json();
    
    let filteredReports = [];
    if (currentRole === 'DREV') {
      filteredReports = allReports;
    } else if (currentRole && currentRole.startsWith('Coordinador')) {
      const prog = currentRole.replace('Coordinador ', '').trim();
      // Coordinators cannot see 'Coordinador de Carrera' reports. Only DREV can see them.
      filteredReports = allReports.filter(r => r.programa === prog && r.tipo_reporte !== 'Coordinador de Carrera');
    }

    const container = document.getElementById('studentReportsTableContainer');
    if (filteredReports.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <p style="color: #666; font-size: 1rem; margin: 0;">No hay quejas o reportes anónimos registrados para su programa en este periodo.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="max-height: 500px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Programa</th>
              <th>Dirigido A</th>
              <th>Detalles</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.map(r => `
              <tr>
                <td><strong style="color: var(--secondary-color);">${escapeHTML(r.tipo_reporte)}</strong></td>
                <td><span class="badge badge-info" style="font-size: 0.8rem;">🎓 ${escapeHTML(r.programa)}</span></td>
                <td><strong>${escapeHTML(r.dirigido_a)}</strong></td>
                <td>
                  <div style="max-width: 350px; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; color: #ccc;">
                    ${escapeHTML(r.detalles)}
                  </div>
                </td>
                <td><small style="color: #888;">${new Date(r.fecha).toLocaleString()}</small></td>
                <td>
                  <span class="badge ${r.estado === 'PENDIENTE' ? 'badge-err' : 'badge-ok'}">
                    ${escapeHTML(r.estado)}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('studentReportsTableContainer').innerHTML = `
      <div style="padding: 2.5rem; background: rgba(255, 60, 60, 0.05); border: 1px solid rgba(255, 60, 60, 0.2); border-radius: 12px; text-align: center;">
        <h4 style="color: var(--danger); font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Error de Conexión</h4>
        <p style="color: #999; margin: 0; font-size: 0.95rem;">No se pudieron recuperar los reportes del servidor central (puerto 3001).</p>
      </div>
    `;
  }
}

// =============================================================================
// APP INITIALIZATION
// =============================================================================
window.addEventListener('DOMContentLoaded', () => {
  if (currentRole) {
    login(currentRole);
  } else {
    logout();
  }
});
