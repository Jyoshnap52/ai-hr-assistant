import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, required: true },
    matchScore: { type: Number, required: true },
    experienceYears: { type: Number, default: 0 },
    experienceText: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    recommendation: { type: String, enum: ['Strong Match', 'Good Match', 'Review', 'Not Recommended'], default: 'Review' },
    summary: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    jobDescription: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Candidate = mongoose.model('Candidate', candidateSchema);
