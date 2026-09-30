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
  ChevronRight,
  ShoppingBag,
  Shield,
  Radio,
  Check,
  Copy,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { UserProfile, TokenPackage, ArmoryItem } from '../types/ctf';
import {
  TOKEN_PACKAGES,
  ARMORY_ITEMS,
  purchaseTokens,
  claimDailyFreeTokens,
  purchaseArmoryItem,
  equipTitle
} from '../services/tokenService';
import { sound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onSuccessNotice: (msg: string) => void;
  guestTokens?: number;
  onUpdateGuestTokens?: (newTokens: number) => void;
  guestInventory?: string[];
  onUpdateGuestInventory?: (newItemId: string) => void;
}

export const TokenStoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  onOpenAuth,
  onSuccessNotice,
  guestTokens = 250,
  onUpdateGuestTokens,
  guestInventory = [],
  onUpdateGuestInventory
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'armory'>('buy');
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(TOKEN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'voucher'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [equippingTitle, setEquippingTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card Form State
  const [cardName, setCardName] = useState<string>('Cipher Operator');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('133');

  // Crypto Form State
  const [cryptoCoin, setCryptoCoin] = useState<'USDT' | 'ETH' | 'BTC' | 'SOL'>('USDT');
  const [copiedCrypto, setCopiedCrypto] = useState(false);

  // Voucher Form State
  const [voucherCode, setVoucherCode] = useState<string>('CYBER2026');
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [voucherSuccessMsg, setVoucherSuccessMsg] = useState<string | null>(null);

  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    txId: string;
    tokensAdded: number;
    packageName: string;
    amountPaid: number;
    method: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentBalance = userProfile ? (userProfile.tokens ?? 250) : guestTokens;
  const todayStr = new Date().toISOString().split('T')[0];

  const guestDailyClaimed = typeof window !== 'undefined'
    ? localStorage.getItem('cyberstrike_guest_daily_claim') === todayStr
    : false;

  const isDailyClaimed = userProfile
    ? userProfile.lastDailyTokenClaimDate === todayStr
    : guestDailyClaimed;

  const effectivePrice = selectedPackage
    ? Math.max(0, selectedPackage.priceUsd * (1 - voucherDiscount))
    : 0;

  const handleApplyVoucher = () => {
    sound.playClick();
    const clean = voucherCode.trim().toUpperCase();
    if (clean === 'CYBER2026' || clean === 'HACKTHEPLANET' || clean === 'ZERODAY') {
      sound.playSuccess();
      setVoucherDiscount(1.0); // 100% Free CTF Sponsor Grant
      setVoucherSuccessMsg(`Voucher [${clean}] Applied: 100% Academic Sponsor Grant (Price: $0.00)!`);
      setErrorMessage(null);
    } else if (clean === 'VIP50') {
      sound.playSuccess();
      setVoucherDiscount(0.5); // 50% discount
      setVoucherSuccessMsg(`Voucher [${clean}] Applied: 50% Operator Discount!`);
      setErrorMessage(null);
    } else {
      sound.playError();
      setErrorMessage('Invalid or expired voucher code. Try "CYBER2026" or "ZERODAY".');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setErrorMessage(null);
    sound.playClick();
    setIsProcessing(true);

    try {
      // Realistic gateway latency simulation
      await new Promise(r => setTimeout(r, 650));

      const totalTokensAwarded = selectedPackage.tokens + selectedPackage.bonusTokens;
      const nowIso = new Date().toISOString();

      if (userProfile) {
        // Authenticated Firebase Flow
        const res = await purchaseTokens(userProfile, selectedPackage, paymentMethod);
        sound.playSuccess();
        setPurchaseSuccess({
          txId: res.transactionId,
          tokensAdded: totalTokensAwarded,
          packageName: selectedPackage.name,
          amountPaid: effectivePrice,
          method: paymentMethod.toUpperCase(),
          timestamp: nowIso
        });
        onSuccessNotice(`Payment Authorized! +${totalTokensAwarded.toLocaleString()} Cyber Credits added to account.`);
      } else {
        // Guest Mode Flow
        const guestTxId = `tx-guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const newBalance = guestTokens + totalTokensAwarded;
        onUpdateGuestTokens?.(newBalance);

        sound.playSuccess();
        setPurchaseSuccess({
          txId: guestTxId,
          tokensAdded: totalTokensAwarded,
          packageName: selectedPackage.name,
          amountPaid: effectivePrice,
          method: paymentMethod.toUpperCase(),
          timestamp: nowIso
        });
        onSuccessNotice(`Simulated Payment Complete! +${totalTokensAwarded.toLocaleString()} Cyber Credits added to operative balance.`);
      }
    } catch (err: unknown) {
      sound.playError();
      setErrorMessage((err as Error).message || 'Failed to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimDailyDrop = async () => {
    setErrorMessage(null);
    sound.playClick();
    setIsClaimingDaily(true);

    try {
      if (userProfile) {
        const res = await claimDailyFreeTokens(userProfile);
        sound.playSuccess();
        onSuccessNotice(res.message);
      } else {
        if (guestDailyClaimed) {
          throw new Error('Daily supply drop already claimed today. Returns at 00:00 UTC.');
        }
        localStorage.setItem('cyberstrike_guest_daily_claim', todayStr);
        const newBalance = guestTokens + 50;
        onUpdateGuestTokens?.(newBalance);
        sound.playSuccess();
        onSuccessNotice('Daily Supply Drop claimed! +50 Cyber Credits added to operative balance.');
      }
    } catch (err: unknown) {
      sound.playError();
      setErrorMessage((err as Error).message || 'Failed to claim daily tokens.');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const handleBuyArmoryItem = async (item: ArmoryItem) => {
    setErrorMessage(null);
    sound.playClick();
    setBuyingItemId(item.id);

    try {
      if (userProfile) {
        const res = await purchaseArmoryItem(userProfile, item);
        sound.playSuccess();
        onSuccessNotice(res.message);
      } else {
        // Guest mode Armory purchase
        if (guestTokens < item.tokenCost) {
          throw new Error(`Insufficient Cyber Credits. Need ${item.tokenCost} tokens, but you currently have ${guestTokens}.`);
        }
        if (guestInventory.includes(item.id)) {
          throw new Error(`You already own "${item.name}".`);
        }

        const newBalance = guestTokens - item.tokenCost;
        onUpdateGuestTokens?.(newBalance);
        onUpdateGuestInventory?.(item.id);
        sound.playSuccess();
        onSuccessNotice(`Acquired "${item.name}"! ${item.effect}.`);
      }
    } catch (err: unknown) {
      sound.playError();
      setErrorMessage((err as Error).message || 'Failed to purchase armory item.');
    } finally {
      setBuyingItemId(null);
    }
  };

  const handleEquipTitle = async (titleBadge: string) => {
    setErrorMessage(null);
    sound.playClick();
    setEquippingTitle(titleBadge);
    try {
      if (userProfile) {
        const res = await equipTitle(userProfile, titleBadge);
        sound.playSuccess();
        onSuccessNotice(res.message);
      } else {
        localStorage.setItem('cyberstrike_guest_title', titleBadge);
        sound.playSuccess();
        onSuccessNotice(`Equipped title "${titleBadge}" to your public profile.`);
      }
    } catch (err: unknown) {
      sound.playError();
      setErrorMessage((err as Error).message || 'Failed to equip title.');
    } finally {
      setEquippingTitle(null);
    }
  };

  const mockCryptoAddresses: Record<string, string> = {
    USDT: '0x71C...a49B (Tron TRC20 / ERC20)',
    ETH: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    BTC: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cyber Credits Payment Portal & Armory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE & OPERATIONAL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted transaction gateway for CTF tactical upgrades, hint credits, and cosmetic flairs
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('buy');
              setPurchaseSuccess(null);
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'buy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Acquire Cyber Credits</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('armory');
              setPurchaseSuccess(null);
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'armory'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Black Market Armory & Perks</span>
          </button>
        </div>

        {/* User Balance & Daily Drop Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Balance:</span>
            <span className="text-base font-bold text-amber-400 flex items-center gap-1 tabular-nums font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              {currentBalance.toLocaleString()} Credits
            </span>
            {(userProfile?.hasRadarLicense || guestInventory.includes('radar-license')) && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Recon Drone Active</span>
              </span>
            )}
            {userProfile?.tokenBoosterCount ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{userProfile.tokenBoosterCount}x Solve Boost Active</span>
              </span>
            ) : null}
          </div>

          {/* Daily Supply Drop Button */}
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={handleClaimDailyDrop}
              disabled={isDailyClaimed || isClaimingDaily}
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

        {/* Error message banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {purchaseSuccess ? (
            /* Transaction Success Receipt */
            <div className="p-8 text-center space-y-5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl font-mono">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Payment Authorized & Confirmed</h3>
                <p className="text-xs text-slate-400">
                  Transaction receipt generated and stored securely. Cyber Credits immediately credited.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{purchaseSuccess.txId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-500">Package:</span>
                  <span className="font-bold text-white">{purchaseSuccess.packageName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-500">Channel / Method:</span>
                  <span className="text-slate-200">{purchaseSuccess.method}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-emerald-400">${purchaseSuccess.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Credits Granted:</span>
                  <span className="font-bold text-amber-400">+{purchaseSuccess.tokensAdded.toLocaleString()} Credits</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setPurchaseSuccess(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Buy Another Package
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  Return to Arena
                </button>
              </div>
            </div>
          ) : activeTab === 'buy' ? (
            /* Acquire Credits View */
            <>
              {/* Package Tier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TOKEN_PACKAGES.map(pkg => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPackage(pkg);
                        setErrorMessage(null);
                      }}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow">
                          Most Popular
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                          {pkg.badge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                          <div className="text-xl font-bold text-amber-400 flex items-baseline gap-1 mt-1 font-mono">
                            <span>{(pkg.tokens + pkg.bonusTokens).toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-normal">Credits</span>
                          </div>
                          {pkg.bonusTokens > 0 && (
                            <div className="text-[11px] text-emerald-400 font-semibold font-mono">
                              +{pkg.bonusTokens} Bonus Credits
                            </div>
                          )}
                        </div>

                        <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                          {pkg.perks.map((perk, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-base font-bold text-white font-mono">
                          ${pkg.priceUsd.toFixed(2)}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors font-mono ${
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

              {/* Interactive Checkout Portal Configuration */}
              {selectedPackage && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 font-mono">
                    <div>
                      <div className="text-xs text-slate-400">Selected Package</div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{selectedPackage.name}</span>
                        <span className="text-amber-400 font-normal">
                          (+{(selectedPackage.tokens + selectedPackage.bonusTokens).toLocaleString()} Credits)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Due</div>
                      <div className="text-2xl font-bold text-emerald-400">${effectivePrice.toFixed(2)}</div>
                      {voucherDiscount > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {(voucherDiscount * 100)}% DISCOUNT APPLIED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Channel Selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-mono">Payment Channel Gateway:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setPaymentMethod('card');
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-lg border flex items-center gap-3 text-left transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-slate-900 border-amber-500/80 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Credit / Debit Card</div>
                          <div className="text-[10px] text-slate-500">Instant Authorization</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setPaymentMethod('crypto');
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-lg border flex items-center gap-3 text-left transition-colors ${
                          paymentMethod === 'crypto'
                            ? 'bg-slate-900 border-amber-500/80 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Web3 Crypto Node</div>
                          <div className="text-[10px] text-slate-500">USDT / ETH / BTC / SOL</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setPaymentMethod('voucher');
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-lg border flex items-center gap-3 text-left transition-colors ${
                          paymentMethod === 'voucher'
                            ? 'bg-slate-900 border-amber-500/80 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Terminal Voucher</div>
                          <div className="text-[10px] text-slate-500">CTF Promo Code</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Channel 1: Credit / Debit Card Interactive Inputs */}
                  {paymentMethod === 'card' && (
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>256-Bit SSL Encrypted Card Gateway</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Sandbox Test Mode Enabled</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[11px]">Cardholder Name:</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px]">Card Number (16 Digits):</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs tracking-wider"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px]">Expiry Date (MM/YY):</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs text-center"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px]">Security Code (CVC):</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvc}
                            onChange={e => setCardCvc(e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Channel 2: Crypto Node Deposit Address */}
                  {paymentMethod === 'crypto' && (
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-bold">Select Settlement Cryptocurrency:</span>
                        <div className="flex gap-1.5">
                          {(['USDT', 'ETH', 'BTC', 'SOL'] as const).map(c => (
                            <button
                              key={c}
                              onClick={() => {
                                sound.playClick();
                                setCryptoCoin(c);
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                cryptoCoin === c
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase">Deposit Address ({cryptoCoin}):</div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-amber-400 font-bold text-xs truncate">
                            {mockCryptoAddresses[cryptoCoin]}
                          </code>
                          <button
                            onClick={() => {
                              sound.playClick();
                              navigator.clipboard.writeText(mockCryptoAddresses[cryptoCoin]);
                              setCopiedCrypto(true);
                              setTimeout(() => setCopiedCrypto(false), 2000);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 shrink-0"
                          >
                            {copiedCrypto ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCrypto ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Node status: Listening on mempool. Instant authorization supported in arena.</span>
                      </div>
                    </div>
                  )}

                  {/* Channel 3: Voucher Code Promo Input */}
                  {paymentMethod === 'voucher' && (
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                      <div className="text-slate-300 font-bold">Enter CTF Sponsor / Terminal Voucher Code:</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="e.g. CYBER2026, ZERODAY, VIP50"
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono uppercase"
                        />
                        <button
                          onClick={handleApplyVoucher}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                        >
                          Apply Code
                        </button>
                      </div>

                      {voucherSuccessMsg ? (
                        <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{voucherSuccessMsg}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          Try voucher codes: <code className="text-amber-400">CYBER2026</code> (100% Sponsor Grant) or <code className="text-amber-400">VIP50</code>.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission and Authorization Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Instant Balance Crediting · Real-Time Account Synchronization</span>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <span>Processing & Authorizing Gateway...</span>
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
            </>
          ) : (
            /* Armory Upgrades */
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-4 font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Black Market Armory & Tactical Upgrades</h3>
                    <p className="text-xs text-slate-400">
                      Spend your hard-earned Cyber Credits on automated radar scanners, solve boosters, and prestige title insignias.
                    </p>
                  </div>
                </div>
              </div>

              {/* Armory Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ARMORY_ITEMS.map(item => {
                  const isOwned = Boolean(
                    userProfile?.inventory?.includes(item.id) ||
                    guestInventory.includes(item.id) ||
                    (item.id === 'radar-license' && (userProfile?.hasRadarLicense || guestInventory.includes('radar-license')))
                  );
                  const isBuying = buyingItemId === item.id;
                  const canAfford = currentBalance >= item.tokenCost;
                  const isTitle = item.category === 'title';
                  const isEquipped = (userProfile?.badgeTitle === item.badge) || (typeof window !== 'undefined' && localStorage.getItem('cyberstrike_guest_title') === item.badge);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 font-mono ${
                        isOwned
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white flex items-center gap-2">
                            <span>{item.name}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.tokenCost} Credits
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Effect: {item.effect}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="text-[11px] font-mono text-slate-400">
                          Badge: <span className="text-slate-200">{item.badge}</span>
                        </div>

                        {isOwned ? (
                          isTitle ? (
                            <button
                              onClick={() => handleEquipTitle(item.badge)}
                              disabled={isEquipped || equippingTitle === item.badge}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isEquipped
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 cursor-default'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : 'Equip Title'}
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              <span>Owned</span>
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleBuyArmoryItem(item)}
                            disabled={!canAfford || isBuying}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>{isBuying ? 'Acquiring...' : canAfford ? 'Acquire Perk' : 'Need More Credits'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
