import React, { useState } from 'react';
import { Terminal, Key, CheckCircle2, Play } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{v1g3n3r3_4ut0k3y_c1ph3r_cr4ck3d_4512}';

export const VigenereAutokeySandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [seedWord, setSeedWord] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');

  const handleCrack = () => {
    sound.playClick();
    if (seedWord.trim().toUpperCase() === 'ZEUS') {
      sound.playSuccess();
      setDecryptedText(SECRET_FLAG);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setDecryptedText('jxql{w9h8g8t5_7vu7n6b_k7df5r_pt8jk2e_9841} (Garbled output - invalid seed word)');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Autokey Polyalphabetic Decipher Console</span>
        </div>

        <div className="text-slate-400 text-[11px]">
          Target ciphertext was generated using an autokey cipher. The keystream starts with a 4-letter seed keyword, after which the decrypted plaintext characters themselves become the key.
        </div>

        <div>
          <label className="text-slate-400 text-[11px]">4-Letter Seed Keyword (Deduce from known prefix "flag" and ciphertext):</label>
          <input
            type="text"
            value={seedWord}
            onChange={e => setSeedWord(e.target.value.toUpperCase())}
            maxLength={4}
            className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono uppercase"
            placeholder="Enter 4 uppercase letters..."
          />
        </div>

        <button
          onClick={handleCrack}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
        >
          Propagate Autokey Keystream & Decrypt
        </button>

        {decryptedText && (
          <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Decrypted Result:</div>
            <div className={`font-mono text-sm font-bold ${decryptedText.startsWith('flag{') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {decryptedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
