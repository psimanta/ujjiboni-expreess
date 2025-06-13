import { Application } from 'express';
import express from 'express';
import config from '../config';
import morgan from 'morgan';

const requestMiddleware = (app: Application): void => {
  // Parse JSON bodies
  app.use(
    express.json({
      limit: '10mb',
      strict: true,
    })
  );

  // Parse URL-encoded bodies
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
      parameterLimit: 1000,
    })
  );

  // Request logging middleware
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }
};

export default requestMiddleware;
