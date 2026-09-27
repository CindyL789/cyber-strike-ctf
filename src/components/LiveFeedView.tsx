import React from 'react';
import { Activity, Flame, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { ActivityEvent } from '../types/ctf';

interface Props {
  activities: ActivityEvent[];
}

export const LiveFeedView: React.FC<Props> = ({ activities }) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Live Competition Feed</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>STREAM ACTIVE</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {activities.map(ev => {
            return (
              <div
                key={ev.id}
                className={`py-3.5 flex items-center justify-between gap-4 transition-colors ${
                  ev.isUser ? 'bg-emerald-950/20 px-3 rounded-lg border border-emerald-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ev.isFirstBlood
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : ev.isUser
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ev.isFirstBlood ? (
                      <Flame className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-200">
                      <span className="font-bold text-white">{ev.teamName}</span>{' '}
                      <span className="text-slate-400">captured</span>{' '}
                      <span className="font-semibold text-emerald-300 font-mono">{ev.challengeTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>{ev.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-semibold">+{ev.points} pts</span>
                      {ev.isFirstBlood && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400 font-bold uppercase text-[10px]">First Blood</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{ev.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
