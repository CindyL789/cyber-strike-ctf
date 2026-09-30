import React from 'react';
import { Activity, Flame, Clock, Shield } from 'lucide-react';
import { ActivityEvent } from '../types/ctf';

interface Props {
  activities: ActivityEvent[];
}

export const LiveFeedView: React.FC<Props> = ({ activities }) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-white text-sm">Real-Time Tournament Capture Stream</h2>
        </div>
        <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE TELEMETRY
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
            No solve events recorded yet. Capture the first flag!
          </div>
        ) : (
          activities.map((act, i) => (
            <div
              key={act.id || i}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                act.isFirstBlood
                  ? 'bg-gradient-to-r from-rose-950/30 via-slate-950 to-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    act.isFirstBlood
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {act.isFirstBlood ? <Flame className="w-5 h-5 fill-rose-500/40" /> : <Shield className="w-4 h-4" />}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{act.teamName}</span>
                    <span className="text-slate-500">solved</span>
                    <span className="font-semibold text-emerald-400">{act.challengeTitle}</span>
                    {act.isFirstBlood && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
                        FIRST BLOOD!
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{act.category}</span>
                    <span>·</span>
                    <span className="text-emerald-400">+{act.points} pts</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                <Clock className="w-3 h-3" />
                <span>{act.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
