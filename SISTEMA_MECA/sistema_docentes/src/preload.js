const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Catalogos
  getCatalogo: (tabla) => ipcRenderer.invoke('db:catalogo', tabla),
  
  // Docentes
  getDocentes: () => ipcRenderer.invoke('db:docentes'),
  crearDocente: (datos) => ipcRenderer.invoke('db:docente:crear', datos),
  eliminarDocente: (id) => ipcRenderer.invoke('db:docente:eliminar', id),
  
  // Asignaciones
  getAsignaciones: () => ipcRenderer.invoke('db:asignaciones'),
  crearAsignacion: (datos) => ipcRenderer.invoke('db:asignacion:crear', datos),
  eliminarAsignacion: (id) => ipcRenderer.invoke('db:asignacion:eliminar', id),
  
  // Ejecucion presupuestaria
  getEjecucion: () => ipcRenderer.invoke('db:ejecucion'),
  crearEjecucion: (datos) => ipcRenderer.invoke('db:ejecucion:crear', datos),
  
  // Excepciones
  getExcepciones: () => ipcRenderer.invoke('db:excepciones'),
  crearExcepcion: (datos) => ipcRenderer.invoke('db:excepcion:crear', datos),
  
  // Auditoria
  getAuditoria: () => ipcRenderer.invoke('db:auditoria'),
  
  // Reportes
  getReporteDocentes: () => ipcRenderer.invoke('db:reporte:docentes'),
  getReportePresupuesto: () => ipcRenderer.invoke('db:reporte:presupuesto'),
  
  // Stats
  getStats: () => ipcRenderer.invoke('db:stats'),
  
  // Validacion
  validarPago: (docenteId, periodo) => ipcRenderer.invoke('db:validar-pago', docenteId, periodo),
  
  // Utilidades
  generarHash: (datos) => {
    const str = JSON.stringify(datos);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
});
