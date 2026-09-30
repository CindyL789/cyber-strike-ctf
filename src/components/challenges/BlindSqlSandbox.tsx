import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Play, AlertCircle, Database, Search } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const TRUE_FLAG = 'flag{bl1nd_b00l34n_sql1_3xf1ltr4t10n_9941}';

export const BlindSqlSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [payload, setPayload] = useState<string>("AG-007' AND 1=1 --");
  const [testPos, setTestPos] = useState<number>(1);
  const [testChar, setTestChar] = useState<string>('f');
  const [knownBuffer, setKnownBuffer] = useState<string[]>(new Array(TRUE_FLAG.length).fill('_'));
  const [requestLog, setRequestLog] = useState<Array<{
    id: string;
    payload: string;
    status: number;
    result: 'TRUE' | 'FALSE' | 'SYNTAX_ERROR';
    timeMs: number;
  }>>([
    {
      id: 'log-0',
      payload: "AG-007' AND 1=1 --",
      status: 200,
      result: 'TRUE',
      timeMs: 42
    },
    {
      id: 'log-1',
      payload: "AG-007' AND 1=2 --",
      status: 404,
      result: 'FALSE',
      timeMs: 38
    }
  ]);

  const evaluatePayload = (sql: string): { status: number; result: 'TRUE' | 'FALSE' | 'SYNTAX_ERROR' } => {
    const raw = sql.trim();
    if (!raw.includes("'")) {
      return raw.includes('AG-007')
        ? { status: 200, result: 'TRUE' }
        : { status: 404, result: 'FALSE' };
    }

    // Check for comment
    if (!raw.includes('--') && !raw.includes('/*')) {
      return { status: 500, result: 'SYNTAX_ERROR' };
    }

    // Basic Boolean oracle evaluation
    const lower = raw.toLowerCase();

    // 1. Direct boolean tests
    if (lower.includes('1=1') || lower.includes("'1'='1'")) {
      return { status: 200, result: 'TRUE' };
    }
    if (lower.includes('1=2') || lower.includes("'1'='2'")) {
      return { status: 404, result: 'FALSE' };
    }

    // 2. Substring extraction checks
    const matchSubstr = raw.match(/substr\s*\(\s*(?:flag|\(select flag from classified_vault\))\s*,\s*(\d+)\s*,\s*1\s*\)\s*=\s*'([^']+)'/i);
    if (matchSubstr) {
      const pos = parseInt(matchSubstr[1], 10);
      const char = matchSubstr[2];
      if (pos >= 1 && pos <= TRUE_FLAG.length && TRUE_FLAG[pos - 1] === char) {
        return { status: 200, result: 'TRUE' };
      }
      return { status: 404, result: 'FALSE' };
    }

    // 3. Length checks
    const matchLen = raw.match(/length\s*\(\s*(?:flag|\(select flag from classified_vault\))\s*\)\s*=\s*(\d+)/i);
    if (matchLen) {
      const len = parseInt(matchLen[1], 10);
      return len === TRUE_FLAG.length
        ? { status: 200, result: 'TRUE' }
        : { status: 404, result: 'FALSE' };
    }

    return { status: 404, result: 'FALSE' };
  };

  const handleSend = (sqlToSend?: string) => {
    const query = (sqlToSend || payload).trim();
    if (!query) return;
    sound.playClick();
    const evalRes = evaluatePayload(query);
    const newLog = {
      id: `log-${Date.now()}`,
      payload: query,
      status: evalRes.status,
      result: evalRes.result,
      timeMs: Math.floor(Math.random() * 25) + 30
    };
    setRequestLog(prev => [newLog, ...prev.slice(0, 15)]);

    if (evalRes.result === 'TRUE') {
      sound.playSuccess();
      // If was substr query, update known buffer
      const match = query.match(/substr\s*\(\s*(?:flag|\(select flag from classified_vault\))\s*,\s*(\d+)\s*,\s*1\s*\)\s*=\s*'([^']+)'/i);
      if (match) {
        const p = parseInt(match[1], 10);
        const c = match[2];
        const updated = [...knownBuffer];
        updated[p - 1] = c;
        setKnownBuffer(updated);
        if (!updated.includes('_')) {
          onFlagFound(updated.join(''));
        }
      }
    } else {
      sound.playError();
    }
  };

  const handleTestSpecificChar = () => {
    if (!testChar || testPos < 1 || testPos > TRUE_FLAG.length) return;
    const q = `AG-007' AND (SELECT SUBSTR(flag, ${testPos}, 1) FROM classified_vault) = '${testChar}' --`;
    setPayload(q);
    handleSend(q);
  };

  return (
    <div className="space-y-4">
      {/* Target API Console Header */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Target Endpoint:</span>
            <span className="text-emerald-400">POST /api/v3/agent/verify</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Response: <span className="text-emerald-400">HTTP 200 (TRUE)</span> vs <span className="text-rose-400">HTTP 404 (FALSE)</span>
          </div>
        </div>

        {/* Input injection form */}
        <div className="space-y-2">
          <label className="text-slate-400 text-[11px] flex items-center justify-between">
            <span>HTTP JSON Body (agent_id parameter):</span>
            <span className="text-slate-500">Backend: SQLite 3.39</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={payload}
              onChange={e => setPayload(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              placeholder="Inject boolean SQL condition..."
            />
            <button
              onClick={() => handleSend()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Payload</span>
            </button>
          </div>
        </div>

        {/* Quick boolean test payloads */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-500">Payload presets:</span>
          <button
            onClick={() => setPayload("AG-007' AND 1=1 --")}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            1=1 (True Oracle)
          </button>
          <button
            onClick={() => setPayload("AG-007' AND 1=2 --")}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            1=2 (False Oracle)
          </button>
          <button
            onClick={() => setPayload("AG-007' AND (SELECT LENGTH(flag) FROM classified_vault)=43 --")}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            Length == 43
          </button>
        </div>
      </div>

      {/* Interactive Substring Probe */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Boolean Substring Character Probe</span>
          </div>
          <span className="text-[10px] text-slate-400">Position 1 to {TRUE_FLAG.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Index:</span>
            <input
              type="number"
              min={1}
              max={TRUE_FLAG.length}
              value={testPos}
              onChange={e => setTestPos(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Char:</span>
            <input
              type="text"
              maxLength={1}
              value={testChar}
              onChange={e => setTestChar(e.target.value)}
              className="w-12 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs text-center"
            />
          </div>

          <button
            onClick={handleTestSpecificChar}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs"
          >
            Test Condition SUBSTR(flag, {testPos}, 1) = '{testChar}'
          </button>
        </div>

        {/* Live Extracted Buffer */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Discovered Flag Buffer ({knownBuffer.filter(c => c !== '_').length}/{TRUE_FLAG.length} characters):</div>
          <div className="text-sm font-bold text-emerald-400 font-mono tracking-wider break-all">
            {knownBuffer.join('')}
          </div>
        </div>
      </div>

      {/* HTTP Oracle Telemetry Log */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
        <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>Server Response Telemetry Stream</span>
          <span className="text-[10px] text-slate-500">Last 15 queries</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {requestLog.map(item => (
            <div
              key={item.id}
              className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-[11px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                    item.result === 'TRUE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : item.result === 'FALSE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  HTTP {item.status} ({item.result})
                </span>
                <span className="text-slate-300 truncate max-w-md">{item.payload}</span>
              </div>
              <span className="text-slate-500 text-[10px] tabular-nums shrink-0">{item.timeMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
