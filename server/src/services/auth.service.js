import { User } from '../models/User.model.js';
import { ApiError } from '../utils/apiError.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';

export const registerUser = async ({ username, email, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw ApiError.conflict('Email address is already in use', 'EMAIL_IN_USE');
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw ApiError.conflict('Username is already taken', 'USERNAME_TAKEN');
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    username,
    email,
    passwordHash,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  user.refreshTokens.push(refreshToken);
  user.lastSeen = new Date();
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshSession = async (token) => {
  if (!token) {
    throw ApiError.unauthorized('Refresh token is required', 'NO_REFRESH_TOKEN');
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      throw ApiError.unauthorized('Invalid or revoked refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Generate new Access Token
    const accessToken = generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  } catch (error) {
    throw ApiError.unauthorized('Refresh token expired or invalid', 'REFRESH_TOKEN_EXPIRED');
  }
};

export const logoutUser = async (userId, token) => {
  if (userId && token) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: token },
    });
  }
};
