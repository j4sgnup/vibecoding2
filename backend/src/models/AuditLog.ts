import { Schema, model, Types } from 'mongoose';

const auditLogSchema = new Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  actorId: { type: Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  actorEmail: { type: String, required: true },
  actionType: { type: String, required: true },
  targetEntityId: { type: String },
  targetEntityName: { type: String },
  status: { type: String, enum: ['success', 'failure'], required: true },
  location: { type: String },
  details: { type: Schema.Types.Mixed },
  orgId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

export const AuditLog = model('AuditLog', auditLogSchema);