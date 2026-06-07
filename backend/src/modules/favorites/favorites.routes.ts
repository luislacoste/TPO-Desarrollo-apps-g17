/**
 * Rutas del módulo Favorites. Todos los endpoints requieren JWT.
 */
import { Router } from 'express';
import * as ctrl from './favorites.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);

router.get   ('/',         asyncHandler(ctrl.list));
router.post  ('/:itemId',  asyncHandler(ctrl.add));
router.delete('/:itemId',  asyncHandler(ctrl.remove));

export default router;
