import React, { useState, useMemo } from 'react';
import { Binary, CheckCircle2, Zap, Copy, Sparkles, Sliders } from 'lucide-react';
import { sound } from '../../utils/audio';
import { xorHexWithByte } from '../../utils/cryptoTools';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const XorCipherSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const CIPHERTEXT_HEX = '2d272a2c30337b3914287a3b2378391429397b20782514357a7f142d39783a36782528321473737a36';
  const TARGET_KEY = 75; // 0x4B
  const FLAG = 'flag{x0r_c1ph3r_br0k3n_v14_fr3qu3ncy_881}';

  const [currentKey, setCurrentKey] = useState<number>(10);
  const [knownPrefix, setKnownPrefix] = useState<string>('flag{');
  const [solved, setSolved] = useState<boolean>(false);

  // Decrypt with current key
  const decrypted = useMemo(() => {
    return xorHexWithByte(CIPHERTEXT_HEX, currentKey);
  }, [currentKey]);

  // English letter frequency heuristic
  const englishScore = useMemo(() => {
    let printable = 0;
    let alpha = 0;
    for (let i = 0; i < decrypted.length; i++) {
      const code = decrypted.charCodeAt(i);
      if (code >= 32 && code <= 126) printable++;
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95 || code === 123 || code === 125) {
        alpha++;
      }
    }
    const score = Math.round(((printable * 0.4 + alpha * 0.6) / decrypted.length) * 100);
    return Math.min(100, Math.max(0, score));
  }, [decrypted]);

  const handleKeyChange = (val: number) => {
    setCurrentKey(val);
    if (val === TARGET_KEY && !solved) {
      setSolved(true);
      sound.playSuccess();
      if (onFlagFound) onFlagFound(FLAG);
    }
  };

  const calculateFromPrefix = () => {
    sound.playClick();
    if (!knownPrefix) return;
    // first byte of ciphertext: 0x2d
    const firstCipherByte = parseInt(CIPHERTEXT_HEX.slice(0, 2), 16);
    const firstPlainChar = knownPrefix.charCodeAt(0);
    const derivedKey = firstCipherByte ^ firstPlainChar;
    handleKeyChange(derivedKey);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Binary className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Intercepted Signal: Raw Single-Byte XOR Stream</div>
          <div className="text-xs text-slate-400">
            Length: 41 bytes (82 hex chars) · Modulation: Symmetric 8-bit stream masking
          </div>
        </div>
      </div>

      {/* Raw Hex Ciphertext display */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intercepted Hex Dump</div>
        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300 break-all select-all tracking-wider">
          {CIPHERTEXT_HEX}
        </div>
      </div>

      {/* Interactive Decryption Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Slider & Key selection */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              XOR Key Brute-Forcer
            </span>
            <div className="font-mono text-xs">
              <span className="text-slate-400">Key: </span>
              <span className="text-cyan-300 font-bold">{currentKey}</span>
              <span className="text-slate-500"> (0x{currentKey.toString(16).toUpperCase().padStart(2, '0')})</span>
            </div>
          </div>

          <div>
            <input
              type="range"
              min={0}
              max={255}
              value={currentKey}
              onChange={e => handleKeyChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>0x00 (0)</span>
              <span>0x7F (127)</span>
              <span>0xFF (255)</span>
            </div>
          </div>

          {/* Known Plaintext helper */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Known Plaintext Attack (KPA):</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={knownPrefix}
                onChange={e => setKnownPrefix(e.target.value)}
                placeholder="Prefix e.g. flag{"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={calculateFromPrefix}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-medium whitespace-nowrap transition-colors"
              >
                Derive Key (0x2D ^ '{knownPrefix[0] || 'f'}')
              </button>
            </div>
          </div>
        </div>

        {/* Live Output & Plausibility Score */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">Live Decoded Stream</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Plausibility:</span>
                <span
                  className={`font-mono font-bold ${
                    englishScore > 80 ? 'text-emerald-400' : englishScore > 50 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {englishScore}%
                </span>
              </div>
            </div>

            <pre className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs break-all whitespace-pre-wrap min-h-24 flex items-center text-slate-100">
              {decrypted}
            </pre>
          </div>

          {currentKey === TARGET_KEY && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cipher Key Solved! (Key: 0x4B / 75)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-emerald-800/40">
                <code className="text-emerald-300 font-mono text-xs select-all">{FLAG}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(FLAG);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
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
