import mongoose from 'mongoose';

const onboardingTaskSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    dueDate: { type: String, required: true },
    assignedTo: { type: String, default: 'HR Team' }
  },
  { timestamps: true }
);

export const OnboardingTask = mongoose.model('OnboardingTask', onboardingTaskSchema);
