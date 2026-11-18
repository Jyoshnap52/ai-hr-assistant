import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['HR Admin', 'Manager', 'Employee'], default: 'Employee' },
    department: { type: String, default: 'Human Resources' },
    avatar: { type: String, default: '' },
    employeeId: { type: String, default: '' }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
