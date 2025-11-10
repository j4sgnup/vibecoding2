import { Schema, model, Types } from 'mongoose';

const serviceAccessLogSchema = new Schema({
  userId: { type: Types.ObjectId, required: true, ref: 'User' },
  serviceId: { type: String, required: true },
  lastAccessedAt: { type: Date, required: true },
}, { timestamps: true });

export const ServiceAccessLog = model('ServiceAccessLog', serviceAccessLogSchema);
