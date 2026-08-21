import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.util.js';
import { initSocket } from './sockets/index.js';

const server = http.createServer(app);

// Initialize Socket.IO Engine
initSocket(server);

const startServer = async () => {
  // Connect to database
  await connectDB();

  const PORT = env.PORT || 5000;
  const HOST = '0.0.0.0';

  server.listen(PORT, HOST, () => {
    logger.info(`🚀 NexusChat Server listening on ${HOST}:${PORT} in ${env.NODE_ENV} mode`);
    logger.info(`🔗 Health check available at http://localhost:${PORT}/health`);
  });
};

startServer();
