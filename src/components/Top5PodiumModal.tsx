import React, { useState } from 'react';
import { X, Crown, Trophy, Medal, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, TeamScore } from '../types/ctf';
import { TOP_5_REWARDS, claimTop5SeasonReward } from '../services/tokenService';
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

  if (!isOpen) return null;

  const isEligible = userRank >= 1 && userRank <= 5;
  const userRewardTier = isEligible ? TOP_5_REWARDS.find(t => t.rank === userRank) : null;
  const hasClaimed = Boolean(userProfile?.claimedTop5Reward);

  const handleClaim = async () => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!isEligible || hasClaimed) return;

    sound.playClick();
    setIsClaiming(true);

    try {
      const res = await claimTop5SeasonReward(userProfile, userRank);
      sound.playSuccess();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      onSuccessNotice(res.message);
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to claim season bounty.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Season Championship 13,000 Credit Bounty
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TOP 5 PODIUM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The top 5 operatives at tournament conclusion claim their share of the prize pool and exclusive insignia.
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

        {/* User Rank Status Bar */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400">Your Current Standing:</span>
            <span className={`font-bold ${isEligible ? 'text-amber-400' : 'text-slate-300'}`}>
              Rank #{userRank} {isEligible ? `(${userRewardTier?.title})` : '(Unranked / Outside Top 5)'}
            </span>
          </div>

          {isEligible && userRewardTier && (
            <button
              onClick={handleClaim}
              disabled={isClaiming || hasClaimed}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                hasClaimed
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>
                {hasClaimed ? 'Bounty Already Claimed' : `Claim Rank #${userRank} Bounty (+${userRewardTier.tokensReward.toLocaleString()} Credits)`}
              </span>
            </button>
          )}
        </div>

        {/* Reward Tiers Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOP_5_REWARDS.map(tier => {
              const isUserTier = userRank === tier.rank;

              return (
                <div
                  key={tier.rank}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                    isUserTier
                      ? 'bg-slate-900 border-amber-500 shadow-xl ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Medal className="w-4 h-4 text-amber-400" />
                        <span className="text-white">RANK #{tier.rank}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        +{tier.tokensReward.toLocaleString()} Credits
                      </span>
                    </div>

                    <div>
                      <div className="text-base font-bold text-white">{tier.title}</div>
                      <div className="text-xs text-amber-400 pt-0.5">{tier.badge}</div>
                      <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">{tier.summary}</p>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isUserTier && (
                    <div className="pt-3 border-t border-slate-800 text-center">
                      <span className="text-[11px] font-bold text-amber-400">
                        ★ You currently qualify for this reward tier!
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
