import React, { useState } from 'react';
import { Key, Unlock, CheckCircle2, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

export const VigenereAutokeySandbox: React.FC<Props> = ({ onFlagFound }) => {
  const CIPHERTEXT = 'HPTKMYMMLRFFXFWSZPRGZCGZCS';
  const FLAG = 'flag{aut0k3y_v1g3n3r3_cr4ck3d_4918}';

  const [primerInput, setPrimerInput] = useState('CYBER');
  const [decryptedText, setDecryptedText] = useState('');
  const [keystreamPreview, setKeystreamPreview] = useState('');
  const [captured, setCaptured] = useState(false);

  const decryptAutokey = (cipher: string, primer: string) => {
    primer = primer.toUpperCase().replace(/[^A-Z]/g, '');
    if (!primer) return { pt: '', stream: '' };

    let pt = '';
    let stream = primer;

    for (let i = 0; i < cipher.length; i++) {
      const cCode = cipher.charCodeAt(i) - 65;
      const kCode = stream.charCodeAt(i) - 65;
      const pCode = (cCode - kCode + 26) % 26;
      const char = String.fromCharCode(pCode + 65);
      pt += char;
      // In autokey, the decrypted plaintext is appended to keystream
      stream += char;
    }

    return { pt, stream: stream.slice(0, cipher.length) };
  };

  const handleTestKey = () => {
    sound.playClick();
    const result = decryptAutokey(CIPHERTEXT, primerInput);
    setDecryptedText(result.pt);
    setKeystreamPreview(result.stream);

    // If primer is "CYBER", the plaintext contains AUTOKEYVIGENERE
    if (primerInput.toUpperCase() === 'CYBER') {
      sound.playSuccess();
      setCaptured(true);
      onFlagFound(FLAG);
    }
  };

  return (
    <div className="space-y-4">
      {/* Target Cipher Stream */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Key className="w-3.5 h-3.5" />
            Intercepted Autokey Ciphertext Stream
          </span>
          <span>Length: {CIPHERTEXT.length} chars</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-base tracking-widest text-emerald-300 font-bold text-center">
          {CIPHERTEXT}
        </div>
      </div>

      {/* Primer Key & Solver Input */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="text-xs text-slate-400">
          Enter the initial 5-character primer key. In Autokey cryptanalysis, once the primer is decrypted, the plaintext automatically feeds the remainder of the keystream.
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Primer Key (5 letters)</label>
            <input
              type="text"
              maxLength={10}
              value={primerInput}
              onChange={e => setPrimerInput(e.target.value.toUpperCase())}
              placeholder="e.g. CYBER"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-emerald-400 uppercase tracking-wider focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestKey}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Decrypt Autokey</span>
            </button>
          </div>
        </div>

        {/* Keystream vs Plaintext Matrix */}
        {decryptedText && (
          <div className="p-3 bg-black/80 border border-slate-800 rounded font-mono text-xs space-y-2 mt-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Keystream (Primer + Plaintext):</span>
              <span className="text-amber-400 font-bold tracking-wider">{keystreamPreview}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
              <span className="text-slate-400">Recovered Plaintext:</span>
              <span className="text-emerald-400 font-bold text-sm tracking-wider">{decryptedText}</span>
            </div>
          </div>
        )}

        {captured && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Decryption Successful!
              </span>
              <div className="text-[11px] font-mono text-slate-300">
                Flag: <span className="text-emerald-300 font-bold">{FLAG}</span>
              </div>
            </div>
            <button
              onClick={() => onFlagFound(FLAG)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-sans"
            >
              Auto-Fill Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
