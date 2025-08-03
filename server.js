require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const ytdl = require('ytdl-core');

let ytdlp;
try {
  const { create } = require('yt-dlp-exec');
  ytdlp = create(); // ✅ Auto-detect correct binary (don't use .exe)
  console.log('✅ yt-dlp-exec initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize yt-dlp-exec:', error.message);
}

const app = express();

const args = process.argv.slice(2);
let port = process.env.PORT || 3000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    port = parseInt(args[i + 1], 10);
    break;
  } else if (args[i].startsWith('--port=')) {
    port = parseInt(args[i].split('=')[1], 10);
    break;
  }
}
const PORT = port;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// ✅ Route: Get video info using yt-dlp
app.get('/api/video-info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });
    res.json(info);
  } catch (err) {
    console.error('❌ yt-dlp error:', err.stderr || err.message || err);
    res.status(500).json({ error: 'Failed to extract YouTube video information' });
  }
});


// ✅ Route: Download video using ytdl-core
app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing video URL' });

  try {
    const info = await ytdl.getInfo(url);
    const selectedFormat = ytdl.chooseFormat(info.formats, { quality: format || 'highest' });

    res.header('Content-Disposition', `attachment; filename="video.${selectedFormat.container}"`);
    ytdl(url, { format: selectedFormat }).pipe(res);
  } catch (err) {
    console.error('❌ ytdl-core error:', err.message);
    res.status(500).json({ error: 'Failed to download video' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
