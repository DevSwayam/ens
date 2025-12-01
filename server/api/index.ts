import express, { type Request, type Response } from 'express';
import cors from 'cors';
import friendsRouter from '../src/routes/friends';

const app: express.Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// API Routes
app.get('/api/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express backend!' });
});

// Friend relationships routes
app.use('/api/friends', friendsRouter);

// Vercel serverless function handler
export default app;

