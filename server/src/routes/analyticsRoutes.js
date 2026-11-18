import express from 'express';
import { getDashboardMetrics, getAnalyticsData } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, getDashboardMetrics);
router.get('/hiring', requireAuth, getAnalyticsData);

export default router;
