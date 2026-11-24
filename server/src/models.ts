import { Schema, model } from 'mongoose';
export const STATUSES = ['pending','accepted','rejected','in_progress','completed','cancelled'] as const;
export const User = model('User', new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer','technician','engineer','company','admin'], default: 'customer' },
  active: { type: Boolean, default: true },
  gender: { type: String, enum: ['male','female'] }, phone: String, address: String,
  // who this person works under: a technician's engineer, an engineer's company. null = works alone (default)
  employer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  // technician / engineer profile (companies use `bio` as their description)
  category: String, skills: [String], experienceYears: Number, bio: String, rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 },
}, { timestamps: true }));
export const Category = model('Category', new Schema({ name: { type: String, unique: true, required: true }, icon: String }));
export const Req = model('Request', new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  technician: { type: Schema.Types.ObjectId, ref: 'User' },
  provider: { type: Schema.Types.ObjectId, ref: 'User' },
  providerRole: { type: String, enum: ['engineer', 'company'] },
  category: String, description: { type: String, required: true }, urgent: { type: Boolean, default: false },
  scheduledAt: { type: Date, required: true }, status: { type: String, enum: STATUSES, default: 'pending' },
  reviewed: { type: Boolean, default: false },
  // photos the customer attached (compressed data URLs). Hidden from normal queries so lists stay light; read via GET /requests/:id/photos
  photos: { type: [String], select: false }, photoCount: { type: Number, default: 0 },
}, { timestamps: true }));
export const Review = model('Review', new Schema({
  request: { type: Schema.Types.ObjectId, ref: 'Request', unique: true }, customer: { type: Schema.Types.ObjectId, ref: 'User' },
  technician: { type: Schema.Types.ObjectId, ref: 'User' }, rating: { type: Number, min: 1, max: 5 }, comment: String,
}, { timestamps: true }));

// An engineer invites a technician, or a company invites an engineer. Nothing changes until the invited person accepts.
export const Invite = model('Invite', new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true }));

// A shared work-history portfolio item. Photos are data URLs to match the existing request-photo flow.
export const PortfolioItem = model('PortfolioItem', new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 800 },
  photos: { type: [String], default: [] },
}, { timestamps: true }));

// Two-way collaboration: technicians apply to engineers, engineers apply to companies,
// while engineers and companies can send hiring offers to the people they lead.
export const Collaboration = model('Collaboration', new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['application', 'offer'], required: true },
  message: { type: String, trim: true, maxlength: 800 },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true }));
