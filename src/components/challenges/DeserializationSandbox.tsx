import React, { useState } from 'react';
import { Terminal, Send, ShieldAlert, CheckCircle2, Globe, Database } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{pyth0n_p1ckl3_g4dg3t_ch41n_rc3_8819}';

export const DeserializationSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [moduleTarget, setModuleTarget] = useState<string>('os');
  const [callableTarget, setCallableTarget] = useState<string>('system');
  const [commandArg, setCommandArg] = useState<string>('/bin/cat /vault/flag.txt');
  const [executionLog, setExecutionLog] = useState<string[]>([
    '[*] Remote Worker: wss://broker.internal.cyberstrike/ws/v1/sync',
    '[*] SecureUnpickler active: restricts allowed modules to prevent arbitrary code execution.',
    '[*] Banned namespaces: "os", "subprocess", "socket", "sys".',
    '[*] Construct a gadget reduction chain using allowed namespaces e.g. "posix" or "builtins".'
  ]);
  const [isExploited, setIsExploited] = useState<boolean>(false);

  const handleSendPayload = () => {
    sound.playClick();
    const newLogs = [...executionLog];
    newLogs.push(`[>] Serializing pickle stream: GLOBAL ${moduleTarget} ${callableTarget}("${commandArg}")`);

    // Check banned filters
    const banned = ['os', 'subprocess', 'socket', 'sys'];
    if (banned.includes(moduleTarget.trim().toLowerCase())) {
      sound.playError();
      newLogs.push(`[-] SecurityException: Module "${moduleTarget}" is prohibited by SafeUnpickler blacklist!`);
      setExecutionLog(newLogs);
      return;
    }

    // Allowed bypasses
    const isPosixBypass = (moduleTarget === 'posix' && (callableTarget === 'popen' || callableTarget === 'system'));
    const isBuiltinsBypass = (moduleTarget === 'builtins' && (callableTarget === 'eval' || callableTarget === 'exec'));

    if (isPosixBypass || isBuiltinsBypass) {
      if (commandArg.includes('/vault/flag.txt') || commandArg.includes('cat')) {
        sound.playSuccess();
        setIsExploited(true);
        newLogs.push('[+] SafeUnpickler filter bypassed! Instantiated callable in permitted namespace.');
        newLogs.push(`[+] Command executed: ${commandArg}`);
        newLogs.push(`[+] OUTPUT: ${SECRET_FLAG}`);
        onFlagFound(SECRET_FLAG);
      } else {
        newLogs.push(`[+] Command executed, but target flag file not read.`);
      }
    } else {
      sound.playError();
      newLogs.push(`[-] Callable ${moduleTarget}.${callableTarget} does not yield remote execution or is invalid.`);
    }

    setExecutionLog(newLogs);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">WebSocket Serialized State Worker</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            NIGHTMARE DIFFICULTY // 580 PTS
          </span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
          {executionLog.map((l, i) => (
            <div key={i} className={l.includes('OUTPUT') ? 'text-emerald-400 font-bold' : l.includes('[-] ') ? 'text-rose-400' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Gadget Builder */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs">Pickle Gadget Chain Constructor</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Target Module (Namespace):</label>
            <input
              type="text"
              value={moduleTarget}
              onChange={e => setModuleTarget(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. posix, builtins..."
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Target Callable (Method):</label>
            <input
              type="text"
              value={callableTarget}
              onChange={e => setCallableTarget(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. popen, exec..."
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Command Argument:</label>
            <input
              type="text"
              value={commandArg}
              onChange={e => setCommandArg(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="/bin/cat /vault/flag.txt"
            />
          </div>
        </div>

        <button
          onClick={handleSendPayload}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Insecure Deserialization Stream</span>
        </button>
      </div>
    </div>
  );
};
