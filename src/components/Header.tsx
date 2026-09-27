import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Wrench,
  Trophy,
  Flag,
  Shield,
  User,
  ShieldAlert,
  LogIn,
  LogOut
} from 'lucide-react';
import { sound } from '../utils/audio';
import { UserProfile } from '../types/ctf';

interface Props {
  currentTab: 'challenges' | 'scoreboard' | 'activity' | 'rules' | 'admin';
  onSelectTab: (tab: 'challenges' | 'scoreboard' | 'activity' | 'rules' | 'admin') => void;
  userProfile: UserProfile | null;
  userRank: number;
  onOpenWorkbench: () => void;
  onQuickSubmitFlag: (flag: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  userProfile,
  userRank,
  onOpenWorkbench,
  onQuickSubmitFlag,
  soundEnabled,
  onToggleSound,
  onOpenAuth,
  onLogout
}) => {
  const [quickFlag, setQuickFlag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFlag.trim()) return;
    onQuickSubmitFlag(quickFlag.trim());
    setQuickFlag('');
  };

  const isAdmin = userProfile?.role === 'admin';
  const displayName = userProfile?.username || 'Guest';
  const score = userProfile?.score ?? 0;
  const solves = userProfile?.solvesCount ?? 0;
  const avatarText = (userProfile?.username || 'GP').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <button
            onClick={() => onSelectTab('challenges')}
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>CyberStrike CTF</span>
            <span className="hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              LIVE
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('challenges');
            }}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'challenges'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('scoreboard');
            }}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'scoreboard'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('activity');
            }}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'activity'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Feed
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('rules');
            }}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'rules'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Rules & Intel
          </button>

          {/* Admin Dashboard tab */}
          {isAdmin && (
            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('admin');
              }}
              className={`transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Quick flag submission form */}
          <form onSubmit={handleSubmit} className="hidden lg:flex items-center relative">
            <input
              type="text"
              value={quickFlag}
              onChange={e => setQuickFlag(e.target.value)}
              placeholder="Quick flag{...}"
              className="w-44 pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-md text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:w-56 transition-all"
            />
            <Flag className="w-3.5 h-3.5 text-emerald-400 absolute left-2 top-2 pointer-events-none" />
          </form>

          {/* Cyber Workbench tool toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenWorkbench();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Open Cyber Workbench"
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={soundEnabled ? 'Mute Audio SFX' : 'Enable Audio SFX'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* User Account / Profile Controls */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {userProfile ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 font-mono flex items-center justify-end gap-1.5">
                    <span>{displayName}</span>
                    {isAdmin && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono tabular-nums">
                    {score} pts · #{userRank} ({solves} solves)
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                  {avatarText}
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onLogout();
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
