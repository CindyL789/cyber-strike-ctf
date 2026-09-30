import React, { useState } from 'react';
import { X, Wrench, Copy, ArrowRightLeft, Check, Terminal } from 'lucide-react';
import { toBase64, fromBase64, toHex, fromHex, rotN, xorWithKey, md5, sha256 } from '../utils/cryptoTools';
import { sound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ToolMode = 'base64' | 'hex' | 'rot' | 'xor' | 'hash' | 'url';

export const CyberWorkbench: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ToolMode>('base64');
  const [input, setInput] = useState<string>('ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==');
  const [output, setOutput] = useState<string>('');
  const [rotShift, setRotShift] = useState<number>(13);
  const [xorKey, setXorKey] = useState<string>('key');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunConversion = async (operation: string) => {
    sound.playClick();
    if (activeTab === 'base64') {
      if (operation === 'encode') setOutput(toBase64(input));
      if (operation === 'decode') setOutput(fromBase64(input));
    } else if (activeTab === 'hex') {
      if (operation === 'toHex') setOutput(toHex(input));
      if (operation === 'fromHex') setOutput(fromHex(input));
    } else if (activeTab === 'rot') {
      setOutput(rotN(input, rotShift));
    } else if (activeTab === 'xor') {
      setOutput(xorWithKey(input, xorKey));
    } else if (activeTab === 'hash') {
      if (operation === 'sha256') {
        const hash = await sha256(input);
        setOutput(hash);
      } else if (operation === 'md5') {
        setOutput(md5(input));
      }
    } else if (activeTab === 'url') {
      if (operation === 'encode') setOutput(encodeURIComponent(input));
      if (operation === 'decode') setOutput(decodeURIComponent(input));
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    sound.playClick();
    setInput(output);
    setOutput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Cryptographic Multi-Tool Workbench</h2>
              <p className="text-xs text-slate-400">Client-side payload encoder, decrypter, and hash generator</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          {(['base64', 'hex', 'rot', 'xor', 'hash', 'url'] as ToolMode[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab);
                setOutput('');
              }}
              className={`px-3 py-1.5 rounded uppercase font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">Input Buffer:</label>
            <textarea
              rows={4}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Parameters for Rot / XOR */}
          {activeTab === 'rot' && (
            <div className="space-y-1">
              <label className="text-slate-400 text-xs">ROT Shift Offset ({rotShift}):</label>
              <input
                type="range"
                min="1"
                max="25"
                value={rotShift}
                onChange={e => setRotShift(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}

          {activeTab === 'xor' && (
            <div className="space-y-1">
              <label className="text-slate-400 text-xs">XOR Key:</label>
              <input
                type="text"
                value={xorKey}
                onChange={e => setXorKey(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'base64' && (
              <>
                <button
                  onClick={() => handleRunConversion('decode')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Base64 Decode
                </button>
                <button
                  onClick={() => handleRunConversion('encode')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Base64 Encode
                </button>
              </>
            )}

            {activeTab === 'hex' && (
              <>
                <button
                  onClick={() => handleRunConversion('fromHex')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Hex to Text
                </button>
                <button
                  onClick={() => handleRunConversion('toHex')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Text to Hex
                </button>
              </>
            )}

            {activeTab === 'rot' && (
              <button
                onClick={() => handleRunConversion('rot')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
              >
                Apply ROT-{rotShift}
              </button>
            )}

            {activeTab === 'xor' && (
              <button
                onClick={() => handleRunConversion('xor')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
              >
                Execute XOR with Key
              </button>
            )}

            {activeTab === 'hash' && (
              <>
                <button
                  onClick={() => handleRunConversion('sha256')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Compute SHA-256
                </button>
                <button
                  onClick={() => handleRunConversion('md5')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Compute MD5
                </button>
              </>
            )}

            {activeTab === 'url' && (
              <>
                <button
                  onClick={() => handleRunConversion('decode')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  URL Decode
                </button>
                <button
                  onClick={() => handleRunConversion('encode')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  URL Encode
                </button>
              </>
            )}
          </div>

          {/* Output Buffer */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Conversion Result:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwap}
                  className="hover:text-white flex items-center gap-1 text-[11px]"
                  title="Move output to input"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap to Input</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="hover:text-emerald-400 flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              rows={4}
              value={output}
              placeholder="Output will appear here..."
              className="w-full p-3 bg-slate-950 border border-slate-850 rounded-lg text-emerald-400 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
