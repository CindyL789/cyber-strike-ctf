import React from 'react';
import { Flame, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DailyOpInfo } from '../types/ctf';
import { sound } from '../utils/audio';

interface Props {
  dailyOp: DailyOpInfo;
  onSelectChallenge: () => void;
  isFilterActive: boolean;
  onToggleFilter: () => void;
}

export const DailyOpBanner: React.FC<Props> = ({
  dailyOp,
  onSelectChallenge,
  isFilterActive,
  onToggleFilter
}) => {
  if (!dailyOp || !dailyOp.challenge) return null;

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-950 border border-orange-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
          <Flame className="w-6 h-6 fill-orange-500/20" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
              DAILY OPERATION // {dailyOp.dayName.toUpperCase()}
            </span>
            {dailyOp.isSolvedToday && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                SOLVED TODAY
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{dailyOp.challenge.title}</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({dailyOp.challenge.category} · {dailyOp.challenge.difficulty} · {dailyOp.challenge.points} pts)
            </span>
          </h3>

          <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <Award className="w-3.5 h-3.5" />
              +{dailyOp.bonusPoints} Streak Points & +150 Cyber Credits
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Resets in {dailyOp.timeRemaining}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            onToggleFilter();
          }}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-colors border ${
            isFilterActive
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {isFilterActive ? 'Show All Ops' : 'Filter Daily'}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectChallenge();
          }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-lg"
        >
          <span>Engage Objective</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
