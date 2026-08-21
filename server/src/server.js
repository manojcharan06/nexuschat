import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.util.js';

const server = http.createServer(app);

const startServer = async () => {
  // Connect to database
  await connectDB();

  server.listen(env.PORT, () => {
    logger.info(`🚀 NexusChat Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`🔗 Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });
};

startServer();
