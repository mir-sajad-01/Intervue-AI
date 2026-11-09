import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { validateEnvironment } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { requestId } from './middleware/requestId.js';
import { isAllowedOrigin } from './middleware/originGuard.js';
import authRoutes from './routes/authRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import sessionRoutes, { dashboardStatsHandler } from './routes/sessionRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

morgan.token('id', (req) => req.requestId || '-');

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(requestId);
app.use(morgan('[:id] :method :url :status :response-time ms'));
app.use(cookieParser());
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      const error = new Error('This origin is not allowed to access the API.');
      error.status = 403;
      return callback(error);
    },
    credentials: true
  })
);

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    service: 'IntervueAI API'
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.get('/api/dashboard/stats', ...dashboardStatsHandler);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  const configurationErrors = validateEnvironment();
  if (configurationErrors.length) {
    throw new Error(`Invalid server configuration:\n- ${configurationErrors.join('\n- ')}`);
  }

  await connectDB();
  const server = app.listen(PORT, () => console.log(`IntervueAI API running on port ${PORT}`));

  const shutdown = (signal) => {
    console.log(`${signal} received; closing API server.`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error) => {
  console.error(`API startup failed: ${error.message}`);
  process.exitCode = 1;
});
