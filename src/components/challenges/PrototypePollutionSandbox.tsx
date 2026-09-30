import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{pr0t0_p0llut10n_r00t_c0ntr0l_412}';

export const PrototypePollutionSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [jsonInput, setJsonInput] = useState<string>('{\n  "theme": "dark",\n  "refreshInterval": 30,\n  "language": "en-US"\n}');
  const [authStatus, setAuthStatus] = useState<string>('Standard User Session (isAdmin = undefined)');
  const [isPolluted, setIsPolluted] = useState<boolean>(false);

  const handleMerge = () => {
    sound.playClick();
    if (jsonInput.includes('__proto__') && jsonInput.includes('isAdmin')) {
      sound.playSuccess();
      setIsPolluted(true);
      setAuthStatus('CRITICAL: Object.prototype polluted! Instantiated permissions object evaluated auth.isAdmin === true');
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setIsPolluted(false);
      setAuthStatus('Payload merged without prototype modification.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-white text-sm">Recursive JSON Configuration Merger</span>
        </div>

        <div className="text-slate-400 text-[11px]">
          Target function performs deep recursive merge of JSON properties into application settings without filtering <code className="text-rose-400">__proto__</code>.
        </div>

        <textarea
          rows={6}
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
        />

        <button
          onClick={handleMerge}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
        >
          Send JSON Merge Payload
        </button>

        <div className={`p-3 rounded-lg border text-xs ${isPolluted ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          {authStatus}
          {isPolluted && (
            <div className="pt-2 text-emerald-400 font-bold">
              Root Secret: {SECRET_FLAG}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
