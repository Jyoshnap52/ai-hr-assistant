import mongoose from 'mongoose';
import { config } from './env.js';

export let isMemoryMode = true;
export const memoryStore = {
  users: [],
  employees: [],
  documents: [],
  documentChunks: [],
  candidates: [],
  onboardingTasks: [],
  chatSessions: [],
  chatMessages: [],
  analytics: null
};

export const connectDB = async () => {
  // If no external MONGODB_URI configured in production, use in-memory store directly
  if (!process.env.MONGODB_URI) {
    console.log('⚡ No external MONGODB_URI configured. Initializing High-Performance In-Memory Data Store...');
    isMemoryMode = true;
    return;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 2000
    };
    await mongoose.connect(config.mongoUri, options);
    console.log('✅ MongoDB connected successfully:', config.mongoUri);
    isMemoryMode = false;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('⚡ Initializing High-Performance In-Memory Data Store fallback for seamless execution...');
    isMemoryMode = true;
  }
};
