import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, ShieldCheck, LogIn, Loader2, Sparkles, LogOut, AlertCircle } from 'lucide-react';

interface AuthProfile {
  id: string;
  isAnonymous?: boolean;
  email?: string;
}

export const LoginPage: React.FC<{ onReturnToPractice: () => void }> = ({ onReturnToPractice }) => {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser({
            id: data.session.user.id,
            isAnonymous: data.session.user.is_anonymous,
            email: data.session.user.email,
          });
        }
      } catch (err: any) {
        console.warn('Session check warning:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          isAnonymous: session.user.is_anonymous,
          email: session.user.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleGuestLogin = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;

      if (data?.user) {
        setUser({
          id: data.user.id,
          isAnonymous: data.user.is_anonymous,
          email: data.user.email,
        });
        setSuccessMsg('Logged in anonymously as Guest successfully!');
      }
    } catch (err: any) {
      console.error('Guest login failed:', err);
      setError(
        err?.message ||
          'Failed to sign in anonymously. Make sure Anonymous sign-ins are toggled ON in your Supabase Auth provider dashboard.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSuccessMsg('Signed out successfully.');
    } catch (err: any) {
      setError(err?.message || 'Error signing out.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md text-center space-y-4 relative overflow-hidden shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <User className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Account & Guest Login</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Connect seamlessly to save your typing benchmark personal records, track stats, or continue as an anonymous guest with Supabase authentication.
          </p>
        </div>

        {/* Current Auth Status Card */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Checking authentication status...</span>
          </div>
        ) : user ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{user.isAnonymous ? 'Logged in as Guest' : 'Authenticated User'}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Session
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
              <p className="text-slate-400 text-[11px]">User UID:</p>
              <p className="text-amber-400 select-all break-all">{user.id}</p>
              {user.email && <p className="text-slate-300 text-[11px] mt-1">Email: {user.email}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={onReturnToPractice}
                className="flex-1 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center cursor-pointer shadow-md"
              >
                Return to Typing Practice &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Connecting to Supabase...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-slate-950" />
                  <span>Continue as Guest (One-Click)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500">
              One-click instant login powered by <strong className="text-slate-400">Supabase Anonymous Auth</strong>. No password required.
            </p>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-left text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Sign-in Notice</p>
              <p className="text-rose-300 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Supabase Integration Details Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-3">
        <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Configured Supabase Project
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase">Supabase Endpoint</span>
            <span className="text-amber-400 truncate block mt-0.5">https://axyzrqxxfzdufuotajfq.supabase.co</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase">Auth Mode</span>
            <span className="text-emerald-400 block mt-0.5">Anonymous Guest Auth (JWT)</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          For Next.js / Vercel full-stack deployment, server-side visitor telemetry is captured in <code className="text-amber-400">/app/page.js</code> with <code className="text-amber-400">visitor_logs</code> and viewable in <code className="text-amber-400">/app/admin/page.js</code>.
        </p>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onReturnToPractice}
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline cursor-pointer"
        >
          &larr; Back to Typing Practice
        </button>
      </div>
    </div>
  );
};
