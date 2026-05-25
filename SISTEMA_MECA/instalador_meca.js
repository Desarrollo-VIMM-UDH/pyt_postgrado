import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const ROOT = path.resolve(__dirname);
const SISTEMA_MECA = path.join(ROOT, 'SISTEMA_MECA');

// ANSI colors for pretty output
const C = '\x1b[36m';
const V = '\x1b[32m';
const R = '\x1b[31m';
const X = '\x1b[0m';

function log(color, msg) {
  console.log(color + msg + X);
}

function crearCarpeta(ruta, desc) {
  if (!fs.existsSync(ruta)) {
    fs.mkdirSync(ruta, { recursive: true });
    log(V, `  [OK] ${desc} creada.`);
  }
}

function instalar(cwd) {
  log(C, `  Instalando dependencias en ${cwd}...`);
  const r = spawnSync('npm', ['install', '--legacy-peer-deps'], {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  if (r.status !== 0) {
    log(R, '  [ERROR] Falló la instalación.');
    process.exit(1);
  }
  log(V, '  [OK] Dependencias instaladas.');
}

function obtenerIP() {
  for (const net of Object.values(os.networkInterfaces())) {
    for (const iface of net) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

function main() {
  console.clear();
  log(C, '=== Instalador SISTEMA_MECA ===');

  // Paso 1: crear carpeta uploads si no existe
  crearCarpeta(path.join(SISTEMA_MECA, 'uploads'), 'Carpeta uploads');

  // Paso 2: npm install
  instalar(SISTEMA_MECA);

  // Paso 3: información de acceso
  const ip = obtenerIP();
  console.log();
  log(V, '  Instalación completada.');
  console.log();
  log(C, '  Acceso local:');
  log(V, `    http://localhost:3003`);
  log(C, '  Acceso desde red:');
  log(V, `    http://${ip}:3003`);
  console.log();
  log(C, '  Ejecutá "npm start" para lanzar todos los servicios.');
}

main();
