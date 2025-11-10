
import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  organizationId: mongoose.Schema.Types.ObjectId;
  action: string;
  phoneNumber: string;
  createdAt: Date;
}

const AlertSchema: Schema = new Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  action: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create a compound index to ensure that an alert is unique for a specific organization and action
AlertSchema.index({ organizationId: 1, action: 1 }, { unique: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);
