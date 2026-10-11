import Link from 'next/link';
import { createAdminClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let logs = [];
  let errorMessage = null;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('visitor_logs')
      .select('id, ip_address, user_agent, referer, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      errorMessage = error.message;
    } else {
      logs = data || [];
    }
  } catch (err) {
    errorMessage = err?.message || 'Failed to connect to Supabase database.';
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Visitor Access Logs
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Showing the most recent {logs.length} visitor record{logs.length === 1 ? '' : 's'} (limited to last 50)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
            <p className="font-semibold text-rose-200">Unable to load visitor logs</p>
            <p className="text-xs mt-1 text-rose-400">{errorMessage}</p>
            <p className="text-xs mt-3 text-slate-400">
              Ensure your <code className="text-amber-400">SUPABASE_SECRET_KEY</code> is correctly set and the <code className="text-amber-400">visitor_logs</code> table exists in your Supabase SQL schema.
            </p>
          </div>
        )}

        {/* Table View */}
        {!errorMessage && logs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
            No visitor logs recorded yet. Visit the homepage to capture the first record.
          </div>
        ) : !errorMessage && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">IP Address</th>
                    <th className="px-5 py-3.5">User Agent</th>
                    <th className="px-5 py-3.5">Referer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-amber-400 whitespace-nowrap">
                        {log.ip_address || 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 truncate max-w-sm sm:max-w-md font-sans text-[11px]" title={log.user_agent}>
                        {log.user_agent || 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {log.referer || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
