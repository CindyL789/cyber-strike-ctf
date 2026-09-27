import React, { useState } from 'react';
import { X, Wrench, Copy, ArrowRightLeft, Trash2, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm text-slate-100">Cyber Toolkit & Decoder Workbench</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/70 border-b border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'base64', label: 'Base64' },
            { id: 'hex', label: 'Hex Converter' },
            { id: 'rot', label: 'ROT / Caesar' },
            { id: 'xor', label: 'XOR Key' },
            { id: 'hash', label: 'Hash (MD5/SHA)' },
            { id: 'url', label: 'URL Encode' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as ToolMode);
              }}
              className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Controls for current tool */}
          {activeTab === 'base64' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRunConversion('decode')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Decode Base64
              </button>
              <button
                onClick={() => handleRunConversion('encode')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                Encode to Base64
              </button>
            </div>
          )}

          {activeTab === 'hex' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRunConversion('fromHex')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Hex → ASCII
              </button>
              <button
                onClick={() => handleRunConversion('toHex')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                ASCII → Hex
              </button>
            </div>
          )}

          {activeTab === 'rot' && (
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Shift Offset: {rotShift}</span>
              <input
                type="range"
                min={1}
                max={25}
                value={rotShift}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setRotShift(val);
                  setOutput(rotN(input, val));
                }}
                className="w-48 h-2 bg-slate-800 rounded accent-emerald-500"
              />
              <button
                onClick={() => handleRunConversion('rot')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
              >
                Apply ROT-{rotShift}
              </button>
            </div>
          )}

          {activeTab === 'xor' && (
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Key:</span>
              <input
                type="text"
                value={xorKey}
                onChange={e => setXorKey(e.target.value)}
                placeholder="String or byte key..."
                className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded font-mono text-slate-200"
              />
              <button
                onClick={() => handleRunConversion('xor')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
              >
                Execute XOR
              </button>
            </div>
          )}

          {activeTab === 'hash' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRunConversion('sha256')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Compute SHA-256
              </button>
              <button
                onClick={() => handleRunConversion('md5')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                Compute MD5
              </button>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRunConversion('decode')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                URL Decode
              </button>
              <button
                onClick={() => handleRunConversion('encode')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                URL Encode
              </button>
            </div>
          )}

          {/* Input text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>INPUT DATA</span>
              <button
                onClick={() => {
                  setInput('');
                  sound.playClick();
                }}
                className="hover:text-slate-200 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              placeholder="Paste strings, hex, base64 or ciphertexts..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Swap Output to Input"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Output text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>CONVERTED OUTPUT</span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="hover:text-emerald-400 flex items-center gap-1 text-slate-300"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <textarea
              readOnly
              value={output}
              rows={4}
              placeholder="Converted output will appear here..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-emerald-300 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
