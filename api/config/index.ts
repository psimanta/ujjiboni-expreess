import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security Configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/ujjiboni',
    name: process.env.DATABASE_NAME || 'ujjiboni',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
    },
  },

  // JWT Configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // API Configuration
  api: {
    key: process.env.API_KEY || '',
    version: '1.0.0',
  },

  // Application Settings
  app: {
    name: 'Ujjiboni',
    description: 'Ujjiboni is an organization.',
  },
};

export default config;
