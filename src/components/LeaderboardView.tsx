import React from 'react';
import { Trophy, Medal, Crown, ArrowRight, Users, Shield } from 'lucide-react';
import { TeamScore, UserProfile } from '../types/ctf';
import { TOP_5_REWARDS } from '../services/tokenService';
import { sound } from '../utils/audio';

interface Props {
  teams: TeamScore[];
  userProfile?: UserProfile | null;
  onOpenTop5Podium?: () => void;
}

export const LeaderboardView: React.FC<Props> = ({
  teams,
  userProfile,
  onOpenTop5Podium
}) => {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Top 5 Season Bounty Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Season Championship 13,000 Credit Bounty Pool
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ACTIVE TOURNAMENT
              </span>
            </div>
            <p className="text-xs text-slate-400 pt-0.5">
              Top 5 qualifiers unlock Obsidian Crown, Crimson Skull, and Dragon badges plus up to 5,000 bonus tokens.
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

      {/* Top 5 Podium Summary Cards */}
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
          <span className="text-xs font-mono text-slate-400">Ranked by points & solve timeline</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-medium">
                <th className="py-3 px-4 w-14">#</th>
                <th className="py-3 px-4">Operative / Squad</th>
                <th className="py-3 px-4 text-center">Solves</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Web</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Crypto</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Reverse</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Forensics</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Pwn</th>
                <th className="py-3 px-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {sortedTeams.map((team, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop5 = rank <= 5;
                const tier = TOP_5_REWARDS.find(r => r.rank === rank);

                return (
                  <tr
                    key={team.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      team.isUser ? 'bg-emerald-950/20 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      {isTop1 ? (
                        <Crown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <span className={`font-bold ${isTop5 ? 'text-amber-300' : 'text-slate-400'}`}>
                          {rank}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-850 border border-slate-700/60 flex items-center justify-center font-bold text-slate-300 text-[11px] shrink-0">
                          {team.avatar}
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          {team.teamTag && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                              [{team.teamTag}]
                            </span>
                          )}
                          <span className="text-slate-100 font-semibold truncate">{team.name}</span>
                          {tier && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 ${tier.badgeColor}`}>
                              {tier.badge}
                            </span>
                          )}
                          {team.badgeTitle && !tier && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              {team.badgeTitle}
                            </span>
                          )}
                          {team.isUser && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300 tabular-nums">{team.solves}</td>
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums hidden md:table-cell">{team.categoryBreakdown?.Web || 0}</td>
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums hidden md:table-cell">{team.categoryBreakdown?.Crypto || 0}</td>
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums hidden md:table-cell">{team.categoryBreakdown?.Reverse || 0}</td>
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums hidden md:table-cell">{team.categoryBreakdown?.Forensics || 0}</td>
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums hidden md:table-cell">{team.categoryBreakdown?.Pwn || 0}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 tabular-nums">
                      {team.score.toLocaleString()} PTS
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
