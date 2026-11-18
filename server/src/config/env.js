import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/people_ai',
  jwtSecret: process.env.JWT_SECRET || 'people_ai_enterprise_super_secret_jwt_key_2026',
  groqApiKey: process.env.GROQ_API_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
