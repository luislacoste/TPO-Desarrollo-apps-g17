/**
 * Rutas del módulo Auctions.
 *
 * Listados y detalles son públicos. `join` y `stream` requieren JWT.
 */
import { Router } from 'express';
import * as ctrl from './auctions.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/',         asyncHandler(ctrl.list));
router.get('/active',   asyncHandler(ctrl.listActive));
router.get('/upcoming', asyncHandler(ctrl.listUpcoming));
router.get('/:id',           asyncHandler(ctrl.getById));
router.get('/:id/catalog',   asyncHandler(ctrl.getCatalog));
router.post('/:id/join',     auth, asyncHandler(ctrl.join));
router.get('/:id/stream',    auth, asyncHandler(ctrl.getStream));

export default router;
