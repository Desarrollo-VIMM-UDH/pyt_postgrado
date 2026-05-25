import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGEN = __dirname;
const DESTINO = path.join(__dirname, 'SISTEMA_MECA');

const C = '\x1b[36m';
const V = '\x1b[32m';
const A = '\x1b[33m';
const B = '\x1b[1m';
const X = '\x1b[0m';

const line = () => console.log(C + '═'.repeat(60) + X);
const log = (c, m) => console.log(c + m + X);

// Nombres a excluir siempre
const EXCLUIR_DIRS = new Set(['node_modules', '.git', 'SISTEMA_MECA']);
const EXCLUIR_DB = new Set(['database.db', 'sistema_docentes.db']);

function copiar(src, dest, excluirExtra = []) {
  const extras = new Set(excluirExtra);
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (source) => {
      const base = path.basename(source);
      if (EXCLUIR_DIRS.has(base)) return false;
      if (extras.has(base)) return false;
      if (EXCLUIR_DB.has(base)) return false;
      if (source.endsWith('.bat')) return false;
      return true;
    }
  });
}

// ══════════════════════════════════════════════════════════════
console.clear();
line();
log(C, B + '  UNIVERSIDAD DE DEFENSA DE HONDURAS' + X);
log(C, '  Generador de Paquete - SISTEMA_MECA');
line();
console.log();
log(A, '  Crea la carpeta SISTEMA_MECA lista para otra PC.');
log(A, '  (Excluye node_modules, .git, bases de datos, .bat)');
console.log();

// Limpiar anterior
if (fs.existsSync(DESTINO)) {
  log(A, '  Limpiando paquete anterior...');
  fs.rmSync(DESTINO, { recursive: true, force: true });
  log(V, '  [OK] Paquete anterior eliminado.');
}
fs.mkdirSync(DESTINO, { recursive: true });
log(V, '  [OK] Carpeta SISTEMA_MECA creada.');
console.log();

// 1. Archivos raiz
log(C, '  [1/7] Copiando archivos raiz...');
const raiz = [
  'package.json', 'package-lock.json', 'vite.config.js',
  'eslint.config.js', 'index.html', 'arrancar.js',
  'instalador.js', 'generar_paquete.js', 'ver_ip.js', '.env'
];
for (const f of raiz) {
  const src = path.join(ORIGEN, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DESTINO, f));
}
log(V, '  [OK] Archivos raiz copiados.');

// 2. src/
console.log();
log(C, '  [2/7] Copiando codigo fuente React (src)...');
copiar(path.join(ORIGEN, 'src'), path.join(DESTINO, 'src'));
log(V, '  [OK] src/ copiado.');

// 3. server/
console.log();
log(C, '  [3/7] Copiando servidor backend (server)...');
copiar(path.join(ORIGEN, 'server'), path.join(DESTINO, 'server'), ['uploads']);
fs.mkdirSync(path.join(DESTINO, 'server', 'uploads'), { recursive: true });
log(V, '  [OK] server/ copiado (uploads vacio).');

// 4. public/
console.log();
log(C, '  [4/7] Copiando activos publicos (public)...');
copiar(path.join(ORIGEN, 'public'), path.join(DESTINO, 'public'));
log(V, '  [OK] public/ copiado.');

// 5. sistema_docentes/
console.log();
log(C, '  [5/7] Copiando Proyecto 2 - Coordinadores...');
copiar(path.join(ORIGEN, 'sistema_docentes'), path.join(DESTINO, 'sistema_docentes'));
fs.mkdirSync(path.join(DESTINO, 'sistema_docentes', 'database'), { recursive: true });
log(V, '  [OK] sistema_docentes/ copiado.');

// 6. sistema_reportes/
console.log();
log(C, '  [6/7] Copiando Proyecto 3 - Estudiantes...');
copiar(path.join(ORIGEN, 'sistema_reportes'), path.join(DESTINO, 'sistema_reportes'));
log(V, '  [OK] sistema_reportes/ copiado.');

// 7. instalador_tecnologia/
console.log();
log(C, '  [7/7] Copiando documentacion...');
copiar(path.join(ORIGEN, 'instalador_tecnologia'), path.join(DESTINO, 'instalador_tecnologia'));
log(V, '  [OK] Documentacion incluida.');

// Resumen
console.log();
line();
log(V, B + '  PAQUETE GENERADO EXITOSAMENTE' + X);
line();
console.log();
log(V, `  Ubicacion: ${DESTINO}`);
console.log();
log(C, '  INSTRUCCIONES PARA LA OTRA COMPUTADORA:');
log(C, '  ─────────────────────────────────────────');
log(X, '  1. Copie la carpeta SISTEMA_MECA a la otra PC');
log(X, '     (USB, disco externo o red)');
console.log();
log(X, '  2. Instale Node.js desde https://nodejs.org (LTS)');
console.log();
log(X, '  3. Abra terminal en SISTEMA_MECA y ejecute:');
log(V, '       node instalador.js');
console.log();
log(X, '  4. Inicie el sistema diariamente con:');
log(V, '       node arrancar.js');
console.log();
log(A, '  NOTA: Primera instalacion requiere internet.');
line();
console.log();
