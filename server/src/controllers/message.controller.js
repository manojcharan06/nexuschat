import * as messageService from '../services/message.service.js';

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit, before } = req.query;
    const userId = req.user._id;

    const data = await messageService.getConversationMessages(userId, conversationId, {
      limit,
      before,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessageHttp = async (req, res, next) => {
  try {
    const { conversationId, text, attachments, tempId } = req.body;
    const senderId = req.user._id;

    const message = await messageService.createMessage({
      conversationId,
      senderId,
      text,
      attachments,
      tempId,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
