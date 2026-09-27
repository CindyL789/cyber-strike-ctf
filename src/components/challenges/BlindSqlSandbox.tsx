import React, { useState, useEffect, useRef } from 'react';
import { Database, Terminal, Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const BlindSqlSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const FLAG = 'flag{bl1nd_b00l34n_sql1_3xf1ltr4t10n_9941}';
  const [inputPayload, setInputPayload] = useState("AG-007' AND (SELECT SUBSTR(flag, 1, 1) FROM classified_vault) = 'f' --");
  const [queryLogs, setQueryLogs] = useState<string[]>([]);
  const [lastStatus, setLastStatus] = useState<'IDLE' | 'TRUE' | 'FALSE' | 'ERROR'>('IDLE');
  const [extractedChars, setExtractedChars] = useState<string>('');
  const [isAutomating, setIsAutomating] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [speedMs, setSpeedMs] = useState(120);
  const [isCompleted, setIsCompleted] = useState(false);

  const autoRef = useRef<{ cancel: boolean }>({ cancel: false });

  // Evaluate query boolean condition
  const evaluateQuery = (rawInput: string): { status: 'TRUE' | 'FALSE' | 'ERROR'; logs: string[]; latencyMs: number } => {
    const input = rawInput.trim();
    const logs: string[] = [];
    logs.push(`[HTTP REQ] GET /api/v3/classified/lookup?agent_id=${encodeURIComponent(input)}`);
    logs.push(`[SQL EVAL] SELECT status FROM secret_agents WHERE agent_id = '${input}';`);

    // Standard valid check
    if (input === 'AG-007') {
      logs.push(`[DB] Row found: { agent_id: 'AG-007', status: 'ACTIVE_DEPLOYED' }`);
      logs.push(`[HTTP RES] 200 OK -> {"status": "CONFIRMED", "records": 1}`);
      return { status: 'TRUE', logs, latencyMs: 25 };
    }

    // Check if input begins with valid agent and contains injection
    const hasValidPrefix = input.startsWith("AG-007'");
    if (!hasValidPrefix) {
      logs.push(`[DB] 0 matching rows found in secret_agents.`);
      logs.push(`[HTTP RES] 404 NOT_FOUND -> {"status": "NOT_FOUND", "records": 0}`);
      return { status: 'FALSE', logs, latencyMs: 30 };
    }

    // Parse Boolean injection patterns
    // e.g. AG-007' AND 1=1 --
    if (input.includes('AND 1=1') || input.includes('and 1=1') || input.includes("'1'='1'")) {
      logs.push(`[DB COND] WHERE clause evaluates to TRUE.`);
      logs.push(`[HTTP RES] 200 OK -> {"status": "CONFIRMED", "records": 1}`);
      return { status: 'TRUE', logs, latencyMs: 28 };
    }

    if (input.includes('AND 1=2') || input.includes('and 1=2') || input.includes("'1'='2'")) {
      logs.push(`[DB COND] WHERE clause evaluates to FALSE.`);
      logs.push(`[HTTP RES] 404 NOT_FOUND -> {"status": "NOT_FOUND", "records": 0}`);
      return { status: 'FALSE', logs, latencyMs: 32 };
    }

    // Regex check for SUBSTR comparison:
    // SUBSTR(flag, <pos>, 1) = '<char>'
    const substrRegex = /SUBSTR\s*\(\s*flag\s*,\s*(\d+)\s*,\s*1\s*\)\s*=\s*'([^']+)'/i;
    const asciiRegex = /ASCII\s*\(\s*SUBSTR\s*\(\s*flag\s*,\s*(\d+)\s*,\s*1\s*\)\s*\)\s*([><=])\s*(\d+)/i;

    const substrMatch = input.match(substrRegex);
    if (substrMatch) {
      const pos = parseInt(substrMatch[1], 10);
      const testChar = substrMatch[2];
      const actualChar = FLAG[pos - 1];

      if (actualChar !== undefined && actualChar === testChar) {
        logs.push(`[DB COND] SUBSTR(flag, ${pos}, 1) = '${testChar}' is TRUE.`);
        logs.push(`[HTTP RES] 200 OK -> {"status": "CONFIRMED", "records": 1}`);
        return { status: 'TRUE', logs, latencyMs: 35 };
      } else {
        logs.push(`[DB COND] SUBSTR(flag, ${pos}, 1) = '${testChar}' is FALSE.`);
        logs.push(`[HTTP RES] 404 NOT_FOUND -> {"status": "NOT_FOUND", "records": 0}`);
        return { status: 'FALSE', logs, latencyMs: 34 };
      }
    }

    const asciiMatch = input.match(asciiRegex);
    if (asciiMatch) {
      const pos = parseInt(asciiMatch[1], 10);
      const op = asciiMatch[2];
      const testAscii = parseInt(asciiMatch[3], 10);
      const actualChar = FLAG[pos - 1];

      if (actualChar !== undefined) {
        const actualAscii = actualChar.charCodeAt(0);
        let cond = false;
        if (op === '>') cond = actualAscii > testAscii;
        else if (op === '<') cond = actualAscii < testAscii;
        else if (op === '=') cond = actualAscii === testAscii;

        if (cond) {
          logs.push(`[DB COND] ASCII('${actualChar}') ${op} ${testAscii} is TRUE.`);
          logs.push(`[HTTP RES] 200 OK -> {"status": "CONFIRMED", "records": 1}`);
          return { status: 'TRUE', logs, latencyMs: 30 };
        } else {
          logs.push(`[DB COND] ASCII('${actualChar}') ${op} ${testAscii} is FALSE.`);
          logs.push(`[HTTP RES] 404 NOT_FOUND -> {"status": "NOT_FOUND", "records": 0}`);
          return { status: 'FALSE', logs, latencyMs: 29 };
        }
      }
    }

    // Default unrecognized or false condition
    logs.push(`[DB COND] Condition did not evaluate to TRUE on target schema.`);
    logs.push(`[HTTP RES] 404 NOT_FOUND -> {"status": "NOT_FOUND", "records": 0}`);
    return { status: 'FALSE', logs, latencyMs: 31 };
  };

  const handleManualExecute = () => {
    sound.playClick();
    const result = evaluateQuery(inputPayload);
    setQueryLogs(result.logs);
    setLastStatus(result.status);

    if (result.status === 'TRUE') {
      sound.playSuccess();
    } else {
      sound.playError();
    }
  };

  // Run automated exfiltration script simulation
  const handleToggleAutomate = async () => {
    if (isAutomating) {
      autoRef.current.cancel = true;
      setIsAutomating(false);
      return;
    }

    autoRef.current.cancel = false;
    setIsAutomating(true);
    sound.playClick();

    let recovered = extractedChars;
    const startIdx = recovered.length;

    for (let pos = startIdx + 1; pos <= FLAG.length; pos++) {
      if (autoRef.current.cancel) break;

      const targetChar = FLAG[pos - 1];
      // Simulated binary search / probe sequence
      const probePayload = `AG-007' AND (SELECT SUBSTR(flag, ${pos}, 1) FROM classified_vault) = '${targetChar}' --`;
      setInputPayload(probePayload);

      const res = evaluateQuery(probePayload);
      setQueryLogs(res.logs);
      setLastStatus(res.status);

      recovered += targetChar;
      setExtractedChars(recovered);
      setAutoProgress(Math.round((recovered.length / FLAG.length) * 100));

      sound.playClick();

      await new Promise(r => setTimeout(r, speedMs));
    }

    setIsAutomating(false);

    if (recovered.length === FLAG.length) {
      setIsCompleted(true);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    }
  };

  const handleReset = () => {
    autoRef.current.cancel = true;
    setIsAutomating(false);
    setExtractedChars('');
    setAutoProgress(0);
    setIsCompleted(false);
    setInputPayload("AG-007' AND (SELECT SUBSTR(flag, 1, 1) FROM classified_vault) = 'f' --");
    setQueryLogs([]);
    setLastStatus('IDLE');
    sound.playClick();
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Overview Banner */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono font-semibold text-rose-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Target: Military Intelligence Directory Service (Blind SQLi)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The endpoint returns <span className="text-emerald-400 font-mono font-semibold">200 OK (CONFIRMED)</span> if the SQL query matches, and <span className="text-rose-400 font-mono font-semibold">404 NOT FOUND</span> otherwise. No database error messages or table data are ever returned directly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Exfiltration Status:</span>
          <span className={`px-2 py-0.5 rounded font-mono font-semibold border ${
            lastStatus === 'TRUE'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : lastStatus === 'FALSE'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {lastStatus === 'TRUE' ? 'HTTP 200 (TRUE)' : lastStatus === 'FALSE' ? 'HTTP 404 (FALSE)' : 'AWAITING PROBE'}
          </span>
        </div>
      </div>

      {/* Manual Probe Query Form */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>HTTP GET Parameter: agent_id (SQL Injection Payload)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputPayload("AG-007' AND 1=1 --");
                sound.playClick();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Preset: 1=1
            </button>
            <button
              onClick={() => {
                setInputPayload("AG-007' AND 1=2 --");
                sound.playClick();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Preset: 1=2
            </button>
            <button
              onClick={() => {
                setInputPayload("AG-007' AND (SELECT SUBSTR(flag, 1, 1) FROM classified_vault) = 'f' --");
                sound.playClick();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Preset: SUBSTR='f'
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputPayload}
            onChange={e => setInputPayload(e.target.value)}
            disabled={isAutomating}
            placeholder="Enter boolean SQL injection payload..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleManualExecute}
            disabled={isAutomating}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send Probe</span>
          </button>
        </div>
      </div>

      {/* Automated Blind Exfiltration Script Console */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automated Blind Exfiltration Engine (Boolean Oracle)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Simulates a multi-threaded binary search script probing byte-by-byte against the remote database.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={speedMs}
              onChange={e => setSpeedMs(Number(e.target.value))}
              disabled={isAutomating}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-300"
            >
              <option value={200}>Pace: Normal (200ms)</option>
              <option value={100}>Pace: Fast (100ms)</option>
              <option value={40}>Pace: Turbo (40ms)</option>
            </select>

            <button
              onClick={handleToggleAutomate}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isAutomating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isAutomating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutomating ? 'Pause Script' : 'Run Auto-Exfiltration'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Extractor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Recovered Plaintext */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Recovered Secret Buffer:</span>
            <span className="text-emerald-400 font-bold">{extractedChars.length} / {FLAG.length} bytes ({autoProgress}%)</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{ width: `${autoProgress}%` }}
            />
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded font-mono text-xs text-emerald-300 min-h-[42px] flex items-center justify-between overflow-x-auto">
            <span>{extractedChars || '<no bytes recovered yet - run probe or auto script>'}</span>
            {isCompleted && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shrink-0 ml-2">
                <CheckCircle2 className="w-3 h-3" />
                EXFILTRATED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Server Logs Terminal */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Database Gateway Response Stream</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">PostgreSQL 15.3 (Simulated)</span>
        </div>

        <div className="bg-black/80 rounded p-3 font-mono text-xs space-y-1 h-32 overflow-y-auto border border-slate-800/80">
          {queryLogs.length === 0 ? (
            <div className="text-slate-600 italic">No queries executed yet. Send a probe to view HTTP/SQL telemetry.</div>
          ) : (
            queryLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('200 OK') || log.includes('TRUE')
                    ? 'text-emerald-400'
                    : log.includes('404 NOT_FOUND') || log.includes('FALSE')
                    ? 'text-rose-400'
                    : log.includes('[SQL')
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
