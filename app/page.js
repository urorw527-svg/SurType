import { headers } from 'next/headers';
import Link from 'next/link';
import { createAdminClient } from '../lib/supabase/server';
import GuestLoginButton from '../components/GuestLoginButton';

export const dynamic = 'force-dynamic';

/**
 * Server-side visitor logging helper.
 * Captures IP address and User-Agent from incoming request headers,
 * then inserts a row into the `visitor_logs` table using the admin client.
 */
async function logVisitor() {
  try {
    const headersList = await headers();

    // In Vercel and reverse proxies, the real client IP is passed via x-forwarded-for
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : (realIp || 'Unknown');

    const userAgent = headersList.get('user-agent') || 'Unknown';
    const referer = headersList.get('referer') || null;

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.from('visitor_logs').insert([
      {
        ip_address: clientIp,
        user_agent: userAgent,
        referer: referer,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Failed to insert visitor log:', error.message);
    }
  } catch (err) {
    // Avoid crashing page rendering if database credentials are not set yet or request fails
    console.warn('Visitor logging skipped or encountered an issue:', err?.message || err);
  }
}

export default async function HomePage() {
  // Capture visitor telemetry upon page load
  await logVisitor();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 font-bold text-lg shadow-inner">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Visitor Portal
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Your visit has been recorded into the visitor log table. Sign in below as a guest to continue.
          </p>
        </div>

        <div className="relative z-10 pt-2">
          <GuestLoginButton />
        </div>

        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-500">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-amber-400 transition-colors underline font-medium"
          >
            Open Admin Log Dashboard &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
