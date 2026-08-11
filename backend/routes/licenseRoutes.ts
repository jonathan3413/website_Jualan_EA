import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

function calculateDaysRemaining(expiryDateStr: string): number {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr).getTime();
  const expiry = new Date(expiryDateStr).getTime();
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// PUBLIC ENDPOINT FOR MT5 EA VERIFICATION
// ==========================================
// POST /api/license/verify
router.post('/verify', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const { mt5AccountId, productCode, eaVersion } = req.body;

  if (!mt5AccountId || !productCode) {
    db.logVerification({
      mt5_account_id: mt5AccountId || 'UNKNOWN',
      product_code: productCode || 'UNKNOWN',
      result: 'INVALID',
      reason: 'MISSING_PARAMETERS',
      ip_address: clientIp
    });

    return res.status(400).json({
      valid: false,
      status: 'INVALID',
      reason: 'MISSING_PARAMETERS'
    });
  }

  const cleanAccountId = String(mt5AccountId).trim();
  const cleanProductCode = String(productCode).trim().toUpperCase();

  // 1. Check if product exists
  const product = db.getProductByCode(cleanProductCode);
  if (!product) {
    db.logVerification({
      mt5_account_id: cleanAccountId,
      product_code: cleanProductCode,
      result: 'INVALID',
      reason: 'PRODUCT_NOT_FOUND',
      ip_address: clientIp
    });

    return res.json({
      valid: false,
      status: 'INVALID',
      reason: 'PRODUCT_NOT_FOUND'
    });
  }

  // 2. Check if license exists for this account and product
  const license = db.getLicenseByAccountAndProduct(cleanAccountId, cleanProductCode);
  if (!license) {
    db.logVerification({
      mt5_account_id: cleanAccountId,
      product_code: cleanProductCode,
      result: 'INVALID',
      reason: 'ACCOUNT_NOT_REGISTERED',
      ip_address: clientIp
    });

    return res.json({
      valid: false,
      status: 'INVALID',
      reason: 'ACCOUNT_NOT_REGISTERED'
    });
  }

  // 3. Check status
  if (license.status === 'BLOCKED' || license.status === 'SUSPENDED') {
    db.logVerification({
      license_id: license.id,
      mt5_account_id: cleanAccountId,
      product_code: cleanProductCode,
      result: 'INVALID',
      reason: 'LICENSE_BLOCKED',
      ip_address: clientIp
    });

    return res.json({
      valid: false,
      status: 'BLOCKED',
      reason: 'LICENSE_BLOCKED'
    });
  }

  // 4. Check expiry date against server date
  const todayStr = new Date().toISOString().split('T')[0];
  if (license.expiry_date < todayStr) {
    // Update license status in DB to EXPIRED
    db.setLicenseStatus(license.id, 'EXPIRED');

    db.logVerification({
      license_id: license.id,
      mt5_account_id: cleanAccountId,
      product_code: cleanProductCode,
      result: 'INVALID',
      reason: 'LICENSE_EXPIRED',
      ip_address: clientIp
    });

    return res.json({
      valid: false,
      status: 'EXPIRED',
      reason: 'LICENSE_EXPIRED'
    });
  }

  // 5. License is VALID!
  db.updateLastVerification(license.id);
  db.logVerification({
    license_id: license.id,
    mt5_account_id: cleanAccountId,
    product_code: cleanProductCode,
    result: 'VALID',
    reason: 'VERIFICATION_SUCCESSFUL',
    ip_address: clientIp
  });

  const daysRemaining = calculateDaysRemaining(license.expiry_date);

  return res.json({
    valid: true,
    status: 'ACTIVE',
    expiresAt: license.expiry_date,
    daysRemaining: daysRemaining < 0 ? 0 : daysRemaining
  });
});

// ==========================================
// ADMIN AUTHENTICATED ENDPOINTS
// ==========================================

// GET /api/licenses
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const data = db.getData();
  const todayStr = new Date().toISOString().split('T')[0];

  const licenses = data.licenses.map((lic) => {
    const client = data.clients.find((c) => c.id === lic.client_id && !c.deleted_at);
    const product = data.products.find((p) => p.id === lic.product_id);
    const daysRemaining = calculateDaysRemaining(lic.expiry_date);
    let calculatedStatus = lic.status;
    if (lic.status === 'ACTIVE' && lic.expiry_date < todayStr) {
      calculatedStatus = 'EXPIRED';
    }
    return {
      ...lic,
      status: calculatedStatus,
      daysRemaining,
      client,
      product
    };
  });

  return res.json(licenses);
});

// POST /api/licenses/:id/extend
router.post('/:id/extend', authMiddleware, (req: Request, res: Response) => {
  const { months } = req.body;
  const numMonths = parseInt(months, 10);
  if (![1, 3, 6, 12].includes(numMonths)) {
    return res.status(400).json({ error: 'Extension duration must be 1, 3, 6, or 12 months' });
  }

  const updated = db.extendLicense(req.params.id, numMonths);
  if (!updated) {
    return res.status(404).json({ error: 'License not found' });
  }

  return res.json({
    message: `License extended by ${numMonths} months`,
    license: updated
  });
});

// POST /api/licenses/:id/block
router.post('/:id/block', authMiddleware, (req: Request, res: Response) => {
  const updated = db.setLicenseStatus(req.params.id, 'BLOCKED');
  if (!updated) {
    return res.status(404).json({ error: 'License not found' });
  }
  return res.json({ message: 'License blocked successfully', license: updated });
});

// POST /api/licenses/:id/activate
router.post('/:id/activate', authMiddleware, (req: Request, res: Response) => {
  const updated = db.setLicenseStatus(req.params.id, 'ACTIVE');
  if (!updated) {
    return res.status(404).json({ error: 'License not found' });
  }
  return res.json({ message: 'License activated successfully', license: updated });
});

// POST /api/licenses/:id/change-account
router.post('/:id/change-account', authMiddleware, (req: Request, res: Response) => {
  const { newMt5AccountId } = req.body;
  if (!newMt5AccountId || String(newMt5AccountId).trim().length === 0) {
    return res.status(400).json({ error: 'New MT5 Account ID is required' });
  }

  const cleanAccountId = String(newMt5AccountId).trim();
  const license = db.getLicenseById(req.params.id);
  if (!license) {
    return res.status(404).json({ error: 'License not found' });
  }

  const product = db.getProductById(license.product_id);
  if (product) {
    const existing = db.getLicenseByAccountAndProduct(cleanAccountId, product.product_code);
    if (existing && existing.id !== license.id) {
      return res.status(400).json({ error: `Account ID ${cleanAccountId} is already registered for product ${product.name}` });
    }
  }

  const updated = db.changeLicenseAccount(req.params.id, cleanAccountId);
  return res.json({ message: 'MT5 Account ID updated successfully', license: updated });
});

export default router;
