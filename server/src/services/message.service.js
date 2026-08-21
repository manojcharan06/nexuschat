import { Message } from '../models/Message.model.js';
import { Conversation } from '../models/Conversation.model.js';
import { ApiError } from '../utils/apiError.util.js';

export const getConversationMessages = async (userId, conversationId, { limit = 30, before }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  }

  // Authorization check: User must be a participant
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    throw ApiError.forbidden('You are not authorized to view this conversation', 'UNAUTHORIZED_CONVERSATION');
  }

  const query = { conversationId };
  if (before) {
    query._id = { $lt: before };
  }

  const limitNum = parseInt(limit, 10) || 30;

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum + 1)
    .populate('senderId', 'username avatarUrl');

  let hasMore = false;
  if (messages.length > limitNum) {
    hasMore = true;
    messages.pop(); // Remove extra item used for checking next page
  }

  // Reverse so older messages are first in response log
  const formattedMessages = messages.reverse();

  return {
    messages: formattedMessages,
    hasMore,
    nextCursor: formattedMessages.length > 0 ? formattedMessages[0]._id : null,
  };
};

export const createMessage = async ({ conversationId, senderId, text, attachments = [], tempId }) => {
  if (!text && (!attachments || attachments.length === 0)) {
    throw ApiError.badRequest('Message content or attachment is required', 'EMPTY_MESSAGE');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  }

  // Authorization check
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId.toString()
  );
  if (!isParticipant) {
    throw ApiError.forbidden('You are not authorized to send messages in this conversation', 'UNAUTHORIZED_CONVERSATION');
  }

  // 1. Save message document to MongoDB
  const message = await Message.create({
    conversationId,
    senderId,
    text,
    attachments,
    tempId,
    status: 'sent',
    readBy: [{ userId: senderId, readAt: new Date() }],
  });

  // 2. Update Conversation lastMessage & updatedAt
  conversation.lastMessage = message._id;
  await conversation.save();

  return await Message.findById(message._id).populate('senderId', 'username avatarUrl');
};
