import { Router, Request, Response } from 'express';
import config from '../config';

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
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    version: config.api.version,
  });
});

export default router;
