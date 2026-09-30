import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, ShieldAlert, Cpu, AlertTriangle, Key } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{gh0stw1r3_c4n4ry_l34k_r3t2l1bc_sh3ll_9934}';
// Simulated randomized ASLR memory space
const CANARY_HEX = '0x9a3e7b10c542e100';
const LIBC_BASE_HEX = '0x7ffff7dc0000';
const LIBC_START_MAIN_RET = '0x7ffff7de9d90'; // Base + 0x29D90

export const GhostwireSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [probeInput, setProbeInput] = useState<string>('');
  const [bufferPadding, setBufferPadding] = useState<number>(0);
  const [canaryInput, setCanaryInput] = useState<string>('');
  const [popRdiAddr, setPopRdiAddr] = useState<string>('');
  const [binShAddr, setBinShAddr] = useState<string>('');
  const [systemAddr, setSystemAddr] = useState<string>('');
  const [alignRet, setAlignRet] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[*] Daemon: /opt/ghostwire/telemetry_service (x86_64 ELF)',
    '[*] Security Mitigations: Full RELRO | Stack Canary | NX Enabled | PIE Enabled (ASLR)',
    '[*] Phase 1: Format string leak parameter to defeat ASLR and Stack Canary.',
    '[*] Phase 2: Construct ROP chain to call system("/bin/sh") without tripping __stack_chk_fail.'
  ]);

  const handleSendProbe = () => {
    sound.playClick();
    const clean = probeInput.trim();
    if (!clean) return;

    const newLogs = [...logs, `[PROBE]: ${clean}`];

    if (clean.includes('%11$p') || clean.includes('%15$p')) {
      let output = '';
      if (clean.includes('%11$p')) output += `Canary: ${CANARY_HEX} `;
      if (clean.includes('%15$p')) output += `__libc_start_main_ret: ${LIBC_START_MAIN_RET}`;
      newLogs.push(`[RESPONSE]: ${output.trim()}`);
      newLogs.push('[ANALYSIS]: Offset %11$p leaked stack canary. Offset %15$p leaked libc return address.');
      newLogs.push(`[INTEL]: Standard Libc offsets: system = libc_base + 0x50D70, /bin/sh = libc_base + 0x1D8678, pop rdi; ret = libc_base + 0x2A3E5.`);
      sound.playSuccess();
    } else if (clean.includes('%p')) {
      newLogs.push('[RESPONSE]: 0x7fffffffdf10.0x10.0x7ffff7fcd000.0x0.0x7ffff7fc0000');
      newLogs.push('[HINT]: Test higher parameter offsets e.g. %11$p (canary) or %15$p (saved return).');
    } else {
      newLogs.push(`[RESPONSE]: ${clean}`);
    }

    setLogs(newLogs);
  };

  const handleExecuteRopChain = () => {
    sound.playClick();
    const newLogs = [...logs];
    newLogs.push('[*] Dispatching structured ROP payload to vulnerable gets() buffer...');

    // 1. Check padding length
    if (bufferPadding !== 40) {
      sound.playError();
      newLogs.push(`[-] SIGSEGV: Buffer padding is incorrect (${bufferPadding} bytes). Stack buffer is 40 bytes to canary boundary.`);
      setLogs(newLogs);
      return;
    }

    // 2. Check Canary
    if (canaryInput.trim().toLowerCase() !== CANARY_HEX.toLowerCase()) {
      sound.playError();
      newLogs.push('[-] *** stack smashing detected ***: terminated (__stack_chk_fail triggered).');
      newLogs.push('[-] Canary value mismatched! Stack integrity failed.');
      setLogs(newLogs);
      return;
    }

    // 3. Check pop rdi
    const targetPopRdi = '0x7ffff7dea3e5'; // Base + 0x2A3E5
    const targetBinSh = '0x7ffff7f98678'; // Base + 0x1D8678
    const targetSystem = '0x7ffff7e10d70'; // Base + 0x50D70

    if (popRdiAddr.trim().toLowerCase() !== targetPopRdi) {
      sound.playError();
      newLogs.push(`[-] Crash at instruction pointer: Invalid pop rdi gadget (${popRdiAddr || 'empty'}). Expected libc_base + 0x2A3E5.`);
      setLogs(newLogs);
      return;
    }

    if (binShAddr.trim().toLowerCase() !== targetBinSh) {
      sound.playError();
      newLogs.push(`[-] Crash: RDI does not point to "/bin/sh" string (${binShAddr || 'empty'}). Expected libc_base + 0x1D8678.`);
      setLogs(newLogs);
      return;
    }

    if (systemAddr.trim().toLowerCase() !== targetSystem) {
      sound.playError();
      newLogs.push(`[-] Crash: System address invalid (${systemAddr || 'empty'}). Expected libc_base + 0x50D70.`);
      setLogs(newLogs);
      return;
    }

    if (!alignRet) {
      sound.playError();
      newLogs.push('[-] SIGSEGV in GLIBC do_system: RSP register was not 16-byte aligned before movaps call!');
      newLogs.push('[-] HINT: Insert a dummy standalone "ret" gadget into the ROP chain for stack alignment.');
      setLogs(newLogs);
      return;
    }

    // WIN
    sound.playSuccess();
    newLogs.push('[+] Stack canary verified cleanly! __stack_chk_fail passed.');
    newLogs.push('[+] Executing ROP chain: pop rdi -> "/bin/sh" -> ret (aligned) -> system()');
    newLogs.push('[+] ROOT INTERACTIVE SHELL SPAWNED (uid=0, euid=0)');
    newLogs.push(`[+] FLAG: ${SECRET_FLAG}`);
    setLogs(newLogs);
    onFlagFound(SECRET_FLAG);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-white text-sm">Hardened x86_64 ret2libc & Canary Bypass</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            NIGHTMARE DIFFICULTY // 600 PTS
          </span>
        </div>

        {/* Console stream */}
        <div className="p-3 bg-slate-900 rounded border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-slate-300">
          {logs.map((l, i) => (
            <div key={i} className={l.includes('FLAG') ? 'text-emerald-400 font-bold' : l.includes('[-]') ? 'text-rose-400' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Stage 1: Parameter Leak Probe */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Stage 1: Format Specifier Leak Probe (Defeat Canary & ASLR)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={probeInput}
            onChange={e => setProbeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendProbe()}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            placeholder="e.g. %11$p.%15$p to leak Canary and Libc offset..."
          />
          <button
            onClick={handleSendProbe}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs"
          >
            Probe Stack
          </button>
        </div>
      </div>

      {/* Stage 2: ROP Chain Constructor */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Stage 2: ROP Payload & Canary Preservation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Buffer Offset to Canary (bytes):</label>
            <input
              type="number"
              value={bufferPadding || ''}
              onChange={e => setBufferPadding(parseInt(e.target.value, 10) || 0)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. 40"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Preserved Stack Canary (hex):</label>
            <input
              type="text"
              value={canaryInput}
              onChange={e => setCanaryInput(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">pop rdi; ret Gadget (hex):</label>
            <input
              type="text"
              value={popRdiAddr}
              onChange={e => setPopRdiAddr(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="libc_base + 0x2A3E5"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">"/bin/sh" String Address (hex):</label>
            <input
              type="text"
              value={binShAddr}
              onChange={e => setBinShAddr(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="libc_base + 0x1D8678"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">system() Address (hex):</label>
            <input
              type="text"
              value={systemAddr}
              onChange={e => setSystemAddr(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="libc_base + 0x50D70"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="align"
              checked={alignRet}
              onChange={e => setAlignRet(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500"
            />
            <label htmlFor="align" className="text-slate-300 text-xs cursor-pointer">
              16-Byte Stack Alignment (ret gadget)
            </label>
          </div>
        </div>

        <button
          onClick={handleExecuteRopChain}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Transmit Multi-Stage ROP Payload</span>
        </button>
      </div>
    </div>
  );
};
