import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Shield, HelpCircle, RefreshCw } from 'lucide-react';
import { Challenge } from '../../types/ctf';
import { sound } from '../../utils/audio';

interface Props {
  challenge: Challenge;
  onFlagFound: (flag: string) => void;
}

export const UniversalTerminalSandbox: React.FC<Props> = ({ challenge, onFlagFound }) => {
  const [inputCmd, setInputCmd] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: 'uname -a && id',
      output: `Linux ctf-sandbox-box 6.6.14-cyberstrike x86_64\nuid=1001(guest) gid=1001(guest) groups=1001(guest)`
    },
    {
      cmd: 'ls -la',
      output: `total 32\ndrwxr-xr-x 2 guest guest 4096 Sep 28 00:00 .\ndrwxr-xr-x 4 root  root  4096 Sep 28 00:00 ..\n-rwxr-xr-x 1 root  root  8840 Sep 28 00:00 target_service\n-rw-r----- 1 root  guest  128 Sep 28 00:00 instructions.txt\n-rw-r----- 1 root  root    64 Sep 28 00:00 secret_flag.enc`
    }
  ]);
  const [captured, setCaptured] = useState(false);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCmd.trim();
    if (!cmd) return;

    sound.playClick();
    setInputCmd('');

    let output = '';
    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      output = `Supported Commands:\n  help                 Display command list\n  ls [-la]             List directory contents\n  cat <file>           Display file contents\n  strings <file>       Extract printable ASCII strings\n  curl <url>           Fetch remote endpoint\n  solve                Analyze challenge payload and verify solution\n  clear                Clear terminal output\n  inspect              Examine target binary headers`;
    } else if (lower === 'clear') {
      setHistory([]);
      return;
    } else if (lower.startsWith('cat instructions') || lower.startsWith('cat instructions.txt')) {
      output = `Target: ${challenge.title}\nCategory: ${challenge.category} | Difficulty: ${challenge.difficulty}\nObjective: ${challenge.description}`;
    } else if (lower.startsWith('cat secret_flag.enc')) {
      output = `[Encrypted stream]: \\x7b\\x99\\x81\\x44\\xfa\\x01... Permission denied: raw root key required.`;
    } else if (lower.startsWith('strings target_service')) {
      output = `/lib64/ld-linux-x86-64.so.2\nlibc.so.6\nputs\nprintf\nFLAG_PAYLOAD_SECTION\nTarget Verification Service v2.4\nHint: Check challenge hints tab or solve directly.`;
    } else if (lower === 'solve' || lower.includes('cat flag') || lower.includes(challenge.flag.toLowerCase())) {
      output = `[+] Solution verified!\n[+] Target unlocked.\n[+] FLAG: ${challenge.flag}`;
      sound.playSuccess();
      setCaptured(true);
      onFlagFound(challenge.flag);
    } else if (lower.startsWith('curl')) {
      output = `HTTP/1.1 200 OK\nServer: Internal-Test/1.0\n{"status": "online", "challenge": "${challenge.id}"}`;
    } else if (lower.startsWith('ls')) {
      output = `target_service  instructions.txt  secret_flag.enc`;
    } else {
      output = `bash: ${cmd}: command not executed. Type 'help' for available diagnostic tools.`;
    }

    setHistory(prev => [...prev, { cmd, output }]);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          Interactive Cyber Investigation Shell
        </span>
        <span>Target: {challenge.id}</span>
      </div>

      <div className="p-4 bg-black/95 border border-slate-800 rounded-lg font-mono text-xs space-y-3 min-h-[220px] max-h-[340px] overflow-y-auto">
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="text-slate-500">guest@cyberstrike:~$</span>
              <span className="text-slate-100">{h.cmd}</span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed pl-2 border-l border-slate-800 text-[11px]">
              {h.output}
            </pre>
          </div>
        ))}

        <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2 border-t border-slate-900">
          <span className="text-emerald-500 font-bold">guest@cyberstrike:~$</span>
          <input
            type="text"
            value={inputCmd}
            onChange={e => setInputCmd(e.target.value)}
            placeholder="Type 'help' or enter commands..."
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-600 font-mono text-xs"
            autoFocus
          />
          <button type="submit" className="text-slate-400 hover:text-emerald-400">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {captured && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center justify-between">
          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Flag Found: {challenge.flag}
          </span>
          <button
            onClick={() => onFlagFound(challenge.flag)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-sans"
          >
            Auto-Fill Flag
          </button>
        </div>
      )}
    </div>
  );
};
