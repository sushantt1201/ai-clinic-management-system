import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/api/v1/health', (_request, response) => {
    response.status(200).json({
      success: true,
      message: 'AI Clinic API is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.use((_request, response) => {
    response.status(404).json({ success: false, message: 'Route not found' });
  });

  return app;
}

