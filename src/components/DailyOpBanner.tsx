import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Flame,
  CheckCircle2,
  ArrowRight,
  Shield,
  Trophy,
  Sparkles,
  Calendar,
  Gift
} from 'lucide-react';
import { Challenge, UserProfile, DailyOpInfo } from '../types/ctf';
import { getTimeUntilUtcMidnight, getUtcDateString, getUtcDayName } from '../services/dailyChallengeService';
import { sound } from '../utils/audio';

interface Props {
  dailyInfo: DailyOpInfo;
  userProfile: UserProfile | null;
  onLaunchDaily: (challenge: Challenge) => void;
  onFilterDailyOps: () => void;
  isDailyFilterActive: boolean;
}

export const DailyOpBanner: React.FC<Props> = ({
  dailyInfo,
  userProfile,
  onLaunchDaily,
  onFilterDailyOps,
  isDailyFilterActive
}) => {
  const [countdown, setCountdown] = useState<string>(dailyInfo.timeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilUtcMidnight();
      setCountdown(remaining.text);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const streak = userProfile?.dailyStreak || 0;
  const streakRecord = userProfile?.dailyStreakRecord || streak;
  const isSolved = dailyInfo.isSolvedToday;
  const ch = dailyInfo.challenge;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-emerald-950/30 p-4 sm:p-5 shadow-xl transition-all">
      {/* Background ambient glow effect */}
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Badge, Day info, and Title */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Pulsing Daily Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider text-[11px] shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>TODAY'S DAILY OP</span>
            </span>

            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{dailyInfo.dayName} Drop · {dailyInfo.date}</span>
            </span>

            {/* Streak Counter */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                streak > 0
                  ? 'bg-orange-950/70 border border-orange-500/40 text-orange-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-orange-400 fill-orange-400' : 'text-slate-500'}`} />
              <span>{streak}-Day Streak</span>
              {streakRecord > streak && (
                <span className="text-[10px] text-slate-500 font-normal">
                  (Best: {streakRecord}d)
                </span>
              )}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{ch.title}</span>
                {isSolved && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SOLVED
                  </span>
                )}
              </h2>
            </div>

            <p className="text-xs text-slate-300/90 line-clamp-2 mt-1 leading-relaxed">
              {ch.description}
            </p>
          </div>

          {/* Reward Metrics */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
            <span className="text-emerald-400 font-semibold">{ch.category}</span>
            <span className="text-slate-600">·</span>
            <span
              className={
                ch.difficulty === 'Easy'
                  ? 'text-emerald-300'
                  : ch.difficulty === 'Medium'
                  ? 'text-amber-300'
                  : ch.difficulty === 'Hard'
                  ? 'text-rose-300'
                  : 'text-purple-300'
              }
            >
              {ch.difficulty}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-200 font-bold tabular-nums">
              {ch.points} pts
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              <Gift className="w-3 h-3 text-amber-400" />
              <span>+{dailyInfo.bonusPoints} Daily Streak Bonus</span>
            </span>
          </div>
        </div>

        {/* Right Side: Countdown Timer & CTA */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between w-full lg:w-auto gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
          {/* UTC Countdown Clock */}
          <div className="text-left lg:text-right font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center lg:justify-end gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Next Op In:</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-300 tabular-nums">
              {countdown}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onFilterDailyOps();
              }}
              className={`px-3 py-2 text-xs font-mono rounded-lg transition-colors border ${
                isDailyFilterActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Show all daily challenges"
            >
              {isDailyFilterActive ? 'View All Challenges' : 'Daily Ops Vault'}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onLaunchDaily(ch);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSolved
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>{isSolved ? 'Review Daily Op' : 'Launch Daily Op'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
