import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role:     { type: String, enum: ['admin','engineer','desk','viewer'], default: 'desk' }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
