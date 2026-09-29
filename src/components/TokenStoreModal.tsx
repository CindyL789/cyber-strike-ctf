import React, { useState } from 'react';
import {
  X,
  Coins,
  Zap,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Gift,
  ArrowRight,
  Clock,
  Flame,
  Award,
  DollarSign,
  Lock,
  ChevronRight
} from 'lucide-react';
import { UserProfile, TokenPackage } from '../types/ctf';
import { TOKEN_PACKAGES, purchaseTokens, claimDailyFreeTokens } from '../services/tokenService';
import { sound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onSuccessNotice: (msg: string) => void;
}

export const TokenStoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  onOpenAuth,
  onSuccessNotice
}) => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(TOKEN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'voucher'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    txId: string;
    tokensAdded: number;
    packageName: string;
  } | null>(null);

  if (!isOpen) return null;

  const userTokens = userProfile?.tokens ?? 250;
  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyClaimed = userProfile?.lastDailyTokenClaimDate === todayStr;

  const handlePurchase = async () => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!selectedPackage) return;

    sound.playClick();
    setIsProcessing(true);

    try {
      // Simulate high-tech secure gateway latency
      await new Promise(r => setTimeout(r, 900));

      const res = await purchaseTokens(
        userProfile,
        selectedPackage,
        paymentMethod === 'card' ? 'Visa/Mastercard' : paymentMethod === 'crypto' ? 'Ethereum (USDC)' : 'Terminal Credit Voucher'
      );

      sound.playSuccess();
      setPurchaseSuccess({
        txId: res.transactionId,
        tokensAdded: selectedPackage.tokens + selectedPackage.bonusTokens,
        packageName: selectedPackage.name
      });
      onSuccessNotice(res.message);
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimDailyDrop = async () => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    sound.playClick();
    setIsClaimingDaily(true);

    try {
      const res = await claimDailyFreeTokens(userProfile);
      sound.playSuccess();
      onSuccessNotice(res.message);
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to claim daily tokens.');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Cyber Credits Armory</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  INSTANT DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acquire tokens to unlock hints penalty-free, run sandbox target diagnostics, and claim tactical perks.
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

        {/* User Balance & Daily Drop Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Balance:</span>
            <span className="text-base font-bold text-amber-400 flex items-center gap-1 tabular-nums">
              <Coins className="w-4 h-4 text-amber-400" />
              {userTokens.toLocaleString()} Credits
            </span>
          </div>

          {/* Daily Supply Drop Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClaimDailyDrop}
              disabled={isDailyClaimed || isClaimingDaily || !userProfile}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs ${
                isDailyClaimed
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDailyClaimed ? 'Daily Drop Claimed Today' : '+50 Free Daily Supply Drop'}</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {purchaseSuccess ? (
            /* Purchase Success Confirmation View */
            <div className="p-8 text-center space-y-5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Cyber Credits Dispatched!</h3>
                <p className="text-sm text-slate-300">
                  Successfully authorized package <strong className="text-emerald-300">{purchaseSuccess.packageName}</strong>.
                </p>
                <div className="text-xs font-mono text-emerald-400 pt-1">
                  +{purchaseSuccess.tokensAdded.toLocaleString()} Tokens added to your account · Ref: #{purchaseSuccess.txId}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPurchaseSuccess(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono"
                >
                  Buy Another Package
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold shadow-lg"
                >
                  Return to Challenge Arena
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Package Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {TOKEN_PACKAGES.map(pkg => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const totalTokens = pkg.tokens + pkg.bonusTokens;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPackage(pkg);
                      }}
                      className={`relative p-5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/70 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/40'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Popular Ribbon */}
                      {pkg.popular && (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-mono font-bold text-slate-950 shadow">
                          MOST POPULAR
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-400">{pkg.badge}</span>
                          {pkg.bonusTokens > 0 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              +{pkg.bonusTokens} BONUS
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white">{pkg.name}</h4>
                          <div className="flex items-baseline gap-1 mt-1 font-mono">
                            <span className="text-2xl font-black text-amber-400 tabular-nums">
                              {totalTokens.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">Tokens</span>
                          </div>
                        </div>

                        {/* Perks list */}
                        <ul className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                          {pkg.perks.map((perk, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-base font-bold text-white font-mono">
                          ${pkg.priceUsd.toFixed(2)}
                        </div>
                        <span
                          className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Configuration & Payment Method */}
              {selectedPackage && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="text-xs text-slate-400 font-mono">Selected Package</div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{selectedPackage.name}</span>
                        <span className="text-amber-400 font-mono">
                          ({(selectedPackage.tokens + selectedPackage.bonusTokens).toLocaleString()} Cyber Credits)
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono">
                      <div className="text-xs text-slate-400">Total Price</div>
                      <div className="text-xl font-black text-emerald-400">
                        ${selectedPackage.priceUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selectors */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 block">Select Payment Channel:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-slate-900 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Credit / Debit Card</div>
                          <div className="text-[10px] text-slate-500">Stripe / Visa / MC</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('crypto')}
                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                          paymentMethod === 'crypto'
                            ? 'bg-slate-900 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Web3 Crypto Pay</div>
                          <div className="text-[10px] text-slate-500">ETH / USDC / Solana</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('voucher')}
                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                          paymentMethod === 'voucher'
                            ? 'bg-slate-900 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Terminal Voucher</div>
                          <div className="text-[10px] text-slate-500">CTF Event Promo Code</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Complete Purchase Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>256-Bit Encrypted Simulated Checkout · Instant Account Credit</span>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <span>Authorizing Gateway...</span>
                      ) : (
                        <>
                          <span>
                            Authorize & Add +
                            {(selectedPackage.tokens + selectedPackage.bonusTokens).toLocaleString()} Credits
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Token Utility Breakdown Guide */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>How to Earn & Use Cyber Credits</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400 pt-1">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-emerald-400 mb-1">🎯 0 Score Penalty Hints</div>
                    <p className="text-[11px] leading-relaxed">
                      Unlock hints using tokens instead of reducing your rank score on the public leaderboard.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-amber-400 mb-1">🚩 Solve & Daily Rewards</div>
                    <p className="text-[11px] leading-relaxed">
                      Earn +50 free tokens for every captured flag, and +150 tokens on today's Daily Operation!
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-indigo-400 mb-1">🏆 Top 5 Season Bounty</div>
                    <p className="text-[11px] leading-relaxed">
                      Maintain a Top 5 spot on the scoreboard to claim up to 5,000 bonus tokens and exclusive titles.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
