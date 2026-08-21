import { Conversation } from '../models/Conversation.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/apiError.util.js';

export const getOrCreateDirectConversation = async (userId, recipientId) => {
  if (!recipientId) {
    throw ApiError.badRequest('Recipient ID is required', 'MISSING_RECIPIENT_ID');
  }

  if (userId.toString() === recipientId.toString()) {
    throw ApiError.badRequest('Cannot create conversation with yourself', 'INVALID_RECIPIENT');
  }

  const recipientExists = await User.findById(recipientId);
  if (!recipientExists) {
    throw ApiError.notFound('Recipient user not found', 'RECIPIENT_NOT_FOUND');
  }

  // Find existing 1-on-1 direct conversation
  let conversation = await Conversation.findOne({
    type: 'direct',
    participants: { $all: [userId, recipientId] },
  })
    .populate('participants', 'username email avatarUrl isOnline lastSeen statusMessage')
    .populate({
      path: 'lastMessage',
      populate: { path: 'senderId', select: 'username avatarUrl' },
    });

  if (conversation) {
    return conversation;
  }

  // Create new conversation if none exists
  conversation = await Conversation.create({
    type: 'direct',
    participants: [userId, recipientId],
  });

  return await Conversation.findById(conversation._id).populate(
    'participants',
    'username email avatarUrl isOnline lastSeen statusMessage'
  );
};

export const getUserConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username email avatarUrl isOnline lastSeen statusMessage')
    .populate({
      path: 'lastMessage',
      populate: { path: 'senderId', select: 'username avatarUrl' },
    });

  return conversations;
};
