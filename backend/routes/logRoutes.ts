import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/dashboard/stats', authMiddleware, (req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  return res.json(stats);
});

// GET /api/logs
router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const logs = db.getVerificationLogs(limit);
  return res.json(logs);
});

// GET /api/system/backup
router.get('/system/backup', authMiddleware, (req: Request, res: Response) => {
  const data = db.getData();
  // Strip sensitive hashed passwords from export if needed, or include raw schema export
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      clients: data.clients,
      products: data.products,
      licenses: data.licenses,
      verification_logs: data.verification_logs
    }
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ea_license_backup_${new Date().toISOString().split('T')[0]}.json`);
  return res.send(JSON.stringify(backup, null, 2));
});

export default router;
