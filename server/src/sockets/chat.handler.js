import { Conversation } from '../models/Conversation.model.js';
import * as messageService from '../services/message.service.js';
import { logger } from '../utils/logger.util.js';

export const registerChatHandlers = (io, socket) => {
  const userId = socket.userId;

  // 1. Join Conversation Room Event
  socket.on('conversation:join', async (data, callback) => {
    try {
      const { conversationId } = data || {};
      if (!conversationId) {
        if (typeof callback === 'function') callback({ status: 'error', message: 'Missing conversationId' });
        return;
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        if (typeof callback === 'function') callback({ status: 'error', message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString()
      );
      if (!isParticipant) {
        if (typeof callback === 'function') callback({ status: 'error', message: 'Unauthorized room join' });
        return;
      }

      const roomName = `conv_${conversationId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} (user @${socket.user.username}) joined room ${roomName}`);

      if (typeof callback === 'function') {
        callback({ status: 'ok', joinedRoom: roomName });
      }
    } catch (error) {
      logger.error(`Error in conversation:join: ${error.message}`);
      if (typeof callback === 'function') callback({ status: 'error', message: error.message });
    }
  });

  // 2. Real-Time Send Message Event
  socket.on('message:send', async (data, callback) => {
    try {
      const { conversationId, text, attachments, tempId } = data || {};

      if (!conversationId) {
        if (typeof callback === 'function') callback({ status: 'error', message: 'Missing conversationId' });
        return;
      }

      // Step A: Save message to MongoDB first (Persistence before emit)
      const savedMessage = await messageService.createMessage({
        conversationId,
        senderId: userId,
        text,
        attachments,
        tempId,
      });

      // Step B: Send acknowledgement back to sender socket
      if (typeof callback === 'function') {
        callback({
          status: 'success',
          data: savedMessage,
        });
      }

      // Step C: Broadcast message:received to conversation room
      const convRoom = `conv_${conversationId}`;
      io.to(convRoom).emit('message:received', savedMessage);

      // Step D: Also broadcast to participants' personal user rooms (for sidebar updates)
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.participants.forEach((participantId) => {
          const pId = participantId.toString();
          if (pId !== userId.toString()) {
            io.to(`user_${pId}`).emit('message:received', savedMessage);
          }
        });
      }
    } catch (error) {
      logger.error(`Error processing message:send: ${error.message}`);
      if (typeof callback === 'function') {
        callback({
          status: 'error',
          message: error.message || 'Failed to send message',
        });
      }
    }
  });
};
