import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Shield } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{jwt_n0n3_4lg_auth_byp4ss_718}';

export const JwtTamperSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [headerJson, setHeaderJson] = useState<string>('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState<string>('{\n  "user": "guest_user",\n  "role": "guest",\n  "isAdmin": false\n}');
  const [authResponse, setAuthResponse] = useState<string>('');

  const handleVerify = () => {
    sound.playClick();
    if (headerJson.includes('"none"') && payloadJson.includes('"admin"')) {
      sound.playSuccess();
      setAuthResponse(`HTTP 200 OK — Algorithm "none" accepted! Role elevated to administrator. Flag: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setAuthResponse('HTTP 403 Forbidden — Signature verification failed or non-admin role.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">JSON Web Token Tamper Console</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Header Segment:</label>
            <textarea
              rows={4}
              value={headerJson}
              onChange={e => setHeaderJson(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Payload Claims:</label>
            <textarea
              rows={4}
              value={payloadJson}
              onChange={e => setPayloadJson(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleVerify}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
        >
          Send Token (Unsigned Header.Payload.)
        </button>

        {authResponse && (
          <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-emerald-400 font-bold">
            {authResponse}
          </div>
        )}
      </div>
    </div>
  );
};
