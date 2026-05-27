import { spawnSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SISTEMA_DOCENTES = path.join(ROOT, 'sistema_docentes');
const SISTEMA_REPORTES = path.join(ROOT, 'sistema_reportes');

const VERDE   = '\x1b[32m';
const AMARILLO = '\x1b[33m';
const ROJO    = '\x1b[31m';
const CYAN    = '\x1b[36m';
const RESET   = '\x1b[0m';

function log(color, msg) {
  console.log(color + msg + RESET);
}

function instalar(nombre, cwd, extraFlags = []) {
  log(AMARILLO, `\n[INSTALANDO] ${nombre}...`);
  const result = spawnSync('npm', ['install', '--legacy-peer-deps', ...extraFlags], {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  if (result.status !== 0) {
    log(ROJO, `[ERROR] Fallo la instalacion de ${nombre}`);
    process.exit(1);
  }
  log(VERDE, `[OK] ${nombre} instalado.`);
}

function tienePaquete(cwd, paquete) {
  try {
    const requireDesdeProyecto = createRequire(path.join(cwd, 'package.json'));
    requireDesdeProyecto.resolve(paquete);
    return true;
  } catch {
    return false;
  }
}

function proyectoListo(cwd, paquetes) {
  if (!fs.existsSync(path.join(cwd, 'node_modules'))) return false;
  return paquetes.every((paquete) => tienePaquete(cwd, paquete));
}

function crearCarpeta(ruta) {
  if (!fs.existsSync(ruta)) {
    fs.mkdirSync(ruta, { recursive: true });
  }
}

function obtenerIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function iniciarServicio(nombre, comando, args, cwd, color) {
  const proc = spawn(comando, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(color + `[${nombre}] ` + RESET + data.toString());
  });

  proc.stderr.on('data', (data) => {
    const texto = data.toString();
    if (!texto.includes('ExperimentalWarning') && !texto.includes('DeprecationWarning')) {
      process.stderr.write(ROJO + `[${nombre} ERR] ` + RESET + texto);
    }
  });

  proc.on('error', (err) => {
    log(ROJO, `[${nombre}] Error al iniciar: ${err.message}`);
  });

  return proc;
}

async function main() {
  console.clear();
  log(CYAN, '============================================================');
  log(CYAN, '   UNIVERSIDAD DE DEFENSA DE HONDURAS');
  log(CYAN, '   Sistema Integral de Gestion Academica');
  log(CYAN, '============================================================');

  log(AMARILLO, '\n[FASE 1] Verificando dependencias...\n');

  const npmVer = spawnSync('npm', ['-v'], { shell: true, encoding: 'utf8' }).stdout.trim();
  log(VERDE, `Node.js: ${process.version}  |  npm: ${npmVer}`);

  crearCarpeta(path.join(ROOT, 'server', 'uploads'));
  crearCarpeta(path.join(SISTEMA_DOCENTES, 'database'));

  const falta1 = !proyectoListo(ROOT, ['express', 'vite']);
  const falta2 = !proyectoListo(SISTEMA_DOCENTES, ['express', 'better-sqlite3']);
  const falta3 = !proyectoListo(SISTEMA_REPORTES, ['express', 'cors']);

  if (falta1) instalar('Proyecto 1 (Contratos)', ROOT);
  else log(VERDE, '[OK] Proyecto 1 ya instalado.');

  if (falta2) instalar('Proyecto 2 (Coordinadores)', SISTEMA_DOCENTES);
  else log(VERDE, '[OK] Proyecto 2 ya instalado.');

  if (falta3) instalar('Proyecto 3 (Estudiantes)', SISTEMA_REPORTES);
  else log(VERDE, '[OK] Proyecto 3 ya instalado.');

  const ip = obtenerIP();

  log(AMARILLO, '\n[FASE 2] Iniciando los 4 servicios...\n');

  iniciarServicio('API :3001',        'node', ['server/index.js'],                ROOT, '\x1b[36m');
  iniciarServicio('Coordinad :3002',  'node', ['sistema_docentes/src/server.js'], ROOT, '\x1b[35m');
  iniciarServicio('Estudiant :3003',  'node', ['sistema_reportes/src/server.js'], ROOT, '\x1b[34m');

  await new Promise(r => setTimeout(r, 1500));

  iniciarServicio('Vite :5173',       'npx',  ['vite', '--host', '0.0.0.0'],     ROOT, '\x1b[33m');

  await new Promise(r => setTimeout(r, 3000));

  log(CYAN,  '\n============================================================');
  log(VERDE, '   TODOS LOS SERVICIOS OPERATIVOS');
  log(CYAN,  '============================================================');
  log(VERDE, `\n   Dashboard Admin     ->  http://localhost:5173`);
  log(VERDE, `   Coordinadores      ->  http://localhost:3002`);
  log(VERDE, `   Portal Estudiantil ->  http://localhost:3003`);
  log(CYAN,  `\n   Acceso desde red:`);
  log(VERDE, `   Dashboard Admin     ->  http://${ip}:5173`);
  log(VERDE, `   Coordinadores      ->  http://${ip}:3002`);
  log(VERDE, `   Portal Estudiantil ->  http://${ip}:3003`);
  log(CYAN,  '\n   Presione Ctrl+C para detener todos los servicios.\n');

  process.on('SIGINT', () => {
    log(ROJO, '\n[SISTEMA] Deteniendo servicios...');
    process.exit(0);
  });
}

main().catch(err => {
  log(ROJO, `Error critico: ${err.message}`);
  process.exit(1);
});
