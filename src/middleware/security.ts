import { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config';

const securityMiddleware = (app: Application): void => {
  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
};

export default securityMiddleware;
