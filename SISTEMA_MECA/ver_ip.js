import os from 'os';

const C = '\x1b[36m';
const V = '\x1b[32m';
const X = '\x1b[0m';

console.clear();
console.log(C + '═'.repeat(60) + X);
console.log(C + '  UDH - Informacion de Red para Acceso Remoto' + X);
console.log(C + '═'.repeat(60) + X);
console.log();
console.log(C + '  Direcciones IPv4 de este equipo:' + X);
console.log();

for (const [nombre, interfaces] of Object.entries(os.networkInterfaces())) {
  for (const iface of interfaces) {
    if (iface.family === 'IPv4') {
      const tipo = iface.internal ? '(loopback)' : '(red local)';
      console.log(V + `    ${nombre}: ${iface.address} ${tipo}` + X);
    }
  }
}

// Obtener IP principal para mostrar URLs
let ipPrincipal = 'localhost';
for (const nets of Object.values(os.networkInterfaces())) {
  for (const n of nets) {
    if (n.family === 'IPv4' && !n.internal) { ipPrincipal = n.address; break; }
  }
  if (ipPrincipal !== 'localhost') break;
}

console.log();
console.log(C + '═'.repeat(60) + X);
console.log(C + '  Use la IP de red local para acceder desde otra PC:' + X);
console.log();
console.log(V + `    http://${ipPrincipal}:5173  -> Dashboard de Contratos` + X);
console.log(V + `    http://${ipPrincipal}:3002  -> Portal de Coordinadores` + X);
console.log(V + `    http://${ipPrincipal}:3003  -> Portal Estudiantil` + X);
console.log(C + '═'.repeat(60) + X);
console.log();
