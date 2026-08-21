import * as conversationService from '../services/conversation.service.js';

export const createDirectConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    const conversation = await conversationService.getOrCreateDirectConversation(
      userId,
      recipientId
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await conversationService.getUserConversations(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};
