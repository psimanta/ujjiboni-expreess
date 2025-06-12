import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security Configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  
  // Database Configuration (for future use)
  database: {
    url: process.env.DATABASE_URL || '',
    name: process.env.DATABASE_NAME || 'ujjiboni'
  },
  
  // JWT Configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // API Configuration
  api: {
    key: process.env.API_KEY || '',
    version: '1.0.0'
  },
  
  // Application Settings
  app: {
    name: 'Ujjiboni Express',
    description: 'A minimal Express.js and TypeScript boilerplate'
  }
};

export default config; 