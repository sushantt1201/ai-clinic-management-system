import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

try {
  const connection = await connectDatabase();
  console.log(`MongoDB connection successful: ${connection.name}`);
  await disconnectDatabase();
} catch (error) {
  console.error(`MongoDB connection failed: ${error.message}`);
  process.exitCode = 1;
}
