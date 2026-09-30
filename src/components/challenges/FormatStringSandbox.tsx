import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Shield, AlertTriangle, Cpu } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const TARGET_ADDR = '0x0804C028';
const REQUIRED_VALUE = 0x1337; // 4919
const SECRET_FLAG = 'flag{fmt_str_4rb1tr4ry_wr1t3_st4ck_h4ck_672}';

export const FormatStringSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [payload, setPayload] = useState<string>('%p.%p.%p.%p.%p.%p.%p');
  const [currentAuthVal, setCurrentAuthVal] = useState<number>(0x0000);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    '[*] Diagnostic Echo Daemon (x86 ELF 32-bit)',
    '[*] target_auth_level located at 0x0804C028: current value = 0x0000',
    '[*] Enter test format string payload to execute printf(buf)...'
  ]);
  const [isPwned, setIsPwned] = useState<boolean>(false);

  const handleSend = () => {
    sound.playClick();
    const p = payload.trim();
    const newLogs = [...consoleOutput, `[USER INPUT]: ${p}`];

    // Check for %p stack leak
    if (p.includes('%p')) {
      const leaks = [
        '0xffe48120',
        '0x08049182',
        '0xf7de1200',
        '0x00000001',
        '0xffe48134',
        '0x00000000',
        '0x78252e70' // parameter 7 reflects user input buffer!
      ];
      newLogs.push(`[PRINTF OUTPUT]: ${leaks.join('.')}`);
      newLogs.push('[ANALYSIS]: Parameter at offset 7 reflects the start of your user buffer!');
    } else if (p.includes('%n') || p.includes('$n')) {
      // Check for arbitrary write
      if (p.includes('08%4915c%7$n') || p.includes('28\\xc0\\x04\\x08%4915c%7$n') || p.includes('4919')) {
        sound.playSuccess();
        setCurrentAuthVal(REQUIRED_VALUE);
        setIsPwned(true);
        newLogs.push('[PRINTF OUTPUT]: (4919 characters printed to stdout stream...)');
        newLogs.push('[*] %n write triggered at target offset 7 -> address 0x0804C028');
        newLogs.push('[+] target_auth_level overwritten with: 0x1337 (4919)!');
        newLogs.push(`[+] PRIVILEGE ESCALATION ACHIEVED: ${SECRET_FLAG}`);
        onFlagFound(SECRET_FLAG);
      } else {
        sound.playError();
        newLogs.push('[PRINTF OUTPUT]: (Output printed, but target value did not reach 0x1337)');
      }
    } else {
      newLogs.push(`[PRINTF OUTPUT]: ${p}`);
    }

    setConsoleOutput(newLogs);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Memory Target Status */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-white text-sm">Target Process Memory State (.bss)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            x86 32-bit Stack Frame
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500 text-[10px] uppercase">Variable Symbol:</span>
            <div className="font-bold text-slate-200">target_auth_level</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500 text-[10px] uppercase">Memory Address:</span>
            <div className="font-bold text-amber-400 font-mono">{TARGET_ADDR}</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500 text-[10px] uppercase">Current Value:</span>
            <div className={`font-bold font-mono ${isPwned ? 'text-emerald-400' : 'text-slate-400'}`}>
              0x{currentAuthVal.toString(16).padStart(4, '0').toUpperCase()} {isPwned && '(ROOT GRANTED)'}
            </div>
          </div>
        </div>
      </div>

      {/* Input payload sender */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <label className="text-slate-300 font-bold text-xs flex items-center justify-between">
          <span>Format String Exploit Payload:</span>
          <span className="text-[11px] text-slate-500">printf(buf)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={payload}
            onChange={e => setPayload(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-rose-500"
            placeholder="Enter format string e.g. %p.%p or %n write..."
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to stdin</span>
          </button>
        </div>

        {/* Quick exploit presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
          <span className="text-slate-500">Presets:</span>
          <button
            onClick={() => setPayload('%p.%p.%p.%p.%p.%p.%p')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            Leak Stack Offsets (%p)
          </button>
          <button
            onClick={() => setPayload('\\x28\\xc0\\x04\\x08%4915c%7$n')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            Arbitrary %n Write (0x1337)
          </button>
        </div>
      </div>

      {/* Process Terminal Output */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Target Daemon Output Stream:
        </div>
        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 text-[11px] max-h-48 overflow-y-auto">
          {consoleOutput.map((line, i) => (
            <div
              key={i}
              className={
                line.includes('FLAG') || line.includes('PRIVILEGE')
                  ? 'text-emerald-400 font-bold'
                  : line.includes('USER INPUT')
                  ? 'text-indigo-300'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
