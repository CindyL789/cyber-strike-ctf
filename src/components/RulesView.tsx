import React from 'react';
import { Shield, AlertTriangle, Flag, Terminal, Trophy, Users } from 'lucide-react';

export const RulesView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Rules of Engagement & Arena Intel</h2>
            <p className="text-xs text-slate-400">Standard operating guidelines for CyberStrike CTF tournaments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span>Flag Syntax & Standards</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              All official flags follow the standard format: <code className="text-emerald-400">flag&#123;...&#125;</code>. Flags are strictly case-sensitive. Leaking flags in public channels will lead to immediate score disqualification.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Season Top 5 Bounties</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The top 5 operatives on the leaderboard at season conclusion share the 13,000 Cyber Credits bounty pool and unlock exclusive Obsidian Crown, Crimson Skull, and Dragon badges.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Strict Scope & Boundaries</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Attacking the scoring server infrastructure, denial-of-service (DoS) against challenge sandboxes, or automated brute forcing of authentication gateways is strictly forbidden.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-indigo-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>System Shell & Workbench</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Operators are equipped with a built-in System Shell terminal (with ls, cat, whoami, strings, grep) and a Cryptographic Workbench (Base64, Hex, XOR, Rot13) to aid rapid tactical analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
