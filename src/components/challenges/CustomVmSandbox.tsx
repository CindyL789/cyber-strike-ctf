import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Play, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Code, Key, StepForward } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

interface VmInstruction {
  pc: number;
  hex: string;
  mnemonic: string;
  comment: string;
}

export const CustomVmSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const FLAG = 'flag{vm_byt3c0d3_d1s4ss3mbl3r_pwn3d_491}';
  const VALID_KEY = 'K8-7X9P!';

  const [inputKey, setInputKey] = useState<string>('A1-00000');
  const [pc, setPc] = useState<number>(0);
  const [registers, setRegisters] = useState<{ [reg: string]: number }>({
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
    ZF: 0
  });
  const [stack, setStack] = useState<number[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isHalted, setIsHalted] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'disasm' | 'constraints'>('disasm');

  // Proprietary Bytecode instruction set
  const DISASSEMBLY: VmInstruction[] = [
    { pc: 0, hex: '20 00 00', mnemonic: 'LOAD R0, [KEY + 0]', comment: "Load byte 0 ('K' = 0x4B)" },
    { pc: 3, hex: '30 00 42', mnemonic: 'XOR R0, 0x42', comment: 'R0 ^= 0x42 (0x4B ^ 0x42 = 0x09)' },
    { pc: 6, hex: '40 00 09', mnemonic: 'CMP R0, 0x09', comment: 'Verify R0 == 0x09' },
    { pc: 9, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 11, hex: '20 01 01', mnemonic: 'LOAD R1, [KEY + 1]', comment: "Load byte 1 ('8' = 0x38)" },
    { pc: 14, hex: '32 01 02', mnemonic: 'ROR R1, 2', comment: 'Rotate right 2 bits (0x38 -> 0x8E)' },
    { pc: 17, hex: '40 01 8E', mnemonic: 'CMP R1, 0x8E', comment: 'Verify R1 == 0x8E' },
    { pc: 20, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 22, hex: '20 02 02', mnemonic: 'LOAD R2, [KEY + 2]', comment: "Load byte 2 ('-' = 0x2D)" },
    { pc: 25, hex: '40 02 2D', mnemonic: 'CMP R2, 0x2D', comment: "Verify delimiter is '-'" },
    { pc: 28, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 30, hex: '20 00 03', mnemonic: 'LOAD R0, [KEY + 3]', comment: "Load byte 3 ('7' = 0x37)" },
    { pc: 33, hex: '30 00 13', mnemonic: 'ADD R0, 0x13', comment: 'R0 += 0x13 (0x37 + 0x13 = 0x4A)' },
    { pc: 36, hex: '40 00 4A', mnemonic: 'CMP R0, 0x4A', comment: 'Verify R0 == 0x4A' },
    { pc: 39, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 41, hex: '20 01 04', mnemonic: 'LOAD R1, [KEY + 4]', comment: "Load byte 4 ('X' = 0x58)" },
    { pc: 44, hex: '30 01 55', mnemonic: 'XOR R1, 0x55', comment: 'R1 ^= 0x55 (0x58 ^ 0x55 = 0x0D)' },
    { pc: 47, hex: '40 01 0D', mnemonic: 'CMP R1, 0x0D', comment: 'Verify R1 == 0x0D' },
    { pc: 50, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 52, hex: '20 02 05', mnemonic: 'LOAD R2, [KEY + 5]', comment: "Load byte 5 ('9' = 0x39)" },
    { pc: 55, hex: '30 02 20', mnemonic: 'SUB R2, 0x20', comment: 'R2 -= 0x20 (0x39 - 0x20 = 0x19)' },
    { pc: 58, hex: '40 02 19', mnemonic: 'CMP R2, 0x19', comment: 'Verify R2 == 0x19' },
    { pc: 61, hex: '50 3C', mnemonic: 'JNZ 0x3C (FAIL)', comment: 'Branch to fail if ZF == 0' },

    { pc: 63, hex: '77 00', mnemonic: 'UNLOCK_VAULT', comment: 'ALL CHECKS PASSED -> DECRYPT FLAG' },
    { pc: 65, hex: 'AA', mnemonic: 'HALT (SUCCESS)', comment: 'Exit code 0' },
    { pc: 66, hex: 'EE 01', mnemonic: 'FAIL_ROUTINE', comment: 'Exit code 1 (ACCESS_DENIED)' }
  ];

  const handleStepInstruction = () => {
    sound.playClick();
    if (isHalted) return;

    const currentInstr = DISASSEMBLY.find(ins => ins.pc === pc);
    if (!currentInstr) {
      setIsHalted(true);
      return;
    }

    const newLogs = [...logs];
    newLogs.push(`[EXEC @ 0x${pc.toString(16).padStart(2, '0')}] ${currentInstr.mnemonic}`);

    // Execute VM logic
    if (currentInstr.mnemonic.startsWith('LOAD')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const idx = parseInt(currentInstr.mnemonic.match(/\+\s*(\d+)/)?.[1] || '0', 10);
      const charVal = inputKey.charCodeAt(idx) || 0;
      setRegisters(prev => ({ ...prev, [reg]: charVal }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('XOR')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const imm = parseInt(parts[2], 16);
      const result = (registers[reg] ^ imm) & 0xff;
      setRegisters(prev => ({ ...prev, [reg]: result }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('ROR')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const bits = parseInt(parts[2], 10);
      const val = registers[reg];
      const result = ((val >> bits) | (val << (8 - bits))) & 0xff;
      setRegisters(prev => ({ ...prev, [reg]: result }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('ADD')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const imm = parseInt(parts[2], 16);
      const result = (registers[reg] + imm) & 0xff;
      setRegisters(prev => ({ ...prev, [reg]: result }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('SUB')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const imm = parseInt(parts[2], 16);
      const result = (registers[reg] - imm) & 0xff;
      setRegisters(prev => ({ ...prev, [reg]: result }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('CMP')) {
      const parts = currentInstr.mnemonic.split(' ');
      const reg = parts[1].replace(',', '');
      const imm = parseInt(parts[2], 16);
      const zf = registers[reg] === imm ? 1 : 0;
      setRegisters(prev => ({ ...prev, ZF: zf }));
      setPc(pc + 3);
    } else if (currentInstr.mnemonic.startsWith('JNZ')) {
      if (registers.ZF === 0) {
        newLogs.push(`[BRANCH] ZF == 0 (Comparison Failed). Jumping to FAIL_ROUTINE.`);
        setPc(66);
        setIsHalted(true);
        sound.playError();
      } else {
        newLogs.push(`[BRANCH] ZF == 1 (Check Passed). Continuing sequence.`);
        setPc(pc + 2);
      }
    } else if (currentInstr.mnemonic.startsWith('UNLOCK_VAULT')) {
      newLogs.push(`[AUTH SUCCESS] All VM constraints satisfied! Vault unlocked.`);
      setIsSuccess(true);
      setIsHalted(true);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    } else if (currentInstr.mnemonic.startsWith('HALT') || currentInstr.mnemonic.startsWith('FAIL')) {
      setIsHalted(true);
    }

    setLogs(newLogs);
  };

  const handleRunToEnd = () => {
    sound.playClick();
    const cleanKey = inputKey.trim();

    if (cleanKey.startsWith('K8-7X9')) {
      setIsSuccess(true);
      setIsHalted(true);
      setPc(63);
      setRegisters({ R0: 0x4a, R1: 0x0d, R2: 0x19, R3: 0, ZF: 1 });
      setLogs([
        `[VM BOOT] Initializing bytecode engine with key: ${cleanKey}`,
        `[CONSTRAINT] Byte 0: 'K' ^ 0x42 == 0x09 -> PASS`,
        `[CONSTRAINT] Byte 1: '8' ROR 2 == 0x8E -> PASS`,
        `[CONSTRAINT] Byte 2: '-' == 0x2D -> PASS`,
        `[CONSTRAINT] Byte 3: '7' + 0x13 == 0x4A -> PASS`,
        `[CONSTRAINT] Byte 4: 'X' ^ 0x55 == 0x0D -> PASS`,
        `[CONSTRAINT] Byte 5: '9' - 0x20 == 0x19 -> PASS`,
        `[AUTH OK] UNLOCK_VAULT triggered! Secret decrypted.`
      ]);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    } else {
      setIsSuccess(false);
      setIsHalted(true);
      setPc(66);
      setLogs([
        `[VM BOOT] Initializing bytecode engine with key: ${cleanKey}`,
        `[VM ERROR] Key constraint check failed at instruction check.`,
        `[JNZ 0x3C] Branch taken -> Terminated with status 1 (FAIL).`
      ]);
      sound.playError();
    }
  };

  const handleResetVm = () => {
    sound.playClick();
    setPc(0);
    setRegisters({ R0: 0, R1: 0, R2: 0, R3: 0, ZF: 0 });
    setStack([]);
    setLogs([]);
    setIsHalted(false);
    setIsSuccess(false);
  };

  const handleAutoSolveKey = () => {
    sound.playClick();
    setInputKey(VALID_KEY);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header Info */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono font-semibold text-indigo-400">
            <Cpu className="w-4 h-4" />
            <span>Target: EnigmaCore Proprietary Bytecode Virtual Machine</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The target binary does not use native x86/ARM instructions. It compiles validation constraints into custom bytecode executed by an internal stack/register VM interpreter. Reverse the instruction sequence to discover the valid licensing key.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">VM State:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-semibold border ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isHalted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
            }`}
          >
            {isSuccess ? 'UNLOCKED' : isHalted ? 'HALTED (FAIL)' : 'READY / STEPPING'}
          </span>
        </div>
      </div>

      {/* Input Key & Debugger Controls */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>License Serial Key Parameter (8 ASCII Bytes)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoSolveKey}
              className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 transition-colors"
            >
              Fill Solved Key: {VALID_KEY}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputKey}
            maxLength={12}
            onChange={e => setInputKey(e.target.value)}
            placeholder="Enter license key..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-indigo-300 tracking-wider focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleStepInstruction}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>
          <button
            onClick={handleRunToEnd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run VM</span>
          </button>
          <button
            onClick={handleResetVm}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Reset VM"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Disassembler & Virtual Register Bank */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Virtual CPU Register Bank */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Virtual Registers & Flags</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(registers).map(([reg, val]) => (
              <div key={reg} className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                <span className="text-slate-400">{reg}:</span>
                <span className="text-cyan-300 font-bold">
                  0x{val.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>
            ))}
            <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between col-span-2">
              <span className="text-slate-400">PC (Program Counter):</span>
              <span className="text-amber-300 font-bold">
                0x{pc.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Success Flag Display */}
          {isSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded space-y-1">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Flag Decrypted:</span>
              </div>
              <div className="font-mono text-xs text-emerald-300 break-all select-all font-semibold">
                {FLAG}
              </div>
            </div>
          )}
        </div>

        {/* Bytecode Disassembly Stream */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('disasm')}
                className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'disasm' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Disassembled Bytecode
              </button>
              <button
                onClick={() => setActiveTab('constraints')}
                className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'constraints' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Algebraic Constraints
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Architecture: 8-bit Custom RISC</span>
          </div>

          {activeTab === 'disasm' ? (
            <div className="bg-black/90 rounded p-2.5 font-mono text-xs space-y-1 h-56 overflow-y-auto border border-slate-800">
              {DISASSEMBLY.map(ins => {
                const isCurrent = ins.pc === pc;
                return (
                  <div
                    key={ins.pc}
                    className={`flex items-center gap-3 px-2 py-0.5 rounded transition-colors ${
                      isCurrent
                        ? 'bg-indigo-950 text-indigo-200 border-l-2 border-indigo-400'
                        : 'text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="text-slate-600 w-10">0x{ins.pc.toString(16).padStart(2, '0')}:</span>
                    <span className="text-slate-500 w-16 text-[11px]">{ins.hex}</span>
                    <span className={`w-40 font-semibold ${isCurrent ? 'text-amber-300' : 'text-slate-200'}`}>
                      {ins.mnemonic}
                    </span>
                    <span className="text-slate-600 text-[11px] italic truncate">{ins.comment}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded p-3 font-mono text-xs space-y-2 h-56 overflow-y-auto border border-slate-800 text-slate-300">
              <div className="text-cyan-400 font-bold mb-1">// Reconstructed Constraint Equations:</div>
              <div>• Byte 0: <code className="text-amber-300">Key[0] ^ 0x42 == 0x09</code> → <span className="text-emerald-400">Key[0] = 0x09 ^ 0x42 = 0x4B ('K')</span></div>
              <div>• Byte 1: <code className="text-amber-300">Key[1] &gt;&gt;&gt; 2 == 0x8E</code> → <span className="text-emerald-400">Key[1] = 0x8E &lt;&lt;&lt; 2 = 0x38 ('8')</span></div>
              <div>• Byte 2: <code className="text-amber-300">Key[2] == 0x2D</code> → <span className="text-emerald-400">Key[2] = '-'</span></div>
              <div>• Byte 3: <code className="text-amber-300">Key[3] + 0x13 == 0x4A</code> → <span className="text-emerald-400">Key[3] = 0x4A - 0x13 = 0x37 ('7')</span></div>
              <div>• Byte 4: <code className="text-amber-300">Key[4] ^ 0x55 == 0x0D</code> → <span className="text-emerald-400">Key[4] = 0x0D ^ 0x55 = 0x58 ('X')</span></div>
              <div>• Byte 5: <code className="text-amber-300">Key[5] - 0x20 == 0x19</code> → <span className="text-emerald-400">Key[5] = 0x19 + 0x20 = 0x39 ('9')</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Log */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>VM Execution Log Trace</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Cycle Count: {logs.length}</span>
        </div>

        <div className="bg-black/80 rounded p-3 font-mono text-xs space-y-1 h-24 overflow-y-auto border border-slate-800/80">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Press "Step" or "Run VM" to execute bytecode stream.</div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('SUCCESS') || log.includes('PASS')
                    ? 'text-emerald-400'
                    : log.includes('FAIL') || log.includes('ERROR')
                    ? 'text-rose-400'
                    : 'text-slate-300'
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
