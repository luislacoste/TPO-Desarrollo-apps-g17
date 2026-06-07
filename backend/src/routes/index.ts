import { Router } from 'express';
import { pool } from '../db';
import authRoutes from '../modules/auth/auth.routes';

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

router.use('/auth', authRoutes);

// A medida que se agreguen módulos, montar acá:
//   router.use('/users', usersRoutes);
//   router.use('/auctions', auctionsRoutes);
//   ...

export default router;
