import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser/client-side components.
 * Utilizes NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Supabase environment variables missing: ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured in your Vercel/environment settings.'
    );
  }

  return createBrowserClient(supabaseUrl || '', supabaseKey || '');
}
