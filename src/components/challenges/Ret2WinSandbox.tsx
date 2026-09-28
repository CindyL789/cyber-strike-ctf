import React, { useState } from 'react';
import { Terminal, Shield, Play, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

export const Ret2WinSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [paddingLength, setPaddingLength] = useState(40);
  const [retAddress, setRetAddress] = useState('0x004011ba');
  const [terminalOutput, setTerminalOutput] = useState<string>(
    'gdb-peda$ checksec\n' +
    'CANARY    : disabled\n' +
    'FORTIFY   : disabled\n' +
    'NX        : ENABLED\n' +
    'PIE       : disabled\n' +
    'RELRO     : Partial RELRO\n\n' +
    'gdb-peda$ print win\n' +
    '$1 = {<text variable, no debug info>} 0x4011ba <win>\n\n' +
    'Ready for payload injection. Enter buffer offset and target function address.'
  );
  const [captured, setCaptured] = useState(false);

  const FLAG = 'flag{r3t2w1n_st4ck_sm4sh_x86_64_5521}';

  const handleExecute = () => {
    sound.playClick();
    const cleanAddr = retAddress.trim().toLowerCase();

    if (paddingLength === 40 && (cleanAddr === '0x4011ba' || cleanAddr === '0x004011ba')) {
      sound.playSuccess();
      setTerminalOutput(
        `[+] Constructed exploit payload:\n` +
        `    Padding: ${paddingLength} bytes ('A' * 40)\n` +
        `    Saved RBP: Overwritten with 0x4141414141414141\n` +
        `    Saved RIP: Diverted to 0x004011ba <win>\n\n` +
        `[+] Executing binary with crafted input...\n` +
        `[+] Hijacking instruction pointer...\n` +
        `[+] In win() function:\n` +
        `[+] System privilege elevated. Reading /flags/pwn.txt...\n\n` +
        `FLAG CAPTURED: ${FLAG}`
      );
      setCaptured(true);
      onFlagFound(FLAG);
    } else if (paddingLength < 40) {
      sound.playError();
      setTerminalOutput(
        `[-] Payload length (${paddingLength} bytes) failed to reach saved RIP offset.\n` +
        `[-] Program exited normally (Code 0). Return address unchanged.`
      );
    } else if (paddingLength > 40) {
      sound.playError();
      setTerminalOutput(
        `[-] Payload length exceeded 40 bytes before setting return pointer.\n` +
        `[-] Segmentation fault (SIGSEGV) at unmapped address. Core dumped.`
      );
    } else {
      sound.playError();
      setTerminalOutput(
        `[-] Return pointer redirected to invalid or unmapped address: ${retAddress}\n` +
        `[-] Program crashed with SIGSEGV.`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* 64-bit Stack Frame Layout */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <Bug className="w-3.5 h-3.5" />
            x86_64 Stack Frame Map
          </span>
          <span className="text-[11px] text-slate-500">gets() overflow vulnerability</span>
        </div>

        {/* Stack diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <div className="text-slate-500 text-[10px] uppercase">Buffer (32 Bytes)</div>
            <div className="text-slate-300 font-bold mt-1">char buf[32]</div>
            <div className="text-[10px] text-slate-500 mt-1">Offset: 0x00 - 0x20</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <div className="text-slate-500 text-[10px] uppercase">Saved RBP (8 Bytes)</div>
            <div className="text-amber-400 font-bold mt-1">rbp frame pointer</div>
            <div className="text-[10px] text-slate-500 mt-1">Offset: 0x20 - 0x28 (32-40)</div>
          </div>
          <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded">
            <div className="text-rose-400 text-[10px] uppercase font-bold">Saved RIP (8 Bytes)</div>
            <div className="text-rose-300 font-bold mt-1">Return Address</div>
            <div className="text-[10px] text-rose-400/80 mt-1">Offset: 40 bytes</div>
          </div>
        </div>

        {/* Payload builder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Padding Offset to Saved RIP: <span className="text-emerald-400 font-bold">{paddingLength} bytes</span>
            </label>
            <input
              type="range"
              min={20}
              max={60}
              step={1}
              value={paddingLength}
              onChange={e => setPaddingLength(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Function Address:</label>
            <input
              type="text"
              value={retAddress}
              onChange={e => setRetAddress(e.target.value)}
              placeholder="0x004011ba"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleExecute}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Smash Stack & Execute</span>
          </button>
        </div>
      </div>

      {/* GDB / Execution Console */}
      <div className="p-4 bg-black/90 border border-slate-800 rounded-lg font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Terminal className="w-3 h-3" />
            GDB Debugger Session
          </span>
          <span className="text-emerald-400">PID: 9024</span>
        </div>

        <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
          {terminalOutput}
        </pre>

        {captured && (
          <div className="p-2.5 mt-2 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Ret2Win Exploited!
            </span>
            <button
              onClick={() => onFlagFound(FLAG)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-sans"
            >
              Auto-Fill Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
