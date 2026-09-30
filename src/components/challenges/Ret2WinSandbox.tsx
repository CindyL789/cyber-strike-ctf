import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{r0p_ch41n_r3t2w1n_st4ck_sm4sh_8831}';

export const Ret2WinSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [paddingLen, setPaddingLen] = useState<number>(0);
  const [useRetGadget, setUseRetGadget] = useState<boolean>(false);
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[*] 64-bit ELF Binary: stack_vanguard',
    '[*] Vulnerable function vuln() allocates 64-byte stack buffer.',
    '[*] win() function address located at: 0x401196',
    '[*] Notice: GLIBC Ubuntu x86_64 requires 16-byte stack alignment prior to system().'
  ]);

  const handlePwn = () => {
    sound.playClick();
    const newLogs = [...terminalLogs];
    newLogs.push(`[>] Sending payload: ${paddingLen} bytes padding + ${useRetGadget ? '0x40101a (ret) + ' : ''}${targetAddress}`);

    if (paddingLen === 72 && targetAddress === '0x401196') {
      if (!useRetGadget) {
        sound.playError();
        newLogs.push('[-] Process received SIGSEGV! Stack pointer RSP was not 16-byte aligned before movaps call.');
        newLogs.push('[-] HINT: Prepend a dummy standalone "ret" gadget (0x40101a) to satisfy stack alignment!');
      } else {
        sound.playSuccess();
        newLogs.push('[+] Saved RIP successfully redirected to win() with 16-byte aligned RSP!');
        newLogs.push(`[+] ROOT SHELL SPAWNED! Flag: ${SECRET_FLAG}`);
        onFlagFound(SECRET_FLAG);
      }
    } else {
      sound.playError();
      newLogs.push('[-] Segmentation fault: Saved RIP corrupted with invalid memory address.');
    }

    setTerminalLogs(newLogs);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-white text-sm">64-Bit x86_64 ROP Stack Frame Constructor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Buffer to RIP Offset:</label>
            <input
              type="number"
              value={paddingLen}
              onChange={e => setPaddingLen(parseInt(e.target.value, 10))}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 text-[11px]">Target win() Address:</label>
            <input
              type="text"
              value={targetAddress}
              onChange={e => setTargetAddress(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="retGadget"
              checked={useRetGadget}
              onChange={e => setUseRetGadget(e.target.checked)}
              className="accent-emerald-500 w-4 h-4"
            />
            <label htmlFor="retGadget" className="text-slate-300 text-xs cursor-pointer">
              Stack Alignment Gadget (ret)
            </label>
          </div>
        </div>

        <button
          onClick={handlePwn}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
        >
          Dispatch ROP Payload
        </button>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 text-[11px] max-h-48 overflow-y-auto">
          {terminalLogs.map((l, i) => (
            <div key={i} className={l.includes('ROOT SHELL') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
