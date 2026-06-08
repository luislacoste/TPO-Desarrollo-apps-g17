/**
 * Rutas del módulo Admin.
 *
 * Todos los endpoints requieren JWT con `role: admin`.
 * Si falta o tiene otro rol, `requireRole('admin')` responde
 * 403 `ForbiddenAdmin` (según corrección 2.3 del swagger).
 */
import { Router } from 'express';
import * as ctrl from './admin.controller';
import { auth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);
router.use(requireRole('admin'));

// ─── Usuarios ─────────────────────────────────────────────────────────
router.get  ('/users',                            asyncHandler(ctrl.listUsers));
router.get  ('/users/:id',                        asyncHandler(ctrl.getUserById));
router.post ('/users/:id/approve',                asyncHandler(ctrl.approveUser));
router.post ('/users/:id/reject',                 asyncHandler(ctrl.rejectUser));
router.patch('/users/:id/category',               asyncHandler(ctrl.changeCategory));
router.patch('/users/:id/admission',              asyncHandler(ctrl.changeAdmission));
router.post ('/users/:id/block-participation',    asyncHandler(ctrl.blockParticipation));
router.post ('/users/:id/unblock-participation',  asyncHandler(ctrl.unblockParticipation));

// ─── Subastas ─────────────────────────────────────────────────────────
router.post ('/auctions/:id/close',         asyncHandler(ctrl.closeAuction));

// ─── Medios de pago ───────────────────────────────────────────────────
router.post ('/payment-methods/:id/verify', asyncHandler(ctrl.verifyPaymentMethod));

// ─── Solicitudes de venta ─────────────────────────────────────────────
router.post ('/sell-requests/:id/offer-conditions', asyncHandler(ctrl.offerSellRequestConditions));

// ─── Pagos ────────────────────────────────────────────────────────────
router.post ('/payments',                asyncHandler(ctrl.createPayment));
router.get  ('/fines',                   asyncHandler(ctrl.listFines));
router.post ('/payments/:id/apply-fine', asyncHandler(ctrl.applyFine));
router.post ('/fines/:id/waive',         asyncHandler(ctrl.waiveFine));

export default router;
