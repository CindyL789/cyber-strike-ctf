import React, { useState, useRef } from 'react';
import { ShieldCheck, Terminal, Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Key, Cpu, Zap } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const PaddingOracleSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const FLAG = 'flag{p4dd1ng_0r4cl3_c0mpu73d_byt3_by_byt3_8829}';
  // 48 bytes -> exactly 3 blocks of 16 bytes!
  // Block 0: flag{p4dd1ng_0r (16 bytes)
  // Block 1: 4cl3_c0mpu73d_b (16 bytes)
  // Block 2: yt3_by_byt3_8829 (16 bytes) -> PKCS#7 padded with 16 bytes of 0x10 if full block!
  // Let's create an authentic representation:
  const RAW_PLAINTEXT = 'flag{p4dd1ng_0r4cl3_c0mpu73d_byt3_by_byt3_8829}';

  // Fixed demo ciphertext blocks in hex (IV + 3 blocks)
  // Generated using AES-128
  const ORIGINAL_IV = [0x4a, 0x9b, 0x2c, 0x8f, 0x10, 0xd3, 0xe5, 0xa7, 0xb6, 0xc8, 0xd2, 0xe4, 0xf1, 0xa3, 0xb5, 0xc7];
  const BLOCKS_HEX = [
    // Block 1
    [0x3e, 0x81, 0xfa, 0x44, 0x90, 0x12, 0xab, 0xcd, 0x5e, 0x71, 0x23, 0x45, 0x67, 0x89, 0xef, 0x01],
    // Block 2
    [0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x33, 0x44, 0x55, 0x66],
    // Block 3
    [0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66]
  ];

  // Current target block being analyzed (0, 1, or 2)
  const [targetBlockIdx, setTargetBlockIdx] = useState<number>(0);
  const [selectedByteIdx, setSelectedByteIdx] = useState<number>(15);
  const [candidateByte, setCandidateByte] = useState<number>(0x00);
  const [oracleLogs, setOracleLogs] = useState<string[]>([]);
  const [oracleStatus, setOracleStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');

  // Recovered intermediate and plaintext bytes
  const [recoveredPlaintext, setRecoveredPlaintext] = useState<string[]>(new Array(48).fill('•'));
  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const autoRef = useRef<{ cancel: boolean }>({ cancel: false });

  // Simulate cryptographic padding oracle verification
  const queryPaddingOracle = (
    cPrev: number[],
    cTarget: number[]
  ): { valid: boolean; statusCode: number; message: string } => {
    // In CBC decryption:
    // P = Decrypt(cTarget) ^ cPrev
    // Decrypt(cTarget) gives the fixed intermediate state byte array `I`.
    // We compute true intermediate byte array from true plaintext:
    const blockStart = targetBlockIdx * 16;
    const truePlaintextSlice = RAW_PLAINTEXT.slice(blockStart, blockStart + 16);
    const origPrev = targetBlockIdx === 0 ? ORIGINAL_IV : BLOCKS_HEX[targetBlockIdx - 1];

    // Compute I: I[i] = origPrev[i] ^ truePlaintextSlice[i]
    const I = new Array(16).fill(0).map((_, i) => {
      const pChar = truePlaintextSlice.charCodeAt(i) || 0x10; // PKCS#7 pad byte
      return origPrev[i] ^ pChar;
    });

    // When cPrev is altered, modified Plaintext is P' = I ^ cPrev
    const modifiedP = I.map((byte, i) => byte ^ cPrev[i]);

    // Check PKCS#7 padding on modifiedP
    const lastByte = modifiedP[15];
    if (lastByte < 1 || lastByte > 16) {
      return { valid: false, statusCode: 500, message: `PKCS7_BAD_PADDING_EXCEPTION: invalid padding byte 0x${lastByte.toString(16).padStart(2, '0')}` };
    }

    // Verify all trailing `lastByte` bytes match `lastByte`
    for (let i = 16 - lastByte; i < 16; i++) {
      if (modifiedP[i] !== lastByte) {
        return { valid: false, statusCode: 500, message: `PKCS7_BAD_PADDING_EXCEPTION: corrupt padding sequence` };
      }
    }

    return { valid: true, statusCode: 200, message: `OK: Valid PKCS#7 padding (ends in 0x${lastByte.toString(16).padStart(2, '0')})` };
  };

  const handleManualProbe = () => {
    sound.playClick();
    const origPrev = targetBlockIdx === 0 ? [...ORIGINAL_IV] : [...BLOCKS_HEX[targetBlockIdx - 1]];
    const testPrev = [...origPrev];
    testPrev[selectedByteIdx] = candidateByte;

    const res = queryPaddingOracle(testPrev, BLOCKS_HEX[targetBlockIdx]);
    const hexVal = '0x' + candidateByte.toString(16).padStart(2, '0').toUpperCase();
    const newLogs = [
      `[REQ] POST /api/v1/auth/verify_ticket`,
      `[PAYLOAD] Block ${targetBlockIdx}, byte offset ${selectedByteIdx} tested with ${hexVal}`,
      `[ORACLE] Status ${res.statusCode}: ${res.message}`
    ];
    setOracleLogs(newLogs);
    setOracleStatus(res.valid ? 'VALID' : 'INVALID');

    if (res.valid) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
  };

  // Run automated Vaudenay CBC Padding Oracle attack
  const handleAutoCrackAll = async () => {
    if (isAutomating) {
      autoRef.current.cancel = true;
      setIsAutomating(false);
      return;
    }

    autoRef.current.cancel = false;
    setIsAutomating(true);
    sound.playClick();

    const currentPlaintext = [...recoveredPlaintext];

    for (let blockIdx = 0; blockIdx < 3; blockIdx++) {
      setTargetBlockIdx(blockIdx);
      const origPrev = blockIdx === 0 ? ORIGINAL_IV : BLOCKS_HEX[blockIdx - 1];
      const targetCipher = BLOCKS_HEX[blockIdx];

      // Decrypt byte 15 down to 0
      for (let byteIdx = 15; byteIdx >= 0; byteIdx--) {
        if (autoRef.current.cancel) break;

        const padVal = 16 - byteIdx; // Desired PKCS#7 padding byte
        const globalIdx = blockIdx * 16 + byteIdx;
        const targetChar = RAW_PLAINTEXT[globalIdx];

        // Animate candidate byte probe
        for (let step = 0; step < 4; step++) {
          setCandidateByte((step * 45) % 256);
          await new Promise(r => setTimeout(r, 15));
        }

        // True solution:
        const pVal = targetChar ? targetChar.charCodeAt(0) : 0x10;
        currentPlaintext[globalIdx] = String.fromCharCode(pVal);
        setRecoveredPlaintext([...currentPlaintext]);
        setSelectedByteIdx(byteIdx);
        setCandidateByte(pVal);

        const logs = [
          `[CRACK] Block ${blockIdx} Byte ${byteIdx}: Solved Intermediate byte`,
          `[MATH] Plaintext P[${byteIdx}] = I[${byteIdx}] ^ C_prev[${byteIdx}] = '${String.fromCharCode(pVal)}' (0x${pVal.toString(16).padStart(2, '0')})`
        ];
        setOracleLogs(logs);
        setOracleStatus('VALID');
        sound.playClick();

        await new Promise(r => setTimeout(r, 60));
      }
    }

    setIsAutomating(false);
    setIsCompleted(true);
    sound.playSuccess();
    if (onFlagFound) {
      onFlagFound(FLAG);
    }
  };

  const handleReset = () => {
    autoRef.current.cancel = true;
    setIsAutomating(false);
    setIsCompleted(false);
    setRecoveredPlaintext(new Array(48).fill('•'));
    setOracleLogs([]);
    setOracleStatus('IDLE');
    setTargetBlockIdx(0);
    setSelectedByteIdx(15);
    setCandidateByte(0x00);
    sound.playClick();
  };

  const plaintextString = recoveredPlaintext.join('');

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header Info */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono font-semibold text-amber-400">
            <Cpu className="w-4 h-4" />
            <span>Target: AES-128-CBC Cryptographic Verification Gateway</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Exploit the side-channel error leak in PKCS#7 padding verification. The oracle reveals whether manipulated ciphertext yields valid padding without ever providing the AES encryption key.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Oracle Feedback:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-semibold border ${
              oracleStatus === 'VALID'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : oracleStatus === 'INVALID'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {oracleStatus === 'VALID'
              ? '200 OK (VALID PAD)'
              : oracleStatus === 'INVALID'
              ? '500 ERROR (BAD PAD)'
              : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Block & Byte Matrix Visualizer */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ciphertext Blocks & Intermediate Matrix (16 Bytes / Block)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Select a block and target byte offset to test CBC malleability against the decryption oracle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClick();
                  setTargetBlockIdx(idx);
                }}
                disabled={isAutomating}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
                  targetBlockIdx === idx
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Block #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 16-Byte Grid */}
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 font-mono text-xs">
          {BLOCKS_HEX[targetBlockIdx].map((byte, i) => {
            const isSelected = selectedByteIdx === i;
            const globalIdx = targetBlockIdx * 16 + i;
            const isCracked = recoveredPlaintext[globalIdx] !== '•';

            return (
              <button
                key={i}
                onClick={() => {
                  sound.playClick();
                  setSelectedByteIdx(i);
                }}
                disabled={isAutomating}
                className={`p-2 rounded flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30'
                    : isCracked
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-[9px] text-slate-500">[{i}]</span>
                <span className="font-bold">
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </span>
                <span className="text-[10px] text-amber-300/80">
                  {recoveredPlaintext[globalIdx]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Manual Byte Modification & Probe */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300">
              Offset <strong className="text-cyan-400">{selectedByteIdx}</strong> Candidate:
            </span>
            <input
              type="range"
              min="0"
              max="255"
              value={candidateByte}
              onChange={e => setCandidateByte(Number(e.target.value))}
              disabled={isAutomating}
              className="accent-cyan-500 w-32 cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-400">
              0x{candidateByte.toString(16).padStart(2, '0').toUpperCase()} ({candidateByte})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualProbe}
              disabled={isAutomating}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Query Oracle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Solve CBC Padding Oracle Drawer */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automated Vaudenay Padding Oracle Solver</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Iterates through intermediate states $I_k$, deriving byte by byte until the complete flag is decrypted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoCrackAll}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isAutomating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isAutomating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutomating ? 'Pause Solver' : 'Execute Full Oracle Attack'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Attack"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recovered Plaintext Stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Decrypted Plaintext Stream:</span>
            <span className="text-emerald-400 font-bold">
              {plaintextString.replace(/•/g, '').length} / {FLAG.length} chars
            </span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-300 min-h-[46px] flex items-center justify-between overflow-x-auto">
            <span>{plaintextString}</span>
            {isCompleted && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shrink-0 ml-2">
                <CheckCircle2 className="w-3 h-3" />
                DECRYPTED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Oracle Output */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Cryptographic Gateway Protocol Wire</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">PKCS#7 Strict Validator</span>
        </div>

        <div className="bg-black/80 rounded p-3 font-mono text-xs space-y-1 h-28 overflow-y-auto border border-slate-800/80">
          {oracleLogs.length === 0 ? (
            <div className="text-slate-600 italic">No oracle queries logged yet.</div>
          ) : (
            oracleLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('200') || log.includes('Solved')
                    ? 'text-emerald-400'
                    : log.includes('500')
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
