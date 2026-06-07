/**
 * Rutas del módulo Sell Requests.
 * Todos los endpoints requieren JWT (el vendedor opera sobre sus propias
 * solicitudes; los lookups por id filtran por `duenio_id = req.user.sub`).
 *
 * Las rutas se montan bajo /v1/sell. El swagger define dos prefijos:
 *   POST /sell/request
 *   GET/PUT/POST /sell/my-requests/...
 */
import { Router } from 'express';
import * as ctrl from './sell-requests.controller';
import { auth } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(auth);

// POST /v1/sell/request — multipart con mínimo 6 imágenes + ownership.
router.post(
  '/request',
  upload.fields([
    { name: 'images',               maxCount: 20 },
    { name: 'ownershipDeclaration', maxCount: 1 },
  ]),
  asyncHandler(ctrl.submit),
);

// /v1/sell/my-requests/...
router.get ('/my-requests',                       asyncHandler(ctrl.listMine));
router.get ('/my-requests/:id',                   asyncHandler(ctrl.getMine));
router.put ('/my-requests/:id/accept',            asyncHandler(ctrl.accept));
router.post('/my-requests/:id/reject',            asyncHandler(ctrl.reject));
router.get ('/my-requests/:id/rejection-reason',  asyncHandler(ctrl.getRejectionReason));
router.get ('/my-requests/:id/return-cost',       asyncHandler(ctrl.getReturnCost));

export default router;
