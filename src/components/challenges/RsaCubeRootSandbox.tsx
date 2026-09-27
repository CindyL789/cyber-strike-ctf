import React, { useState, useMemo } from 'react';
import { Lock, CheckCircle2, ArrowRight, Copy, Terminal, Calculator } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

const FLAG = 'flag{sm4ll_exp0n3nt_cub3_r00t_rsa_543}';

function textToBigInt(text: string): bigint {
  const bytes = new TextEncoder().encode(text);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return BigInt('0x' + hex);
}

function bigIntToText(n: bigint): string {
  try {
    let hex = n.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return 'Invalid text encoding';
  }
}

function integerCubeRoot(n: bigint): bigint {
  if (n < 0n) throw new Error('Negative number');
  if (n === 0n) return 0n;
  let x = n;
  let y = (2n * x + n / (x * x)) / 3n;
  while (y < x) {
    x = y;
    y = (2n * x + n / (x * x)) / 3n;
  }
  return x;
}

export const RsaCubeRootSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const mBigInt = useMemo(() => textToBigInt(FLAG), []);
  const cBigInt = useMemo(() => mBigInt * mBigInt * mBigInt, [mBigInt]);

  const modulusN =
    '0xbb49c30f40d1e57c6b54a20b3dc4e92a87401df499c855a9b70868fdb7ffaa46c4f3e691238910d54fbc40d216976693892742918402758129581902840192840192840912809481902849018249018249018249018249018249018249018249018249018249018249018249018249018249018249018249018249';

  const [calcInput, setCalcInput] = useState<string>(cBigInt.toString());
  const [calculationResult, setCalculationResult] = useState<{
    rootBigInt: string;
    decodedText: string;
    isExact: boolean;
  } | null>(null);

  const handleComputeRoot = () => {
    sound.playClick();
    try {
      const c = BigInt(calcInput.trim());
      const root = integerCubeRoot(c);
      const isExact = root * root * root === c;
      const text = bigIntToText(root);

      setCalculationResult({
        rootBigInt: root.toString(),
        decodedText: text,
        isExact
      });

      if (text === FLAG) {
        sound.playSuccess();
        if (onFlagFound) onFlagFound(FLAG);
      } else {
        sound.playClick();
      }
    } catch {
      sound.playError();
      setCalculationResult(null);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Public Key Cryptex: Vulnerable Low Exponent RSA</div>
          <div className="text-xs text-slate-400">
            Parameters: <code className="text-indigo-300 font-mono">e = 3</code> · Modulus: 2048-bit · Flaw: Unpadded raw message (<code className="text-indigo-300 font-mono">m³ &lt; n</code>)
          </div>
        </div>
      </div>

      {/* Captured Parameters */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intercepted Satellite Cryptogram</div>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-slate-500">Exponent e = </span>
            <span className="text-amber-400 font-bold">3</span>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">Modulus n (2048-bit):</div>
            <div className="p-2 bg-slate-900 rounded text-[11px] text-slate-400 break-all border border-slate-800">
              {modulusN}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">Ciphertext c (decimal):</div>
            <div className="p-2 bg-slate-900 rounded text-[11px] text-indigo-300 break-all border border-slate-800 select-all">
              {cBigInt.toString()}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cube Root Calculator */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            BigInt Integer Cube Root Engine
          </span>
          <button
            onClick={() => setCalcInput(cBigInt.toString())}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Insert Ciphertext c
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={calcInput}
            onChange={e => setCalcInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            placeholder="Enter integer ciphertext c"
          />
          <button
            onClick={handleComputeRoot}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>Compute ∛c</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {calculationResult && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 font-mono">Integer Cube Root m:</span>
                <div className="font-mono text-xs text-slate-300 break-all select-all">
                  {calculationResult.rootBigInt}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 font-mono">Decoded ASCII Plaintext:</span>
                <div className="font-mono text-xs font-bold text-emerald-400 break-all select-all">
                  {calculationResult.decodedText}
                </div>
              </div>
            </div>

            {calculationResult.decodedText === FLAG && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cube Root Decoded! Hastad attack successful.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(FLAG);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Flag
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
