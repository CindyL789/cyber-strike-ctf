import React from 'react';
import { ShieldAlert, Database, Users } from 'lucide-react';
import { Challenge } from '../types/ctf';

interface Props {
  challenges: Challenge[];
}

export const AdminDashboard: React.FC<Props> = ({ challenges }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
      <div className="p-5 bg-amber-950/20 border border-amber-500/40 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">Administrator Command Console</h2>
            <p className="text-xs text-slate-400">Authenticated as root arena administrator</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 uppercase text-[10px]">Total Published Challenges:</span>
          <div className="text-2xl font-bold text-emerald-400">{challenges.length}</div>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 uppercase text-[10px]">Total Score Pool:</span>
          <div className="text-2xl font-bold text-amber-400">
            {challenges.reduce((acc, c) => acc + c.points, 0).toLocaleString()} PTS
          </div>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 uppercase text-[10px]">Database Status:</span>
          <div className="text-2xl font-bold text-indigo-400">CONNECTED (FIRESTORE)</div>
        </div>
      </div>

    </div>
  );
};
