import { z } from 'zod';
import * as path from 'path';

// Load environment variables from .env file (for local development)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  } catch (error) {
    // dotenv might not be available, continue without it
  }
}

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3002'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  CORS_ORIGIN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(
      `Invalid environment variables:\n${missingVars}\n\nPlease check your .env file or environment configuration.`
    );
  }
  throw error;
}

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
} as const;

