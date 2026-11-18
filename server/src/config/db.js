import mongoose from 'mongoose';
import { config } from './env.js';

export let isMemoryMode = false;
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
  try {
    // Attempt MongoDB connection with 3-second timeout
    const options = {
      serverSelectionTimeoutMS: 3000
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
