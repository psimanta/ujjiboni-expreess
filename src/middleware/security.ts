import { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';

const securityMiddleware = (app: Application): void => {
  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: '*', // or use '*' for any origin (not for production)
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true, // if you're sending cookies/auth headers
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
};

export default securityMiddleware;
