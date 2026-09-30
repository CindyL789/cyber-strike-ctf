import React, { useState } from 'react';
import { Terminal, Image as ImageIcon, Play, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{st3g0_l34st_s1gn1f1c4nt_b1t_c4rv3d_771}';

export const StegoBitplanesSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [selectedChannel, setSelectedChannel] = useState<'red' | 'green' | 'blue'>('green');
  const [bitPlane, setBitPlane] = useState<number>(7);
  const [extractedHex, setExtractedHex] = useState<string>('');

  const handleExtract = () => {
    sound.playClick();
    if (selectedChannel === 'red' && bitPlane === 0) {
      sound.playSuccess();
      setExtractedHex(`50 4b 03 04 ... (ZIP Archive Recovered!)\nFile: secret.txt\nContent: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setExtractedHex('7a 1b 4c 9e ... (High-entropy pseudo-random noise)');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Least-Significant-Bit Bitplane Demuxer</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Color Channel:</label>
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value as 'red' | 'green' | 'blue')}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
            >
              <option value="red">Red Channel</option>
              <option value="green">Green Channel</option>
              <option value="blue">Blue Channel</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Bitplane (0 = LSB, 7 = MSB):</label>
            <select
              value={bitPlane}
              onChange={e => setBitPlane(parseInt(e.target.value, 10))}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
            >
              <option value={0}>Bit 0 (Least Significant Bit)</option>
              <option value={1}>Bit 1</option>
              <option value={2}>Bit 2</option>
              <option value={7}>Bit 7 (Most Significant Bit)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExtract}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
        >
          Carve Bitstream & Reassemble
        </button>

        {extractedHex && (
          <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Carved Bitstream Analysis:</div>
            <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap">{extractedHex}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
