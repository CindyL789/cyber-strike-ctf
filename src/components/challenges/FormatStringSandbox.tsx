import React, { useState } from 'react';
import { Terminal, Shield, Play, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Code, Eye, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const FormatStringSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const FLAG = 'flag{fmt_str_4rb1tr4ry_wr1t3_st4ck_h4ck_672}';
  const TARGET_ADDRESS = '0x0804C028';
  const TARGET_VAL_DEC = 4919; // 0x1337
  const TARGET_VAL_HEX = '0x00001337';

  const [inputPayload, setInputPayload] = useState<string>('%p.%p.%p.%p.%p.%p.%p');
  const [authLevel, setAuthLevel] = useState<number>(0);
  const [outputTerminal, setOutputTerminal] = useState<string[]>([]);
  const [isExploited, setIsExploited] = useState<boolean>(false);

  // Stack snapshot (Offsets 1 to 8)
  const STACK_FRAMES = [
    { offset: 1, address: '0xFFFFD120', value: '0x08048600', name: 'Saved EBP' },
    { offset: 2, address: '0xFFFFD124', value: '0xF7E20B25', name: '__libc_start_main' },
    { offset: 3, address: '0xFFFFD128', value: '0x00000001', name: 'argc' },
    { offset: 4, address: '0xFFFFD12C', value: '0xFFFFD280', name: 'argv' },
    { offset: 5, address: '0xFFFFD130', value: '0x00000000', name: 'NULL envp' },
    { offset: 6, address: '0xFFFFD134', value: '0x41414141', name: 'padding' },
    { offset: 7, address: '0xFFFFD138', value: 'user_buffer', name: 'user_buf[0..3]' },
    { offset: 8, address: '0xFFFFD13C', value: 'user_buffer+4', name: 'user_buf[4..7]' }
  ];

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const raw = inputPayload.trim();
    const newLogs: string[] = [];
    newLogs.push(`[EXEC] ./diagnostics_service <<< "${raw}"`);

    // Check for leak payloads: e.g. %p, %x
    if (raw.includes('%p') || raw.includes('%x')) {
      const leakedValues = [
        '0x8048600',
        '0xf7e20b25',
        '0x1',
        '0xffffd280',
        '(nil)',
        '0x41414141',
        // Offset 7 reveals beginning of user_buffer
        raw.startsWith('\\x28\\xc0\\x04\\x08') || raw.startsWith('0x0804C028')
          ? '0x804c028'
          : '0x70252e70' // ASCII hex for "%p.%p"
      ];

      // Render output with leaked values
      let simulatedOutput = raw;
      simulatedOutput = simulatedOutput.replace(/%p/g, () => leakedValues[Math.floor(Math.random() * 3)] || '0xffffd100');
      newLogs.push(`[STDOUT] ${simulatedOutput}`);
      newLogs.push(`[ANALYSIS] Stack parameter #7 points directly to user input buffer!`);
    }

    // Check for %n arbitrary write payload:
    // e.g. \x28\xc0\x04\x08%4915c%7$n or 0x0804C028%4915c%7$n
    const hasAddress = raw.includes('\\x28\\xc0\\x04\\x08') || raw.includes('0x0804c028') || raw.includes('%7$n');
    const hasWriteModifier = raw.includes('%7$n') || raw.includes('%n');

    if (hasWriteModifier && (raw.includes('4915') || raw.includes('4919') || raw.includes('1337'))) {
      setAuthLevel(4919);
      setIsExploited(true);
      newLogs.push(`[STDOUT] <...4915 bytes of padding emitted...>`);
      newLogs.push(`[WRITE EVENT] %n write triggered: wrote 4919 bytes (0x1337) into memory address 0x0804C028.`);
      newLogs.push(`[MEMORY] target_auth_level updated: 0x00000000 -> 0x00001337.`);
      newLogs.push(`[AUTH] Condition matched: (target_auth_level == 0x1337). Dropping privileged root shell.`);
      newLogs.push(`[ROOT SHELL] uid=0(root) gid=0(root) groups=0(root)`);
      newLogs.push(`[ROOT SHELL] cat /root/flag.txt -> ${FLAG}`);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    } else if (hasWriteModifier) {
      // Wrote arbitrary number of bytes
      const bytesWritten = Math.min(raw.length * 4, 256);
      setAuthLevel(bytesWritten);
      newLogs.push(`[WRITE EVENT] %n write triggered: wrote ${bytesWritten} bytes into target memory.`);
      newLogs.push(`[MEMORY] target_auth_level is now 0x${bytesWritten.toString(16).padStart(8, '0')}. (Required: 0x00001337)`);
      sound.playError();
    }

    setOutputTerminal(newLogs);
  };

  const handlePresetLeak = () => {
    setInputPayload('AAAA.%p.%p.%p.%p.%p.%p.%p.%p');
    sound.playClick();
  };

  const handlePresetExploit = () => {
    // 4 bytes address + 4915 chars = 4919 chars = 0x1337
    setInputPayload('\\x28\\xc0\\x04\\x08%4915c%7$n');
    sound.playClick();
  };

  const handleReset = () => {
    sound.playClick();
    setAuthLevel(0);
    setIsExploited(false);
    setInputPayload('%p.%p.%p.%p.%p.%p.%p');
    setOutputTerminal([]);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header Info */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono font-semibold text-rose-400">
            <Flame className="w-4 h-4" />
            <span>Target: Unsafe Format String Service (x86 32-bit ELF)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The daemon calls <code className="text-rose-300 font-mono">printf(user_buffer)</code> without format specifiers. Use format string operators (<code className="text-cyan-300">%p</code> to leak stack pointers, <code className="text-amber-300">%n</code> to write count of printed bytes) to overwrite <code className="text-emerald-400">target_auth_level</code> at address <code className="text-amber-300">0x0804C028</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Exploit Status:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-semibold border ${
              isExploited
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isExploited ? 'PWNED (ROOT)' : 'UNPRIVILEGED'}
          </span>
        </div>
      </div>

      {/* Target Memory & Stack Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monitored Memory Watch */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Memory Watch</span>
          </h4>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Variable:</span>
              <span className="text-slate-200">target_auth_level</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Address:</span>
              <span className="text-cyan-300">{TARGET_ADDRESS}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Required:</span>
              <span className="text-emerald-400 font-bold">{TARGET_VAL_HEX} (4919)</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Current Value:</span>
              <span
                className={`font-bold text-sm ${
                  authLevel === TARGET_VAL_DEC ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                0x{authLevel.toString(16).padStart(8, '0')} ({authLevel})
              </span>
            </div>
          </div>

          {/* Success Flag Display */}
          {isExploited && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded space-y-1">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Root Flag Captured:</span>
              </div>
              <div className="font-mono text-xs text-emerald-300 break-all select-all font-semibold">
                {FLAG}
              </div>
            </div>
          )}
        </div>

        {/* Stack Frames (Offsets 1 to 8) */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>x86 Stack Frames (printf argument lookup)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Calling Convention: cdecl 32-bit</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {STACK_FRAMES.map(f => (
              <div
                key={f.offset}
                className={`p-2 rounded border ${
                  f.offset === 7
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Offset #{f.offset}</span>
                  {f.offset === 7 && <span className="text-amber-400 font-bold">TARGET ARG</span>}
                </div>
                <div className="text-[11px] font-bold text-slate-200">{f.address}</div>
                <div className="text-[10px] text-cyan-300 truncate">{f.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Payload & Presets */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>Format String Input Payload</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePresetLeak}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Preset: Leak Stack (%p)
            </button>
            <button
              onClick={handlePresetExploit}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors"
            >
              Preset: Arbitrary Write (%7$n)
            </button>
          </div>
        </div>

        <form onSubmit={handleExecute} className="flex gap-2">
          <input
            type="text"
            value={inputPayload}
            onChange={e => setInputPayload(e.target.value)}
            placeholder="e.g. \x28\xc0\x04\x08%4915c%7$n"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Send Exploit</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Terminal Wire */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Process IO Stream</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">GDB Telemetry</span>
        </div>

        <div className="bg-black/80 rounded p-3 font-mono text-xs space-y-1 h-32 overflow-y-auto border border-slate-800/80">
          {outputTerminal.length === 0 ? (
            <div className="text-slate-600 italic">No payload delivered yet. Send exploit to inspect process output.</div>
          ) : (
            outputTerminal.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('ROOT SHELL') || log.includes('Condition matched')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('WRITE EVENT')
                    ? 'text-amber-300'
                    : log.includes('ANALYSIS')
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
