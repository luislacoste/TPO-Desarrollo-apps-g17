import { Router } from 'express';
import { pool } from '../db';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import categoriesRoutes from '../modules/categories/categories.routes';

const router = Router();

/**
 * Health check — verifica que el proceso responde y que la DB es alcanzable.
 * GET /v1/health
 */
router.get('/health', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      db: rows[0]?.ok === 1 ? 'up' : 'down',
      time: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.use('/auth',       authRoutes);
router.use('/users',      usersRoutes);
router.use('/categories', categoriesRoutes);

// A medida que se agreguen módulos, montar acá:
//   router.use('/auctions', auctionsRoutes);
//   router.use('/items',    itemsRoutes);
//   router.use('/bids',     bidsRoutes);
//   ...

export default router;
