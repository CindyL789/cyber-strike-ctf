import React, { useState } from 'react';
import { Trophy, Medal, Users, User, Sparkles, Activity, Shield, Crown, Coins, ArrowRight } from 'lucide-react';
import { TeamScore, UserProfile } from '../types/ctf';
import { TOP_5_REWARDS } from '../services/tokenService';
import { sound } from '../utils/audio';

interface Props {
  teams: TeamScore[];
  userProfile?: UserProfile | null;
  onOpenTop5Podium?: () => void;
}

export const LeaderboardView: React.FC<Props> = ({ teams, userProfile, onOpenTop5Podium }) => {
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
      {/* Top 5 Season Championship Bounty Banner */}
      <div className="relative overflow-hidden p-5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white tracking-tight">Season Top 5 Championship Bounty</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                13,000 CREDITS POOL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintain a Top 5 standing at competition close to claim up to 5,000 Cyber Credits, exclusive title badges, and Hall of Fame honors.
            </p>
          </div>
        </div>

        {onOpenTop5Podium && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenTop5Podium();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shrink-0 whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 fill-slate-950" />
            <span>Top 5 Prize Tiers & Claim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top 5 Podium summary cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Season Top 5 Podium Standings</span>
          </span>
          <span className="text-[11px] text-slate-500">Live Qualification Stage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {sortedTeams.slice(0, 5).map((team, idx) => {
            const rank = idx + 1;
            const tier = TOP_5_REWARDS.find(r => r.rank === rank);
            const medalStyles = [
              'border-amber-400/60 bg-gradient-to-b from-amber-500/10 to-slate-900 text-amber-300 ring-1 ring-amber-500/30 shadow-amber-950/40',
              'border-slate-300/50 bg-gradient-to-b from-slate-400/10 to-slate-900 text-slate-200 ring-1 ring-slate-400/20 shadow-slate-950/40',
              'border-amber-700/50 bg-gradient-to-b from-amber-700/10 to-slate-900 text-amber-600 ring-1 ring-amber-700/20 shadow-amber-950/40',
              'border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-slate-900 text-blue-300 ring-1 ring-blue-500/20 shadow-blue-950/40',
              'border-purple-500/40 bg-gradient-to-b from-purple-500/10 to-slate-900 text-purple-300 ring-1 ring-purple-500/20 shadow-purple-950/40'
            ];

            return (
              <div
                key={team.id}
                className={`p-4 rounded-xl border ${medalStyles[idx]} flex flex-col justify-between space-y-2.5 relative overflow-hidden shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Medal className="w-4 h-4" />
                    <span className="font-bold text-xs">Rank #{rank}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    +{tier?.tokensReward.toLocaleString()} Cr
                  </span>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400">{tier?.badge.split(' ')[0]} {tier?.title}</div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate pt-0.5">
                    {team.teamTag && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                        [{team.teamTag}]
                      </span>
                    )}
                    <span className="truncate">{team.name}</span>
                    {team.isUser && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums pt-1">
                    {team.score.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">PTS</span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between">
                    <span>{team.solves} solves</span>
                    <span className="text-slate-500">{team.lastSolveTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                              {rank <= 5 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                  <span>{TOP_5_REWARDS[rank - 1]?.badge}</span>
                                  <span className="hidden lg:inline text-[9px] text-amber-400/90">{TOP_5_REWARDS[rank - 1]?.title}</span>
                                </span>
                              )}
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
