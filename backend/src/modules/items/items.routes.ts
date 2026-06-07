/**
 * Rutas de Items. `authOptional` en /:id permite que anónimos vean
 * el ítem pero sin `precio_base` (solo registrados lo ven).
 */
import { Router } from 'express';
import * as ctrl from './items.controller';
import { authOptional } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/',                  asyncHandler(ctrl.list));
router.get('/:id',               authOptional, asyncHandler(ctrl.getById));
router.get('/:id/images',        asyncHandler(ctrl.getPhotos));
router.get('/:id/images/:photoId', asyncHandler(ctrl.getPhotoBinary));
router.get('/:id/history',       asyncHandler(ctrl.getHistory));

export default router;
