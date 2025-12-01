import { createApp } from '../src/app';

// Create Express app for Vercel serverless function
const app = createApp();

// Vercel serverless function handler
export default app;

