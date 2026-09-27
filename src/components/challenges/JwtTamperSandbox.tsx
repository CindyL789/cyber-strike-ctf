import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, Copy } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

function base64UrlEncode(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  } catch {
    return '';
  }
}

export const JwtTamperSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [headerStr, setHeaderStr] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadStr, setPayloadStr] = useState('{\n  "user": "hunter1",\n  "role": "guest",\n  "isAdmin": false,\n  "exp": 1790000000\n}');
  const [signatureStr, setSignatureStr] = useState('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  const [responseLog, setResponseLog] = useState<{ status: number; text: string; data?: unknown } | null>(null);
  const [flag, setFlag] = useState<string | null>(null);

  const FLAG = 'flag{jwt_n0n3_4lg_auth_byp4ss_718}';

  const assembledToken = `${base64UrlEncode(headerStr)}.${base64UrlEncode(payloadStr)}.${signatureStr}`;

  const handleTestToken = () => {
    sound.playClick();

    try {
      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      const isAlgNone = typeof header.alg === 'string' && header.alg.toLowerCase() === 'none';
      const isAdmin = payload.role === 'admin' || payload.isAdmin === true || payload.user === 'admin';

      if (isAlgNone) {
        if (isAdmin) {
          sound.playSuccess();
          setResponseLog({
            status: 200,
            text: '200 OK - Access Granted to Classified Vault',
            data: {
              status: 'success',
              vault: 'Sector-07 Classified Intel',
              clearance: 'TOP_SECRET',
              flag: FLAG
            }
          });
          setFlag(FLAG);
          if (onFlagFound) onFlagFound(FLAG);
        } else {
          sound.playError();
          setResponseLog({
            status: 403,
            text: '403 Forbidden: Token algorithm accepted ("none"), but user identity is not admin.',
            data: { error: 'Insufficient permissions for /api/v2/vault/flag. Current role: ' + (payload.role || 'guest') }
          });
        }
      } else {
        // alg is not none
        if (isAdmin) {
          sound.playError();
          setResponseLog({
            status: 401,
            text: '401 Unauthorized: HMAC-SHA256 signature verification failed. Secret key mismatch.',
            data: { error: 'Invalid token signature. Payload has been tampered with without valid server secret.' }
          });
        } else {
          setResponseLog({
            status: 403,
            text: '403 Forbidden: Valid guest token, but role is restricted.',
            data: { error: 'Access denied: requires administrator clearance.' }
          });
        }
      }
    } catch (e: unknown) {
      sound.playError();
      setResponseLog({
        status: 400,
        text: '400 Bad Request: Malformed JSON in Header or Payload.',
        data: { error: (e as Error).message }
      });
    }
  };

  const applyExploitPreset = () => {
    sound.playClick();
    setHeaderStr('{\n  "alg": "none",\n  "typ": "JWT"\n}');
    setPayloadStr('{\n  "user": "admin",\n  "role": "admin",\n  "isAdmin": true,\n  "exp": 1790000000\n}');
    setSignatureStr('');
  };

  const resetPreset = () => {
    sound.playClick();
    setHeaderStr('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    setPayloadStr('{\n  "user": "hunter1",\n  "role": "guest",\n  "isAdmin": false,\n  "exp": 1790000000\n}');
    setSignatureStr('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    setResponseLog(null);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Simulated Target: REST API Vault Gateway</div>
          <div className="text-xs text-slate-400">
            Protected Resource: <code className="text-amber-300 font-mono">GET /api/v2/vault/flag</code> · Auth Type: Bearer JWT
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Header Block */}
        <div className="p-3 bg-slate-950 border border-rose-900/40 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-400 uppercase tracking-wider">Header</span>
            <span className="text-[11px] text-slate-500 font-mono">Algorithm & Token Type</span>
          </div>
          <textarea
            value={headerStr}
            onChange={e => setHeaderStr(e.target.value)}
            rows={5}
            className="w-full p-2 bg-slate-900 border border-rose-900/30 rounded font-mono text-xs text-rose-300 focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        {/* Payload Block */}
        <div className="p-3 bg-slate-950 border border-purple-900/40 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-400 uppercase tracking-wider">Payload Data</span>
            <span className="text-[11px] text-slate-500 font-mono">Claims & Identity</span>
          </div>
          <textarea
            value={payloadStr}
            onChange={e => setPayloadStr(e.target.value)}
            rows={5}
            className="w-full p-2 bg-slate-900 border border-purple-900/30 rounded font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Signature Block */}
        <div className="p-3 bg-slate-950 border border-cyan-900/40 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-400 uppercase tracking-wider">Signature</span>
            <span className="text-[11px] text-slate-500 font-mono">HMAC / Unsigned</span>
          </div>
          <textarea
            value={signatureStr}
            onChange={e => setSignatureStr(e.target.value)}
            rows={5}
            placeholder="Empty for alg: none"
            className="w-full p-2 bg-slate-900 border border-cyan-900/30 rounded font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
      </div>

      {/* Assembled Raw Token */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">Assembled Bearer Token</span>
          <div className="flex items-center gap-2">
            <button
              onClick={applyExploitPreset}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Load Alg:None Exploit
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={resetPreset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
        <div className="p-2 bg-slate-900 rounded font-mono text-xs break-all text-slate-300 border border-slate-800">
          <span className="text-rose-400">{base64UrlEncode(headerStr)}</span>
          <span className="text-slate-500">.</span>
          <span className="text-purple-400">{base64UrlEncode(payloadStr)}</span>
          <span className="text-slate-500">.</span>
          <span className="text-cyan-400">{signatureStr}</span>
        </div>
      </div>

      {/* Action and Response */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleTestToken}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-2"
        >
          <span>Send Authorized Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {responseLog && (
        <div
          className={`p-3 rounded-lg border font-mono text-xs space-y-2 ${
            responseLog.status === 200
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
          }`}
        >
          <div className="font-bold flex items-center gap-2">
            {responseLog.status === 200 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
            {responseLog.text}
          </div>
          <pre className="p-2 bg-slate-900 rounded text-slate-200 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(responseLog.data, null, 2)}
          </pre>
          {flag && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">Flag: {flag}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(flag);
                  sound.playClick();
                }}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] rounded flex items-center gap-1 font-sans"
              >
                <Copy className="w-3 h-3" />
                Copy Flag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
