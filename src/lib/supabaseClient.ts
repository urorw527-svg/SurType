import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axyzrqxxfzdufuotajfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R0LDFoY30l5jytE8QXDRpw_GA4X5EGo';

export const supabase = createSupabaseClient(
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || SUPABASE_URL,
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || SUPABASE_ANON_KEY
);
