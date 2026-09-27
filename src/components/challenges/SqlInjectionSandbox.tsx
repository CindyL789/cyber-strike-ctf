import React, { useState } from 'react';
import { Terminal, Database, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const SqlInjectionSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [username, setUsername] = useState("admin' OR '1'='1' --");
  const [password, setPassword] = useState('any_pass');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [flag, setFlag] = useState<string | null>(null);

  const FLAG = 'flag{sql_1nj3ct10n_m4st3r_992}';

  const simulatedQuery = `SELECT id, user, role, token FROM operators WHERE user = '${username}' AND pass = '${password}';`;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const newLogs: string[] = [];
    newLogs.push(`[REQ] POST /admin/login HTTP/1.1`);
    newLogs.push(`[SQL] ${simulatedQuery}`);

    // Check for SQL injection patterns
    const un = username.trim();
    const isSqliBypass =
      (un.includes("' OR '") || un.includes("' or '") || un.includes("' OR 1=1") || un.includes("' or 1=1") || un.includes("' OR '1'='1") || un.includes("' or '1'='1")) &&
      (un.includes('--') || un.includes('#') || un.includes('/*'));

    const isUnionSelect = un.toUpperCase().includes('UNION') && un.toUpperCase().includes('SELECT');

    if (isSqliBypass || isUnionSelect) {
      newLogs.push(`[DB] Query parsed: condition evaluates to TRUE for all rows.`);
      newLogs.push(`[DB] Matched record: { id: 1, user: 'root_admin', role: 'SuperAdmin' }`);
      newLogs.push(`[AUTH] Session established. Access granted to Mission Control Vault.`);
      setIsSuccess(true);
      setFlag(FLAG);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    } else if (un === 'admin' && password === 'SuperSecretMasterPassword2026!') {
      newLogs.push(`[DB] Matched operator credentials.`);
      setIsSuccess(true);
      setFlag(FLAG);
      sound.playSuccess();
    } else {
      newLogs.push(`[DB] 0 rows returned.`);
      newLogs.push(`[AUTH] 401 Unauthorized: Invalid operator credentials.`);
      setIsSuccess(false);
      sound.playError();
    }

    setLogs(newLogs);
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Target description banner */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Simulated Target: Mission Control Login Gateway</div>
          <div className="text-xs text-slate-400">
            Target Endpoint: <code className="text-emerald-300 font-mono">POST /admin/login</code> · Backend Database: SQLite v3.42
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form panel */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authentication Gateway</div>

          <form onSubmit={handleExecute} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username / Operator ID</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                placeholder="e.g. admin' OR '1'='1' --"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                placeholder="Password"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors flex items-center gap-2"
              >
                <span>Execute Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin' OR '1'='1' --");
                  setPassword('bypass');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
              >
                Insert SQLi Payload
              </button>
            </div>
          </form>

          {/* Live SQL Preview */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Server Backend Query Template:</div>
            <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-amber-300/90 overflow-x-auto whitespace-pre-wrap break-all">
              {simulatedQuery}
            </pre>
          </div>
        </div>

        {/* Server Response & Logs */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Backend Telemetry
              </span>
              <span className="text-slate-500 font-mono text-[11px]">PORT: 5432</span>
            </div>

            <div className="h-44 p-3 bg-slate-900/90 border border-slate-800 rounded font-mono text-xs overflow-y-auto space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">Awaiting login request... Submit credentials to test injection.</div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.startsWith('[AUTH] Session') || log.startsWith('[DB] Matched')
                        ? 'text-emerald-400 font-semibold'
                        : log.startsWith('[AUTH] 401')
                        ? 'text-rose-400'
                        : log.startsWith('[SQL]')
                        ? 'text-amber-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Flag result reveal */}
          {isSuccess && flag && (
            <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authentication Bypassed! Flag Extracted:</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-emerald-800/40">
                <code className="text-emerald-300 font-mono text-xs select-all">{flag}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(flag);
                    sound.playClick();
                  }}
                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
