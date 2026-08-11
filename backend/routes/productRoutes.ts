import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// GET /api/products (Public or Auth)
router.get('/', (req: Request, res: Response) => {
  const products = db.getProducts();
  return res.json(products);
});

// POST /api/products (Admin Auth)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, product_code, version } = req.body;
  if (!name || !product_code) {
    return res.status(400).json({ error: 'Product name and product code are required' });
  }

  const existing = db.getProductByCode(product_code);
  if (existing) {
    return res.status(400).json({ error: `Product code '${product_code}' already exists` });
  }

  const newProduct = db.createProduct({
    name,
    product_code: product_code.toUpperCase(),
    version: version || '1.0.0'
  });

  return res.status(201).json(newProduct);
});

export default router;
