import React, { useState } from 'react';
import {
  X,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Terminal,
  Shield,
  ArrowRight,
  Coins,
  Sparkles,
  Radio,
  Cpu,
  Network,
  LockOpen
} from 'lucide-react';
import { Challenge } from '../types/ctf';
import { sound } from '../utils/audio';

// Sandboxes
import { BlindSqlSandbox } from './challenges/BlindSqlSandbox';
import { PaddingOracleSandbox } from './challenges/PaddingOracleSandbox';
import { CustomVmSandbox } from './challenges/CustomVmSandbox';
import { FormatStringSandbox } from './challenges/FormatStringSandbox';
import { MemoryForensicsSandbox } from './challenges/MemoryForensicsSandbox';
import { RsaCubeRootSandbox } from './challenges/RsaCubeRootSandbox';
import { DisassemblerSandbox } from './challenges/DisassemblerSandbox';
import { PcapInspectorSandbox } from './challenges/PcapInspectorSandbox';
import { LinuxTerminalSandbox } from './challenges/LinuxTerminalSandbox';
import { PrototypePollutionSandbox } from './challenges/PrototypePollutionSandbox';
import { JwtTamperSandbox } from './challenges/JwtTamperSandbox';
import { XorCipherSandbox } from './challenges/XorCipherSandbox';
import { Ret2WinSandbox } from './challenges/Ret2WinSandbox';
import { SsrfSandbox } from './challenges/SsrfSandbox';
import { StegoBitplanesSandbox } from './challenges/StegoBitplanesSandbox';
import { VigenereAutokeySandbox } from './challenges/VigenereAutokeySandbox';
import { GhostwireSandbox } from './challenges/GhostwireSandbox';
import { LatticeCryptoSandbox } from './challenges/LatticeCryptoSandbox';
import { PolymorphicVmSandbox } from './challenges/PolymorphicVmSandbox';
import { DeserializationSandbox } from './challenges/DeserializationSandbox';
import { TlsForensicsSandbox } from './challenges/TlsForensicsSandbox';
import { UniversalTerminalSandbox } from './challenges/UniversalTerminalSandbox';

interface Props {
  challenge: Challenge;
  isSolved: boolean;
  unlockedHints: string[];
  userTokens?: number;
  hasRadarLicense?: boolean;
  onClose: () => void;
  onSubmitFlag: (challengeId: string, flag: string) => boolean;
  onUnlockHint: (challengeId: string, hintId: string, cost: number) => void;
  onUnlockHintWithTokens?: (challengeId: string, hintId: string, tokenCost: number) => void;
  onOpenTokenStore?: () => void;
  onOpenShell?: () => void;
}

export const ChallengeModal: React.FC<Props> = ({
  challenge,
  isSolved,
  unlockedHints,
  userTokens = 0,
  hasRadarLicense = false,
  onClose,
  onSubmitFlag,
  onUnlockHint,
  onUnlockHintWithTokens,
  onOpenTokenStore,
  onOpenShell
}) => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'brief' | 'radar' | 'hints' | 'writeup'>('sandbox');
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
      case 'rsa-cube-root-weakness':
        return <RsaCubeRootSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'linux-suid-privesc':
        return <LinuxTerminalSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'prototype-pollution-sandbox':
        return <PrototypePollutionSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'reverse-disassembler-crackme':
        return <DisassemblerSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'pcap-stream-exfiltration':
        return <PcapInspectorSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'jwt-tamper-bypass':
        return <JwtTamperSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'xor-frequency-breaker':
        return <XorCipherSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'ret2win-rop-buffer-overflow':
        return <Ret2WinSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'ssrf-cloud-metadata-pivot':
        return <SsrfSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'stego-bitplanes-recovery':
        return <StegoBitplanesSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'vigenere-autokey-breaker':
        return <VigenereAutokeySandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'operation-ghostwire-ret2libc':
        return <GhostwireSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'the-quantum-lattice-ecdsa':
        return <LatticeCryptoSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'shadow-kernel-polymorphic':
        return <PolymorphicVmSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'zero-click-deserialization':
        return <DeserializationSandbox onFlagFound={handleFlagFoundInSandbox} />;
      case 'bgp-hijack-tls13-downgrade':
        return <TlsForensicsSandbox onFlagFound={handleFlagFoundInSandbox} />;
      default:
        return <UniversalTerminalSandbox challenge={challenge} onFlagFound={handleFlagFoundInSandbox} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
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
                    : challenge.difficulty === 'Insane'
                    ? 'text-purple-300 font-bold'
                    : 'text-rose-400 font-extrabold uppercase tracking-wider animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
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
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs flex-wrap">
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
              setActiveTab('radar');
            }}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'radar'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recon Radar</span>
            {hasRadarLicense && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            )}
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

          {onOpenShell && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenShell();
              }}
              className="ml-auto px-2.5 py-1 text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 flex items-center gap-1 font-mono text-[11px] transition-colors"
              title="Open dedicated System Shell"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Open in System Shell</span>
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

          {activeTab === 'radar' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Tactical Architecture Radar</span>
                      {hasRadarLicense ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          DRONE LICENSE UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          STANDARD SCAN
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live telemetry reconnaissance and port fingerprinting for target: {challenge.id}
                    </p>
                  </div>
                </div>

                {!hasRadarLicense && onOpenTokenStore && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenTokenStore();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0"
                  >
                    Get Drone License (Armory)
                  </button>
                )}
              </div>

              {/* Architecture & Ports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target Host Runtime & Kernel</span>
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Sandbox VM:</span>
                      <span className="text-emerald-400 font-bold">ctf-{challenge.category.toLowerCase()}-node.internal</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>OS Platform:</span>
                      <span className="text-slate-200">Linux 5.15.0-x86_64</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Isolation:</span>
                      <span className="text-slate-200">Seccomp / Unprivileged Namespace</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Challenge Domain:</span>
                      <span className="text-amber-400 font-bold">{challenge.category}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Port & Service Fingerprint</span>
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Primary Ingress:</span>
                      <span className="text-emerald-400 font-bold">
                        {challenge.category === 'Web'
                          ? 'TCP/80, 443 (HTTP/1.1)'
                          : challenge.category === 'Pwn'
                          ? 'TCP/1337 (ELF Daemon)'
                          : challenge.category === 'Crypto'
                          ? 'TCP/9002 (Cryptographic RPC)'
                          : 'Local Memory Stream'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Service Banner:</span>
                      <span className="text-slate-200 truncate max-w-[200px]">{challenge.title} v1.4</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Authentication:</span>
                      <span className="text-rose-400 font-bold">Vulnerable / Bypassable</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payload Mode:</span>
                      <span className="text-slate-200">Synchronous Sandbox Execution</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attack Vector Surface Map */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <LockOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Identified Attack Vectors</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {challenge.tags.map(tag => (
                    <div
                      key={tag}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="font-bold text-white">{tag}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                  Reconnaissance indicates input sanitization weaknesses or algorithmic shortcuts can be leveraged. Use the Interactive Target Sandbox tab to test payloads against the live container.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="space-y-4">
              {/* Token balance status bar */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Available Cyber Credits:</span>
                  <span className="font-bold text-amber-400">{userTokens.toLocaleString()}</span>
                </div>

                {onOpenTokenStore && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenTokenStore();
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1"
                  >
                    <span>Get More Credits</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {challenge.hints.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No hints registered for this objective.</div>
              ) : (
                challenge.hints.map((hint, idx) => {
                  const isUnlocked = unlockedHints.includes(hint.id);
                  const tokenCost = hint.cost * 3;
                  const canAffordTokens = userTokens >= tokenCost;

                  return (
                    <div
                      key={hint.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Intel Hint #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400">-{hint.cost} pts penalty</span>
                          <span className="text-slate-600">or</span>
                          <span className="font-mono text-emerald-400 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {tokenCost} credits (0 penalty)
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <p className="text-xs text-emerald-300 font-mono bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/30">
                          {hint.text}
                        </p>
                      ) : (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          {onUnlockHintWithTokens && (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onUnlockHintWithTokens(challenge.id, hint.id, tokenCost);
                              }}
                              disabled={!canAffordTokens}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                                canAffordTokens
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Unlock with {tokenCost} Credits (0 Score Penalty)</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              sound.playClick();
                              onUnlockHint(challenge.id, hint.id, hint.cost);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                          >
                            Standard Unlock (-{hint.cost} pts from score)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'writeup' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Official Vulnerability Root-Cause Walkthrough</span>
                </div>
                <div className="text-slate-300 leading-relaxed pt-1">
                  {challenge.writeup || 'Flag verified and logged.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom: Flag Submission Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 font-mono ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Flag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={flagInput}
                onChange={e => setFlagInput(e.target.value)}
                placeholder="flag{...}"
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <span>Submit Flag</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
