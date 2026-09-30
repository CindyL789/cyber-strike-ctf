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
  LogOut,
  Github,
  Coins,
  Crown,
  Terminal
} from 'lucide-react';
import { sound } from '../utils/audio';
import { UserProfile } from '../types/ctf';

interface Props {
  currentTab: 'challenges' | 'scoreboard' | 'activity' | 'teams' | 'rules' | 'admin' | 'shell';
  onSelectTab: (tab: 'challenges' | 'scoreboard' | 'activity' | 'teams' | 'rules' | 'admin' | 'shell') => void;
  userProfile: UserProfile | null;
  userRank: number;
  onOpenWorkbench: () => void;
  onQuickSubmitFlag: (flag: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTokenStore: () => void;
  onOpenTop5Podium: () => void;
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
  onLogout,
  onOpenTokenStore,
  onOpenTop5Podium
}) => {
  const [quickFlag, setQuickFlag] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFlag.trim()) return;
    onQuickSubmitFlag(quickFlag.trim());
    setQuickFlag('');
  };

  const displayName = userProfile?.username || 'Operator';
  const avatarText = displayName.substring(0, 2).toUpperCase();
  const score = userProfile?.score ?? 0;
  const tokenCount = userProfile?.tokens ?? 250;
  const isAdmin = userProfile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectTab('challenges')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                <span>CYBERSTRIKE</span>
                <span className="text-emerald-400 font-normal">ARENA</span>
              </span>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                HARDCORE CTF OPERATIONS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-mono font-medium">
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
            Scoreboard
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('teams');
            }}
            className={`transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              currentTab === 'teams'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Squads</span>
            {userProfile?.teamTag && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                [{userProfile.teamTag}]
              </span>
            )}
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
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('shell');
            }}
            className={`transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              currentTab === 'shell'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>System Shell</span>
          </button>

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

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Top 5 Bounty Podium Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTop5Podium();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Season Top 5 Championship Bounty Pool"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Top 5 Bounty</span>
          </button>

          {/* Cyber Credits Token Pill */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTokenStore();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-inner"
            title="Cyber Credits Armory & Exchange"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">{tokenCount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Credits</span>
          </button>

          {/* Cyber Workbench Quick Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenWorkbench();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Open Cryptographic Multi-Tool Workbench"
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-300" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Auth Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {userProfile ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 font-mono flex items-center justify-end gap-1.5">
                    {userProfile.badgeTitle && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                        {userProfile.badgeTitle}
                      </span>
                    )}
                    {userProfile.teamTag && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        [{userProfile.teamTag}]
                      </span>
                    )}
                    <span>{displayName}</span>
                    {isAdmin && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono tabular-nums flex items-center justify-end gap-1.5">
                    {userProfile.dailyStreak && userProfile.dailyStreak > 0 ? (
                      <span className="text-[10px] text-orange-400 font-bold bg-orange-950/60 px-1 py-0.2 rounded border border-orange-500/40 flex items-center gap-0.5">
                        🔥 {userProfile.dailyStreak}d
                      </span>
                    ) : null}
                    <span>{userProfile.teamName ? `${userProfile.teamName} · ` : ''}{score} pts · #{userRank}</span>
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
