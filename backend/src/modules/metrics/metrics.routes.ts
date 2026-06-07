/**
 * Rutas del módulo Metrics. Todos los endpoints requieren JWT.
 *
 * Cualquier usuario autenticado puede consultar las métricas de
 * cualquier otro usuario (stats públicas dentro de la app). Si en el
 * futuro hace falta restringir, se puede agregar acá un check sobre
 * `req.user.sub === userId`.
 */
import { Router } from 'express';
import * as ctrl from './metrics.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);

router.get('/user/:userId',          asyncHandler(ctrl.user));
router.get('/user/:userId/auctions', asyncHandler(ctrl.userAuctions));

export default router;
