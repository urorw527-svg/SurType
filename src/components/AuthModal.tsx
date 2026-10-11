import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, LogIn, Loader2, Sparkles, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthUser {
  id: string;
  isAnonymous?: boolean;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
  onSignOut: () => void;
  isFirstVisitPrompt?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  onSignOut,
  isFirstVisitPrompt = false,
}) => {
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');

  if (!isOpen) return null;

  const handleGuestLogin = async () => {
    setLoadingGuest(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: guestName.trim() || 'Guest Typist',
          },
        },
      });

      if (err) throw err;

      if (data?.user) {
        onAuthSuccess({
          id: data.user.id,
          isAnonymous: true,
          user_metadata: {
            full_name: guestName.trim() || 'Guest Typist',
          },
        });
        onClose();
      }
    } catch (err: any) {
      console.warn('Supabase anonymous sign-in failed, fallback to client session:', err);
      // Fallback guest session stored in local storage if Supabase anon auth is disabled in dashboard
      const localGuestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      const fallbackUser: AuthUser = {
        id: localGuestId,
        isAnonymous: true,
        user_metadata: {
          full_name: guestName.trim() || 'Guest Racer',
        },
      };
      localStorage.setItem('surtype_guest_user', JSON.stringify(fallbackUser));
      onAuthSuccess(fallbackUser);
      onClose();
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (err) throw err;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err?.message || 'Google Sign-In failed. Please try again or continue as Guest.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button (allowed if not strict or after login) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            {user ? <ShieldCheck className="w-7 h-7 text-emerald-400" /> : <User className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{user ? 'My Account' : 'Welcome to SurType'}</span>
            {!user && <Sparkles className="w-4 h-4 text-amber-400" />}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {user
              ? 'Manage your session and connected profile.'
              : isFirstVisitPrompt
              ? 'First time here? Sign in with Google or continue instantly as Guest to save your high scores and races.'
              : 'Log in to track your personal records, speed history, and friend races.'}
          </p>
        </div>

        {/* If already logged in */}
        {user ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user.isAnonymous ? 'Guest Account' : 'Google Account'}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
                <p className="text-slate-400 text-[11px]">Name / Display:</p>
                <p className="text-white font-medium">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest Racer'}
                </p>
                {user.email && (
                  <>
                    <p className="text-slate-400 text-[11px] mt-2">Email:</p>
                    <p className="text-amber-400 select-all">{user.email}</p>
                  </>
                )}
                <p className="text-slate-400 text-[11px] mt-2">User UID:</p>
                <p className="text-slate-400 truncate text-[10px]">{user.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 py-2.5 px-4 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors cursor-pointer text-center"
              >
                Log Out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer text-center shadow-md"
              >
                Continue Typing
              </button>
            </div>
          </div>
        ) : (
          /* Login options: Google or Guest */
          <div className="space-y-4">
            {/* Google Login button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingGuest}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold px-4 py-3 text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loadingGoogle ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">or guest</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Optional Nickname for guest */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block text-left">
                Guest Nickname (optional):
              </label>
              <input
                type="text"
                placeholder="e.g. SpeedRacer, Alex, Turbo"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={24}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuestLogin();
                }}
              />
            </div>

            {/* Guest Login button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loadingGuest || loadingGoogle}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-3 text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loadingGuest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Signing in as Guest...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-slate-950" />
                  <span>Continue as Guest (One-Click)</span>
                </>
              )}
            </button>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-left text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-[11px] text-center text-slate-500 pt-1">
              No password needed. Jump straight into typing practice and races!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
