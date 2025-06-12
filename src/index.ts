import express, { Application } from 'express';

// Import configuration
import config from './config';

// Import middleware
import {
  securityMiddleware,
  requestMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './middleware';

// Import routes
import apiRoutes from './routes';

const app: Application = express();

// Apply middleware
securityMiddleware(app);
requestMiddleware(app);

// Apply routes
app.use('/', apiRoutes);

// Apply error handling middleware (must be last)
app.use('*', notFoundMiddleware);
app.use(errorMiddleware);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server is running on port ${config.port}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 URL: http://localhost:${config.port}`);
  console.log(`📋 App: ${config.app.name} v${config.api.version}`);
});

export default app;
