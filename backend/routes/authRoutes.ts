import { Router, Response } from 'express';
import { db } from '../db.js';
import { comparePassword, generateToken, authMiddleware, AuthenticatedRequest, hashPassword } from '../auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = db.getAdminByUsername(username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isValid = comparePassword(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken({ id: admin.id, username: admin.username, email: admin.email });
  return res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email
    }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  return res.json({ user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = db.getAdminById(req.user!.id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin user not found' });
  }

  if (!comparePassword(currentPassword, admin.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const newHash = hashPassword(newPassword);
  db.updateAdminPassword(req.user!.id, newHash);

  return res.json({ message: 'Password changed successfully' });
});

export default router;
