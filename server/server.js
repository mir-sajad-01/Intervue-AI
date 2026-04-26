import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { seedQuestions } from './data/questions.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import Question from './models/Question.js';
import authRoutes from './routes/authRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import sessionRoutes, { dashboardStatsHandler } from './routes/sessionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && localDevOrigin.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'IntervueAI API' }));
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
  await connectDB();
  await seedQuestions(Question);
  app.listen(PORT, () => console.log(`IntervueAI API running on port ${PORT}`));
};

start();

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
