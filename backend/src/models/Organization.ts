import { Schema, model, Types } from 'mongoose';

const organizationSchema = new Schema({
  orgId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['parent', 'sister', 'related'], required: true },
  parentOrgId: { type: String },
  contactDetails: {
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  servicesEnrolled: [{ type: String }],
  teamMembers: [{ type: Types.ObjectId, ref: 'User' }],
  intermediaries: [{ type: Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export const Organization = model('Organization', organizationSchema);
