// Load environment variables from .env file (for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import friendsRouter from './routes/friends';

const app = express();
const PORT = process.env.PORT || 3002;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

