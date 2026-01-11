import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connectDB } from './src/loaders/db.js';
import multer from 'multer';
import apiRouter from './src/routes/api.js';
import rateLimit from 'express-rate-limit';
import requestLogger from './src/middlewares/requestLogger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

async function bootstrap(){

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(requestLogger);


// console.log(`Upload directory: ${path.join(__dirname, 'uploads/user-data')}`);
console.log('✅ Rate limiting configured');

app.use("/api", apiRouter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

await connectDB();

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 files allowed per upload.'
      });
    }
  }
  
  // Handle other file upload errors
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
});
}
bootstrap().catch((err)=>{
  console.error("Startup failed:", err);
  process.exit(1);
});