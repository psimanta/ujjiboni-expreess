import { Router, Request, Response } from 'express';
import config from '../config';
import Database from '../database';
import accountRoutes from './account';
import transactionRoutes from './transaction';

const router = Router();

// Root route
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: `Welcome to ${config.app.name}!`,
    description: config.app.description,
    version: config.api.version,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Health check route
router.get('/health', (req: Request, res: Response) => {
  const database = Database.getInstance();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    version: config.api.version,
    database: {
      connected: database.getConnectionStatus(),
      readyState: database.getConnection().readyState,
      host: database.getConnection().host,
      name: database.getConnection().name,
    },
  });
});

// Mount account routes
router.use('/accounts', accountRoutes);

// Mount transaction routes
router.use('/transactions', transactionRoutes);

export default router;
