import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FriendRelationship } from '../types/database';
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
 * Supabase client configuration
 * Uses environment variables for connection
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database table name for friend relationships
 */
export const FRIENDS_TABLE = 'friend_relationships';

