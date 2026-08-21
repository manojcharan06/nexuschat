import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.util.js';
import { socketAuthMiddleware } from './socket.auth.js';
import { registerPresenceHandlers } from './presence.handler.js';
import { registerChatHandlers } from './chat.handler.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply Socket Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`⚡ Socket Connected: ${socket.id} (userId: ${socket.userId})`);

    // Register Handlers
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });


  logger.info('🔌 Socket.IO Server initialized cleanly');

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
