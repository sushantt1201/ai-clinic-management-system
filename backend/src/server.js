import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;
const app = createApp();

try {
  const connection = await connectDatabase();
  console.log(`MongoDB connected: ${connection.name}`);

  const server = app.listen(port, () => {
    console.log(`AI Clinic API listening on port ${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Closing the API safely.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error(`API startup failed: ${error.message}`);
  process.exit(1);
}
