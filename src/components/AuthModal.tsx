import React, { useState } from 'react';
import { X, Lock, User, Mail, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { registerPlayer, loginPlayer, loginWithGoogle } from '../services/authService';
import { UserProfile } from '../types/ctf';
import { sound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    sound.playClick();

    try {
      if (isRegister) {
        if (!username.trim()) throw new Error('Username is required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const profile = await registerPlayer(username, password, email);
        sound.playSuccess();
        onSuccess(profile);
        onClose();
      } else {
        if (!username.trim()) throw new Error('Enter your username or email.');
        if (!password) throw new Error('Enter your password.');
        const profile = await loginPlayer(username, password);
        sound.playSuccess();
        onSuccess(profile);
        onClose();
      }
    } catch (err: unknown) {
      sound.playError();
      setErrorMsg((err as Error).message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    sound.playClick();
    try {
      const profile = await loginWithGoogle();
      sound.playSuccess();
      onSuccess(profile);
      onClose();
    } catch (err: unknown) {
      sound.playError();
      setErrorMsg((err as Error).message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type: 'player' | 'admin') => {
    sound.playClick();
    if (type === 'admin') {
      setUsername('admin');
      setPassword('AdminMasterPass2026!');
      setIsRegister(false);
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setUsername(`operator_${randomSuffix}`);
      setPassword('CyberStrikePass123!');
      setIsRegister(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              {isRegister ? 'Player Registration' : 'CyberStrike Access Terminal'}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${
              !isRegister
                ? 'border-emerald-400 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${
              isRegister
                ? 'border-emerald-400 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-lg text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-slate-300 font-medium">
              {isRegister ? 'Handle / Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isRegister ? 'e.g. cipher_hacker' : 'username or email'}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Email Address <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-slate-300 font-medium">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Access Arena'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Google Sign-in */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-2 bg-slate-900 text-slate-500 text-[11px] font-mono">
              OR CONTINUE WITH
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Google Account</span>
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Instant Pre-fill:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('player')}
                className="text-emerald-400 hover:underline"
              >
                + Demo Player
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="text-amber-400 hover:underline"
              >
                + Admin Account
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
