import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import https from 'https';
import { setupDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use('/', express.static(publicDir));
}

const TELEGRAM_TOKEN = '8963440470:AAFLKuclWRMLDJNrkfGuAPcG0d6RTc3jb_U';
const CHATS_FILE = path.join(__dirname, 'telegram_chats.json');

function getSavedChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading telegram chats file:', err);
  }
  return [];
}

function saveChats(chats) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving telegram chats file:', err);
  }
}

function telegramRequest(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}${apiPath}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ ok: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Telegram TLS request failed:', err);
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function discoverAndGetChats() {
  let chats = getSavedChats();
  try {
    const data = await telegramRequest('/getUpdates', 'GET');
    if (data.ok && data.result) {
      let updated = false;
      for (const update of data.result) {
        const updateId = update.update_id;
        const text = update.message?.text;
        if (updateId && text && text.startsWith('[STUDENT_REPORT_FALLBACK]')) {
          const processedUpdatesFile = path.join(__dirname, 'processed_updates.json');
          let processedList = [];
          try {
            if (fs.existsSync(processedUpdatesFile)) {
              processedList = JSON.parse(fs.readFileSync(processedUpdatesFile, 'utf8'));
            }
          } catch (e) {}

          if (!processedList.includes(updateId)) {
            processedList.push(updateId);
            try {
              fs.writeFileSync(processedUpdatesFile, JSON.stringify(processedList, null, 2), 'utf8');
              const jsonStr = text.substring('[STUDENT_REPORT_FALLBACK]'.length).trim();
              const report = JSON.parse(jsonStr);

              console.log('Reporte de contingencia recibido via Telegram:', report);

              if (db) {
                await db.run(
                  `INSERT INTO reportes_estudiantes (programa, tipo_reporte, dirigido_a, detalles, fecha) 
                   VALUES (?, ?, ?, ?, ?)`,
                  [report.programa, report.tipo_reporte, report.dirigido_a, report.detalles, new Date().toISOString()]
                );
                console.log('Reporte de contingencia insertado en base de datos.');
              }
            } catch (err) {
              console.error('Error processing fallback report:', err);
            }
          }
        }

        const chat = update.message?.chat || update.channel_post?.chat;
        if (chat && chat.id) {
          if (!chats.includes(chat.id)) {
            chats.push(chat.id);
            updated = true;

            const welcomeText = `*Conexion Exitosa con el Portal UDH*\n\n` +
              `A partir de este momento recibira las notificaciones de reportes estudiantiles anonimos en tiempo real.`;

            await telegramRequest('/sendMessage', 'POST', {
              chat_id: chat.id,
              text: welcomeText,
              parse_mode: 'Markdown'
            }).catch(e => console.error('Error sending welcome message:', e));
          }
        }
      }
      if (updated) {
        saveChats(chats);
      }
    }
  } catch (err) {
    console.error('Error in discoverAndGetChats:', err);
  }
  return chats;
}

async function sendReportToTelegram(report) {
  const chats = await discoverAndGetChats();
  if (chats.length === 0) {
    console.log('No hay chats de Telegram registrados aun.');
    return;
  }

  const messageText = `*NUEVO REPORTE ESTUDIANTIL ANONIMO*\n` +
    `===================================\n` +
    `*Programa:* ${report.programa}\n` +
    `*Categoria:* ${report.tipo_reporte}\n` +
    `*Dirigido a:* ${report.dirigido_a}\n` +
    `*Fecha:* ${new Date().toLocaleString()}\n\n` +
    `*Detalles:* \n_${report.detalles}_\n` +
    `===================================`;

  for (const chatId of chats) {
    try {
      await telegramRequest('/sendMessage', 'POST', {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(`Error sending telegram message to chat ${chatId}:`, err);
    }
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.body.docenteId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

let db;

async function startServer() {
  db = await setupDatabase();

  app.get('/api/docentes', async (req, res) => {
    try {
      const docentes = await db.all('SELECT * FROM docentes');
      res.json(docentes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/contratos', async (req, res) => {
    try {
      const contratos = await db.all('SELECT * FROM contratos');
      res.json(contratos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contratos', upload.single('cv'), async (req, res) => {
    const {
      docenteId, nombre, titulo, telefono, correo,
      academia, programa, asignatura, horas, periodo, observaciones, proponente,
      excepcion, justificacionExcepcion
    } = req.body;

    let cvPath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const docente = await db.get('SELECT id FROM docentes WHERE id = ?', [docenteId]);

      if (!docente) {
        await db.run(
          'INSERT INTO docentes (id, nombre, titulo, telefono, correo, fechaIngreso) VALUES (?, ?, ?, ?, ?, ?)',
          [docenteId, nombre, titulo, telefono, correo, new Date().toISOString()]
        );
      }

      if (!cvPath) {
        const lastContrato = await db.get('SELECT cvPath FROM contratos WHERE docenteId = ? AND cvPath IS NOT NULL ORDER BY id DESC LIMIT 1', [docenteId]);
        if (lastContrato && lastContrato.cvPath) cvPath = lastContrato.cvPath;
      } else {
        const oldContratos = await db.all('SELECT cvPath FROM contratos WHERE docenteId = ? AND cvPath IS NOT NULL', [docenteId]);
        if (oldContratos.length > 0) {
          const oldPaths = [...new Set(oldContratos.map(c => c.cvPath))];
          oldPaths.forEach(oldPath => {
            const absoluteOldPath = path.join(__dirname, 'uploads', path.basename(oldPath));
            if (fs.existsSync(absoluteOldPath)) {
              fs.unlinkSync(absoluteOldPath);
            }
          });
          await db.run('UPDATE contratos SET cvPath = ? WHERE docenteId = ? AND cvPath IS NOT NULL', [cvPath, docenteId]);
        }
      }

      const result = await db.run(
        `INSERT INTO contratos 
        (docenteId, docenteNombre, academia, programa, asignatura, horas, periodo, estado, observaciones, proponente, cvPath, excepcion, justificacionExcepcion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [docenteId, nombre, academia, programa || null, asignatura, parseInt(horas), periodo, 'PROPUESTO', observaciones, proponente, cvPath, excepcion || null, justificacionExcepcion || null]
      );

      res.status(201).json({ id: result.lastID, success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/contratos/:id/estado', async (req, res) => {
    const { estado, observaciones } = req.body;
    try {
      if (observaciones !== undefined) {
        await db.run('UPDATE contratos SET estado = ?, observaciones = ? WHERE id = ?', [estado, observaciones, req.params.id]);
      } else {
        await db.run('UPDATE contratos SET estado = ? WHERE id = ?', [estado, req.params.id]);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reportes-estudiantes', async (req, res) => {
    try {
      const reportes = await db.all('SELECT * FROM reportes_estudiantes ORDER BY id DESC');
      res.json(reportes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reportes-estudiantes', async (req, res) => {
    const { programa, tipo_reporte, dirigido_a, detalles } = req.body;
    try {
      const result = await db.run(
        `INSERT INTO reportes_estudiantes (programa, tipo_reporte, dirigido_a, detalles, fecha) 
         VALUES (?, ?, ?, ?, ?)`,
        [programa, tipo_reporte, dirigido_a, detalles, new Date().toISOString()]
      );

      sendReportToTelegram({ programa, tipo_reporte, dirigido_a, detalles }).catch(err => {
        console.error('Telegram broadcast error:', err);
      });

      res.status(201).json({ id: result.lastID, success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/reportes-estudiantes/:id/estado', async (req, res) => {
    const { estado } = req.body;
    try {
      await db.run('UPDATE reportes_estudiantes SET estado = ? WHERE id = ?', [estado, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Backend Operativo en el puerto ${PORT}`);

    setInterval(() => {
      discoverAndGetChats().catch(() => {});
    }, 5000);
  });
}

startServer().catch(err => {
  console.error('Error iniciando servidor:', err);
});
