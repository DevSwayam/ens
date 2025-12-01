import { createApp } from './app';
import { config } from './config/env';
import { logger } from './middleware/logger';

// Create Express app
const app = createApp();

// Start server (only for local development)
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Backend server running on http://localhost:${PORT}`, {
    environment: config.env,
    port: PORT,
  });
});


