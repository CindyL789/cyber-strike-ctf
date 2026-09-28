import React, { useState } from 'react';
import { Trophy, Medal, Users, User, Sparkles, Activity, Shield } from 'lucide-react';
import { TeamScore } from '../types/ctf';
import { sound } from '../utils/audio';

interface Props {
  teams: TeamScore[];
}

export const LeaderboardView: React.FC<Props> = ({ teams }) => {
  const [filterType, setFilterType] = useState<'all' | 'teams' | 'solo'>('all');

  // Filter teams based on selected filter
  const filteredTeams = teams.filter(t => {
    if (filterType === 'teams') return !!t.isTeam;
    if (filterType === 'solo') return !t.isTeam;
    return true;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Top Podium summary cards */}
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
              className={`p-5 rounded-xl border ${medalColors[idx]} space-y-3 relative overflow-hidden shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Medal className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-wider">Rank #{idx + 1}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {team.solves} solved
                </span>
              </div>

              <div>
                <div className="text-base font-bold text-slate-100 flex items-center gap-2 truncate">
                  {team.teamTag && (
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                      [{team.teamTag}]
                    </span>
                  )}
                  <span className="truncate">{team.name}</span>
                  {team.isUser && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      YOU
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums pt-1">
                  {team.score.toLocaleString()} <span className="text-xs font-normal text-slate-400">PTS</span>
                </div>

                {team.isTeam && team.memberCount && (
                  <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>Squad of {team.memberCount} operatives</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Live Dynamic CTF Scoreboard</h3>
          </div>

          {/* Filter: All / Teams / Solo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
              <button
                onClick={() => {
                  sound.playClick();
                  setFilterType('all');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Rankings ({teams.length})
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFilterType('teams');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  filterType === 'teams'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Squads Only</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFilterType('solo');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  filterType === 'solo'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Solo Agents</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 font-mono pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Entity / Squad Name</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Aggregated Score</th>
                <th className="py-3 px-4 text-center">Solves</th>
                <th className="py-3 px-4 hidden md:table-cell">Category Matrix (W/C/R/F/P)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {sortedTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No competitors match the selected filter.
                  </td>
                </tr>
              ) : (
                sortedTeams.map((team, index) => {
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
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold border ${
                              team.isTeam
                                ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {team.avatar}
                          </div>

                          <div className="space-y-0.5 truncate">
                            <div className="flex items-center gap-2 truncate">
                              {team.teamTag && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                  [{team.teamTag}]
                                </span>
                              )}
                              <span className="font-bold">{team.name}</span>
                              {isUser && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  YOU
                                </span>
                              )}
                            </div>
                            {team.captainName && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Captain: {team.captainName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-sans">
                        {team.isTeam ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Squad ({team.memberCount || 1})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Solo</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-100 tabular-nums">
                        {team.score.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center tabular-nums text-slate-300">
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
