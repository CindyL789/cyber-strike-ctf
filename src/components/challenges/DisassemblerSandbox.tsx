import React, { useState } from 'react';
import { Cpu, Play, StepForward, RotateCcw, CheckCircle2, Copy, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

interface Instruction {
  address: string;
  opcode: string;
  mnemonic: string;
  comment: string;
}

const INSTRUCTIONS: Instruction[] = [
  { address: '0x00401000', opcode: '8B 45 08', mnemonic: 'MOV EAX, [ebp+serial]', comment: 'Load user serial into accumulator' },
  { address: '0x00401003', opcode: '35 5A 00', mnemonic: 'XOR EAX, 0x005A', comment: 'Mask with byte key 0x5A (90)' },
  { address: '0x00401006', opcode: 'C1 C0 03', mnemonic: 'ROL EAX, 3', comment: 'Bitwise rotate left by 3 bits' },
  { address: '0x00401009', opcode: '05 37 13', mnemonic: 'ADD EAX, 0x1337', comment: 'Add constant offset 0x1337 (4919)' },
  { address: '0x0040100C', opcode: '3D B2 D4', mnemonic: 'CMP EAX, 0xD4B2', comment: 'Compare against target 0xD4B2 (54450)' },
  { address: '0x0040100F', opcode: '74 08', mnemonic: 'JE 0x00401019', comment: 'Jump if equal (Valid serial)' },
  { address: '0x00401011', opcode: 'B8 00 00', mnemonic: 'MOV EAX, 0', comment: 'Return 0 (Access Denied)' },
  { address: '0x00401016', opcode: 'C3', mnemonic: 'RET', comment: 'Exit function' },
  { address: '0x00401019', opcode: 'B8 01 00', mnemonic: 'MOV EAX, 1', comment: 'Return 1 (License Validated)' },
  { address: '0x0040101E', opcode: 'C3', mnemonic: 'RET', comment: 'Emit secret flag' }
];

const TARGET_SERIAL = 30837; // 0x7875 -> XOR 0x5A = 0x782F -> ROL 3 = 0xC17B -> + 0x1337 = 0xD4B2
const FLAG = 'flag{r3v_4ss3mbly_cr4ckm3_pwn3d_334}';

export const DisassemblerSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [serialInput, setSerialInput] = useState<string>('12345');
  const [pc, setPc] = useState<number>(0);
  const [eax, setEax] = useState<number>(0);
  const [zf, setZf] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'valid' | 'invalid'>('idle');

  // Helper for 16-bit rotate left
  const rol16 = (val: number, bits: number) => {
    const v = val & 0xffff;
    return ((v << bits) | (v >>> (16 - bits))) & 0xffff;
  };

  const handleReset = () => {
    sound.playClick();
    setPc(0);
    setEax(0);
    setZf(false);
    setStatus('idle');
  };

  const handleStep = () => {
    sound.playClick();
    const serial = parseInt(serialInput.trim(), 10) || 0;

    if (pc === 0) {
      setEax(serial & 0xffff);
      setPc(1);
    } else if (pc === 1) {
      setEax(prev => (prev ^ 0x005a) & 0xffff);
      setPc(2);
    } else if (pc === 2) {
      setEax(prev => rol16(prev, 3));
      setPc(3);
    } else if (pc === 3) {
      setEax(prev => (prev + 0x1337) & 0xffff);
      setPc(4);
    } else if (pc === 4) {
      // CMP EAX, 0xD4B2
      const isEq = eax === 0xd4b2;
      setZf(isEq);
      setPc(5);
    } else if (pc === 5) {
      // JE
      if (zf) {
        setPc(8); // jump to valid
        setStatus('valid');
        sound.playSuccess();
        if (onFlagFound) onFlagFound(FLAG);
      } else {
        setPc(6); // fail path
        setStatus('invalid');
        sound.playError();
      }
    } else if (pc >= 6) {
      // Finished
    }
  };

  const handleRunAll = () => {
    sound.playClick();
    const serial = parseInt(serialInput.trim(), 10) || 0;
    const step1 = (serial ^ 0x005a) & 0xffff;
    const step2 = rol16(step1, 3);
    const step3 = (step2 + 0x1337) & 0xffff;
    const match = step3 === 0xd4b2;

    setEax(step3);
    setZf(match);

    if (match) {
      setPc(8);
      setStatus('valid');
      sound.playSuccess();
      if (onFlagFound) onFlagFound(FLAG);
    } else {
      setPc(6);
      setStatus('invalid');
      sound.playError();
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Ghidra / x86 Virtual CPU Disassembly Engine</div>
          <div className="text-xs text-slate-400">
            Target Binary: <code className="text-emerald-300 font-mono">verify_license.elf</code> · Arch: x86_64 stripped
          </div>
        </div>
      </div>

      {/* Control & Serial Input Bar */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Serial Input:</span>
          <input
            type="text"
            value={serialInput}
            onChange={e => {
              setSerialInput(e.target.value);
              setStatus('idle');
            }}
            placeholder="Key (e.g. 30837)"
            className="w-36 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => {
              setSerialInput(TARGET_SERIAL.toString());
              setStatus('idle');
              sound.playClick();
            }}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
          >
            Insert Solved Key
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStep}
            disabled={pc >= 8 || pc === 7}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Step (F7)</span>
          </button>
          <button
            onClick={handleRunAll}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute (F9)</span>
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assembly Disassembly Listing */}
        <div className="lg:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Disassembly Listing</span>
            <span className="text-slate-500 font-mono text-[11px]">.text section</span>
          </div>

          <div className="space-y-1 font-mono text-xs overflow-x-auto">
            {INSTRUCTIONS.map((inst, idx) => {
              const isCurrent = pc === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-1.5 rounded transition-colors ${
                    isCurrent
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <span className="w-4 text-emerald-400 text-center font-bold">
                    {isCurrent ? '▶' : ''}
                  </span>
                  <span className="text-slate-500 text-[11px] w-20">{inst.address}</span>
                  <span className="text-slate-500 text-[11px] w-18">{inst.opcode}</span>
                  <span className={`w-40 font-semibold ${isCurrent ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {inst.mnemonic}
                  </span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">// {inst.comment}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registers & Status */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">Virtual Registers</span>
              <span className="text-slate-500 font-mono text-[11px]">16-bit / 32-bit</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">EAX:</span>
                <span className="text-emerald-300 font-bold">
                  0x{eax.toString(16).toUpperCase().padStart(4, '0')} ({eax})
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">TARGET:</span>
                <span className="text-amber-400 font-bold">0xD4B2 (54450)</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">FLAGS.ZF:</span>
                <span className={zf ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {zf ? '1 (Equal)' : '0 (Not Equal)'}
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">STATUS:</span>
                <span
                  className={
                    status === 'valid'
                      ? 'text-emerald-400 font-bold'
                      : status === 'invalid'
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {status === 'valid' ? 'VALIDATED' : status === 'invalid' ? 'ACCESS DENIED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {status === 'valid' && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Crackme Defeated!</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-emerald-800/40 font-mono text-[11px]">
                <code className="text-emerald-300 select-all">{FLAG}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(FLAG);
                    sound.playClick();
                  }}
                  className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px]"
                >
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
