import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        documentTitle: String,
        section: String,
        pageNumber: Number
      }
    ],
    documentCount: { type: Number, default: 0 },
    responseTimeMs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, default: 'New Conversation' }
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
