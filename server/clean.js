import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const uploadsDir = path.join(__dirname, 'uploads');

console.log('--- INICIANDO LIMPIEZA DEL SISTEMA DE CONTRATOS UDH ---');

// Deleting database
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('✅ Base de datos (database.db) eliminada exitosamente.');
  } catch (err) {
    console.error('❌ Error al eliminar la base de datos:', err.message);
  }
} else {
  console.log('ℹ️ La base de datos no existe, se creará limpia en el próximo inicio.');
}

// Cleaning uploads
if (fs.existsSync(uploadsDir)) {
  try {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    }
    console.log('✅ Directorio de currículums (uploads) vaciado.');
  } catch (err) {
    console.error('❌ Error al limpiar la carpeta de uploads:', err.message);
  }
} else {
  console.log('ℹ️ La carpeta de uploads no existe.');
}

console.log('--- LIMPIEZA COMPLETADA CON ÉXITO ---');
