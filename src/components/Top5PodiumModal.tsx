import React, { useState } from 'react';
import {
  X,
  Trophy,
  Award,
  Crown,
  Sparkles,
  CheckCircle2,
  Coins,
  Shield,
  ArrowRight,
  Flame,
  Star,
  Users,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, TeamScore, Top5RewardTier } from '../types/ctf';
import { TOP_5_REWARDS, claimTop5Reward } from '../services/tokenService';
import { sound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  userRank: number;
  teamsLeaderboard: TeamScore[];
  onOpenAuth: () => void;
  onSuccessNotice: (msg: string) => void;
}

export const Top5PodiumModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  userRank,
  teamsLeaderboard,
  onOpenAuth,
  onSuccessNotice
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{
    tokens: number;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  const isEligible = userRank >= 1 && userRank <= 5;
  const hasClaimed = Boolean(userProfile?.claimedTop5Reward);
  const currentRewardTier = TOP_5_REWARDS.find(r => r.rank === userRank);

  // Top 5 teams from live scoreboard
  const sortedBoard = [...teamsLeaderboard].sort((a, b) => b.score - a.score);
  const top5Entries = sortedBoard.slice(0, 5);

  const fifthScore = sortedBoard[4]?.score ?? 0;
  const userScore = userProfile?.score ?? 0;
  const pointsNeededForTop5 = Math.max(0, fifthScore - userScore + 1);

  const handleClaim = async () => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!isEligible || hasClaimed) return;

    sound.playClick();
    setIsClaiming(true);

    try {
      const res = await claimTop5Reward(userProfile, userRank);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#ffffff']
        });
      } catch {
        // Confetti fallback
      }

      sound.playSuccess();
      setClaimedReward({
        tokens: res.tokensAwarded,
        title: res.newTitle
      });
      onSuccessNotice(res.message);
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to claim reward bounty.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Season Top 5 Championship Bounty</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Compete on the live scoreboard to lock in your Top 5 finish and claim up to 5,000 Cyber Credits & exclusive titles.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Rank Status Spotlight */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-center min-w-[70px]">
              <div className="text-[10px] text-slate-500 uppercase">Your Rank</div>
              <div className={`text-lg font-black tabular-nums ${isEligible ? 'text-amber-400' : 'text-slate-200'}`}>
                #{userRank}
              </div>
            </div>

            <div>
              {isEligible ? (
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>QUALIFIED FOR TOP 5 PODIUM TIER #{userRank}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Reward Tier: <strong className="text-white">{currentRewardTier?.title}</strong> ({currentRewardTier?.tokensReward.toLocaleString()} Cyber Credits)
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200">
                    {pointsNeededForTop5 > 0 ? (
                      <span>Need <strong className="text-amber-400 font-mono">+{pointsNeededForTop5} pts</strong> to breach Top 5 rank</span>
                    ) : (
                      <span>Close to the podium! Keep capturing flags.</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Solve Web, Crypto, or Reverse challenges to climb above Rank #5.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Claim Button */}
          {isEligible ? (
            hasClaimed || claimedReward ? (
              <div className="px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shadow">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bounty Claimed! Title: "{userProfile?.badgeTitle || claimedReward?.title}"</span>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-mono font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-all hover:scale-[1.02]"
              >
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>
                  {isClaiming ? 'Claiming Bounty...' : `Claim Rank #${userRank} Bounty (+${currentRewardTier?.tokensReward.toLocaleString()} Credits)`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-800"
            >
              Browse Challenges to Climb
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top 5 Reward Tiers Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Prize Tiers & Distinction Titles</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Total Bounty Pool: 13,000 Credits</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TOP_5_REWARDS.map(tier => {
                const isCurrentTier = userRank === tier.rank;
                return (
                  <div
                    key={tier.rank}
                    className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrentTier
                        ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isCurrentTier && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-mono font-black text-slate-950 shadow whitespace-nowrap">
                        YOUR CURRENT TIER
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 font-bold">Rank #{tier.rank}</span>
                        <span>{tier.badge.split(' ')[0]}</span>
                      </div>

                      <div>
                        <div className="text-sm font-black text-white leading-snug">{tier.title}</div>
                        <div className="mt-1 text-base font-black text-amber-400 font-mono flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>+{tier.tokensReward.toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {tier.summary}
                      </p>

                      <ul className="space-y-1 pt-2 border-t border-slate-800 text-[10px] text-slate-300">
                        {tier.perks.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Live Top 5 Scoreboard Standings */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Current Live Podium Contenders</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Updated in Real-Time</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {top5Entries.map((team, idx) => {
                const rank = idx + 1;
                const tier = TOP_5_REWARDS.find(r => r.rank === rank);
                const isMe = userProfile && team.id === userProfile.uid;

                return (
                  <div
                    key={team.id}
                    className={`py-3 flex items-center justify-between gap-4 transition-colors ${
                      isMe ? 'bg-emerald-950/20 px-3 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          rank === 1
                            ? 'bg-amber-500 text-slate-950'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{rank}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{team.name}</span>
                          {tier && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {tier.badge}
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {team.solves} solves · Solved: {team.lastSolveTime}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">
                        {team.score.toLocaleString()} pts
                      </div>
                      <div className="text-[10px] text-amber-400">
                        +{tier?.tokensReward.toLocaleString()} credits pending
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
