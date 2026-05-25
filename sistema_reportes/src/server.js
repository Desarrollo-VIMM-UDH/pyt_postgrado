const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  let networkIP = '127.0.0.1';
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkIP = iface.address;
        break;
      }
    }
  }

  console.log(`========================================================`);
  console.log(`  Portal Reportes Estudiantes (Proyecto 3) Activo!`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://${networkIP}:${PORT}/`);
  console.log(`========================================================`);
});
