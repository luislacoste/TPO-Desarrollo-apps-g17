/**
 * Rutas del módulo Payment Methods. Todos los endpoints requieren JWT.
 */
import { Router } from 'express';
import * as ctrl from './payment-methods.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(auth);

router.get   ('/',                   asyncHandler(ctrl.list));
router.post  ('/bank-account',       asyncHandler(ctrl.addBankAccount));
router.post  ('/credit-card',        asyncHandler(ctrl.addCreditCard));
router.post  ('/certified-check',    asyncHandler(ctrl.addCertifiedCheck));
router.delete('/:id',                asyncHandler(ctrl.remove));
router.get   ('/:id/status',         asyncHandler(ctrl.status));

export default router;
