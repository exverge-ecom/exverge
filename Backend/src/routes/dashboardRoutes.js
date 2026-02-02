import express from 'express';
import { orderTrend, revenueTrend } from '../controllers/DasboardController.js';
import { topSellingProducts } from '../controllers/TopSellingControllers.js';
import { topPerformingChannels } from '../controllers/TopPerformingChannelController.js';

const router = express.Router();

router.post('/orders', orderTrend);
router.post('/revenue', revenueTrend);
router.post('/topSellingProducts', topSellingProducts);
router.post('/topPerformingChannels', topPerformingChannels);


export default router;
