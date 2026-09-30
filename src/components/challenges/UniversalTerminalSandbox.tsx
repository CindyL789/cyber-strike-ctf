import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2 } from 'lucide-react';
import { Challenge } from '../../types/ctf';
import { sound } from '../../utils/audio';

interface Props {
  challenge: Challenge;
  onFlagFound: (flag: string) => void;
}

export const UniversalTerminalSandbox: React.FC<Props> = ({ challenge, onFlagFound }) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<string[]>([
    `[ARENA CONTAINER] Target: ${challenge.title} (${challenge.category} - ${challenge.difficulty})`,
    `[INFO] Type "help" or run diagnostic inspection routines.`
  ]);

  const handleRun = () => {
    sound.playClick();
    const clean = inputVal.trim();
    const newLogs = [...logs, `$ ${clean}`];

    if (clean === 'help') {
      newLogs.push('Available commands: status, inspect, info, env, probe, flag');
    } else if (clean === 'status') {
      newLogs.push(`Container state: HEALTHY · Isolation: Containerized · Target: ${challenge.id}`);
    } else if (clean === 'inspect') {
      newLogs.push(`Tags: ${challenge.tags.join(', ')} · Author: @${challenge.author}`);
    } else if (clean === 'probe') {
      newLogs.push('Probe response: Target process listening on internal socket.');
    } else {
      newLogs.push(`Executed: ${clean}`);
    }

    setLogs(newLogs);
    setInputVal('');
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Interactive Sandbox: {challenge.title}</span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 max-h-48 overflow-y-auto text-slate-300">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRun()}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="Type terminal command..."
          />
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
