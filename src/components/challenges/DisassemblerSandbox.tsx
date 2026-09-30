import React, { useState } from 'react';
import { Terminal, Cpu, Play, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const CORRECT_DECIMAL = 30837; // 0x7875
const SECRET_FLAG = 'flag{r3v_4ss3mbly_cr4ckm3_pwn3d_334}';

export const DisassemblerSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [candidateKey, setCandidateKey] = useState<string>('');
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  const testKey = () => {
    sound.playClick();
    const val = parseInt(candidateKey.trim(), 10);

    if (val === CORRECT_DECIMAL) {
      sound.playSuccess();
      setResultMsg({
        success: true,
        text: `[+] KEY VALIDATED! 0xD4B2 match satisfied. Flag released: ${SECRET_FLAG}`
      });
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      const step1 = ((val ^ 0x5a) & 0xffff);
      const step2 = (((step1 << 3) | (step1 >>> 13)) & 0xffff);
      const finalVal = (step2 + 0x1337) & 0xffff;
      setResultMsg({
        success: false,
        text: `[-] Verification failed: Result was 0x${finalVal.toString(16).toUpperCase()}, expected 0xD4B2.`
      });
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Disassembled x86 Verification Routine</span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 text-slate-300">
          <div><span className="text-slate-500">0x00401180:</span> <span className="text-indigo-400">mov</span>  <span className="text-amber-300">eax, [esp+4]</span>  <span className="text-slate-500">; load candidate serial</span></div>
          <div><span className="text-slate-500">0x00401184:</span> <span className="text-indigo-400">xor</span>  <span className="text-amber-300">eax, 0x5A</span></div>
          <div><span className="text-slate-500">0x00401187:</span> <span className="text-indigo-400">rol</span>  <span className="text-amber-300">eax, 3</span></div>
          <div><span className="text-slate-500">0x0040118a:</span> <span className="text-indigo-400">add</span>  <span className="text-amber-300">eax, 0x1337</span></div>
          <div><span className="text-slate-500">0x0040118f:</span> <span className="text-indigo-400">cmp</span>  <span className="text-amber-300">eax, 0xD4B2</span>     <span className="text-slate-500">; compare with target</span></div>
          <div><span className="text-slate-500">0x00401194:</span> <span className="text-indigo-400">jne</span>  <span className="text-rose-400">fail_exit</span></div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <label className="text-slate-300 font-bold text-xs">Enter Reversed Decimal Passkey:</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={candidateKey}
            onChange={e => setCandidateKey(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="e.g. 30837"
          />
          <button
            onClick={testKey}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Validate Serial</span>
          </button>
        </div>

        {resultMsg && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              resultMsg.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {resultMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};
