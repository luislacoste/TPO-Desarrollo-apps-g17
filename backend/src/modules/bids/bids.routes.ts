/**
 * Rutas de Bids.
 * POST /bids y los listados "my*" requieren JWT. El resto es público.
 */
import { Router } from 'express';
import * as ctrl from './bids.controller';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/', auth, asyncHandler(ctrl.placeBid));

// /bids/my y /bids/my/won — antes de las rutas con :auctionId para que
// no las pisen.
router.get('/my',     auth, asyncHandler(ctrl.listMine));
router.get('/my/won', auth, asyncHandler(ctrl.listMyWon));

router.get('/auction/:auctionId',                         asyncHandler(ctrl.listForAuction));
router.get('/auction/:auctionId/item/:itemId/current',    asyncHandler(ctrl.currentForItem));

export default router;
