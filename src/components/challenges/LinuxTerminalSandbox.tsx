import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{su1d_p4th_h1j4ck_r00t_sh3ll_901}';

export const LinuxTerminalSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [cmd, setCmd] = useState<string>('');
  const [hasHijackedPath, setHasHijackedPath] = useState<boolean>(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Linux ctf-node-07 5.15.0-x86_64 GNU/Linux',
    'guest@ctf-node-07:~$ Run enumeration commands or exploit SUID binaries.'
  ]);

  const handleRun = () => {
    sound.playClick();
    const clean = cmd.trim();
    const newLogs = [...terminalLines, `guest@ctf-node-07:~$ ${clean}`];

    if (clean.includes('find') && clean.includes('perm')) {
      newLogs.push('/usr/local/bin/sys-backup (SUID root:root)');
    } else if (clean.includes('strings') && clean.includes('sys-backup')) {
      newLogs.push('system("tar -czf /var/backups/archive.tar.gz /home/guest")');
      newLogs.push('[*] Vulnerability: Relative execution of "tar" without absolute path!');
    } else if (clean.includes('PATH=/tmp:$PATH') || clean.includes('export PATH=/tmp')) {
      setHasHijackedPath(true);
      newLogs.push('[+] PATH updated. /tmp now takes precedence.');
    } else if (clean.includes('/usr/local/bin/sys-backup') || clean.includes('sys-backup')) {
      if (hasHijackedPath) {
        sound.playSuccess();
        newLogs.push('[+] SUID root executed /tmp/tar with effective UID 0 (root)!');
        newLogs.push(`root@ctf-node-07:~# cat /root/flag.txt => ${SECRET_FLAG}`);
        onFlagFound(SECRET_FLAG);
      } else {
        newLogs.push('tar: Creating archive /var/backups/archive.tar.gz...');
        newLogs.push('(Standard backup completed as guest)');
      }
    } else {
      newLogs.push(`bash: ${clean}: command executed`);
    }

    setTerminalLines(newLogs);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Privilege Escalation Terminal</span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 max-h-48 overflow-y-auto text-slate-300">
          {terminalLines.map((l, i) => (
            <div key={i} className={l.includes('flag{') ? 'text-emerald-400 font-bold' : ''}>{l}</div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRun()}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="e.g. export PATH=/tmp:$PATH..."
          />
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Execute
          </button>
        </div>

        {/* Common commands helper */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-500">Quick commands:</span>
          <button
            onClick={() => setCmd('find / -perm -4000 -type f 2>/dev/null')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            find SUID binaries
          </button>
          <button
            onClick={() => setCmd('strings /usr/local/bin/sys-backup')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            inspect binary strings
          </button>
          <button
            onClick={() => setCmd('echo $PATH')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            echo $PATH
          </button>
        </div>
      </div>
    </div>
  );
};
