import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/loaders/db.js';
import apiRouter from './src/routes/api.js';
import rateLimit from 'express-rate-limit';
import requestLogger from './src/middlewares/requestLogger.js';
import './src/services/passportConfig.js';
import passport from 'passport';

dotenv.config();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(requestLogger);

console.log('✅ Rate limiting configured');

async function bootstrap() {
  await connectDB();

  app.use(passport.initialize());

  app.use('/api', apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

bootstrap().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});