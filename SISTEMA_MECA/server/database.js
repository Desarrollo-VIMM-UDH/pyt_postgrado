import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');

export async function setupDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Crear tablas si no existen
  await db.exec(`
    CREATE TABLE IF NOT EXISTS docentes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      titulo TEXT NOT NULL,
      telefono TEXT,
      correo TEXT,
      fechaIngreso TEXT
    );

    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      docenteId TEXT NOT NULL,
      docenteNombre TEXT NOT NULL,
      academia TEXT NOT NULL,
      programa TEXT,
      asignatura TEXT NOT NULL,
      horas INTEGER NOT NULL,
      periodo TEXT NOT NULL,
      estado TEXT NOT NULL,
      observaciones TEXT,
      proponente TEXT NOT NULL,
      cvPath TEXT,
      FOREIGN KEY(docenteId) REFERENCES docentes(id)
    );
    CREATE TABLE IF NOT EXISTS reportes_estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programa TEXT NOT NULL,
      tipo_reporte TEXT NOT NULL,
      dirigido_a TEXT NOT NULL,
      detalles TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT DEFAULT 'PENDIENTE'
    );
  `);

  try {
    await db.exec(`ALTER TABLE contratos ADD COLUMN excepcion TEXT;`);
  } catch (e) {
    // Column already exists
  }
  try {
    await db.exec(`ALTER TABLE contratos ADD COLUMN justificacionExcepcion TEXT;`);
  } catch (e) {
    // Column already exists
  }

  return db;
}
