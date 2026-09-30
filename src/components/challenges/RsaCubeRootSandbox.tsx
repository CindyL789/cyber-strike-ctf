import React, { useState } from 'react';
import { Terminal, Calculator, CheckCircle2, Play, Lock, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{sm4ll_exp0n3nt_cub3_r00t_rsa_543}';
const TARGET_C_DECIMAL = '2217344750802148418880459129925901115181429509715645786074149165130015038080451601809591236619876562761461755551801034366129706292748510599949678934870106973751405162806745370691850602440441462594336303973320693187369731151852981024059630491833879518398668306418196824665701';

export const RsaCubeRootSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [candidateM, setCandidateM] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    decodedText?: string;
  } | null>(null);

  const handleVerifyCandidate = () => {
    sound.playClick();
    const clean = candidateM.trim();
    if (!clean) return;

    try {
      const mBig = BigInt(clean);
      const targetC = BigInt(TARGET_C_DECIMAL);
      const computedC = mBig ** 3n;

      if (computedC === targetC) {
        sound.playSuccess();
        // Convert BigInt to Hex then ASCII
        let hex = mBig.toString(16);
        if (hex.length % 2 !== 0) hex = '0' + hex;
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }

        setVerificationResult({
          success: true,
          message: 'Exact integer cube match! m^3 == c verified.',
          decodedText: str
        });

        if (str.includes('flag{')) {
          onFlagFound(SECRET_FLAG);
        }
      } else {
        sound.playError();
        const diff = computedC > targetC ? 'larger' : 'smaller';
        setVerificationResult({
          success: false,
          message: `Validation failed: m^3 does not equal c (candidate cube is ${diff} than target). Use integer cube root (e.g. binary search or Newton-Raphson in Python/Node).`
        });
      }
    } catch {
      sound.playError();
      setVerificationResult({
        success: false,
        message: 'Invalid BigInt integer format. Please provide a valid decimal integer.'
      });
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">RSA Small Public Exponent e = 3 Analysis</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            No Modulus Wrap (m^3 &lt; n)
          </span>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed">
          Because public exponent <code className="text-emerald-400">e = 3</code> and the flag has no PKCS#1 padding, <code className="text-slate-200">m^3 &lt; n</code>. Hence, the modular reduction never wrapped around! The ciphertext <code className="text-slate-200">c</code> is an exact integer cube of <code className="text-slate-200">m</code>. Compute the exact BigInt cube root of <code className="text-slate-200">c</code> in your local terminal or Python console and test your root here.
        </div>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-300 font-bold text-xs">Target BigInt Ciphertext c:</div>
        <div className="p-3 bg-slate-900 rounded border border-slate-800 break-all text-amber-400 text-xs select-all">
          {TARGET_C_DECIMAL}
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 text-[11px]">Enter Computed Integer Cube Root (BigInt decimal m):</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={candidateM}
              onChange={e => setCandidateM(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyCandidate()}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 130400044828272..."
            />
            <button
              onClick={handleVerifyCandidate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Verify Root m^3 == c</span>
            </button>
          </div>
        </div>

        {verificationResult && (
          <div
            className={`p-3 rounded-lg border space-y-1 ${
              verificationResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{verificationResult.message}</span>
            </div>
            {verificationResult.decodedText && (
              <div className="pt-1 text-sm font-bold text-emerald-400 font-mono">
                Decoded Plaintext: {verificationResult.decodedText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
