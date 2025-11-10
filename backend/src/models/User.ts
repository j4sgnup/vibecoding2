import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true }, // Removed enum for flexibility with roles like 'assistant accountant'
  orgId: { type: String, required: true, ref: 'Organization' },
  status: { type: String, enum: ['invited', 'in_progress', 'awaiting_approval', 'active'], required: true },
  invitedBy: { type: String, ref: 'User' },
  registrationProgress: { type: Number, min: 0, max: 100, default: 0 },
  inviteSentAt: { type: Date },
  inviteOpenedAt: { type: Date },
  inviteRedeemedAt: { type: Date },
  registrationStartedAt: { type: Date },
  registrationCompletedAt: { type: Date },
  lastLoginAt: { type: Date }, // New field
  assignedAt: { type: Date }, // New field
}, { timestamps: true });

export const User = model('User', userSchema);
