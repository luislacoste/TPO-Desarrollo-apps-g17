/**
 * Rutas del módulo Notifications. Todos los endpoints requieren JWT.
 *
 * `/settings` se declara antes que `/:id/read` para que el router
 * no la matchee como id.
 */
import { Router } from 'express';
import * as ctrl from './notifications.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(auth);

router.get('/',           asyncHandler(ctrl.list));
router.get('/settings',   asyncHandler(ctrl.getSettings));
router.put('/settings',   asyncHandler(ctrl.updateSettings));
router.put('/:id/read',   asyncHandler(ctrl.markRead));

export default router;
