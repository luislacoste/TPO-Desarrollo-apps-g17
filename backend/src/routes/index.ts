import { Router } from 'express';
import { pool } from '../db';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import auctionsRoutes from '../modules/auctions/auctions.routes';
import itemsRoutes from '../modules/items/items.routes';
import bidsRoutes from '../modules/bids/bids.routes';
import sellRoutes from '../modules/sell-requests/sell-requests.routes';
import paymentMethodsRoutes from '../modules/payment-methods/payment-methods.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import finesRoutes from '../modules/fines/fines.routes';

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
router.use('/auctions',   auctionsRoutes);
router.use('/items',      itemsRoutes);
router.use('/bids',       bidsRoutes);
router.use('/sell',            sellRoutes);
router.use('/payment-methods', paymentMethodsRoutes);
router.use('/payments',        paymentsRoutes);
router.use('/fines',           finesRoutes);

// A medida que se agreguen módulos, montar acá:
//   router.use('/admin', adminRoutes);
//   router.use('/payments',        paymentsRoutes);
//   router.use('/fines',           finesRoutes);
//   router.use('/admin',           adminRoutes);
//   ...

export default router;
