/**
 * Rutas del módulo Payments. Todos los endpoints requieren JWT.
 *
 * Nota: `/invoices` se declara antes que `/:id` para que el router
 * no la matchee como id.
 */
import { Router } from 'express';
import * as ctrl from './payments.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);

router.get ('/pending',   asyncHandler(ctrl.listPending));
router.get ('/invoices',  asyncHandler(ctrl.invoices));
router.get ('/:id',       asyncHandler(ctrl.getById));
router.post('/:id/pay',   asyncHandler(ctrl.pay));

export default router;
