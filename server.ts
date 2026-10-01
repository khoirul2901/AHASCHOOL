import express from 'express';
import path from 'path';
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

  // Vite middleware for development (with graceful fallback to dist static files)
  let isViteActive = false;
  if (process.env.NODE_ENV !== 'production') {
    try {
      const viteModule = await import('vite');
      const vite = await viteModule.createServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      isViteActive = true;
    } catch (err: any) {
      console.warn('Vite development middleware could not be loaded (likely blocked by Windows security policy). Serving static dist build instead.');
    }
  }

  if (!isViteActive) {
    const fs = await import('fs');
    let staticPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(staticPath)) {
      staticPath = path.join(process.cwd(), 'docs');
    }
    app.use(express.static(staticPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIAKAD SEKOLAH TERPADU server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
