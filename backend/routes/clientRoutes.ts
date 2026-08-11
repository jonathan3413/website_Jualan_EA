import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// Helper to calculate remaining days based on expiry date and server date
function calculateDaysRemaining(expiryDateStr: string): number {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr).getTime();
  const expiry = new Date(expiryDateStr).getTime();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// GET /api/clients
router.get('/', (req, res) => {
  const { search, status, page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;

  let clients = db.getClients();
  const todayStr = new Date().toISOString().split('T')[0];

  // Map licenses to include daysRemaining and evaluate dynamic expired status
  clients = clients.map((client) => {
    const licenses = client.licenses.map((lic) => {
      const daysRemaining = calculateDaysRemaining(lic.expiry_date);
      let calculatedStatus = lic.status;
      if (lic.status === 'ACTIVE' && lic.expiry_date < todayStr) {
        calculatedStatus = 'EXPIRED';
      }
      return {
        ...lic,
        status: calculatedStatus,
        daysRemaining
      };
    });
    return { ...client, licenses };
  });

  // Filter by search (Name, Email, Phone, or MT5 Account ID)
  if (search) {
    const q = (search as string).toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.licenses.some((l) => l.mt5_account_id.toLowerCase().includes(q))
    );
  }

  // Filter by status (ACTIVE, EXPIRED, BLOCKED, SUSPENDED)
  if (status) {
    const st = (status as string).toUpperCase();
    clients = clients.filter((c) => c.licenses.some((l) => l.status === st));
  }

  const total = clients.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedClients = clients.slice(startIndex, startIndex + limitNum);

  return res.json({
    data: paginatedClients,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// POST /api/clients
router.post('/', (req, res) => {
  const { name, email, phone, notes, mt5AccountId, broker, server, productId, durationMonths } = req.body;

  if (!name || !mt5AccountId || !productId) {
    return res.status(400).json({ error: 'Name, MT5 Account ID, and Product are required' });
  }

  // Check if MT5 Account ID is already registered for this product
  const products = db.getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(400).json({ error: 'Selected product not found' });
  }

  const existingLicense = db.getLicenseByAccountAndProduct(mt5AccountId, product.product_code);
  if (existingLicense) {
    return res.status(400).json({ error: `MT5 Account ID ${mt5AccountId} is already assigned to another license for ${product.name}` });
  }

  const duration = parseInt(durationMonths, 10) || 3;
  if (duration < 1) {
    return res.status(400).json({ error: 'License duration must be at least 1 month' });
  }

  const result = db.createClientWithLicense({
    name,
    email: email || '',
    phone: phone || '',
    notes: notes || '',
    mt5AccountId,
    broker: broker || 'Standard',
    server: server || 'Live',
    productId,
    durationMonths: duration
  });

  return res.status(201).json(result);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.getClientById(req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const licenses = client.licenses.map((lic) => {
    const daysRemaining = calculateDaysRemaining(lic.expiry_date);
    let calculatedStatus = lic.status;
    if (lic.status === 'ACTIVE' && lic.expiry_date < todayStr) {
      calculatedStatus = 'EXPIRED';
    }
    return {
      ...lic,
      status: calculatedStatus,
      daysRemaining
    };
  });

  return res.json({ ...client, licenses });
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const { name, email, phone, notes } = req.body;
  const updated = db.updateClient(req.params.id, { name, email, phone, notes });
  if (!updated) {
    return res.status(404).json({ error: 'Client not found' });
  }
  return res.json(updated);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const success = db.softDeleteClient(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Client not found' });
  }
  return res.json({ message: 'Client deleted successfully (soft delete)' });
});

export default router;
