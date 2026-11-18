import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    filePath: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'Company Policy' },
    uploadedBy: { type: String, default: 'HR Team' },
    accessRoles: { type: [String], default: ['Employee', 'Manager', 'HR Admin'] },
    version: { type: String, default: '1.0' },
    isSuperseded: { type: Boolean, default: false },
    supersededBy: { type: String, default: null },
    effectiveDate: { type: String, default: '2026-01-01' },
    chunkCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Processing', 'Indexed', 'Failed'], default: 'Processing' },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model('Document', documentSchema);
