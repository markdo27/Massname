const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { ZipArchive } = require('archiver');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FONTS_DIR = path.join(UPLOADS_DIR, 'fonts');
const EXPORTS_DIR = path.join(__dirname, 'exports');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

[UPLOADS_DIR, FONTS_DIR, EXPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file servers
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/exports', express.static(EXPORTS_DIR));

// Configure Multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `video_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  }
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Configure Multer for custom fonts
const fontStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FONTS_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `font_${Date.now()}_${cleanName}`);
  }
});
const uploadFont = multer({
  storage: fontStorage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Helper: Probe video using FFmpeg
function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-i', filePath]);
    let stderr = '';
    proc.stderr.on('data', data => {
      stderr += data.toString();
    });
    proc.on('close', () => {
      let width = 1080;
      let height = 1920;
      let duration = 0;
      let fps = 30;
      let hasAudio = stderr.includes('Audio:');

      // Match resolution
      const resMatch = stderr.match(/Stream #0:0.*Video:.* ([0-9]{3,4})x([0-9]{3,4})/);
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      // Match duration
      const durMatch = stderr.match(/Duration: ([0-9]{2}):([0-9]{2}):([0-9]{2}\.[0-9]{2})/);
      if (durMatch) {
        const h = parseFloat(durMatch[1]);
        const m = parseFloat(durMatch[2]);
        const s = parseFloat(durMatch[3]);
        duration = h * 3600 + m * 60 + s;
      }

      // Match fps
      const fpsMatch = stderr.match(/([0-9]+(?:\.[0-9]+)?) fps/);
      if (fpsMatch) {
        fps = Math.round(parseFloat(fpsMatch[1]));
      }

      const isVertical = height > width;
      const aspectRatio = (width / height).toFixed(2);

      resolve({
        width,
        height,
        duration: Math.round(duration * 100) / 100,
        fps,
        hasAudio,
        isVertical,
        aspectRatio
      });
    });
    proc.on('error', err => reject(err));
  });
}

// 1. Health check & status
app.get('/api/status', (req, res) => {
  const desktopSample = 'c:\\Users\\AZPC\\Desktop\\You are inivated.mp4';
  const sampleExists = fs.existsSync(desktopSample);
  res.json({
    status: 'ok',
    ffmpegReady: true,
    sampleAvailable: sampleExists,
    samplePath: sampleExists ? desktopSample : null
  });
});

// 2. Load Desktop Sample Video directly
app.post('/api/load-sample', async (req, res) => {
  try {
    const desktopSample = 'c:\\Users\\AZPC\\Desktop\\You are inivated.mp4';
    if (!fs.existsSync(desktopSample)) {
      return res.status(404).json({ error: 'Desktop sample file not found' });
    }
    const filename = `sample_${Date.now()}_You_are_invited.mp4`;
    const destPath = path.join(UPLOADS_DIR, filename);
    fs.copyFileSync(desktopSample, destPath);

    const stats = fs.statSync(destPath);
    const meta = await probeVideo(destPath);

    res.json({
      videoId: filename,
      originalName: 'You are invited.mp4',
      filename,
      url: `/uploads/${filename}`,
      size: stats.size,
      ...meta
    });
  } catch (err) {
    console.error('Error loading desktop sample:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Upload Video
app.post('/api/upload', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    const meta = await probeVideo(req.file.path);
    res.json({
      videoId: req.file.filename,
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      ...meta
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Upload Custom Font
app.post('/api/upload-font', uploadFont.single('font'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No font file provided' });
    }
    const fontName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9]/g, '');
    res.json({
      fontName: `CustomFont_${fontName}`,
      filename: req.file.filename,
      url: `/uploads/fonts/${req.file.filename}`
    });
  } catch (err) {
    console.error('Font upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Render individual item
app.post('/api/render-item', async (req, res) => {
  const startTimeMs = Date.now();
  const {
    batchId = uuidv4().slice(0, 8),
    videoId,
    customerName,
    overlayImageBase64,
    timeStart = 0,
    timeEnd = 0,
    fadeDuration = 0,
    quality = 'balanced'
  } = req.body;

  if (!videoId || !overlayImageBase64 || !customerName) {
    return res.status(400).json({ error: 'Missing required parameters (videoId, customerName, overlayImageBase64)' });
  }

  const inputVideoPath = path.join(UPLOADS_DIR, videoId);
  if (!fs.existsSync(inputVideoPath)) {
    return res.status(404).json({ error: 'Base video not found' });
  }

  const batchDir = path.join(EXPORTS_DIR, batchId);
  if (!fs.existsSync(batchDir)) {
    fs.mkdirSync(batchDir, { recursive: true });
  }

  // Safe filename for customer
  const safeName = customerName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  
  let outputFilename = `${safeName}.mp4`;
  let counter = 1;
  while (fs.existsSync(path.join(batchDir, outputFilename))) {
    outputFilename = `${safeName}_${counter}.mp4`;
    counter++;
  }
  const outputVideoPath = path.join(batchDir, outputFilename);
  const thumbnailFilename = `${path.parse(outputFilename).name}_thumb.jpg`;
  const thumbnailPath = path.join(batchDir, thumbnailFilename);

  // Write base64 overlay PNG to disk
  const tempOverlayPath = path.join(batchDir, `temp_${Date.now()}_${uuidv4().slice(0, 6)}.png`);
  try {
    const base64Data = overlayImageBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(tempOverlayPath, Buffer.from(base64Data, 'base64'));

    // Determine quality presets
    let preset = 'veryfast';
    let crf = '20';
    if (quality === 'fast') {
      preset = 'ultrafast';
      crf = '23';
    } else if (quality === 'high') {
      preset = 'fast';
      crf = '18';
    }

    // Build FFmpeg arguments
    const ffmpegArgs = [
      '-y',
      '-i', inputVideoPath,
      '-i', tempOverlayPath
    ];

    const hasTimeWindow = (timeStart > 0 || (timeEnd > 0 && timeEnd > timeStart));
    const hasFade = (fadeDuration > 0 && hasTimeWindow);

    let filterComplex = '';
    if (hasFade) {
      const fadeInSt = timeStart;
      const fadeOutSt = Math.max(timeStart, timeEnd - fadeDuration);
      filterComplex = `[1:v]format=rgba,fade=t=in:st=${fadeInSt}:d=${fadeDuration}:alpha=1,fade=t=out:st=${fadeOutSt}:d=${fadeDuration}:alpha=1[ovl];[0:v][ovl]overlay=0:0:enable='between(t,${timeStart},${timeEnd})'[outv]`;
    } else if (hasTimeWindow) {
      filterComplex = `[0:v][1:v]overlay=0:0:enable='between(t,${timeStart},${timeEnd})'[outv]`;
    } else {
      filterComplex = `[0:v][1:v]overlay=0:0[outv]`;
    }

    ffmpegArgs.push(
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', crf,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputVideoPath
    );

    // Run FFmpeg
    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, ffmpegArgs);
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}: ${stderr.slice(-300)}`));
      });
      proc.on('error', err => reject(err));
    });

    // Generate thumbnail frame at 1s or midpoint
    try {
      const thumbArgs = [
        '-y',
        '-ss', '00:00:01.000',
        '-i', outputVideoPath,
        '-vframes', '1',
        '-q:v', '3',
        thumbnailPath
      ];
      await new Promise((resolve) => {
        const thumbProc = spawn(ffmpegPath, thumbArgs);
        thumbProc.on('close', () => resolve());
        thumbProc.on('error', () => resolve());
      });
    } catch (e) {
      // Non-fatal if thumbnail fails
    }

    // Clean up temporary overlay file
    if (fs.existsSync(tempOverlayPath)) {
      fs.unlinkSync(tempOverlayPath);
    }

    const outputStats = fs.statSync(outputVideoPath);
    const renderTimeSec = ((Date.now() - startTimeMs) / 1000).toFixed(1);

    res.json({
      success: true,
      batchId,
      customerName,
      filename: outputFilename,
      videoUrl: `/exports/${batchId}/${outputFilename}`,
      thumbnailUrl: fs.existsSync(thumbnailPath) ? `/exports/${batchId}/${thumbnailFilename}` : null,
      size: outputStats.size,
      renderTime: `${renderTimeSec}s`
    });

  } catch (err) {
    if (fs.existsSync(tempOverlayPath)) {
      try { fs.unlinkSync(tempOverlayPath); } catch (_) {}
    }
    console.error(`Render error for ${customerName}:`, err);
    res.status(500).json({ error: err.message, customerName });
  }
});

// 6. Download All as ZIP
app.get('/api/download-zip/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batchDir = path.join(EXPORTS_DIR, batchId);

  if (!fs.existsSync(batchDir)) {
    return res.status(404).json({ error: 'Batch folder not found or expired' });
  }

  const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.mp4'));
  if (files.length === 0) {
    return res.status(404).json({ error: 'No exported videos found in batch' });
  }

  const zipFilename = `Video_Invitations_${batchId}.zip`;
  res.attachment(zipFilename);

  const archive = new ZipArchive({ zlib: { level: 4 } });
  archive.on('error', err => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  files.forEach(file => {
    const filePath = path.join(batchDir, file);
    archive.file(filePath, { name: file });
  });
  archive.finalize();
});

// 7. Cleanup batch
app.delete('/api/cleanup/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batchDir = path.join(EXPORTS_DIR, batchId);
  if (fs.existsSync(batchDir)) {
    fs.rmSync(batchDir, { recursive: true, force: true });
  }
  res.json({ success: true });
});

// Serve frontend in production
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/exports')) {
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`ReelInvite Server running on http://localhost:${PORT}`);
});
