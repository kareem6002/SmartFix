import bcrypt from 'bcryptjs'; import { Category, User, Req } from './models';
const CATS = ['Plumbing','Electrical Repairs','Air Conditioning and Maintenance','Carpentry','Painting','General Home Maintenance'];
export async function seed() {
  for (const name of CATS) await Category.updateOne({ name }, { name }, { upsert: true });
  const email = process.env.ADMIN_EMAIL || 'admin@smartfix.com';
  const prod = process.env.NODE_ENV === 'production';
  if (prod && !process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set: no default admin account created in production.');
  if ((!prod || process.env.ADMIN_PASSWORD) && !(await User.findOne({ email }))) await User.create({ name: 'Admin', email, role: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
  const demo = process.env.SEED_DEMO ? process.env.SEED_DEMO !== 'false' : !prod;
  if (demo && !(await User.findOne({ email: 'ahmed@smartfix.com' }))) {
    const pw = await bcrypt.hash('demo123', 10);
    const T: [string, string, string, string, number, number, number][] = [
      ['Ahmed Hassan', 'ahmed@smartfix.com', 'Plumbing', 'Licensed plumber. Leaks, pipes, heaters and bathroom installs.', 8, 4.8, 42],
      ['Mohamed Samir', 'samir@smartfix.com', 'Electrical Repairs', 'Certified electrician for wiring, sockets and lighting. Safe and tidy work.', 10, 4.9, 57],
      ['Omar Khaled', 'omar@smartfix.com', 'Air Conditioning and Maintenance', 'AC installation, gas refill and servicing for all major brands.', 6, 4.6, 31],
      ['Youssef Adel', 'youssef@smartfix.com', 'Carpentry', 'Custom furniture, doors, cabinets and wood repairs.', 12, 4.7, 24],
      ['Hassan Mostafa', 'hassan@smartfix.com', 'Painting', 'Interior and exterior painting with clean finishing.', 5, 4.5, 19],
      ['Karim Nabil', 'karim@smartfix.com', 'General Home Maintenance', 'Handyman for small repairs, fittings and everything in between.', 7, 4.4, 28],
    ];
    const techs = await User.insertMany(T.map(([name, email, category, bio, experienceYears, rating, reviewCount]) => ({ name, email, password: pw, role: 'technician', category, bio, experienceYears, rating, reviewCount })));
    const cust = await User.create({ name: 'Sara Ali', email: 'demo@smartfix.com', password: pw, role: 'customer' });
    const day = 86400000;
    await Req.create([
      { customer: cust.id, technician: techs[0].id, category: 'Plumbing', description: 'Kitchen sink pipe is leaking under the cabinet.', urgent: true, scheduledAt: new Date(Date.now() + day), status: 'pending' },
      { customer: cust.id, technician: techs[1].id, category: 'Electrical Repairs', description: 'Living room wall socket stopped working.', scheduledAt: new Date(Date.now() + 2 * day), status: 'accepted' },
      { customer: cust.id, technician: techs[2].id, category: 'Air Conditioning and Maintenance', description: 'AC not cooling properly, needs gas refill.', scheduledAt: new Date(Date.now() - 3 * day), status: 'completed' },
    ]);
    console.log('Demo data seeded (password for all demo accounts: demo123)');
  }
  if (!demo) return;
  // Demo accounts: fill in gender/phone/address if missing (so they get a profile photo).
  const DEMO: Record<string, ['male' | 'female', string, string]> = {
    'ahmed@smartfix.com': ['male', '01001110001', 'Maadi, Cairo'], 'samir@smartfix.com': ['male', '01001110002', 'Heliopolis, Cairo'],
    'omar@smartfix.com': ['male', '01001110003', 'Nasr City, Cairo'], 'youssef@smartfix.com': ['male', '01001110004', 'Dokki, Giza'],
    'hassan@smartfix.com': ['male', '01001110005', 'Haram, Giza'], 'karim@smartfix.com': ['male', '01001110006', '6th of October City, Giza'],
    'demo@smartfix.com': ['female', '01001110007', 'Zamalek, Cairo'],
  };
  for (const [email, [gender, phone, address]] of Object.entries(DEMO))
    await User.updateOne({ email, gender: { $exists: false } }, { $set: { gender, phone, address } });
  // Demo team chain (created once, never overwritten): company -> engineer -> technicians. Layla is an engineer who works alone.
  const hash = await bcrypt.hash('demo123', 10);
  const ensure = async (email: string, data: Record<string, unknown>) => {
    const found = await User.findOne({ email }); if (found) return { user: found, created: false };
    return { user: await User.create({ email, password: hash, ...data }), created: true };
  };
  const co = await ensure('company@smartfix.com', { name: 'Al Noor Contracting', role: 'company', gender: 'male', phone: '01001110010', address: 'New Cairo, Cairo',
    bio: 'Contracting and home-maintenance company managing a team of engineers and technicians.' });
  const tarek = await ensure('engineer@smartfix.com', { name: 'Tarek Salem', role: 'engineer', gender: 'male', phone: '01001110011', address: 'Nasr City, Cairo',
    category: 'General Home Maintenance', experienceYears: 12, bio: 'Civil engineer supervising home-maintenance projects and leading a team of technicians.', employer: co.user._id });
  await ensure('layla@smartfix.com', { name: 'Layla Fathy', role: 'engineer', gender: 'female', phone: '01001110012', address: 'Zamalek, Cairo',
    category: 'Electrical Repairs', experienceYears: 7, bio: 'Electrical engineer working independently on wiring and lighting projects.' });
  if (tarek.created)   // Ahmed and Omar work with Tarek (only if they were still working alone)
    await User.updateMany({ email: { $in: ['ahmed@smartfix.com', 'omar@smartfix.com'] }, employer: null }, { $set: { employer: tarek.user._id } });
}
