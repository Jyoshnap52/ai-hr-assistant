import express from 'express';
import { getOnboardingTasks, updateTaskStatus, createOnboardingTask } from '../controllers/onboardingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getOnboardingTasks);
router.put('/:id', requireAuth, updateTaskStatus);
router.post('/', requireAuth, createOnboardingTask);

export default router;
