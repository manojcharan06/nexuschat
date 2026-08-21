import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.util.js';

export const registerPresenceHandlers = (io, socket) => {
  const userId = socket.userId;

  // Track user socket room
  socket.join(`user_${userId}`);

  // Handle User Online Event on Connect
  const handleUserOnline = async () => {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });

      logger.info(`User Online: @${socket.user.username} (socketId: ${socket.id})`);

      // Emit connection success to connecting client
      socket.emit('connection:success', {
        userId,
        socketId: socket.id,
        serverTime: new Date().toISOString(),
      });

      // Broadcast presence change to all connected clients
      io.emit('user:presence_changed', {
        userId,
        username: socket.user.username,
        isOnline: true,
      });
    } catch (error) {
      logger.error(`Error updating online status for user ${userId}: ${error.message}`);
    }
  };

  handleUserOnline();

  // Handle Disconnect Event
  socket.on('disconnect', async (reason) => {
    try {
      const lastSeen = new Date();

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen,
      });

      logger.info(`User Offline: @${socket.user.username} (Reason: ${reason})`);

      // Broadcast presence change to all connected clients
      io.emit('user:presence_changed', {
        userId,
        username: socket.user.username,
        isOnline: false,
        lastSeen,
      });
    } catch (error) {
      logger.error(`Error updating offline status for user ${userId}: ${error.message}`);
    }
  });
};
