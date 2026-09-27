import React from 'react';
import { ShieldCheck, Flag, Lightbulb, Terminal, AlertTriangle, BookOpen } from 'lucide-react';

export const RulesView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-sm text-slate-300">
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            CyberStrike Arena Operating Directives
          </h2>
        </div>
        <p className="leading-relaxed">
          Welcome to the live cybersecurity capture the flag arena. All challenges are simulated in isolated sandbox environments with authentic vulnerability patterns spanning web exploitation, modern and classical cryptography, reverse engineering, forensics, and Linux privilege escalation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
            <Flag className="w-4 h-4 text-emerald-400" />
            <span>01. Flag Format</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All flags follow the canonical syntax <code className="text-emerald-400 font-mono">flag&#123;...&#125;</code>. Flags are strictly case-sensitive. You can submit flags either inside each challenge’s interactive modal or through the global quick submit bar in the top navigation.
          </p>
        </div>

        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>02. Hint Economy</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Progressive hints are available for each challenge. Unlocking a hint will deduct the stated penalty points from your scoreboard total. Pure solves without hints maximize your competitive standing.
          </p>
        </div>

        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>03. Cyber Workbench</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access the built-in Cyber Workbench via the wrench icon in the top header. It includes full Base64, Hex, ROT-13, XOR, MD5, SHA-256, and URL decoders to assist with crypto and forensics challenges.
          </p>
        </div>

        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>04. Educational Writeups</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once you capture a challenge flag, its complete technical writeup and root-cause analysis unlock automatically in the challenge modal for maximum learning and debriefing.
          </p>
        </div>
      </div>
    </div>
  );
};
