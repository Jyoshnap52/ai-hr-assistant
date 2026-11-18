import express from 'express';
import {
  chat,
  streamChat,
  saveFeedback,
  getEvalMetrics,
  getSessionHistory
} from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { piiSanitizerMiddleware } from '../middleware/piiSanitizer.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const aiRateLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 60,
  message: 'Security rate limit exceeded. Please wait a moment before sending more AI queries.'
});

// Standard REST AI Query
router.post('/chat', requireAuth, aiRateLimiter, piiSanitizerMiddleware, chat);
router.post('/query', requireAuth, aiRateLimiter, piiSanitizerMiddleware, chat);

// Real-Time Server-Sent Events (SSE) Streaming
router.get('/stream', requireAuth, streamChat);
router.post('/stream', requireAuth, streamChat);

// User Feedback Loop
router.post('/feedback', requireAuth, saveFeedback);

// RAG Evaluation & Retrieval Ablation Metrics Endpoint
router.get('/eval/metrics', getEvalMetrics);
router.post('/eval/metrics', getEvalMetrics);

// Chat Session History
router.get('/sessions/:sessionId', requireAuth, getSessionHistory);

export default router;
