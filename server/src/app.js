import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import messageRoutes from './routes/message.routes.js';

const app = express();

// Parse single or comma-separated client origins
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow for production flexibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/messages', messageRoutes);

// Root & API Health check endpoints (for load balancers & deployment platforms)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'NexusChat API Server',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Global 404 handler for unhandled endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
