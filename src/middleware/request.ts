import { Application } from 'express';
import express from 'express';
import config from '../config';

const requestMiddleware = (app: Application): void => {
  // Parse JSON bodies
  app.use(express.json({ 
    limit: '10mb',
    strict: true
  }));
  
  // Parse URL-encoded bodies
  app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
  }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    if (config.nodeEnv === 'development') {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    }
    next();
  });
};

export default requestMiddleware; 