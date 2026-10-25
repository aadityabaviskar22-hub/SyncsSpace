import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import noteRoutes from './routes/note.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';

const app: Application = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded attachments to be served cross-origin
  })
);

// 2. CORS Configuration for React Client & Angular Admin
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const adminOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:4200';
const allowedOrigins = [clientOrigin, adminOrigin, 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiter (Prevents brute-force & DDoS attacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});

app.use('/api', apiLimiter);

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Static File Serving for File Attachments
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// 6. Base Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'SyncSpace API',
  });
});

// 7. API Route Mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1', taskRoutes);
app.use('/api/v1', noteRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 8. 404 Route Handler
app.use(notFoundHandler);

// 9. Centralized Error Handling Pipeline
app.use(errorHandler);

export default app;
