import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'; import jwt from 'jsonwebtoken'; import bcrypt from 'bcryptjs'; import { z } from 'zod';
import { User, Category, Req, Review, Invite, PortfolioItem, Collaboration } from './models';
import { EMPLOYER_POPULATE, MEMBER_ROLE, Role, canInvite, employmentOnAccept, withAffiliation } from './team';
import { DATA_URL, MAX_IMAGES, MAX_PHOTO_CHARS } from './photos';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || ['dev-secret', 'change-me'].includes(process.env.JWT_SECRET)))
  throw new Error('JWT_SECRET must be set to a long random value when NODE_ENV=production');
export const app = express();
app.use(cors());
// Photos travel as base64 inside JSON, so only these two routes accept big bodies; everything else keeps the small default.
const jsonSmall = express.json(); const jsonBig = express.json({ limit: '6mb' });
const BIG_BODY = new Set(['/api/requests', '/api/portfolio']);
app.use((req, res, next) => (BIG_BODY.has(req.path) ? jsonBig : jsonSmall)(req, res, next));

type H = (req: any, res: Response, next: NextFunction) => any;
const wrap = (fn: H): H => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const auth = (...roles: string[]): H => (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
// Tiny in-memory limiter (per user) for invite spam protection.
const hits = new Map<string, number[]>();
const rateLimit = (max: number, windowMs = 60_000): H => (req, res, next) => {
  const now = Date.now(), key = `${req.path}:${req.user?.id || req.ip}`;
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) return res.status(429).json({ error: 'Too many requests' });
  recent.push(now); hits.set(key, recent); next();
};
const sign = (u: any) => jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '7d' });

const pub = (u: any) => ({ id: u.id, name: u.name, role: u.role, gender: u.gender });
app.get('/api/health', (_q, r) => r.json({ ok: true }));

// ---- Auth ----
const PHONE = z.string().trim().regex(/^\+?[\d\s-]{7,15}$/, 'Enter a valid phone number');
const regSchema = z.object({
  name: z.string().min(2), email: z.string().email().transform(e => e.toLowerCase().trim()), password: z.string().min(6),
  role: z.enum(['customer','technician','engineer','company']).default('customer'),   // companies register with their company name as `name`
  gender: z.enum(['male','female']), phone: PHONE, address: z.string().trim().min(5, 'Enter your address'),
  category: z.string().optional(), skills: z.array(z.string()).optional(), experienceYears: z.number().optional(), bio: z.string().optional(),
});
app.post('/api/auth/register', wrap(async (req, res) => {
  const d = regSchema.parse(req.body);
  if (await User.findOne({ email: d.email })) return res.status(409).json({ error: 'Email already registered' });
  const u = await User.create({ ...d, password: await bcrypt.hash(d.password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
const loginSchema = z.object({
  email: z.string().email(), password: z.string().min(1),
  role: z.enum(['customer','technician','engineer','company','admin']).optional(),
});
app.post('/api/auth/login', wrap(async (req, res) => {
  const d = loginSchema.parse(req.body);
  const u = await User.findOne({ email: d.email.toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(d.password, u.password))) return res.status(401).json({ error: 'Invalid email or password' });
  if (!u.active) return res.status(403).json({ error: 'Account deactivated' });
  if (d.role && u.role !== d.role) return res.status(403).json({ error: `This account is not a ${d.role} account. Go back and choose the right role.` });
  res.json({ token: sign(u), user: pub(u) });
}));
app.get('/api/me', auth(), wrap(async (req, res) => res.json(withAffiliation(await User.findById(req.user.id).select('-password').populate(EMPLOYER_POPULATE)))));
const meSchema = z.object({
  name: z.string().trim().min(2).optional(), gender: z.enum(['male','female']).optional(),
  phone: PHONE.optional(), address: z.string().trim().min(5, 'Enter your address').optional(),
  bio: z.string().max(500).optional(), experienceYears: z.number().min(0).max(60).optional(), skills: z.array(z.string()).optional(),
});
app.put('/api/me', auth(), wrap(async (req, res) => {
  const d: any = meSchema.parse(req.body);
  const role = req.user.role;
  if (!['technician', 'engineer'].includes(role)) { delete d.experienceYears; delete d.skills; }   // professional fields
  if (!['technician', 'engineer', 'company'].includes(role)) delete d.bio;
  res.json(withAffiliation(await User.findByIdAndUpdate(req.user.id, d, { new: true }).select('-password').populate(EMPLOYER_POPULATE)));
}));

// ---- Work history / portfolio ----
const portfolioSchema = z.object({
  label: z.string().trim().min(2).max(80), description: z.string().trim().min(5).max(800),
  photos: z.array(z.string().max(MAX_PHOTO_CHARS).refine(v => DATA_URL.test(v), 'Invalid image')).max(MAX_IMAGES).default([]),
});
app.get('/api/portfolio/me', auth(), wrap(async (req, res) => res.json(await PortfolioItem.find({ owner: req.user.id }).sort({ createdAt: -1 }))));
app.get('/api/portfolio/:ownerId', wrap(async (req, res) => res.json(await PortfolioItem.find({ owner: req.params.ownerId }).sort({ createdAt: -1 }))));
app.post('/api/portfolio', auth('technician', 'engineer', 'company'), wrap(async (req, res) => {
  const d = portfolioSchema.parse(req.body);
  res.status(201).json(await PortfolioItem.create({ ...d, owner: req.user.id }));
}));
app.delete('/api/portfolio/:id', auth('technician', 'engineer', 'company'), wrap(async (req, res) => {
  const r = /^[a-f\d]{24}$/i.test(req.params.id) ? await PortfolioItem.deleteOne({ _id: req.params.id, owner: req.user.id }) : null;
  if (!r?.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

// ---- Teams: company -> engineers -> technicians. The leader invites; the invited person must accept. ----
const isId = (v: string) => /^[a-f\d]{24}$/i.test(v);
app.get('/api/team', auth('engineer', 'company'), wrap(async (req, res) => {
  const members = await User.find({ employer: req.user.id, role: MEMBER_ROLE[req.user.role as Role] }).select('-password').sort({ name: 1 });
  const invites = await Invite.find({ from: req.user.id, status: 'pending' }).populate('to', 'name email gender role').sort({ createdAt: -1 });
  let out: any[] = members.map(m => m.toObject());
  if (req.user.role === 'company') {            // org chart: every engineer together with the technicians who work with them
    const techs = await User.find({ role: 'technician', employer: { $in: members.map(m => m._id) } }).select('name gender category rating reviewCount employer');
    out = out.map(e => ({ ...e, technicians: techs.filter(t => String(t.employer) === String(e._id)) }));
  }
  res.json({ members: out, invites });
}));
app.post('/api/team/invite', auth('engineer', 'company'), rateLimit(20), wrap(async (req, res) => {
  const { email } = z.object({ email: z.string().email().transform(e => e.toLowerCase().trim()) }).parse(req.body);
  const target = await User.findOne({ email, active: true });
  if (!target) return res.status(404).json({ error: 'No account found with that email' });
  if (!canInvite(req.user.role, target.role)) return res.status(400).json({ error: `That account is not ${req.user.role === 'company' ? 'an engineer' : 'a technician'}` });
  if (String(target.employer) === req.user.id) return res.status(409).json({ error: 'Already in your team' });
  if (await Invite.exists({ from: req.user.id, to: target._id, status: 'pending' })) return res.status(409).json({ error: 'Invitation already sent' });
  const inv = await Invite.create({ from: req.user.id, to: target._id });
  res.status(201).json(await inv.populate('to', 'name email gender role'));
}));
app.delete('/api/team/invites/:id', auth('engineer', 'company'), wrap(async (req, res) => {
  const r = isId(req.params.id) ? await Invite.deleteOne({ _id: req.params.id, from: req.user.id, status: 'pending' }) : null;
  if (!r?.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));
app.delete('/api/team/members/:id', auth('engineer', 'company'), wrap(async (req, res) => {
  const r = isId(req.params.id) ? await User.updateOne({ _id: req.params.id, employer: req.user.id }, { $set: { employer: null } }) : null;
  if (!r?.matchedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));
// what a technician / engineer sees: invitations waiting for an answer
app.get('/api/invites', auth('technician', 'engineer'), wrap(async (req, res) => {
  const list = await Invite.find({ to: req.user.id, status: 'pending' })
    .populate({ path: 'from', select: 'name gender role employer', populate: { path: 'employer', select: 'name gender role' } }).sort({ createdAt: -1 });
  res.json(list.filter(i => i.from).map(i => {
    const f: any = i.from;
    const company = f.role === 'engineer' && f.employer?.role === 'company' ? { id: String(f.employer._id), name: f.employer.name } : null;   // tell a technician which company the engineer works for
    return { _id: i._id, createdAt: (i as any).createdAt, from: { id: String(f._id), name: f.name, gender: f.gender, role: f.role, company } };
  }));
}));
const answerInvite = (accept: boolean): H => async (req, res) => {
  const inv = isId(req.params.id) ? await Invite.findOne({ _id: req.params.id, to: req.user.id, status: 'pending' }).populate('from', 'role active') : null;
  const from: any = inv?.from;
  if (!inv || !from?.active || !canInvite(from.role, req.user.role)) return res.status(404).json({ error: 'Not found' });
  if (accept) await User.updateOne({ _id: req.user.id }, { $set: { employer: from._id } });   // one employer at a time: this replaces any previous one
  inv.status = accept ? 'accepted' : 'declined'; await inv.save();
  res.json({ ok: true });
};
app.post('/api/invites/:id/accept', auth('technician', 'engineer'), wrap(answerInvite(true)));
app.post('/api/invites/:id/decline', auth('technician', 'engineer'), wrap(answerInvite(false)));
// leave the team and work alone again
app.delete('/api/me/employer', auth('technician', 'engineer'), wrap(async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $set: { employer: null } }); res.json({ ok: true });
}));

// ---- Applications, hiring offers, and in-app inbox ----
const COLLAB_TARGET: Record<string, string> = { technician: 'engineer', engineer: 'company' };
const OFFER_TARGET: Record<string, string> = { engineer: 'technician', company: 'engineer' };
const collabSchema = z.object({ email: z.string().email().transform(e => e.toLowerCase().trim()), message: z.string().trim().max(800).optional() });
app.get('/api/inbox', auth('technician', 'engineer', 'company'), wrap(async (req, res) => {
  const criteria: any = req.user.role === 'company'
    ? { to: req.user.id, kind: 'application' }
    : { $or: [{ to: req.user.id }, { from: req.user.id }] };
  const rows: any[] = await Collaboration.find(criteria)
    .populate('from', 'name email gender role').populate('to', 'name email gender role').sort({ createdAt: -1 });
  if (req.user.role === 'engineer' || req.user.role === 'company') {
    const jobs: any[] = await Req.find({ provider: req.user.id, providerRole: req.user.role })
      .populate('customer', 'name gender role').sort({ createdAt: -1 });
    rows.push(...jobs.map(job => ({
      _id: String(job._id), kind: 'customer_request', status: job.status,
      from: job.customer ? { _id: String(job.customer._id), name: job.customer.name, gender: job.customer.gender, role: 'customer' } : null,
      to: { _id: req.user.id, name: req.user.name, role: req.user.role }, message: job.description,
      createdAt: job.createdAt, scheduledAt: job.scheduledAt,
    })));
  }
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(rows);
}));
app.post('/api/collaborations/apply', auth('technician', 'engineer'), wrap(async (req, res) => {
  const d = collabSchema.parse(req.body); const target = await User.findOne({ email: d.email, active: true });
  if (!target || target.role !== COLLAB_TARGET[req.user.role]) return res.status(400).json({ error: `Applications can only be sent to a ${COLLAB_TARGET[req.user.role]}` });
  if (String(target._id) === req.user.id) return res.status(400).json({ error: 'You cannot apply to yourself' });
  if (await Collaboration.exists({ from: req.user.id, to: target._id, kind: 'application', status: 'pending' })) return res.status(409).json({ error: 'Application already sent' });
  res.status(201).json(await Collaboration.create({ from: req.user.id, to: target._id, kind: 'application', message: d.message }));
}));
app.post('/api/collaborations/offer', auth('engineer', 'company'), wrap(async (req, res) => {
  const d = collabSchema.parse(req.body); const target = await User.findOne({ email: d.email, active: true });
  if (!target || target.role !== OFFER_TARGET[req.user.role]) return res.status(400).json({ error: `Offers can only be sent to a ${OFFER_TARGET[req.user.role]}` });
  if (await Collaboration.exists({ from: req.user.id, to: target._id, kind: 'offer', status: 'pending' })) return res.status(409).json({ error: 'Offer already sent' });
  res.status(201).json(await Collaboration.create({ from: req.user.id, to: target._id, kind: 'offer', message: d.message }));
}));
const answerCollab = (accept: boolean): H => async (req, res) => {
  const row: any = isId(req.params.id) ? await Collaboration.findOne({ _id: req.params.id, to: req.user.id, status: 'pending' }).populate('from', 'role active') : null;
  if (!row || !row.from?.active) return res.status(404).json({ error: 'Not found' });
  const expectedFrom = row.kind === 'application' ? (req.user.role === 'engineer' ? 'technician' : 'engineer') : (req.user.role === 'technician' ? 'engineer' : 'company');
  if (row.from.role !== expectedFrom) return res.status(400).json({ error: 'This collaboration does not match your role' });
  row.status = accept ? 'accepted' : 'declined'; await row.save();
  if (accept) {
    const { employeeId, employerId } = employmentOnAccept(row.kind, String(req.user.id), String(row.from._id));
    await User.updateOne({ _id: employeeId }, { $set: { employer: employerId } });
  }
  res.json({ ok: true });
};
app.post('/api/inbox/:id/accept', auth('technician', 'engineer', 'company'), wrap(answerCollab(true)));
app.post('/api/inbox/:id/decline', auth('technician', 'engineer', 'company'), wrap(answerCollab(false)));

// ---- Categories (admin CRUD) ----
app.get('/api/categories', wrap(async (_q, res) => res.json(await Category.find())));
app.post('/api/categories', auth('admin'), wrap(async (req, res) => res.status(201).json(await Category.create(req.body))));
app.put('/api/categories/:id', auth('admin'), wrap(async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }))));
app.delete('/api/categories/:id', auth('admin'), wrap(async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.sendStatus(204); }));

// ---- Technicians & providers ----
app.get('/api/technicians', wrap(async (req, res) => {
  const q: any = { role: 'technician', active: true };
  if (req.query.category) q.category = req.query.category;
  res.json((await User.find(q).select('-password').sort({ rating: -1 }).populate(EMPLOYER_POPULATE)).map(withAffiliation));   // affiliation = engineer + company they work under
}));
app.get('/api/technicians/:id/reviews', wrap(async (req, res) =>
  res.json(await Review.find({ technician: req.params.id }).populate('customer', 'name').sort({ createdAt: -1 }))));
const PROVIDER_ROLES = ['technician', 'engineer', 'company'];
app.get('/api/providers', wrap(async (req, res) => {
  const role = String(req.query.role || '');
  if (!PROVIDER_ROLES.includes(role)) return res.status(400).json({ error: 'Choose a valid provider role' });
  const people: any[] = await User.find({ role, active: true })
    .select('name role gender category skills experienceYears bio rating reviewCount employer')
    .sort({ rating: -1, experienceYears: -1 }).populate(EMPLOYER_POPULATE);
  const teamRole = role === 'engineer' ? 'technician' : role === 'company' ? 'engineer' : null;
  const teamSizes = new Map<string, number>();
  if (teamRole && people.length) {
    const grouped = await User.aggregate([{ $match: { role: teamRole, employer: { $in: people.map(p => p._id) } } }, { $group: { _id: '$employer', count: { $sum: 1 } } }]);
    grouped.forEach(row => teamSizes.set(String(row._id), row.count));
  }
  res.json(people.map(person => ({ ...withAffiliation(person), teamSize: teamSizes.get(String(person._id)) || 0 })));
}));
app.get('/api/providers/:role/:id', wrap(async (req, res) => {
  if (!PROVIDER_ROLES.includes(req.params.role) || !isId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const person: any = await User.findOne({ _id: req.params.id, role: req.params.role, active: true })
    .select('name role gender category skills experienceYears bio rating reviewCount employer')
    .populate(EMPLOYER_POPULATE);
  if (!person) return res.status(404).json({ error: 'Not found' });
  const teamRole = person.role === 'engineer' ? 'technician' : person.role === 'company' ? 'engineer' : null;
  const teamSize = teamRole ? await User.countDocuments({ role: teamRole, employer: person._id, active: true }) : 0;
  res.json({ ...withAffiliation(person), teamSize });
}));
// ---- Requests / bookings ----
const photoSchema = z.string().max(MAX_PHOTO_CHARS, 'Invalid image').refine(v => DATA_URL.test(v), 'Invalid image');
const reqSchema = z.object({ technician: z.string(), category: z.string(), description: z.string().min(10), urgent: z.boolean().default(false), scheduledAt: z.coerce.date(),
  photos: z.array(photoSchema).max(MAX_IMAGES).default([]) });
const providerReqSchema = z.object({ providerId: z.string().refine(isId), providerRole: z.enum(['engineer', 'company']), category: z.enum(['complex', 'design', 'property', 'maintenance', 'other']),
  description: z.string().trim().min(10).max(1000), scheduledAt: z.coerce.date() }).superRefine((d, ctx) => {
  if (d.providerRole === 'engineer' && ['property', 'maintenance'].includes(d.category)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Choose an engineering project type' });
  if (d.providerRole === 'company' && d.category === 'complex') ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Choose a company project type' });
});
app.post('/api/requests', auth('customer'), wrap(async (req, res) => {
  const d = reqSchema.parse(req.body);
  if (d.scheduledAt < new Date()) return res.status(400).json({ error: 'Pick a future time' });
  const clash = await Req.findOne({ technician: d.technician, scheduledAt: d.scheduledAt, status: { $in: ['pending','accepted','in_progress'] } });
  if (clash) return res.status(409).json({ error: 'Technician is not available at that time' });
  const created = await Req.create({ ...d, photoCount: d.photos.length, customer: req.user.id });
  const { photos: _omit, ...out } = created.toObject();     // don't echo the photos back
  res.status(201).json(out);
}));
app.post('/api/requests/provider', auth('customer'), wrap(async (req, res) => {
  const d = providerReqSchema.parse(req.body);
  if (d.scheduledAt < new Date()) return res.status(400).json({ error: 'Pick a time in the future' });
  const provider = await User.findOne({ _id: d.providerId, role: d.providerRole, active: true });
  if (!provider) return res.status(404).json({ error: 'Not found' });
  const created = await Req.create({ customer: req.user.id, provider: provider._id, providerRole: d.providerRole, category: d.category, description: d.description, scheduledAt: d.scheduledAt });
  res.status(201).json(created);
}));
// Photos are loaded on demand (lists only carry photoCount). Allowed: the customer, the assigned technician, or an admin.
app.get('/api/requests/:id/photos', auth('customer', 'technician', 'admin'), wrap(async (req, res) => {
  const r = /^[a-f\d]{24}$/i.test(req.params.id) ? await Req.findById(req.params.id).select('+photos') : null;
  const allowed = r && (req.user.role === 'admin' || String(req.user.role === 'customer' ? r.customer : r.technician) === req.user.id);
  if (!r || !allowed) return res.status(404).json({ error: 'Not found' });
  res.json({ photos: r.photos || [] });
}));
app.get('/api/requests', auth('customer','technician','engineer','company'), wrap(async (req, res) => {
  const f = req.user.role === 'customer' ? { customer: req.user.id }
    : req.user.role === 'technician' ? { technician: req.user.id }
    : { provider: req.user.id, providerRole: req.user.role };
  res.json(await Req.find(f).populate('customer technician provider', 'name gender role').sort({ urgent: -1, scheduledAt: 1 }));
}));
const NEXT: Record<string, Record<string, string[]>> = {
  technician: { pending: ['accepted','rejected'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'], accepted: ['cancelled'] },
  engineer: { pending: ['accepted','rejected'], accepted: ['in_progress'], in_progress: ['completed'] },
  company: { pending: ['accepted','rejected'], accepted: ['in_progress'], in_progress: ['completed'] },
};
app.patch('/api/requests/:id/status', auth('customer','technician','engineer','company'), wrap(async (req, res) => {
  const r = await Req.findById(req.params.id);
  const owner = r && String(req.user.role === 'customer' ? r.customer : req.user.role === 'technician' ? r.technician : r.provider) === req.user.id
    && (req.user.role !== 'engineer' && req.user.role !== 'company' || r.providerRole === req.user.role);
  if (!r || !owner) return res.status(404).json({ error: 'Not found' });
  if (!NEXT[req.user.role][r.status]?.includes(req.body.status)) return res.status(400).json({ error: `Cannot move ${r.status} → ${req.body.status}` });
  r.status = req.body.status; await r.save(); res.json(r);
}));

// ---- Reviews ----
app.post('/api/reviews', auth('customer'), wrap(async (req, res) => {
  const { request, rating, comment } = z.object({ request: z.string(), rating: z.number().min(1).max(5), comment: z.string().optional() }).parse(req.body);
  const r = await Req.findOne({ _id: request, customer: req.user.id, status: 'completed' });
  if (!r) return res.status(400).json({ error: 'Only completed requests can be reviewed' });
  if (r.reviewed) return res.status(409).json({ error: 'Already reviewed' });
  await Review.create({ request, rating, comment, customer: req.user.id, technician: r.technician });
  const t = await User.findById(r.technician)!;
  if (t) { const n = t.reviewCount || 0; t.rating = (((t.rating || 0) * n) + rating) / (n + 1); t.reviewCount = n + 1; await t.save(); }
  r.reviewed = true; await r.save(); res.status(201).json({ ok: true });
}));

// ---- Admin ----
app.get('/api/admin/stats', auth('admin'), wrap(async (_q, res) => {
  const [customers, technicians, engineers, companies, requests, completed, pending] = await Promise.all([
    User.countDocuments({ role: 'customer' }), User.countDocuments({ role: 'technician' }),
    User.countDocuments({ role: 'engineer' }), User.countDocuments({ role: 'company' }),
    Req.countDocuments(), Req.countDocuments({ status: 'completed' }), Req.countDocuments({ status: 'pending' })]);
  res.json({ customers, technicians, engineers, companies, requests, completed, pending });
}));
app.get('/api/admin/users', auth('admin'), wrap(async (_q, res) => res.json(await User.find({ role: { $ne: 'admin' } }).select('-password'))));
app.patch('/api/admin/users/:id/active', auth('admin'), wrap(async (req, res) =>
  res.json(await User.findByIdAndUpdate(req.params.id, { active: !!req.body.active }, { new: true }).select('-password'))));
app.get('/api/admin/requests', auth('admin'), wrap(async (_q, res) => res.json(await Req.find().populate('customer technician', 'name gender').sort({ createdAt: -1 }))));

app.use((err: any, _q: Request, res: Response, _n: NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
  console.error(err); res.status(500).json({ error: 'Server error' });
});
