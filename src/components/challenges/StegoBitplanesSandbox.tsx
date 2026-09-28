import React, { useState } from 'react';
import { Layers, Eye, CheckCircle2, Sliders, Image, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

export const StegoBitplanesSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [selectedChannel, setSelectedChannel] = useState<'R' | 'G' | 'B'>('B');
  const [selectedBit, setSelectedBit] = useState<number>(0);
  const [extractedAscii, setExtractedAscii] = useState<string>('');
  const [captured, setCaptured] = useState(false);

  const FLAG = 'flag{lsb_st3g0_b1t_pl4n3_c4rv3d_1829}';

  const handleExtract = () => {
    sound.playClick();
    if (selectedChannel === 'B' && selectedBit === 0) {
      sound.playSuccess();
      setExtractedAscii(`[+] Isolated Blue Channel (Bit 0)...\n[+] Parsing byte stream: 01100110 01101100 01100001 01100111 01111011...\n[+] Reconstructed payload:\n${FLAG}`);
      setCaptured(true);
      onFlagFound(FLAG);
    } else {
      sound.playError();
      setExtractedAscii(`[-] ${selectedChannel} channel (Bit ${selectedBit}) plane contains pseudorandom high-entropy visual noise.\n[-] No valid ASCII header sequence found.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Canvas Simulator */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Layers className="w-3.5 h-3.5" />
            24-Bit RGB Bit Plane Visualizer
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            Channel: {selectedChannel} · Bit Plane: {selectedBit}
          </span>
        </div>

        {/* Channel & Bit Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Color Channel:</label>
            <div className="flex gap-2">
              {(['R', 'G', 'B'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => {
                    sound.playClick();
                    setSelectedChannel(ch);
                  }}
                  className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    selectedChannel === ch
                      ? ch === 'R'
                        ? 'bg-rose-900/80 border border-rose-500 text-rose-200'
                        : ch === 'G'
                        ? 'bg-emerald-900/80 border border-emerald-500 text-emerald-200'
                        : 'bg-indigo-900/80 border border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ch === 'R' ? 'Red (R)' : ch === 'G' ? 'Green (G)' : 'Blue (B)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Bit Plane (0 = LSB, 7 = MSB):
            </label>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(bit => (
                <button
                  key={bit}
                  onClick={() => {
                    sound.playClick();
                    setSelectedBit(bit);
                  }}
                  className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    selectedBit === bit
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matrix Visualization */}
        <div className="relative p-6 bg-black rounded-lg border border-slate-800 flex flex-col items-center justify-center min-h-[140px] overflow-hidden">
          <div className="text-[11px] font-mono text-slate-500 mb-2">Simulated Pixel Plane Rendering:</div>
          <div className="grid grid-cols-16 gap-0.5 max-w-sm">
            {Array.from({ length: 48 }).map((_, i) => {
              const isPayloadBit = selectedChannel === 'B' && selectedBit === 0 && i < 28;
              return (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                    isPayloadBit
                      ? (i % 2 === 0 ? 'bg-emerald-400' : 'bg-slate-900')
                      : ((i + selectedBit) % 3 === 0 ? 'bg-slate-300' : 'bg-slate-950')
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={handleExtract}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Carve LSB Stream on {selectedChannel}{selectedBit}</span>
          </button>
        </div>
      </div>

      {/* Extracted Stream Console */}
      {extractedAscii && (
        <div className="p-3 bg-black/90 border border-slate-800 rounded font-mono text-xs space-y-2">
          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{extractedAscii}</pre>

          {captured && (
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center justify-between mt-2">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Watermark Found!
              </span>
              <button
                onClick={() => onFlagFound(FLAG)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-sans"
              >
                Auto-Fill Flag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
