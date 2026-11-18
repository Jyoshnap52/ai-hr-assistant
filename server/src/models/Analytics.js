import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    totalEmployees: { type: Number, default: 248 },
    pendingOnboarding: { type: Number, default: 12 },
    resumesToReview: { type: Number, default: 37 },
    indexedDocuments: { type: Number, default: 126 },
    hiringOverview: [
      {
        stage: String,
        count: Number
      }
    ],
    departmentBreakdown: [
      {
        department: String,
        count: Number
      }
    ],
    aiUsageMetrics: {
      questionsAsked: { type: Number, default: 1420 },
      documentsIndexed: { type: Number, default: 126 },
      avgResponseTimeMs: { type: Number, default: 420 },
      topTopics: [
        { topic: String, count: Number }
      ]
    }
  },
  { timestamps: true }
);

export const Analytics = mongoose.model('Analytics', analyticsSchema);
