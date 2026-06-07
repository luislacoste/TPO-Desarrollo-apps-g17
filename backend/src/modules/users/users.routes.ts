/**
 * Rutas del módulo Users. Todos los endpoints requieren JWT.
 */
import { Router } from 'express';
import * as ctrl from './users.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(auth); // todas las rutas siguientes requieren autenticación

router.get('/me',          asyncHandler(ctrl.getMe));
router.put('/me',          asyncHandler(ctrl.updateMe));
router.get('/me/metrics',  asyncHandler(ctrl.getMyMetrics));
router.get('/me/category', asyncHandler(ctrl.getMyCategory));

export default router;
