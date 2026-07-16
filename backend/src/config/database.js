import mongoose from 'mongoose';

const DATABASE_NAME = 'ai-clinic';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env before starting the API.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    dbName: DATABASE_NAME,
    serverSelectionTimeoutMS: 10_000,
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] ?? 'unknown';
}
