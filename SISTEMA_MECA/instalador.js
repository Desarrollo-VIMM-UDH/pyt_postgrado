import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SISTEMA_DOCENTES = path.join(ROOT, 'sistema_docentes');
const SISTEMA_REPORTES = path.join(ROOT, 'sistema_reportes');

// ── Colores ANSI ──
const V = '\x1b[32m';
const A = '\x1b[33m';
const R = '\x1b[31m';
const C = '\x1b[36m';
const B = '\x1b[1m';
const X = '\x1b[0m';

const line = () => console.log(C + '═'.repeat(60) + X);
const log = (c, m) => console.log(c + m + X);

// ── Utilidades ──
function esAdmin() {
  try { execSync('net session', { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function obtenerIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets) {
      if (n.family === 'IPv4' && !n.internal) return n.address;
    }
  }
  return 'localhost';
}

function crearCarpeta(ruta, desc) {
  if (!fs.existsSync(ruta)) {
    fs.mkdirSync(ruta, { recursive: true });
    log(V, `  [OK] ${desc} creada.`);
  }
}

function instalar(nombre, cwd, flags = []) {
  log(A, `  Instalando ${nombre}...`);
  const r = spawnSync('npm', ['install', '--legacy-peer-deps', ...flags], {
    cwd, stdio: 'inherit', shell: true
  });
  if (r.status !== 0) {
    log(R, `  [ERROR] Fallo la instalacion de ${nombre}`);
    process.exit(1);
  }
  log(V, `  [OK] ${nombre} listo.`);
}

function configurarFirewall() {
  const reglas = [
    { p: 3001, n: 'UDH-Puerto-3001', d: 'API Contratos' },
    { p: 5173, n: 'UDH-Puerto-5173', d: 'Dashboard Admin' },
    { p: 3002, n: 'UDH-Puerto-3002', d: 'Portal Coordinadores' },
    { p: 3003, n: 'UDH-Puerto-3003', d: 'Portal Estudiantil' },
  ];
  for (const { p, n, d } of reglas) {
    try {
      execSync(`netsh advfirewall firewall show rule name="${n}"`, { stdio: 'ignore' });
      log(V, `  [OK] Puerto ${p} (${d}) ya habilitado.`);
    } catch {
      try {
        execSync(
          `netsh advfirewall firewall add rule name="${n}" protocol=TCP dir=in localport=${p} action=allow`,
          { stdio: 'ignore' }
        );
        log(V, `  [OK] Puerto ${p} (${d}) habilitado.`);
      } catch {
        log(R, `  [!] No se pudo abrir puerto ${p}. Configure manualmente.`);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  INSTALADOR PRINCIPAL
// ══════════════════════════════════════════════════════════════
function main() {
  console.clear();
  line();
  log(C, B + '  UNIVERSIDAD DE DEFENSA DE HONDURAS' + X);
  log(C, '  Sistema Integral de Gestion Academica');
  log(C, '  Instalador Automatico v3.0');
  line();
  console.log();
  log(A, '  Este asistente configurara los 3 subsistemas:');
  log(X, '    [1] Central de Contratos   (Puerto 3001 / 5173)');
  log(X, '    [2] Portal Coordinadores   (Puerto 3002)');
  log(X, '    [3] Portal Estudiantil     (Puerto 3003)');
  console.log();

  // ── Paso 1: Node.js ──
  log(C, '  [1/5] Verificando Node.js...');
  const npm = spawnSync('npm', ['-v'], { shell: true, encoding: 'utf8' });
  log(V, `  [OK] Node.js ${process.version}  |  npm v${(npm.stdout || '').trim()}`);

  // ── Paso 2: Proyecto 1 ──
  console.log();
  log(C, '  [2/5] Configurando Proyecto 1 - Central de Contratos...');
  crearCarpeta(path.join(ROOT, 'server', 'uploads'), 'Carpeta uploads');
  const tiene1 = fs.existsSync(path.join(ROOT, 'node_modules'));
  instalar('Proyecto 1 (Contratos)', ROOT, tiene1 ? ['--prefer-offline'] : []);

  // ── Paso 3: Proyecto 2 ──
  console.log();
  log(C, '  [3/5] Configurando Proyecto 2 - Portal Coordinadores...');
  crearCarpeta(path.join(SISTEMA_DOCENTES, 'database'), 'Carpeta BD Proyecto 2');
  const tiene2 = fs.existsSync(path.join(SISTEMA_DOCENTES, 'node_modules'));
  instalar('Proyecto 2 (Coordinadores)', SISTEMA_DOCENTES,
    tiene2 ? ['--ignore-scripts', '--prefer-offline'] : ['--ignore-scripts']);

  // ── Paso 4: Proyecto 3 ──
  console.log();
  log(C, '  [4/5] Configurando Proyecto 3 - Portal Estudiantil...');
  const tiene3 = fs.existsSync(path.join(SISTEMA_REPORTES, 'node_modules'));
  instalar('Proyecto 3 (Estudiantes)', SISTEMA_REPORTES, tiene3 ? ['--prefer-offline'] : []);

  // ── Paso 5: Firewall ──
  console.log();
  log(C, '  [5/5] Configurando reglas de Firewall...');
  if (esAdmin()) {
    configurarFirewall();
  } else {
    log(A, '  [!] No se ejecuto como Administrador.');
    log(A, '      Firewall NO configurado. Para acceso en red, ejecute:');
    log(A, '      powershell -Command "Start-Process node -ArgumentList \'instalador.js\' -Verb RunAs"');
  }

  // ── Resumen ──
  const ip = obtenerIP();
  console.log();
  line();
  log(V, B + '  INSTALACION COMPLETADA EXITOSAMENTE' + X);
  line();
  console.log();
  log(V, '  Los 3 sistemas estan listos para operar.');
  console.log();
  log(C, '  INICIO DIARIO:');
  log(X, '    node arrancar.js');
  console.log();
  log(C, '  ACCESO LOCAL:');
  log(X, `    Dashboard Admin     -> http://localhost:5173`);
  log(X, `    Portal Coordinad.   -> http://localhost:3002`);
  log(X, `    Portal Estudiantes  -> http://localhost:3003`);
  console.log();
  log(C, '  ACCESO DESDE OTRA PC EN LA RED:');
  log(X, `    Dashboard Admin     -> http://${ip}:5173`);
  log(X, `    Portal Coordinad.   -> http://${ip}:3002`);
  log(X, `    Portal Estudiantes  -> http://${ip}:3003`);
  console.log();
  log(A, '  Para ver la IP:  node ver_ip.js');
  console.log();
}

main();
