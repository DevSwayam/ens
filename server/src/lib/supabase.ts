import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';

/**
 * Supabase client configuration
 * Uses validated environment variables from config
 */
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

/**
 * Database table names (normalized schema)
 */
export const NODES_TABLE = 'nodes';
export const RELATIONSHIPS_TABLE = 'relationships';

