/**
 * Rutas del módulo Categories. Públicas (sin auth) según el swagger.
 */
import { Router } from 'express';
import * as ctrl from './categories.controller';

const router = Router();

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getById);

export default router;
