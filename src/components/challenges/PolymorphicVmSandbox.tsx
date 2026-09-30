import React, { useState } from 'react';
import { Terminal, Cpu, Play, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{p0lym0rph1c_s3lf_m0d1fy1ng_c0d3_cr4ck3d_551}';
const CORRECT_PASSCODE = 'SHADOW_REIGN_99';

export const PolymorphicVmSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [bypassPtrace, setBypassPtrace] = useState<boolean>(false);
  const [bypassChecksum, setBypassChecksum] = useState<boolean>(false);
  const [cyclesToRun, setCyclesToRun] = useState<number>(16);
  const [candidatePasscode, setCandidatePasscode] = useState<string>('');
  const [vmLogs, setVmLogs] = useState<string[]>([
    '[*] Implant Binary: libshadow_implant.so (64-bit ELF)',
    '[*] Self-Modifying Code detected: RWX section mapped at 0x00405000.',
    '[*] Active Defenses: ptrace(PTRACE_TRACEME) detection & INT 3 CRC32 verification.',
    '[*] Neutralize anti-debugging defenses to trace the polymorphic mutation cycles.'
  ]);
  const [keystreamPreview, setKeystreamPreview] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const handleStepMutation = () => {
    sound.playClick();
    const newLogs = [...vmLogs];

    if (!bypassPtrace) {
      sound.playError();
      newLogs.push('[-] Anti-Debug Trap: ptrace() returned -1 (Debugger attached). Implant called exit(137).');
      setVmLogs(newLogs);
      return;
    }

    if (!bypassChecksum) {
      sound.playError();
      newLogs.push('[-] Integrity Failure: Software breakpoint / hook modified code bytes. CRC32 mismatch.');
      setVmLogs(newLogs);
      return;
    }

    sound.playSuccess();
    newLogs.push(`[+] Anti-debugging bypassed cleanly.`);
    newLogs.push(`[+] Executing ${cyclesToRun} polymorphic mutation cycles...`);
    newLogs.push(`[+] Page at 0x00405000 modified via rolling PRNG: K_{i+1} = (K_i * 0x5DEECE66D + 0xB) & 0xFF`);

    if (cyclesToRun >= 48) {
      newLogs.push('[+] Reached Stage 3 Decryption Point (cycle 48).');
      newLogs.push('[+] Dynamic routine unlocked: compares input with decrypted hash: "SHADOW_REIGN_99"');
      setKeystreamPreview('Decoded validation target string: "SHADOW_REIGN_99"');
    } else {
      newLogs.push(`[+] Cycles ran: ${cyclesToRun}. Need at least 48 mutation cycles to reach final validation routine.`);
      setKeystreamPreview('Intermediate page state: 0x88 0x1F 0x4B 0x92 (Incomplete mutation)');
    }

    setVmLogs(newLogs);
  };

  const handleVerifyPasscode = () => {
    sound.playClick();
    if (candidatePasscode.trim() === CORRECT_PASSCODE) {
      sound.playSuccess();
      setStatus(`SUCCESS! Dynamic passkey verified. Flag: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setStatus('ERROR: Verification failed. The payload self-terminated.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Polymorphic Self-Modifying Code Decompiler</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            NIGHTMARE DIFFICULTY // 620 PTS
          </span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
          {vmLogs.map((l, i) => (
            <div key={i} className={l.includes('Dynamic routine unlocked') ? 'text-emerald-400 font-bold' : l.includes('[-]') ? 'text-rose-400' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Anti-Debug Patching Controls */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs">Dynamic Binary Instrumentation Configuration</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-2.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={bypassPtrace}
              onChange={e => setBypassPtrace(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500"
            />
            <span className="text-slate-300 text-xs">Patch ptrace() Return = 0</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={bypassChecksum}
              onChange={e => setBypassChecksum(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500"
            />
            <span className="text-slate-300 text-xs">Bypass CRC32 Integrity Hook</span>
          </label>

          <div>
            <label className="text-slate-400 text-[11px]">Mutation Cycles to Emulate:</label>
            <input
              type="number"
              value={cyclesToRun}
              onChange={e => setCyclesToRun(parseInt(e.target.value, 10) || 0)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. 48"
            />
          </div>
        </div>

        <button
          onClick={handleStepMutation}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
        >
          <Play className="w-4 h-4" />
          <span>Execute Emulation & Unroll Polymorphic Routines</span>
        </button>

        {keystreamPreview && (
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-amber-300 text-xs">
            {keystreamPreview}
          </div>
        )}
      </div>

      {/* Verification */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs">Submit Decrypted Validation Passkey</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={candidatePasscode}
            onChange={e => setCandidatePasscode(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="Enter passkey derived from cycle 48 routine..."
          />
          <button
            onClick={handleVerifyPasscode}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Verify Passkey
          </button>
        </div>

        {status && (
          <div className={`p-3 rounded-lg border text-xs ${status.startsWith('SUCCESS') ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
