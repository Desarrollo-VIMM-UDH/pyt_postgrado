# GUIA DE MIGRACION Y CONFIGURACION DE DOMINIOS UDH

Este documento detalla las modificaciones exactas a realizar en el codigo fuente para sustituir las direcciones locales de prueba por los dominios oficiales de la Universidad de Defensa de Honduras.

---

## 1. Proyecto 3: Portal de Denuncias Estudiantiles Anonimas
* **Archivo a modificar**: sistema_reportes/src/index.html
* **Ubicacion**: Linea 454
* **Texto original**:
  ```javascript
  const CENTRAL_BACKEND_URL = 'http://localhost:3001';
  ```
* **Accion**: Cambie 'http://localhost:3001' por el nuevo dominio de red o IP publica asignado al servidor central del Proyecto 1.
* **Ejemplos**:
  * Para IP de red:
    ```javascript
    const CENTRAL_BACKEND_URL = 'http://192.168.0.2:3001';
    ```
  * Para dominio oficial:
    ```javascript
    const CENTRAL_BACKEND_URL = 'http://reportes.udh.edu.hn:3001';
    ```

---

## 2. Proyecto 2: Portal de Coordinadores y Docentes
* **Archivo a modificar**: sistema_docentes/src/renderer.js
* **Ubicacion 1**: Linea 256
* **Ubicacion 2**: Linea 787
* **Ubicacion 3**: Linea 1243
* **Texto original**:
  ```javascript
  const pro1Url = (typeof window !== 'undefined' && window.location) 
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001';
  ```
* **Accion**: Si prefiere deshabilitar la resolucion dinamica y fijar un dominio estatico, reemplace todo el bloque de arriba por una sola linea con el dominio correspondiente.
* **Ejemplo**:
  ```javascript
  const pro1Url = 'http://contratosoft.udh.edu.hn';
  ```

---

## 3. Proyecto 1: Sistema de Gestion de Contratos
* **Archivo a modificar**: src/hooks/useDataStore.js
* **Ubicacion**: Linea 13
* **Texto original**:
  ```javascript
  const getApiUrl = () => {
    return `http://${window.location.hostname}:3001/api`;
  };
  ```
* **Accion**: Si prefiere deshabilitar la resolucion dinamica y fijar un dominio estatico para el consumo de la API, reemplace la funcion por un valor estatico.
* **Ejemplo**:
  ```javascript
  const getApiUrl = () => {
    return 'http://contratosapi.udh.edu.hn/api';
  };
  ```

---
Universidad de Defensa de Honduras - Facultad de Ingenieria Mecatronica
