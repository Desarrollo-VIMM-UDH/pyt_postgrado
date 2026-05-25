import { useState, useEffect } from 'react';

// =========================================================================
// CONFIGURACION DE CONEXION AL BACKEND DE CONTRATOS
// =========================================================================
const getApiUrl = () => {
  return `http://${window.location.hostname}:3001/api`;
};

export const useDataStore = () => {
  const [docentes, setDocentes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [pregradoDocentes, setPregradoDocentes] = useState([]);
  const [pregradoContratos, setPregradoContratos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = getApiUrl();

  const fetchData = async () => {
    try {
      const resDocentes = await fetch(`${API_URL}/docentes`);
      const dataDocentes = await resDocentes.json();
      setDocentes(dataDocentes);

      const resContratos = await fetch(`${API_URL}/contratos`);
      const dataContratos = await resContratos.json();
      setContratos(dataContratos);

      // Fetch pregrado docentes
      try {
        const resPreDoc = await fetch(`http://${window.location.hostname}:3002/api/docentes`);
        if (resPreDoc.ok) {
          const preDocData = await resPreDoc.json();
          setPregradoDocentes(preDocData || []);
        }
      } catch (e) {
        console.warn('No se pudo conectar con el servidor de Pregrado para obtener docentes.');
      }

      // Fetch pregrado asignaciones
      try {
        const resPreAsig = await fetch(`http://${window.location.hostname}:3002/api/asignaciones`);
        if (resPreAsig.ok) {
          const preAsigData = await resPreAsig.json();
          setPregradoContratos(preAsigData || []);
        }
      } catch (e) {
        console.warn('No se pudo conectar con el servidor de Pregrado para obtener asignaciones.');
      }

    } catch (err) {
      console.error('Error fetching data from SQL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addPropuesta = async (docenteData, contratoData, cvFile) => {
    const formData = new FormData();
    
    // Append all data
    formData.append('docenteId', docenteData.id);
    formData.append('nombre', docenteData.nombre);
    formData.append('titulo', docenteData.titulo);
    formData.append('telefono', docenteData.telefono);
    formData.append('correo', docenteData.correo);
    
    formData.append('academia', contratoData.academia);
    formData.append('programa', contratoData.programa || '');
    formData.append('asignatura', contratoData.asignatura);
    formData.append('horas', contratoData.horas);
    formData.append('periodo', contratoData.periodo);
    formData.append('observaciones', contratoData.observaciones);
    formData.append('proponente', contratoData.proponente);

    if (contratoData.excepcion) {
      formData.append('excepcion', contratoData.excepcion);
    }
    if (contratoData.justificacionExcepcion) {
      formData.append('justificacionExcepcion', contratoData.justificacionExcepcion);
    }

    if (cvFile) {
      formData.append('cv', cvFile);
    }

    try {
      const response = await fetch(`${API_URL}/contratos`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving data:', err);
      return false;
    }
  };

  const updateContratoEstado = async (id, nuevoEstado, observaciones) => {
    try {
      const bodyPayload = { estado: nuevoEstado };
      if (observaciones !== undefined) bodyPayload.observaciones = observaciones;
      
      const res = await fetch(`${API_URL}/contratos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getDocenteById = (id) => {
    const postDoc = docentes.find(d => d.id === id);
    if (postDoc) return postDoc;
    const preDoc = pregradoDocentes.find(d => d.dni === id);
    if (preDoc) {
      return {
        id: preDoc.dni,
        nombre: preDoc.nombre_completo,
        titulo: preDoc.grado_academico,
        telefono: preDoc.telefono || '',
        correo: preDoc.correo || ''
      };
    }
    return null;
  };

  const getContratosActivos = (docenteId) => {
    const activePost = contratos.filter(c => c.docenteId === docenteId && c.estado !== 'RECHAZADO');
    const activePre = pregradoContratos.filter(c => c.dni === docenteId && c.disposicion_id === 11);
    
    return [
      ...activePost.map(c => ({
        tipo: 'Postgrado',
        programa: c.programa,
        periodo: c.periodo,
        academia: c.academia
      })),
      ...activePre.map(c => ({
        tipo: 'Pregrado',
        programa: c.nombre_asignatura,
        periodo: c.periodo_codigo,
        academia: 'Pregrado'
      }))
    ];
  };

  const calculateTotalHours = (docenteId) => {
    return contratos
      .filter(c => c.docenteId === docenteId && c.estado !== 'RECHAZADO')
      .reduce((sum, current) => sum + Number(current.horas), 0);
  };

  return {
    docentes,
    contratos,
    pregradoDocentes,
    pregradoContratos,
    isLoading,
    addPropuesta,
    updateContratoEstado,
    getDocenteById,
    getContratosActivos,
    calculateTotalHours,
    apiUrl: API_URL
  };
};
