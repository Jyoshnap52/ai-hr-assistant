import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/seed.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'PeopleAI – Enterprise HR Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong while processing your request. Please try again.'
  });
});

// Connect DB & Start Server
const PORT = config.port;

async function startServer() {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PeopleAI Enterprise HR Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
