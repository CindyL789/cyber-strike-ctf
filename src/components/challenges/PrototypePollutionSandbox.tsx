import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertOctagon, Terminal, ArrowRight, Copy } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const PrototypePollutionSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [jsonPayload, setJsonPayload] = useState('{\n  "theme": "dark",\n  "__proto__": {\n    "isAdmin": true,\n    "accessLevel": 99\n  }\n}');
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [isPolluted, setIsPolluted] = useState(false);
  const [flag, setFlag] = useState<string | null>(null);

  const FLAG = 'flag{pr0t0_p0llut10n_r00t_c0ntr0l_412}';

  const handleTestMerge = () => {
    sound.playClick();
    const logs: string[] = [];
    logs.push('[PARSE] Validating incoming JSON configuration...');

    try {
      // In JS, JSON.parse with __proto__ creates an object with own property __proto__
      // We simulate the recursive merge vulnerability against a sandbox dictionary
      const parsed = JSON.parse(jsonPayload);
      logs.push('[MERGE] Executing recursive deepMerge(targetConfig, payload)...');

      let pollutedAdmin = false;
      let pollutedLevel = 0;

      // Check if __proto__ was injected or constructor.prototype
      if (parsed['__proto__']) {
        logs.push('[VULN] Detected unvalidated key traversal into __proto__!');
        if (parsed['__proto__'].isAdmin === true) {
          pollutedAdmin = true;
          pollutedLevel = parsed['__proto__'].accessLevel || 99;
        }
      }
      if (parsed['constructor'] && parsed['constructor']['prototype']) {
        logs.push('[VULN] Detected constructor.prototype pollution attempt!');
        if (parsed['constructor']['prototype'].isAdmin === true) {
          pollutedAdmin = true;
          pollutedLevel = 99;
        }
      }

      logs.push('[AUTH] Instantiating newly isolated session object: const session = {};');
      logs.push(`[CHECK] Evaluating session.isAdmin === true ... -> Result: ${pollutedAdmin}`);

      if (pollutedAdmin) {
        logs.push(`[ACCESS] CRITICAL: Root prototype polluted! Inherited accessLevel: ${pollutedLevel}`);
        logs.push('[VAULT] Security barrier collapsed. Flag emitted from kernel memory.');
        setIsPolluted(true);
        setFlag(FLAG);
        sound.playSuccess();
        if (onFlagFound) onFlagFound(FLAG);
      } else {
        logs.push('[CHECK] session.isAdmin is undefined. Standard unprivileged user.');
        logs.push('[AUTH] Access denied to sensitive configuration keys.');
        setIsPolluted(false);
        sound.playError();
      }
    } catch (e: unknown) {
      logs.push(`[ERROR] JSON parse syntax error: ${(e as Error).message}`);
      setIsPolluted(false);
      sound.playError();
    }

    setOutputLogs(logs);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Vulnerable Component: Dynamic Settings Merger</div>
          <div className="text-xs text-slate-400">
            Object prototype pollution vulnerability in recursive key assignment.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Payload Input (JSON)</span>
            <button
              onClick={() => {
                setJsonPayload('{\n  "theme": "dark",\n  "__proto__": {\n    "isAdmin": true,\n    "accessLevel": 99\n  }\n}');
                sound.playClick();
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs underline"
            >
              Insert Exploit Pattern
            </button>
          </div>

          <textarea
            value={jsonPayload}
            onChange={e => setJsonPayload(e.target.value)}
            rows={8}
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <button
            onClick={handleTestMerge}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-2"
          >
            <span>Trigger Config Merge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Telemetry Output */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                V8 Runtime Evaluation
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Node.js v20.10</span>
            </div>

            <div className="h-44 p-3 bg-slate-900/90 border border-slate-800 rounded font-mono text-xs overflow-y-auto space-y-1.5">
              {outputLogs.length === 0 ? (
                <div className="text-slate-500 italic">Submit JSON payload to test Object.prototype pollution.</div>
              ) : (
                outputLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes('[VAULT]') || log.includes('[ACCESS]')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('[VULN]')
                        ? 'text-amber-400'
                        : log.includes('[ERROR]')
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {isPolluted && flag && (
            <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Prototype Polluted! Root Clearance Obtained:</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-emerald-800/40">
                <code className="text-emerald-300 font-mono text-xs select-all">{flag}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(flag);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
