import React, { useState } from 'react';
import { Code, CheckCircle2, Copy, Sparkles, Terminal } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

const OBFUSCATED_CODE = `(function(_0x2d1a, _0x4f12) {
  var _0x1b8a = function(_0x5c90) {
    while (--_0x5c90) {
      _0x2d1a['push'](_0x2d1a['shift']());
    }
  };
  _0x1b8a(++_0x4f12);
}(_0x39f0, 0x1a4));

var _0x39f0 = [
  '\\x63\\x68\\x65\\x63\\x6b\\x5f\\x61\\x75\\x74\\x68',
  '\\x66\\x6c\\x61\\x67\\x7b\\x64\\x33\\x30\\x62\\x66\\x75\\x73\\x63\\x34\\x74\\x33\\x5f\\x6a\\x73\\x5f\\x75\\x6e\\x70\\x34\\x63\\x6b\\x33\\x64\\x5f\\x39\\x30\\x32\\x7d',
  '\\x67\\x72\\x61\\x6e\\x74\\x65\\x64',
  '\\x61\\x64\\x6d\\x69\\x6e\\x5f\\x74\\x6f\\x6b\\x65\\x6e'
];

function _0x51ab(_0x23a1, _0x1c49) {
  return _0x39f0[_0x23a1 - 0x0];
}

function verifyAccess(_0x42ef) {
  if (_0x42ef === _0x51ab(0x3)) {
    return { status: _0x51ab(0x2), flag: _0x51ab(0x1) };
  }
  return { status: 'denied' };
}`;

const DEOBFUSCATED_CODE = `// Deobfuscated Source Code
const dictionary = [
  "check_auth",
  "flag{d30bfusc4t3_js_unp4ck3d_902}",
  "granted",
  "admin_token"
];

function verifyAccess(inputKey) {
  // Comparing input against dictionary[3]: "admin_token"
  if (inputKey === "admin_token") {
    return {
      status: "granted",
      flag: "flag{d30bfusc4t3_js_unp4ck3d_902}"
    };
  }
  return { status: "denied" };
}`;

const FLAG = 'flag{d30bfusc4t3_js_unp4ck3d_902}';

export const JsDeobfuscatorSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [isDeobfuscated, setIsDeobfuscated] = useState(false);
  const [testToken, setTestToken] = useState('admin_token');
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const handleToggleDeobfuscate = () => {
    sound.playClick();
    setIsDeobfuscated(!isDeobfuscated);
  };

  const handleExecute = () => {
    sound.playClick();
    if (testToken.trim() === 'admin_token') {
      sound.playSuccess();
      setExecutionResult(`[SUCCESS] Access Granted! Token verified.\n[EMITTED] flag: "${FLAG}"`);
      if (onFlagFound) onFlagFound(FLAG);
    } else {
      sound.playError();
      setExecutionResult(`[DENIED] Invalid token "${testToken}". Evaluation failed.`);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Code className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Phishing Script Inspector & JavaScript AST Unpacker</div>
          <div className="text-xs text-slate-400">
            Technique: Hex-encoded string array dictionary + self-invoking array rotation
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">
            {isDeobfuscated ? 'Deobfuscated JavaScript' : 'Raw Obfuscated Payload'}
          </span>
          <button
            onClick={handleToggleDeobfuscate}
            className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDeobfuscated ? 'Show Raw Obfuscated' : 'Unpack & Resolve Literals'}</span>
          </button>
        </div>

        <pre className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre">
          {isDeobfuscated ? DEOBFUSCATED_CODE : OBFUSCATED_CODE}
        </pre>
      </div>

      {/* Live Verification Tester */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          Function Execution Sandbox: <code>verifyAccess(token)</code>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testToken}
            onChange={e => setTestToken(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
            placeholder="Input token argument..."
          />
          <button
            onClick={handleExecute}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded transition-colors whitespace-nowrap"
          >
            Run verifyAccess()
          </button>
        </div>

        {executionResult && (
          <div
            className={`p-3 rounded font-mono text-xs whitespace-pre-wrap ${
              executionResult.includes('[SUCCESS]')
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
            }`}
          >
            {executionResult}
          </div>
        )}

        {isDeobfuscated && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
            <span className="text-emerald-400 font-semibold text-xs">Flag Recovered: {FLAG}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(FLAG);
                sound.playClick();
              }}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
