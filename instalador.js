import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SISTEMA_DOCENTES = path.join(ROOT, 'sistema_docentes');
const SISTEMA_REPORTES = path.join(ROOT, 'sistema_reportes');

const V = '\x1b[32m';
const A = '\x1b[33m';
const R = '\x1b[31m';
const C = '\x1b[36m';
const B = '\x1b[1m';
const X = '\x1b[0m';

const SERVICIOS = [
  { nombre: 'Dashboard Admin', puerto: 5173 },
  { nombre: 'Portal Coordinadores', puerto: 3002 },
  { nombre: 'Portal Estudiantil', puerto: 3003 },
];

const line = () => console.log(C + '═'.repeat(64) + X);
const log = (color, message) => console.log(color + message + X);

function esAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function obtenerIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) {
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

function verificarNode() {
  log(C, '  Verificando Node.js y npm...');
  const npm = spawnSync('npm', ['-v'], { shell: true, encoding: 'utf8' });
  if (npm.status !== 0) {
    log(R, '  [ERROR] npm no esta disponible.');
    log(A, '  Instale Node.js LTS desde https://nodejs.org y vuelva a ejecutar este instalador.');
    process.exit(1);
  }
  log(V, `  [OK] Node.js ${process.version} | npm v${(npm.stdout || '').trim()}`);
}

function instalar(nombre, cwd, flags = []) {
  log(A, `  Instalando ${nombre}...`);
  const result = spawnSync('npm', ['install', '--legacy-peer-deps', ...flags], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    log(R, `  [ERROR] Fallo la instalacion de ${nombre}`);
    process.exit(1);
  }

  log(V, `  [OK] ${nombre} listo.`);
}

function configurarFirewall() {
  const reglas = [
    { puerto: 3001, nombre: 'UDH-Puerto-3001', desc: 'API Contratos' },
    { puerto: 5173, nombre: 'UDH-Puerto-5173', desc: 'Dashboard Admin' },
    { puerto: 3002, nombre: 'UDH-Puerto-3002', desc: 'Portal Coordinadores' },
    { puerto: 3003, nombre: 'UDH-Puerto-3003', desc: 'Portal Estudiantil' },
  ];

  for (const { puerto, nombre, desc } of reglas) {
    try {
      execSync(`netsh advfirewall firewall show rule name="${nombre}"`, { stdio: 'ignore' });
      log(V, `  [OK] Puerto ${puerto} (${desc}) ya habilitado.`);
    } catch {
      try {
        execSync(
          `netsh advfirewall firewall add rule name="${nombre}" protocol=TCP dir=in localport=${puerto} action=allow`,
          { stdio: 'ignore' }
        );
        log(V, `  [OK] Puerto ${puerto} (${desc}) habilitado.`);
      } catch {
        log(R, `  [!] No se pudo abrir puerto ${puerto}. Configurelo manualmente.`);
      }
    }
  }
}

function probarUrl(host, puerto) {
  return new Promise((resolve) => {
    const req = http.get({ host, port: puerto, path: '/', timeout: 2500 }, (res) => {
      res.resume();
      resolve({ ok: true, status: res.statusCode });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });

    req.on('error', (error) => resolve({ ok: false, error: error.message }));
  });
}

function escritoriosDisponibles() {
  return ['Desktop', 'Escritorio']
    .map((nombre) => path.join(os.homedir(), nombre))
    .filter((ruta) => fs.existsSync(ruta));
}

function crearAccesoDirecto(nombre, url) {
  const escritorios = escritoriosDisponibles();
  if (escritorios.length === 0) {
    log(A, `  [!] No encontre el Escritorio. Cree manualmente acceso a: ${url}`);
    return;
  }

  const archivo = path.join(escritorios[0], `${nombre}.url`);
  fs.writeFileSync(archivo, `[InternetShortcut]\r\nURL=${url}\r\n`, 'utf8');
  log(V, `  [OK] Acceso creado: ${archivo}`);
}

async function instalarHost() {
  console.log();
  log(C, B + '  MODO HOST / SERVIDOR' + X);
  log(A, '  Esta computadora ejecutara los 3 sistemas y compartira acceso en red.');
  console.log();

  verificarNode();

  console.log();
  log(C, '  [1/4] Configurando Proyecto 1 - Central de Contratos...');
  crearCarpeta(path.join(ROOT, 'server', 'uploads'), 'Carpeta uploads');
  instalar('Proyecto 1 (Contratos)', ROOT, fs.existsSync(path.join(ROOT, 'node_modules')) ? ['--prefer-offline'] : []);

  console.log();
  log(C, '  [2/4] Configurando Proyecto 2 - Portal Coordinadores...');
  crearCarpeta(path.join(SISTEMA_DOCENTES, 'database'), 'Carpeta BD Proyecto 2');
  instalar('Proyecto 2 (Coordinadores)', SISTEMA_DOCENTES, fs.existsSync(path.join(SISTEMA_DOCENTES, 'node_modules')) ? ['--prefer-offline'] : []);

  console.log();
  log(C, '  [3/4] Configurando Proyecto 3 - Portal Estudiantil...');
  instalar('Proyecto 3 (Estudiantes)', SISTEMA_REPORTES, fs.existsSync(path.join(SISTEMA_REPORTES, 'node_modules')) ? ['--prefer-offline'] : []);

  console.log();
  log(C, '  [4/4] Configurando Firewall...');
  if (esAdmin()) {
    configurarFirewall();
  } else {
    log(A, '  [!] No se ejecuto como Administrador.');
    log(A, '      El Firewall NO fue configurado automaticamente.');
    log(A, '      Para acceso en red, ejecute la terminal como Administrador y repita el modo Host.');
  }

  const ip = obtenerIP();
  console.log();
  line();
  log(V, B + '  HOST INSTALADO CORRECTAMENTE' + X);
  line();
  log(C, '  Inicio diario:');
  log(X, '    node arrancar.js');
  console.log();
  log(C, '  Acceso desde esta PC:');
  log(X, '    http://localhost:5173');
  log(X, '    http://localhost:3002');
  log(X, '    http://localhost:3003');
  console.log();
  log(C, '  Acceso desde clientes/esclavos:');
  for (const servicio of SERVICIOS) {
    log(X, `    ${servicio.nombre.padEnd(22)} -> http://${ip}:${servicio.puerto}`);
  }
}

async function instalarCliente(rl) {
  console.log();
  log(C, B + '  MODO CLIENTE / ESCLAVO' + X);
  log(A, '  Esta computadora NO instala el sistema. Solo crea accesos al host.');
  console.log();

  const host = (await rl.question('  IP o nombre del HOST/SERVIDOR: ')).trim();
  if (!host) {
    log(R, '  [ERROR] Debe indicar la IP o nombre del servidor.');
    process.exit(1);
  }

  console.log();
  log(C, '  Probando conexion con el servidor...');
  for (const servicio of SERVICIOS) {
    const resultado = await probarUrl(host, servicio.puerto);
    if (resultado.ok) {
      log(V, `  [OK] ${servicio.nombre} responde en puerto ${servicio.puerto}.`);
    } else {
      log(A, `  [!] ${servicio.nombre} no respondio en puerto ${servicio.puerto} (${resultado.error}).`);
    }
  }

  console.log();
  log(C, '  Creando accesos directos...');
  for (const servicio of SERVICIOS) {
    crearAccesoDirecto(`UDH - ${servicio.nombre}`, `http://${host}:${servicio.puerto}`);
  }

  console.log();
  line();
  log(V, B + '  CLIENTE CONFIGURADO' + X);
  line();
  log(A, '  Si algun servicio no respondio, verifique que el host tenga ejecutado: node arrancar.js');
}

async function elegirModo(rl) {
  const argModo = process.argv.find((arg) => arg.startsWith('--modo='))?.split('=')[1]?.toLowerCase();
  if (['host', 'servidor'].includes(argModo)) return 'host';
  if (['cliente', 'esclavo'].includes(argModo)) return 'cliente';

  console.log();
  log(C, '  ¿Que desea instalar?');
  log(X, '    1) Host / Servidor');
  log(X, '    2) Cliente / Esclavo');
  console.log();

  const respuesta = (await rl.question('  Seleccione 1 o 2: ')).trim();
  if (respuesta === '1') return 'host';
  if (respuesta === '2') return 'cliente';

  log(R, '  [ERROR] Opcion invalida.');
  process.exit(1);
}

async function main() {
  console.clear();
  line();
  log(C, B + '  UNIVERSIDAD DE DEFENSA DE HONDURAS' + X);
  log(C, '  Sistema Integral de Gestion Academica');
  log(C, '  Instalador Unificado v4.0');
  line();

  const rl = readline.createInterface({ input, output });
  try {
    const modo = await elegirModo(rl);
    if (modo === 'host') await instalarHost();
    if (modo === 'cliente') await instalarCliente(rl);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  log(R, `  Error critico: ${error.message}`);
  process.exit(1);
});
