import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.js';
import { dbManager } from './server/db/database.js';
import { AttendanceEngine } from './server/services/attendanceEngine.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize persistent database
  await dbManager.init();

  // Run initial attendance generation for today on startup
  try {
    const today = new Date().toISOString().split('T')[0];
    AttendanceEngine.generateDailyAttendance(today);
  } catch (err) {
    console.error('Error in startup attendance generation:', err);
  }

  // Periodic automatic attendance engine runner (every 5 minutes)
  setInterval(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      AttendanceEngine.generateDailyAttendance(today);
    } catch (err) {
      console.error('Error in scheduled attendance run:', err);
    }
  }, 5 * 60 * 1000);

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIAKAD SEKOLAH TERPADU server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
