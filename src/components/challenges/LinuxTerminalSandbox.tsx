import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, Copy, HelpCircle, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

const FLAG = 'flag{su1d_p4th_h1j4ck_r00t_sh3ll_901}';

interface FileSystemNode {
  type: 'file' | 'dir';
  content?: string;
  perms: string;
  owner: string;
  group: string;
}

export const LinuxTerminalSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [currentDir, setCurrentDir] = useState<string>('/home/guest');
  const [user, setUser] = useState<string>('guest');
  const [isRoot, setIsRoot] = useState<boolean>(false);
  const [pathVar, setPathVar] = useState<string>('/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin');
  const [customTarContent, setCustomTarContent] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [inputVal, setInputVal] = useState<string>('');
  const [lines, setLines] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: 'Linux ctf-node-07 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' },
    { type: 'output', text: 'The programs included with the Debian GNU/Linux system are free software.' },
    { type: 'output', text: 'guest@ctf-node-07:~$ Type "help" or run standard UNIX enumeration commands.' }
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    sound.playClick();
    const promptPrefix = isRoot ? 'root@ctf-node-07:~# ' : `${user}@ctf-node-07:${currentDir === '/home/guest' ? '~' : currentDir}$ `;
    const newLines = [...lines, { type: 'input' as const, text: `${promptPrefix}${raw}` }];

    // Record history
    setHistory(prev => [raw, ...prev]);
    setHistoryIndex(-1);

    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Command parser
    if (cmd === 'clear') {
      setLines([]);
      setInputVal('');
      return;
    }

    if (cmd === 'help') {
      newLines.push({
        type: 'output',
        text: 'Available commands: ls, cd, pwd, cat, whoami, id, sudo, find, strings, echo, export, chmod, /usr/local/bin/sys-backup, clear'
      });
    } else if (cmd === 'whoami') {
      newLines.push({ type: 'output', text: isRoot ? 'root' : 'guest' });
    } else if (cmd === 'id') {
      newLines.push({
        type: 'output',
        text: isRoot
          ? 'uid=0(root) gid=0(root) groups=0(root)'
          : 'uid=1001(guest) gid=1001(guest) groups=1001(guest)'
      });
    } else if (cmd === 'pwd') {
      newLines.push({ type: 'output', text: currentDir });
    } else if (cmd === 'sudo') {
      newLines.push({
        type: 'output',
        text: 'Sorry, user guest is not allowed to execute sudo on ctf-node-07.'
      });
    } else if (cmd === 'ls') {
      const isLa = args.includes('-la') || args.includes('-l') || args.includes('-a');
      if (currentDir === '/home/guest') {
        if (isLa) {
          newLines.push({
            type: 'output',
            text: 'total 24\ndrwxr-xr-x 2 guest guest 4096 Sep 27 10:30 .\ndrwxr-xr-x 3 root  root  4096 Sep 27 10:20 ..\n-rw-r--r-- 1 guest guest  220 Sep 27 10:21 .bash_logout\n-rw-r--r-- 1 guest guest 3526 Sep 27 10:21 .bashrc\n-rw-r--r-- 1 guest guest  142 Sep 27 10:32 notes.txt'
          });
        } else {
          newLines.push({ type: 'output', text: 'notes.txt' });
        }
      } else if (currentDir === '/tmp') {
        if (customTarContent) {
          newLines.push({
            type: 'output',
            text: isLa
              ? '-rwxr-xr-x 1 guest guest 42 Sep 27 10:40 tar'
              : 'tar'
          });
        } else {
          newLines.push({ type: 'output', text: '' });
        }
      } else if (currentDir === '/usr/local/bin') {
        newLines.push({
          type: 'output',
          text: isLa
            ? '-rwsr-xr-x 1 root root 18420 Sep 27 09:15 sys-backup'
            : 'sys-backup'
        });
      } else if (currentDir === '/root') {
        if (isRoot) {
          newLines.push({
            type: 'output',
            text: isLa ? '-r-------- 1 root root 42 Sep 27 09:00 flag.txt' : 'flag.txt'
          });
        } else {
          newLines.push({ type: 'output', text: 'ls: cannot open directory \'/root\': Permission denied' });
        }
      } else {
        newLines.push({ type: 'output', text: 'bin  boot  dev  etc  home  lib  proc  root  sys  tmp  usr  var' });
      }
    } else if (cmd === 'cd') {
      const target = args[0] || '/home/guest';
      if (target === '~' || target === '/home/guest') {
        setCurrentDir('/home/guest');
      } else if (target === '/tmp' || target === 'tmp') {
        setCurrentDir('/tmp');
      } else if (target === '/usr/local/bin') {
        setCurrentDir('/usr/local/bin');
      } else if (target === '/root') {
        if (isRoot) {
          setCurrentDir('/root');
        } else {
          newLines.push({ type: 'output', text: 'bash: cd: /root: Permission denied' });
        }
      } else if (target === '..') {
        setCurrentDir(currentDir === '/home/guest' ? '/home' : '/');
      } else if (target === '/') {
        setCurrentDir('/');
      } else {
        newLines.push({ type: 'output', text: `bash: cd: ${target}: No such file or directory` });
      }
    } else if (cmd === 'cat') {
      const target = args[0] || '';
      if (target === 'notes.txt' || target === '/home/guest/notes.txt') {
        newLines.push({
          type: 'output',
          text: 'TODO for DevOps:\n- Replace cron backup scripts.\n- Audit /usr/local/bin/sys-backup permissions.\n- Secure root flag file in /root/flag.txt.'
        });
      } else if (target === '/root/flag.txt' || (currentDir === '/root' && target === 'flag.txt')) {
        if (isRoot) {
          newLines.push({ type: 'output', text: FLAG });
          sound.playSuccess();
          if (onFlagFound) onFlagFound(FLAG);
        } else {
          newLines.push({ type: 'output', text: 'cat: /root/flag.txt: Permission denied' });
        }
      } else if (target === 'tar' || target === '/tmp/tar') {
        if (customTarContent) {
          newLines.push({ type: 'output', text: customTarContent });
        } else {
          newLines.push({ type: 'output', text: 'cat: tar: No such file or directory' });
        }
      } else {
        newLines.push({ type: 'output', text: `cat: ${target}: No such file or directory` });
      }
    } else if (raw.includes('find') && raw.includes('-u=s')) {
      newLines.push({
        type: 'output',
        text: '/usr/bin/passwd\n/usr/bin/chfn\n/usr/bin/newgrp\n/usr/bin/gpasswd\n/usr/local/bin/sys-backup\n/bin/mount\n/bin/umount'
      });
    } else if (cmd === 'strings') {
      const target = args[0] || '';
      if (target.includes('sys-backup')) {
        newLines.push({
          type: 'output',
          text: '/lib64/ld-linux-x86-64.so.2\nsetuid\nsetgid\nsystem\ntar -czf /var/backups/snapshot.tar.gz /home/guest\n[SYS-BACKUP] Archiving completed successfully.\nGCC: (Debian 12.2.0-14)'
        });
      } else {
        newLines.push({ type: 'output', text: `strings: '${target}': No such file` });
      }
    } else if (raw.startsWith('echo') && (raw.includes('>') || raw.includes('>>'))) {
      const match = raw.match(/echo\s+["']?(.*?)["']?\s*>{1,2}\s*(.*)/);
      if (match) {
        const content = match[1];
        const dest = match[2].trim();
        if (dest === '/tmp/tar' || (currentDir === '/tmp' && dest === 'tar')) {
          setCustomTarContent(content);
          newLines.push({ type: 'output', text: '' });
        } else {
          newLines.push({ type: 'output', text: `bash: ${dest}: Permission denied` });
        }
      }
    } else if (cmd === 'chmod') {
      newLines.push({ type: 'output', text: '' });
    } else if (raw.startsWith('export')) {
      if (raw.includes('PATH=/tmp')) {
        setPathVar('/tmp:' + pathVar);
        newLines.push({ type: 'output', text: '' });
      } else {
        newLines.push({ type: 'output', text: '' });
      }
    } else if (raw === '/usr/local/bin/sys-backup' || (currentDir === '/usr/local/bin' && raw === './sys-backup')) {
      newLines.push({
        type: 'output',
        text: '[SYS-BACKUP] Starting automated backup with SUID root privileges...'
      });

      // Check if PATH has /tmp first and /tmp/tar exists
      if (pathVar.startsWith('/tmp') && customTarContent) {
        newLines.push({
          type: 'output',
          text: '[HIJACK] Executing customized tar binary from PATH: /tmp/tar as root (uid=0)...'
        });
        newLines.push({
          type: 'output',
          text: `[ROOT ACCESS GRANTED] Executing payload: "${customTarContent}"`
        });
        newLines.push({
          type: 'output',
          text: `>>> ${FLAG} <<<`
        });
        setIsRoot(true);
        setUser('root');
        setCurrentDir('/root');
        sound.playSuccess();
        if (onFlagFound) onFlagFound(FLAG);
      } else {
        newLines.push({
          type: 'output',
          text: '[SYS-BACKUP] Standard tar executed. Archive /var/backups/snapshot.tar.gz created.'
        });
      }
    } else {
      newLines.push({ type: 'output', text: `bash: ${cmd}: command not found` });
    }

    setLines(newLines);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  const injectExploitSequence = () => {
    sound.playClick();
    setCustomTarContent('cat /root/flag.txt');
    setPathVar('/tmp:' + pathVar);
    const injected = [
      ...lines,
      { type: 'input' as const, text: 'guest@ctf-node-07:~$ echo "cat /root/flag.txt" > /tmp/tar && chmod +x /tmp/tar' },
      { type: 'input' as const, text: 'guest@ctf-node-07:~$ export PATH=/tmp:$PATH' },
      { type: 'input' as const, text: 'guest@ctf-node-07:~$ /usr/local/bin/sys-backup' },
      { type: 'output' as const, text: '[SYS-BACKUP] Starting automated backup with SUID root privileges...' },
      { type: 'output' as const, text: '[HIJACK] Executing customized tar binary from PATH: /tmp/tar as root (uid=0)...' },
      { type: 'output' as const, text: `[ROOT ACCESS GRANTED] ${FLAG}` }
    ];
    setLines(injected);
    setIsRoot(true);
    setUser('root');
    setCurrentDir('/root');
    sound.playSuccess();
    if (onFlagFound) onFlagFound(FLAG);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Terminal className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Interactive SSH Session: ctf-node-07 (Debian GNU/Linux 12)</div>
          <div className="text-xs text-slate-400">
            Target Host: <code className="text-rose-300 font-mono">10.10.14.99</code> · Current User: <code className="text-rose-300 font-mono">{user}</code> ({isRoot ? 'ROOT #0' : 'UID 1001'})
          </div>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Terminal Header Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-xs text-slate-400">
              {isRoot ? 'root@ctf-node-07:~#' : 'guest@ctf-node-07:~$'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={injectExploitSequence}
              className="text-xs text-rose-400 hover:text-rose-300 font-sans underline"
            >
              Inject PATH Exploit Chain
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => {
                setLines([]);
                setIsRoot(false);
                setUser('guest');
                setCurrentDir('/home/guest');
                setPathVar('/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin');
                setCustomTarContent(null);
                sound.playClick();
              }}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 font-sans"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="p-4 font-mono text-xs text-slate-200 h-80 overflow-y-auto space-y-1.5 cursor-text"
        >
          {lines.map((l, idx) => (
            <div
              key={idx}
              className={`leading-relaxed whitespace-pre-wrap ${
                l.type === 'input'
                  ? 'text-cyan-300 font-semibold'
                  : l.text.includes('flag{')
                  ? 'text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded border border-emerald-500/30'
                  : l.text.includes('HIJACK') || l.text.includes('ROOT')
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {l.text}
            </div>
          ))}

          {/* Prompt line */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold shrink-0">
              {isRoot ? 'root@ctf-node-07:~#' : `${user}@ctf-node-07:${currentDir === '/home/guest' ? '~' : currentDir}$`}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs focus:ring-0 p-0"
              autoFocus
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>

      {isRoot && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Root Shell Acquired! Flag: {FLAG}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(FLAG);
              sound.playClick();
            }}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Flag</span>
          </button>
        </div>
      )}
    </div>
  );
};
