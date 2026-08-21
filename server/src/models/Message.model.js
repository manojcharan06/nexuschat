import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  width: { type: Number },
  height: { type: Number },
});

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
      index: true,
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    tempId: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for O(1) message history pagination by conversation and time
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
