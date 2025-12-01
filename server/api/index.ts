import express, { type Request, type Response } from 'express';
import { config } from '../src/config/env';
import friendsRouter from '../src/routes/friends';
import { errorHandler } from '../src/middleware/errorHandler';
import { securityHeaders, requestLogger, corsConfig } from '../src/middleware/security';

const app: express.Application = express();

// Security middleware (must be first)
app.use(securityHeaders());

// CORS configuration
app.use(corsConfig());

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API Routes
app.get('/api/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express backend!' });
});

// Friend relationships routes
app.use('/api/friends', friendsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Vercel serverless function handler
export default app;

