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
 * Database table name for friend relationships
 */
export const FRIENDS_TABLE = 'friend_relationships';

