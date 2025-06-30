import { Request, Response } from 'express';

const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

export default notFoundMiddleware;
