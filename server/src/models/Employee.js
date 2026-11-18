import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    joiningDate: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Onboarding', 'On Leave', 'Terminated'], default: 'Active' },
    manager: { type: String, default: 'Sarah Jenkins' },
    phone: { type: String, default: '+1 (555) 019-2834' },
    location: { type: String, default: 'New York HQ' },
    avatar: { type: String, default: '' },
    onboardingProgress: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', employeeSchema);
