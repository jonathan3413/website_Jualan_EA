import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/routes/authRoutes.js';
import clientRoutes from './backend/routes/clientRoutes.js';
import licenseRoutes from './backend/routes/licenseRoutes.js';
import productRoutes from './backend/routes/productRoutes.js';
import logRoutes from './backend/routes/logRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security & Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allowed for Vite inline scripts/styles in iframe preview
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/licenses', licenseRoutes);
  app.use('/api/license', licenseRoutes); // Handles POST /api/license/verify
  app.use('/api/products', productRoutes);
  app.use('/api', logRoutes);

  // Serve EA Source file
  app.get('/api/ea/source', (req, res) => {
    const eaPath = path.join(process.cwd(), 'ea', 'LicenseTestEA.mq5');
    if (fs.existsSync(eaPath)) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=LicenseTestEA.mq5');
      return res.sendFile(eaPath);
    }
    return res.status(404).json({ error: 'EA source file not found' });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'MT5 License Management System',
      timestamp: new Date().toISOString()
    });
  });

  // Vite Development or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Unhandled Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`⚡ EA LICENSE MANAGEMENT SERVER ACTIVE ON PORT ${PORT}`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  EA API Verify Endpoint: http://localhost:${PORT}/api/license/verify`);
    console.log(`=======================================================`);
  });
}

startServer();
