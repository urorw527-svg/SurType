'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';

/**
 * GuestLoginButton Component
 * Signs users in anonymously using Supabase auth.signInAnonymously().
 */
export default function GuestLoginButton() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }

      setUser(data.user);
    } catch (err) {
      console.error('Anonymous sign-in error:', err);
      setError(err?.message || 'Failed to sign in anonymously. Ensure anonymous sign-ins are enabled in Supabase Auth settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
      {user ? (
        <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300 shadow-md">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Signed in as Guest</span>
          </div>
          <p className="mt-1 font-mono text-xs text-emerald-400/80 truncate">
            ID: {user.id}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Signing in...</span>
            </span>
          ) : (
            'Continue as Guest'
          )}
        </button>
      )}

      {error && (
        <div className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs text-rose-400">
          {error}
        </div>
      )}
    </div>
  );
}
