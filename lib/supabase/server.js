import { createClient } from '@supabase/supabase-js';

/**
 * Creates an administrative Supabase client for Server Components / Route Handlers.
 * Uses SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to bypass Row Level Security (RLS).
 *
 * NOTE: Never expose this client or SUPABASE_SECRET_KEY to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'Missing Supabase server credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be defined in your environment variables.'
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
