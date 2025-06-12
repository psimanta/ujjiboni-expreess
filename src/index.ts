import express, { Application } from 'express';

// Import configuration
import config from './config';

// Import database
import Database from './database';

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

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    const database = Database.getInstance();
    await database.connect();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 URL: http://localhost:${config.port}`);
      console.log(`📋 App: ${config.app.name} v${config.api.version}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    const database = Database.getInstance();
    await database.disconnect();
    console.log('👋 Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  try {
    const database = Database.getInstance();
    await database.disconnect();
    console.log('👋 Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

export default app;
