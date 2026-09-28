import React, { useState } from 'react';
import { Globe, Terminal, ShieldAlert, CheckCircle2, RefreshCw, Send, ArrowRight, Server } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

export const SsrfSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [urlInput, setUrlInput] = useState('http://webhook.internal/test');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [responseLog, setResponseLog] = useState<string>(
    '# Webhook Dispatcher initialized.\n# Target endpoint must respond with HTTP 200 to verify connectivity.\n# Warning: Localhost and 169.254.169.254 (IMDS) are filtered.'
  );
  const [statusCode, setStatusCode] = useState<number | null>(200);
  const [isRequesting, setIsRequesting] = useState(false);
  const [captured, setCaptured] = useState(false);

  const FLAG = 'flag{ssrf_cl0ud_m3t4d4t4_byp4ss_7721}';

  const handleSend = () => {
    sound.playClick();
    setIsRequesting(true);

    setTimeout(() => {
      setIsRequesting(false);
      const url = urlInput.trim();

      // Check standard blocklists
      const lower = url.toLowerCase();
      if (
        lower.includes('169.254.169.254') ||
        lower.includes('localhost') ||
        lower.includes('127.0.0.1')
      ) {
        sound.playError();
        setStatusCode(403);
        setResponseLog(
          `[HTTP/1.1 403 Forbidden - Security Gateway]\n` +
          `[WAF_RULE_049]: Prohibited destination address detected.\n` +
          `Blocked pattern: ${lower.includes('169.254.169.254') ? '169.254.169.254 (IMDS)' : 'loopback'}\n` +
          `Request aborted.`
        );
        return;
      }

      // Check decimal bypass for 169.254.169.254 -> 2852039166
      // or octal 0177.0.0.1, or hex 0xa9fea9fe
      const isDecimalImds = url.includes('2852039166');
      const isHexImds = lower.includes('0xa9fea9fe') || lower.includes('0xa9.0xfe.0xa9.0xfe');
      const isDwordBypass = isDecimalImds || isHexImds;

      if (isDwordBypass) {
        if (url.includes('/token') || url.includes('/meta-data') || url.includes('/latest')) {
          sound.playSuccess();
          setStatusCode(200);
          setResponseLog(
            `[HTTP/1.1 200 OK]\n` +
            `Server: EC2-Metadata-Proxy/v2.1\n` +
            `Content-Type: application/json\n` +
            `Access-Control-Allow-Origin: *\n\n` +
            `{\n` +
            `  "Code": "Success",\n` +
            `  "LastUpdated": "${new Date().toISOString()}",\n` +
            `  "Type": "AWS-HMAC",\n` +
            `  "RoleArn": "arn:aws:iam::192830192831:role/CyberStrikeProductionRole",\n` +
            `  "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",\n` +
            `  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",\n` +
            `  "Token": "ST-9918237194",\n` +
            `  "FLAG": "${FLAG}"\n` +
            `}`
          );
          setCaptured(true);
          onFlagFound(FLAG);
          return;
        } else {
          setStatusCode(200);
          setResponseLog(
            `[HTTP/1.1 200 OK]\n` +
            `Server: EC2-Metadata-Proxy/v2.1\n\n` +
            `Available Metadata Paths:\n` +
            `/latest/meta-data/\n` +
            `/latest/meta-data/iam/security-credentials/\n` +
            `/latest/meta-data/token\n`
          );
          return;
        }
      }

      if (lower.includes('0177.0.0.1') || lower.includes('2130706433')) {
        setStatusCode(200);
        setResponseLog(
          `[HTTP/1.1 200 OK]\n` +
          `Connected to local loopback service on node ctf-agent-01.\n` +
          `Notice: Target cloud metadata service is hosted on IP 169.254.169.254 (decimal notation: 2852039166).`
        );
        return;
      }

      // Default simulated external query
      setStatusCode(200);
      setResponseLog(
        `[HTTP/1.1 200 OK]\n` +
        `Response from ${url}:\n` +
        `{\n` +
        `  "status": "connected",\n` +
        `  "latency": "14ms",\n` +
        `  "bytes": 248\n` +
        `}`
      );
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Globe className="w-3.5 h-3.5" />
            Webhook Dispatcher & SSRF Target Console
          </span>
          <span className="text-[11px] text-slate-500">Target IP filter active</span>
        </div>

        {/* URL Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={method}
            onChange={e => setMethod(e.target.value as 'GET' | 'POST')}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>

          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="http://..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={handleSend}
            disabled={isRequesting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {isRequesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send Request</span>
          </button>
        </div>

        {/* Quick payload buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-900 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">Quick Targets:</span>
          <button
            onClick={() => setUrlInput('http://169.254.169.254/latest/meta-data/token')}
            className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px] font-mono hover:bg-rose-900/60"
          >
            Test Raw IMDS (Blocked)
          </button>
          <button
            onClick={() => setUrlInput('http://2852039166/latest/meta-data/token')}
            className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] font-mono hover:bg-amber-900/60"
          >
            Decimal IP (2852039166)
          </button>
          <button
            onClick={() => setUrlInput('http://0xa9fea9fe/latest/meta-data/token')}
            className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-[11px] font-mono hover:bg-indigo-900/60"
          >
            Hex IP (0xa9fea9fe)
          </button>
        </div>
      </div>

      {/* HTTP Terminal Response */}
      <div className="p-4 bg-black/90 border border-slate-800 rounded-lg font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-slate-400" />
            HTTP Execution Output
          </span>
          {statusCode && (
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                statusCode === 200
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
              }`}
            >
              HTTP {statusCode}
            </span>
          )}
        </div>

        <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
          {responseLog}
        </pre>

        {captured && (
          <div className="p-2.5 mt-2 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Flag Recovered: {FLAG}
            </span>
            <button
              onClick={() => onFlagFound(FLAG)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-sans"
            >
              Auto-Fill Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
