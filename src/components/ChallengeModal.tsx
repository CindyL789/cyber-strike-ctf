import React, { useState } from 'react';
import { X, Flag, CheckCircle2, AlertTriangle, Lightbulb, BookOpen, Terminal, Shield, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { Challenge } from '../types/ctf';
import { sound } from '../utils/audio';

// Sandboxes
import { SqlInjectionSandbox } from './challenges/SqlInjectionSandbox';
import { JwtTamperSandbox } from './challenges/JwtTamperSandbox';
import { PrototypePollutionSandbox } from './challenges/PrototypePollutionSandbox';
import { XorCipherSandbox } from './challenges/XorCipherSandbox';
import { RsaCubeRootSandbox } from './challenges/RsaCubeRootSandbox';
import { DisassemblerSandbox } from './challenges/DisassemblerSandbox';
import { JsDeobfuscatorSandbox } from './challenges/JsDeobfuscatorSandbox';
import { PcapInspectorSandbox } from './challenges/PcapInspectorSandbox';
import { HexEditorSandbox } from './challenges/HexEditorSandbox';
import { LinuxTerminalSandbox } from './challenges/LinuxTerminalSandbox';
import { BlindSqlSandbox } from './challenges/BlindSqlSandbox';
import { PaddingOracleSandbox } from './challenges/PaddingOracleSandbox';
import { CustomVmSandbox } from './challenges/CustomVmSandbox';
import { FormatStringSandbox } from './challenges/FormatStringSandbox';
import { MemoryForensicsSandbox } from './challenges/MemoryForensicsSandbox';
import { SsrfSandbox } from './challenges/SsrfSandbox';
import { VigenereAutokeySandbox } from './challenges/VigenereAutokeySandbox';
import { StegoBitplanesSandbox } from './challenges/StegoBitplanesSandbox';
import { Ret2WinSandbox } from './challenges/Ret2WinSandbox';
import { UniversalTerminalSandbox } from './challenges/UniversalTerminalSandbox';

interface Props {
  challenge: Challenge;
  isSolved: boolean;
  unlockedHints: string[];
  userTokens?: number;
  onClose: () => void;
  onSubmitFlag: (challengeId: string, flag: string) => boolean;
  onUnlockHint: (challengeId: string, hintId: string, cost: number) => void;
  onUnlockHintWithTokens?: (challengeId: string, hintId: string, tokenCost: number) => void;
  onOpenTokenStore?: () => void;
}

export const ChallengeModal: React.FC<Props> = ({
  challenge,
  isSolved,
  unlockedHints,
  userTokens = 0,
  onClose,
  onSubmitFlag,
  onUnlockHint,
  onUnlockHintWithTokens,
  onOpenTokenStore
}) => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'brief' | 'hints' | 'writeup'>('sandbox');
  const [flagInput, setFlagInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;

    sound.playClick();
    const correct = onSubmitFlag(challenge.id, flagInput.trim());
    if (correct) {
      sound.playSuccess();
      setFeedback({ type: 'success', message: 'Flag Captured! Points awarded to your scoreboard.' });
    } else {
      sound.playError();
      setFeedback({ type: 'error', message: 'Incorrect flag. Inspect challenge logs or verify casing.' });
    }
  };

  const handleFlagFoundInSandbox = (flag: string) => {
    setFlagInput(flag);
  };

  const renderSandbox = () => {
    switch (challenge.id) {
      case 'sqli-auth-bypass':
        return <SqlInjectionSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'jwt-tamper-bypass':
        return <JwtTamperSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'prototype-pollution-sandbox':
        return <PrototypePollutionSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'xor-frequency-breaker':
        return <XorCipherSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'rsa-cube-root-weakness':
        return <RsaCubeRootSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'reverse-disassembler-crackme':
        return <DisassemblerSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'js-deobfuscator-packer':
        return <JsDeobfuscatorSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'pcap-stream-exfiltration':
        return <PcapInspectorSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'hex-magic-bytes-repair':
        return <HexEditorSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'linux-suid-privesc':
        return <LinuxTerminalSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'blind-sqli-time-oracle':
        return <BlindSqlSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'cbc-padding-oracle-attack':
        return <PaddingOracleSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'custom-bytecode-vm-reversal':
        return <CustomVmSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'format-string-stack-arbitrary-write':
        return <FormatStringSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'memory-dump-volatility-forensics':
        return <MemoryForensicsSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'daily-ssrf-metadata':
        return <SsrfSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'daily-vigenere-autokey':
        return <VigenereAutokeySandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'daily-stego-bitplanes':
        return <StegoBitplanesSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'daily-pwn-ret2win':
        return <Ret2WinSandbox onFlagFound={handleFlagFoundInSandbox} />;
      default:
        return <UniversalTerminalSandbox challenge={challenge} onFlagFound={handleFlagFoundInSandbox} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-emerald-400">{challenge.category}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  challenge.difficulty === 'Easy'
                    ? 'text-emerald-300'
                    : challenge.difficulty === 'Medium'
                    ? 'text-amber-300'
                    : challenge.difficulty === 'Hard'
                    ? 'text-rose-300'
                    : 'text-purple-300 font-bold'
                }
              >
                {challenge.difficulty}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-300 font-semibold">{challenge.points} pts</span>
              <span aria-hidden="true">·</span>
              <span>{challenge.solvesCount} solves</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{challenge.title}</span>
              {isSolved && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SOLVED
                </span>
              )}
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('sandbox');
            }}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'sandbox'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Target</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('brief');
            }}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'brief'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Briefing & Scope</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('hints');
            }}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'hints'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hints ({challenge.hints.length})</span>
          </button>
          {isSolved && (
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('writeup');
              }}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'writeup'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Solution Walkthrough</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'sandbox' && renderSandbox()}

          {activeTab === 'brief' && (
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mission Overview</div>
                <p>{challenge.description}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scope & Vectors</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {challenge.tags.map(t => (
                    <span
                      key={t}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 text-slate-400">
                <div>Author: <span className="text-slate-200 font-mono">@{challenge.author}</span></div>
                <div>Standard Flag Format: <code className="text-emerald-400 font-mono">flag&#123;...&#125;</code></div>
              </div>
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="space-y-4">
              {/* Token balance status bar */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Your Cyber Credits:</span>
                  <span className="font-bold text-amber-400 tabular-nums">{userTokens.toLocaleString()} Credits</span>
                </div>
                {onOpenTokenStore && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenTokenStore();
                    }}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1"
                  >
                    <span>+ Get More Tokens</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {challenge.hints.map((hint, idx) => {
                  const isUnlocked = unlockedHints.includes(hint.id);
                  const tokenCost = hint.cost * 2;
                  const canAffordTokens = userTokens >= tokenCost;

                  return (
                    <div
                      key={hint.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-300">Hint {idx + 1}</span>
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Unlocked & Available</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Option 1: Unlock with Cyber Credits (0 score penalty) */}
                            {onUnlockHintWithTokens && (
                              <button
                                onClick={() => {
                                  if (!canAffordTokens && onOpenTokenStore) {
                                    sound.playClick();
                                    onOpenTokenStore();
                                  } else {
                                    sound.playHint();
                                    onUnlockHintWithTokens(challenge.id, hint.id, tokenCost);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded font-mono font-bold flex items-center gap-1.5 transition-all ${
                                  canAffordTokens
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                                }`}
                                title="Unlock hint without losing points on the public scoreboard"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>
                                  {canAffordTokens
                                    ? `Unlock with ${tokenCost} Credits (0 Score Penalty)`
                                    : `Need ${tokenCost} Credits (+Get Tokens)`}
                                </span>
                              </button>
                            )}

                            {/* Option 2: Unlock with Score Penalty */}
                            <button
                              onClick={() => {
                                sound.playHint();
                                onUnlockHint(challenge.id, hint.id, hint.cost);
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-medium flex items-center gap-1 transition-colors text-[11px]"
                              title="Deducts points directly from your rank score"
                            >
                              <Lightbulb className="w-3 h-3 text-slate-500" />
                              <span>Spend -{hint.cost} Score pts</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {isUnlocked ? (
                        <p className="text-slate-300 font-mono text-xs leading-relaxed pt-1 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                          {hint.text}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic">
                          Hint is locked. Unlock using Cyber Credits to preserve your score, or deduct {hint.cost} score points.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'writeup' && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-sm">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Declassified Solution Walkthrough</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{challenge.writeup}</p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-300">
                Accepted Flag: {challenge.flag}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Flag Submission Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={flagInput}
                onChange={e => setFlagInput(e.target.value)}
                placeholder="Enter capture flag e.g. flag{...}"
                disabled={isSolved}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <Flag className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="submit"
              disabled={isSolved || !flagInput.trim()}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>{isSolved ? 'Challenge Completed' : 'Submit Flag'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {feedback && (
            <div
              className={`mt-2.5 p-2 rounded text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
