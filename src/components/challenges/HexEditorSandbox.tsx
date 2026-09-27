import React, { useState } from 'react';
import { FileCode, CheckCircle2, Copy, Sparkles, AlertTriangle, Eye } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

const INITIAL_BYTES = [
  '00', '00', '00', '00', '0D', '0A', '1A', '0A', '00', '00', '00', '0D', '49', '48', '44', '52',
  '00', '00', '01', '80', '00', '00', '00', 'C0', '08', '06', '00', '00', '00', '5F', '3B', '88',
  '00', '00', '00', '01', '73', '52', '47', '42', '00', 'AE', 'CE', '1C', 'E9', '00', '00', '00',
  '04', '67', '41', '4D', '41', '00', '00', 'B1', '8F', '0B', 'FC', '61', '05', '00', '00', '00',
  '09', '70', '48', '59', '73', '00', '00', '0E', 'C4', '00', '00', '0E', 'C4', '01', '95', '2B',
  '0E', '1B', '00', '00', '00', '25', '74', '45', '58', '74', '43', '6F', '6D', '6D', '65', '6E'
];

const PNG_MAGIC = ['89', '50', '4E', '47'];
const FLAG = 'flag{h3x_c0rrupt_m4g1c_byt3s_f1x3d_109}';

export const HexEditorSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [bytes, setBytes] = useState<string[]>(INITIAL_BYTES);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const isMagicValid =
    bytes[0].toUpperCase() === '89' &&
    bytes[1].toUpperCase() === '50' &&
    bytes[2].toUpperCase() === '4E' &&
    bytes[3].toUpperCase() === '47';

  const handleCellClick = (index: number) => {
    sound.playClick();
    setEditingIndex(index);
    setEditValue(bytes[index]);
  };

  const handleSaveCell = (index: number) => {
    let clean = editValue.trim().toUpperCase().replace(/[^0-9A-F]/g, '');
    if (clean.length === 1) clean = '0' + clean;
    if (clean.length === 0) clean = '00';
    if (clean.length > 2) clean = clean.slice(0, 2);

    const newBytes = [...bytes];
    newBytes[index] = clean;
    setBytes(newBytes);
    setEditingIndex(null);
    sound.playClick();
  };

  const applyMagicFix = () => {
    sound.playClick();
    const newBytes = [...bytes];
    newBytes[0] = '89';
    newBytes[1] = '50';
    newBytes[2] = '4E';
    newBytes[3] = '47';
    setBytes(newBytes);
  };

  const handleVerifyAndRender = () => {
    sound.playClick();
    if (isMagicValid) {
      sound.playSuccess();
      setIsRendered(true);
      setRenderError(null);
      if (onFlagFound) onFlagFound(FLAG);
    } else {
      sound.playError();
      setIsRendered(false);
      setRenderError('Error: Invalid PNG magic signature. Image decoder aborted at offset 0x00000000.');
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <FileCode className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Interactive Hex Editor & Header Carving Suite</div>
          <div className="text-xs text-slate-400">
            Target File: <code className="text-emerald-300 font-mono">evidence_classified.png</code> · Size: 96 bytes · Status: Corrupted Header
          </div>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Target Signature:</span>
          <span className="font-mono text-emerald-400 font-bold">89 50 4E 47 (PNG)</span>
          <span className="text-slate-600">·</span>
          <button
            onClick={applyMagicFix}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
          >
            Auto-Repair First 4 Bytes
          </button>
        </div>

        <button
          onClick={handleVerifyAndRender}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Verify & Render Image</span>
        </button>
      </div>

      {/* Hex Grid */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto font-mono text-xs">
        <div className="space-y-1 min-w-[560px]">
          {/* Header row */}
          <div className="flex items-center gap-2 pb-1 text-slate-500 border-b border-slate-800 text-[11px]">
            <span className="w-20">Offset</span>
            <div className="flex-1 grid grid-cols-16 gap-1 text-center">
              {['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>
            <span className="w-36 text-center">ASCII</span>
          </div>

          {/* Rows of 16 bytes */}
          {[0, 16, 32, 48, 64, 80].map(rowOffset => {
            const rowBytes = bytes.slice(rowOffset, rowOffset + 16);
            return (
              <div key={rowOffset} className="flex items-center gap-2 py-0.5 hover:bg-slate-900/40 rounded">
                <span className="w-20 text-slate-500 text-[11px]">
                  0x{rowOffset.toString(16).padStart(8, '0').toUpperCase()}
                </span>
                <div className="flex-1 grid grid-cols-16 gap-1">
                  {rowBytes.map((b, colIdx) => {
                    const absIdx = rowOffset + colIdx;
                    const isMagicArea = absIdx < 4;
                    const isEditing = editingIndex === absIdx;

                    return (
                      <div key={colIdx} className="text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(absIdx)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCell(absIdx);
                              if (e.key === 'Escape') setEditingIndex(null);
                            }}
                            autoFocus
                            maxLength={2}
                            className="w-7 text-center bg-emerald-600 text-white rounded font-mono text-xs focus:outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => handleCellClick(absIdx)}
                            className={`w-7 py-0.5 rounded text-center transition-colors ${
                              isMagicArea
                                ? isMagicValid
                                  ? 'text-emerald-400 bg-emerald-950/60 font-bold border border-emerald-500/30'
                                  : 'text-rose-400 bg-rose-950/60 font-bold border border-rose-500/40'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {b}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* ASCII preview */}
                <div className="w-36 text-slate-400 text-[11px] truncate tracking-wider pl-2 border-l border-slate-800">
                  {rowBytes
                    .map(h => {
                      const code = parseInt(h, 16);
                      return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
                    })
                    .join('')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {renderError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{renderError}</span>
        </div>
      )}

      {/* Rendered Canvas / Graphic Recovery */}
      {isRendered && (
        <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              PNG Header Successfully Repaired & Parsed
            </span>
            <span className="text-slate-500 font-mono text-[11px]">Dimensions: 384x120 · Bit depth: 8</span>
          </div>

          {/* Visual evidence mockup showing the decoded graphic */}
          <div className="relative p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center text-center space-y-2 overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="text-xs uppercase font-mono tracking-widest text-slate-400">Classified Surveillance Artifact #094</div>
            <div className="text-base font-bold font-mono text-emerald-300 tracking-wider select-all z-10">
              {FLAG}
            </div>
            <div className="text-[11px] text-slate-500 font-mono z-10">CONFIDENTIAL · TOP SECRET EYES ONLY</div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Flag extracted from reconstructed chunk memory:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(FLAG);
                sound.playClick();
              }}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Flag</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
