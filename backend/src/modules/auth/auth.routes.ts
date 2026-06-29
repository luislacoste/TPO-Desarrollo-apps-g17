/**
 * Rutas del módulo Auth. Declara los endpoints del swagger
 * (tag `Auth`) y los conecta a los middlewares + controllers.
 *
 * Estos endpoints son públicos (no requieren JWT).
 */
import { Router } from 'express';
import * as ctrl from './auth.controller';
import { upload } from '../../middleware/upload';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/login',             asyncHandler(ctrl.login));
router.post('/register',          asyncHandler(ctrl.registerStart));

// Multipart: dos archivos independientes según corrección 1.3 del profesor.
router.post(
  '/register/document',
  upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack',  maxCount: 1 },
  ]),
  asyncHandler(ctrl.registerDocument),
);

router.post('/register/complete', asyncHandler(ctrl.registerComplete));
router.post('/register/accept-conditions', asyncHandler(ctrl.registerAcceptConditions));
router.post('/check-status',      asyncHandler(ctrl.checkStatus));
router.post('/forgot-password',   asyncHandler(ctrl.forgotPassword));
router.post('/refresh-token',     asyncHandler(ctrl.refreshToken));

export default router;
