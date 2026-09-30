import React, { useState } from 'react';
import { Terminal, Send, Globe, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{ssrf_cl0ud_m3t4d4t4_14m_p1v0t_9012}';

export const SsrfSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://avatars.example.com/user/avatar.png');
  const [headerKey, setHeaderKey] = useState<string>('User-Agent');
  const [headerVal, setHeaderVal] = useState<string>('Mozilla/5.0');
  const [responseLog, setResponseLog] = useState<string>('');

  const handleFetch = () => {
    sound.playClick();
    if (
      (targetUrl.includes('169.254.169.254') || targetUrl.includes('2852039166')) &&
      headerKey.toLowerCase() === 'metadata-flavor' &&
      headerVal.toLowerCase() === 'google'
    ) {
      sound.playSuccess();
      setResponseLog(
        JSON.stringify(
          {
            access_token: 'ya29.c.b0AXv0zTN_simulated_iam_token_secret...',
            token_type: 'Bearer',
            expires_in: 3599,
            instance_identity_proof: SECRET_FLAG
          },
          null,
          2
        )
      );
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setResponseLog('HTTP 403 Forbidden — Missing "Metadata-Flavor: Google" or blocked endpoint.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Automated Webhook Avatar Fetcher</span>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-slate-400 text-[11px]">Webhook Target URL:</label>
            <input
              type="text"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-[11px]">Header Name:</label>
              <input
                type="text"
                value={headerKey}
                onChange={e => setHeaderKey(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[11px]">Header Value:</label>
              <input
                type="text"
                value={headerVal}
                onChange={e => setHeaderVal(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleFetch}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
        >
          Dispatch Webhook Request
        </button>

        {responseLog && (
          <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Server Metadata Response:</div>
            <pre className="text-emerald-400 font-mono text-[11px] whitespace-pre-wrap">{responseLog}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
