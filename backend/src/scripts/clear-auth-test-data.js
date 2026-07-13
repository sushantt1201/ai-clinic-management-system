import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Otp } from '../models/otp.model.js';
import { User } from '../models/user.model.js';

try {
  await connectDatabase();
  const [users, otps] = await Promise.all([User.deleteMany({}), Otp.deleteMany({})]);
  console.log(`Cleared ${users.deletedCount} user account(s) and ${otps.deletedCount} OTP record(s).`);
} finally {
  await disconnectDatabase();
}
