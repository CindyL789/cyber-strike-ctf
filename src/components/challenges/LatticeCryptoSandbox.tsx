import React, { useState } from 'react';
import { Terminal, Key, ShieldCheck, Play, Calculator, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{lll_l4tt1c3_r3duct10n_b14s3d_n0nc3_pwn_7721}';
const TRUE_PRIVATE_KEY_HEX = '0x8f4a2c91b8d30e5571a64b9c3f2e1a8d0764e29b1385cc4178df90a14e6b3281';

export const LatticeCryptoSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [matrixDimension, setMatrixDimension] = useState<number>(5);
  const [nonceBoundBits, setNonceBoundBits] = useState<number>(248); // 256 - 8 bits known
  const [privateKeyGuess, setPrivateKeyGuess] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [latticeLogs, setLatticeLogs] = useState<string[]>([
    '[*] secp256k1 Curve Order n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141',
    '[*] 4 Telemetry Signatures (r_i, s_i, h_i) captured from faulty hardware enclave.',
    '[*] Ephemeral Nonce Vulnerability: Nonce k_i high 8 bits are hardcoded to 0x00.',
    '[*] Bound: k_i < 2^248. This enables formulation as a Closest Vector Problem (CVP) / Shortest Vector Problem (SVP).'
  ]);

  const handleRunLllReduction = () => {
    sound.playClick();
    const newLogs = [...latticeLogs];

    if (matrixDimension !== 5 || nonceBoundBits !== 248) {
      sound.playError();
      newLogs.push(`[-] Lattice Configuration Error: Matrix dimension must be (m+1) = 5 and Nonce Bound must be 248 bits.`);
      setLatticeLogs(newLogs);
      return;
    }

    sound.playSuccess();
    newLogs.push('[+] Constructing 5x5 Kannan CVP Embedding Matrix...');
    newLogs.push('[+] Gram-Schmidt Orthogonalization started: computing mu_{i,j} coefficients...');
    newLogs.push('[+] Executing Lenstra-Lenstra-Lovász (LLL) basis reduction with delta = 0.75...');
    newLogs.push('[+] Lovász condition satisfied across all basis vectors.');
    newLogs.push('[+] Extracted candidate shortest vector v_1: norm = 1.42e+74 < Minkowski bound.');
    newLogs.push(`[+] Solved Hidden Number Problem! Recovered ECDSA Private Scalar:`);
    newLogs.push(`    d = ${TRUE_PRIVATE_KEY_HEX}`);
    newLogs.push('[*] Copy the recovered private key into the Master Key Verification field below.');

    setLatticeLogs(newLogs);
  };

  const handleVerifyKey = () => {
    sound.playClick();
    if (privateKeyGuess.trim().toLowerCase() === TRUE_PRIVATE_KEY_HEX.toLowerCase()) {
      sound.playSuccess();
      setStatusMessage(`SUCCESS: Private Key Verified! Decrypting Classified Enclave Payload: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setStatusMessage('ERROR: Invalid private scalar. Run LLL reduction with dimension 5 and bound 248.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Theoretical Context */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-sm">Biased Nonce ECDSA & LLL Lattice Reduction</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            NIGHTMARE DIFFICULTY // 650 PTS
          </span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
          {latticeLogs.map((l, i) => (
            <div key={i} className={l.includes('Recovered') ? 'text-emerald-400 font-bold' : l.includes('[-]') ? 'text-rose-400' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Lattice Parameters */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>Lattice Matrix Formulation & Dimension Bounds</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Matrix Dimension (m + 1, where m=4 signatures):</label>
            <input
              type="number"
              value={matrixDimension}
              onChange={e => setMatrixDimension(parseInt(e.target.value, 10) || 0)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Nonce Bound Bit Length (256 - leaked bits):</label>
            <input
              type="number"
              value={nonceBoundBits}
              onChange={e => setNonceBoundBits(parseInt(e.target.value, 10) || 0)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="e.g. 248"
            />
          </div>
        </div>

        <button
          onClick={handleRunLllReduction}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Play className="w-4 h-4" />
          <span>Execute LLL Lattice Basis Reduction Algorithm</span>
        </button>
      </div>

      {/* Private Key Verification */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verify Recovered Private Scalar (d)</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={privateKeyGuess}
            onChange={e => setPrivateKeyGuess(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="0x8f4a..."
          />
          <button
            onClick={handleVerifyKey}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Verify Master Key
          </button>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg border text-xs ${statusMessage.startsWith('SUCCESS') ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
