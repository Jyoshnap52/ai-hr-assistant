import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    documentTitle: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    section: { type: String, default: 'General' },
    pageNumber: { type: Number, default: 1 },
    accessRoles: { type: [String], default: ['Employee', 'Manager', 'HR Admin'] },
    version: { type: String, default: '1.0' },
    isSuperseded: { type: Boolean, default: false },
    embedding: { type: [Number], default: [] }
  },
  { timestamps: true }
);

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
