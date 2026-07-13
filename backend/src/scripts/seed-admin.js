import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) throw new Error('Add ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) to backend/.env');
try {
  await connectDatabase();
  let admin = await User.findOne({ email }).select('+password');
  if (!admin) {
    admin = new User({ fullName: 'Clinic Administrator', email, password, role: 'admin', isActive: true });
  } else {
    // This explicit maintenance command is the only supported way to promote an existing account.
    await User.collection.updateOne({ _id: admin._id }, { $set: { role: 'admin', isActive: true } });
    admin = await User.findById(admin._id).select('+password');
    admin.password = password;
  }
  await admin.save();
  console.log('Admin account is ready.');
} finally { await disconnectDatabase(); }
