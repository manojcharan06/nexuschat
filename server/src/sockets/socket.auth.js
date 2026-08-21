import { verifyAccessToken } from '../utils/jwt.util.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.util.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    if (!token) {
      logger.warn(`Socket Auth Failed: No token provided (socket ID: ${socket.id})`);
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`Socket Auth Failed: User not found (userId: ${decoded.userId})`);
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;

    next();
  } catch (error) {
    logger.warn(`Socket Auth Failed: ${error.message} (socket ID: ${socket.id})`);
    return next(new Error('Authentication error: Invalid or expired token'));
  }
};
