import { verifyAccessToken } from '../utils/jwt.util.js';
import { ApiError } from '../utils/apiError.util.js';
import { User } from '../models/User.model.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Not authorized to access this route', 'NO_TOKEN_PROVIDED'));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(ApiError.unauthorized('User belonging to this token no longer exists', 'USER_NOT_FOUND'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN'));
  }
};
