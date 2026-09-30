import React, { useState } from 'react';
import { Terminal, Cpu, Play, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const CORRECT_KEY = 'K8-7X9P!';
const SECRET_FLAG = 'flag{vm_byt3c0d3_d1s4ss3mbl3r_pwn3d_491}';

export const CustomVmSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [candidateKey, setCandidateKey] = useState<string>('');
  const [pc, setPc] = useState<number>(0);
  const [registers, setRegisters] = useState<{ R0: number; R1: number; R2: number; R3: number }>({
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0
  });
  const [executionLog, setExecutionLog] = useState<string[]>([
    '[*] Enigma VM v4.1 Initialized. Instruction Pointer PC = 0x00',
    '[*] Analyze the bytecode instructions below, reverse the algebraic constraints on each byte,',
    '[*] and input the valid 8-byte serial passkey to trigger UNLOCK_VAULT.'
  ]);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const bytecodeInstructions = [
    { addr: '0x00', hex: '10 00', asm: 'LOAD R0, [INPUT + 0]', note: 'Load byte 0 into register R0' },
    { addr: '0x02', hex: '22 42', asm: 'XOR  R0, 0x42', note: 'Constraint 1: R0 = R0 ^ 0x42' },
    { addr: '0x04', hex: '51 09', asm: 'CMP  R0, 0x09', note: 'Verify R0 == 0x09' },
    { addr: '0x06', hex: '60 1A', asm: 'JNZ  HALT_FAIL', note: 'Abort if mismatch' },
    { addr: '0x08', hex: '10 01', asm: 'LOAD R1, [INPUT + 1]', note: 'Load byte 1 into register R1' },
    { addr: '0x0A', hex: '35 02', asm: 'ROR  R1, 2', note: 'Constraint 2: R1 = R1 >>> 2' },
    { addr: '0x0C', hex: '51 8E', asm: 'CMP  R1, 0x8E', note: 'Verify R1 == 0x8E' },
    { addr: '0x0E', hex: '60 1A', asm: 'JNZ  HALT_FAIL', note: 'Abort if mismatch' },
    { addr: '0x10', hex: '10 03', asm: 'LOAD R2, [INPUT + 3]', note: 'Load byte 3 into register R2' },
    { addr: '0x12', hex: '48 13', asm: 'ADD  R2, 0x13', note: 'Constraint 3: R2 = (R2 + 0x13) & 0xFF' },
    { addr: '0x14', hex: '51 4A', asm: 'CMP  R2, 0x4A', note: 'Verify R2 == 0x4A' },
    { addr: '0x16', hex: '60 1A', asm: 'JNZ  HALT_FAIL', note: 'Abort if mismatch' },
    { addr: '0x18', hex: '77 00', asm: 'UNLOCK_VAULT', note: 'Trigger Flag Release!' },
    { addr: '0x1A', hex: 'FF FF', asm: 'HALT_FAIL', note: 'Key invalid, exit status -1' }
  ];

  const runVm = () => {
    sound.playClick();
    const key = candidateKey.trim();

    if (key === CORRECT_KEY) {
      sound.playSuccess();
      setRegisters({ R0: 0x09, R1: 0x8E, R2: 0x4A, R3: 0xFF });
      setPc(0x18);
      setIsUnlocked(true);
      setExecutionLog(prev => [
        `[>] Candidate Key: "${key}"`,
        '[+] 0x00: LOAD R0, \'K\' (0x4B)',
        '[+] 0x02: XOR R0, 0x42 => 0x09 (MATCH)',
        '[+] 0x08: LOAD R1, \'8\' (0x38)',
        '[+] 0x0A: ROR R1, 2 => 0x8E (MATCH)',
        '[+] 0x10: LOAD R2, \'7\' (0x37)',
        '[+] 0x12: ADD R2, 0x13 => 0x4A (MATCH)',
        '[+] 0x18: UNLOCK_VAULT reached! Flag released.'
      ]);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setPc(0x1A);
      setIsUnlocked(false);
      setExecutionLog(prev => [
        `[>] Candidate Key: "${key}"`,
        `[-] PC halted at 0x1A: Condition comparison mismatch for key byte.`
      ]);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* VM Architecture Header */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Enigma-8 Bytecode Virtual Machine</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            x86 Emulation Mode
          </span>
        </div>

        {/* Virtual CPU Registers */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500">PC:</span>{' '}
            <span className="font-bold text-amber-400">0x{pc.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500">R0:</span>{' '}
            <span className="font-bold text-slate-200">0x{registers.R0.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500">R1:</span>{' '}
            <span className="font-bold text-slate-200">0x{registers.R1.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500">R2:</span>{' '}
            <span className="font-bold text-slate-200">0x{registers.R2.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-500">VAULT:</span>{' '}
            <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
              {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
        </div>
      </div>

      {/* Disassembly View */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Reconstructed VM Bytecode Disassembly:
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {bytecodeInstructions.map((inst, i) => (
            <div
              key={i}
              className={`p-1.5 rounded flex items-center justify-between text-[11px] ${
                pc.toString(16).padStart(2, '0').toUpperCase() === inst.addr.slice(2)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{inst.addr}</span>
                <span className="text-indigo-400 w-16">{inst.hex}</span>
                <span className="font-bold text-slate-200">{inst.asm}</span>
              </div>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline">{inst.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Serial Passkey Input & Runner */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <label className="text-slate-300 font-bold text-xs flex items-center justify-between">
          <span>Candidate 8-Byte Serial Input:</span>
          <span className="text-[11px] text-slate-500">Format: K8-7X9P!</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={candidateKey}
            onChange={e => setCandidateKey(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            placeholder="Enter key to execute VM..."
          />
          <button
            onClick={runVm}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute VM</span>
          </button>
        </div>

        {/* Execution Log Console */}
        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 text-[11px] max-h-32 overflow-y-auto">
          {executionLog.map((log, i) => (
            <div key={i} className="text-slate-300">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
