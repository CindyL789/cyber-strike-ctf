import React from 'react';
import { Trophy, Medal, Users, Sparkles, Activity } from 'lucide-react';
import { TeamScore } from '../types/ctf';

interface Props {
  teams: TeamScore[];
}

export const LeaderboardView: React.FC<Props> = ({ teams }) => {
  // Sort teams descending by score
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedTeams.slice(0, 3).map((team, idx) => {
          const medalColors = [
            'border-amber-500/40 bg-amber-500/5 text-amber-400',
            'border-slate-400/40 bg-slate-400/5 text-slate-300',
            'border-amber-700/40 bg-amber-700/5 text-amber-600'
          ];
          return (
            <div
              key={team.id}
              className={`p-5 rounded-xl border ${medalColors[idx]} space-y-3 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Medal className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-wider">Rank #{idx + 1}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Solved {team.solves} targets</span>
              </div>

              <div>
                <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>{team.name}</span>
                  {team.isUser && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums pt-1">
                  {team.score.toLocaleString()} <span className="text-xs font-normal text-slate-400">PTS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Live Dynamic CTF Scoreboard</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL-TIME FIRESTORE SYNC</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Operator / Player</th>
                <th className="py-3 px-4 text-right">Total Score</th>
                <th className="py-3 px-4 text-center">Solves</th>
                <th className="py-3 px-4 hidden md:table-cell">Category Matrix (W/C/R/F/P)</th>
                <th className="py-3 px-4 text-right">Last Capture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {sortedTeams.map((team, index) => {
                const rank = index + 1;
                const isUser = team.isUser;

                return (
                  <tr
                    key={team.id}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-emerald-950/30 hover:bg-emerald-950/40 text-emerald-300 font-medium'
                        : 'hover:bg-slate-900/50 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-100 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300 font-bold">
                        {team.avatar}
                      </div>
                      <span>{team.name}</span>
                      {isUser && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100 tabular-nums">
                      {team.score.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-400">
                      {team.solves}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span title="Web" className="text-emerald-400">{team.categoryBreakdown.Web}</span>
                        <span className="text-slate-600">/</span>
                        <span title="Crypto" className="text-cyan-400">{team.categoryBreakdown.Crypto}</span>
                        <span className="text-slate-600">/</span>
                        <span title="Reverse" className="text-amber-400">{team.categoryBreakdown.Reverse}</span>
                        <span className="text-slate-600">/</span>
                        <span title="Forensics" className="text-sky-400">{team.categoryBreakdown.Forensics}</span>
                        <span className="text-slate-600">/</span>
                        <span title="Pwn" className="text-rose-400">{team.categoryBreakdown.Pwn}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {team.lastSolveTime}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
