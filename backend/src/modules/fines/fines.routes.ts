/**
 * Rutas del módulo Fines. Todos los endpoints requieren JWT.
 */
import { Router } from 'express';
import * as ctrl from './fines.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);

router.get ('/',         asyncHandler(ctrl.listMine));
router.get ('/:id',      asyncHandler(ctrl.getById));
router.post('/:id/pay',  asyncHandler(ctrl.pay));

export default router;
