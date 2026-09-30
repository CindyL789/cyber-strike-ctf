import React, { useState } from 'react';
import { Terminal, Key, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const HEX_STREAM = '2d272a2c30337b3914287a3b2378391429397b20782514357a7f142d39783a36782528321473737a36';
const SECRET_FLAG = 'flag{x0r_c1ph3r_br0k3n_v14_fr3qu3ncy_881}';

export const XorCipherSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [xorKey, setXorKey] = useState<number>(0x00);
  const [decodedText, setDecodedText] = useState<string>('-\'*,03{9\u0014(z;?9\u0014)9{?%\u00145z?\u0014-9?:6?%(2\u0014ssz6');

  const applyKey = (k: number) => {
    setXorKey(k);
    let str = '';
    for (let i = 0; i < HEX_STREAM.length; i += 2) {
      const b = parseInt(HEX_STREAM.substring(i, i + 2), 16);
      str += String.fromCharCode(b ^ k);
    }
    setDecodedText(str);
    if (str.startsWith('flag{')) {
      sound.playSuccess();
      onFlagFound(SECRET_FLAG);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white text-sm">Single-Byte XOR Frequency Analyzer</span>
        </div>

        <div className="p-2.5 bg-slate-900 rounded border border-slate-800 break-all text-slate-400 text-xs">
          {HEX_STREAM}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Key Slider: 0x{xorKey.toString(16).padStart(2, '0').toUpperCase()} ({xorKey})</span>
            <span className="text-slate-400">Known prefix: ciphertext 0x2D XOR ASCII 'f'</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={xorKey}
            onChange={e => applyKey(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Decoded Stream:</div>
          <div className={`font-mono text-sm font-bold ${decodedText.startsWith('flag{') ? 'text-emerald-400' : 'text-slate-400'}`}>
            {decodedText}
          </div>
        </div>
      </div>
    </div>
  );
};
