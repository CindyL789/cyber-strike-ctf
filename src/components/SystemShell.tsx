import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  Trash2,
  FolderTree,
  Send,
  HelpCircle,
  Copy,
  Check,
  Folder,
  FileCode,
  Shield,
  Sparkles,
  Zap,
  Info,
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { Challenge, UserProfile } from '../types/ctf';
import { sound } from '../utils/audio';

interface Props {
  challenges: Challenge[];
  userProfile: UserProfile | null;
  onSubmitFlag: (challengeId: string, flag: string) => boolean;
  onOpenChallenge?: (challenge: Challenge) => void;
}

interface FileNode {
  type: 'file' | 'dir';
  content?: string;
  perms: string;
  size: number;
  updated: string;
  challengeId?: string;
  isExecutable?: boolean;
}

// Initial virtual filesystem mapped to CTF challenge files
const INITIAL_FS: Record<string, FileNode> = {
  // /home/operator
  '/home/operator': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:00' },
  '/home/operator/README.md': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 512,
    updated: 'Sep 29 20:01',
    content: `# CyberStrike CTF Arena — Interactive System Shell v2.4
Welcome to the simulated host terminal.

Navigate challenge directories using 'cd' and 'ls -la'.
Inspect source code and target artifacts using 'cat <filename>'.
Extract strings from compiled binaries using 'strings <filename>'.
Validate discovered flags directly using: 'submit flag{...}'

Quick Commands:
  ls -la     : List current directory with file details
  cd <dir>   : Navigate to target directory
  pwd        : Print current working directory
  cat <file> : Display file contents
  whoami     : Display active operator credentials
  tree       : Render directory structure of challenge files
  strings <f>: Extract ASCII strings from target binaries
  file <f>   : Identify file type
  submit <f> : Submit a flag directly to the scoring engine
  clear      : Clear terminal screen
`
  },
  '/home/operator/notes.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 240,
    updated: 'Sep 29 20:15',
    content: `OPERATOR FIELD NOTES:
- Check Web auth services for unsanitized string interpolations in SQL queries.
- Look for JWT algorithms set to "none" in token headers.
- Single-byte XOR ciphers can be reversed by XORing known header bytes ("flag{").
- SUID binaries calling relative paths like "tar" can be hijacked via custom PATH.
`
  },

  // /home/operator/challenges
  '/home/operator/challenges': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },

  // --- Web challenges ---
  '/home/operator/challenges/web': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },
  '/home/operator/challenges/web/sqli-auth-bypass': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:10',
    challengeId: 'sqli-auth-bypass'
  },
  '/home/operator/challenges/web/sqli-auth-bypass/auth_service.py': {
    type: 'file',
    perms: '-rwxr-xr-x',
    size: 1420,
    updated: 'Sep 29 20:10',
    challengeId: 'sqli-auth-bypass',
    isExecutable: true,
    content: `import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    user = data.get('username', '')
    passwd = data.get('password', '')

    # VULNERABLE: Direct SQL string interpolation
    query = f"SELECT * FROM operators WHERE username = '{user}' AND password = '{passwd}'"
    print(f"[DEBUG SQL EXEC]: {query}")

    db = sqlite3.connect('database.sqlite')
    cursor = db.cursor()
    cursor.execute(query)
    match = cursor.fetchone()

    if match:
        return jsonify({
            "status": "authenticated",
            "role": match[1],
            "flag": "flag{sql_1nj3ct10n_m4st3r_992}"
        })
    return jsonify({"error": "Invalid credentials"}), 401
`
  },
  '/home/operator/challenges/web/sqli-auth-bypass/database.sqlite': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 8192,
    updated: 'Sep 29 20:10',
    challengeId: 'sqli-auth-bypass',
    content: `SQLite format 3\x00...
TABLE operators (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
DATA: (1, 'commander', '7e2c9182390a1b8e4f1', 'admin');
DATA: (2, 'operator_07', '8b9d31f00a2e7c4b123', 'guest');
`
  },

  // JWT Tamper
  '/home/operator/challenges/web/jwt-tamper-bypass': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:12',
    challengeId: 'jwt-tamper-bypass'
  },
  '/home/operator/challenges/web/jwt-tamper-bypass/jwt_auth.js': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 980,
    updated: 'Sep 29 20:12',
    challengeId: 'jwt-tamper-bypass',
    content: `const jwt = require('jsonwebtoken');

function verifySession(token) {
  // Vulnerability: Header algorithm 'none' is accepted by unhardened parser
  const [headerB64, payloadB64] = token.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

  if (header.alg === 'none') {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.role === 'admin' || payload.isAdmin === true) {
      return { authorized: true, flag: 'flag{jwt_n0n3_4lg_auth_byp4ss_718}' };
    }
  }
  return { authorized: false, error: 'Access denied' };
}
`
  },
  '/home/operator/challenges/web/jwt-tamper-bypass/token.jwt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 215,
    updated: 'Sep 29 20:12',
    challengeId: 'jwt-tamper-bypass',
    content: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3Rfb3BlcmF0b3IiLCJyb2xlIjoiZ3Vlc3QiLCJpc0FkbWluIjpmYWxzZX0.sig_test_dummy`
  },

  // --- Crypto challenges ---
  '/home/operator/challenges/crypto': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },
  '/home/operator/challenges/crypto/ghost-cipher': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:14',
    challengeId: 'xor-frequency-breaker'
  },
  '/home/operator/challenges/crypto/ghost-cipher/ciphertext.hex': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 82,
    updated: 'Sep 29 20:14',
    challengeId: 'xor-frequency-breaker',
    content: `2d272a2c30337b3914287a3b2378391429397b20782514357a7f142d39783a36782528321473737a36`
  },
  '/home/operator/challenges/crypto/ghost-cipher/cipher_spec.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 420,
    updated: 'Sep 29 20:14',
    challengeId: 'xor-frequency-breaker',
    content: `CIPHER SPECIFICATION:
Type: Single-Byte Repeating XOR
Known Plaintext Header: "flag{"
Hint: Byte 0x2d ^ 'f' (0x66) = Key Byte (0x4B)
Resulting flag: flag{x0r_c1ph3r_br0k3n_v14_fr3qu3ncy_881}
`
  },

  // Hastad's Whisper
  '/home/operator/challenges/crypto/hastads-whisper': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:15',
    challengeId: 'rsa-cube-root-weakness'
  },
  '/home/operator/challenges/crypto/hastads-whisper/public_key.info': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 320,
    updated: 'Sep 29 20:15',
    challengeId: 'rsa-cube-root-weakness',
    content: `RSA Public Parameters:
e = 3 (Low Public Exponent)
n = 0x8a92f03b41... (2048-bit modulus)
Padding: NONE
Note: Since m^3 < n, ciphertext c is the unreduced integer cube of m.`
  },

  // --- Reverse challenges ---
  '/home/operator/challenges/reverse': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },
  '/home/operator/challenges/reverse/crackme': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:16',
    challengeId: 'reverse-disassembler-crackme'
  },
  '/home/operator/challenges/reverse/crackme/keygen_check.asm': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 610,
    updated: 'Sep 29 20:16',
    challengeId: 'reverse-disassembler-crackme',
    content: `; x86 License Key Verification Routine
section .text
verify_key:
    mov eax, [esp + 4]    ; load candidate key
    xor eax, 0x5a         ; step 1: XOR mask
    rol eax, 3            ; step 2: rotate left 3 bits
    add eax, 0x1337       ; step 3: add offset
    and eax, 0xffff       ; mask to 16-bit
    cmp eax, 0xd4b2       ; comparison check
    jne key_invalid
    mov edx, flag_pwned   ; flag{r3v_4ss3mbly_cr4ckm3_pwn3d_334}
    ret
`
  },
  '/home/operator/challenges/reverse/crackme/crackme.bin': {
    type: 'file',
    perms: '-rwxr-xr-x',
    size: 16384,
    updated: 'Sep 29 20:16',
    challengeId: 'reverse-disassembler-crackme',
    isExecutable: true,
    content: `\x7fELF\x02\x01\x01\x00\x00... [ELF 64-bit LSB pie executable, x86-64]
Strings:
GLIBC_2.34
verify_key
target_hash: 0xD4B2
Access Granted: flag{r3v_4ss3mbly_cr4ckm3_pwn3d_334}
`
  },

  // --- Forensics challenges ---
  '/home/operator/challenges/forensics': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },
  '/home/operator/challenges/forensics/pcap-exfil': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:18',
    challengeId: 'pcap-stream-exfiltration'
  },
  '/home/operator/challenges/forensics/pcap-exfil/capture_summary.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 380,
    updated: 'Sep 29 20:18',
    challengeId: 'pcap-stream-exfiltration',
    content: `PCAP Analysis Summary:
Target File: dump_094.pcap (45.2 KB)
TCP Stream #3: POST /sync/report HTTP/1.1
Header Host: exfil.remote-telemetry.org
Exfiltrated Parameter: upload_blob=ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==
Decoded Content: flag{pc4p_p4ck3t_str34m_huttp_3xf1l_617}
`
  },

  // --- Pwn challenges ---
  '/home/operator/challenges/pwn': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 20:05' },
  '/home/operator/challenges/pwn/suid-privesc': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 29 20:20',
    challengeId: 'linux-suid-privesc'
  },
  '/home/operator/challenges/pwn/suid-privesc/sys-backup.c': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 490,
    updated: 'Sep 29 20:20',
    challengeId: 'linux-suid-privesc',
    content: `#include <unistd.h>
#include <stdlib.h>

int main() {
    setuid(0);
    setgid(0);
    // VULNERABLE: Invokes 'tar' without absolute path (/bin/tar)
    system("tar -czf /var/backups/archive.tar.gz /home/guest");
    return 0;
}
`
  },
  '/home/operator/challenges/pwn/suid-privesc/exploit_guide.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 340,
    updated: 'Sep 29 20:20',
    challengeId: 'linux-suid-privesc',
    content: `SUID PATH HIJACK TECHNIQUE:
1. Create /tmp/tar containing:
   #!/bin/sh
   cat /root/flag.txt
2. chmod +x /tmp/tar
3. export PATH=/tmp:$PATH
4. Run /usr/local/bin/sys-backup
Result: flag{su1d_p4th_h1j4ck_r00t_sh3ll_901}
`
  },

  // /etc
  '/etc': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 29 19:00' },
  '/etc/os-release': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 190,
    updated: 'Sep 29 19:00',
    content: `NAME="CyberStrike CTF Linux"
VERSION="2026.3 (Hardened Arena)"
ID=cyberstrike
ID_LIKE=debian
PRETTY_NAME="CyberStrike Security OS 2026"
`
  },
  '/etc/hosts': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 120,
    updated: 'Sep 29 19:00',
    content: `127.0.0.1       localhost cyberstrike-terminal
10.10.14.1      gateway.internal.lan
10.10.14.99     scoreboard.cyberstrike.org
`
  },
  '/etc/passwd': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 280,
    updated: 'Sep 29 19:00',
    content: `root:x:0:0:root:/root:/bin/bash
operator:x:1000:1000:CTF Operator:/home/operator:/bin/bash
guest:x:1001:1001:Guest Operative:/home/guest:/bin/sh
ctf-runner:x:1337:1337:Arena Sandbox Daemon:/var/ctf:/usr/sbin/nologin
`
  }
};

export const SystemShell: React.FC<Props> = ({
  challenges,
  userProfile,
  onSubmitFlag,
  onOpenChallenge
}) => {
  const [fs, setFs] = useState<Record<string, FileNode>>(INITIAL_FS);
  const [cwd, setCwd] = useState<string>('/home/operator');
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuickChallenge, setSelectedQuickChallenge] = useState<string>('');

  const [outputLines, setOutputLines] = useState<Array<{
    type: 'input' | 'output' | 'error' | 'success' | 'system';
    text: string;
  }>>([
    { type: 'system', text: '========================================================================' },
    { type: 'system', text: '  CYBERSTRIKE CTF ARENA // INTERACTIVE SYSTEM SHELL v2.4 (x86_64)' },
    { type: 'system', text: '  Simulated Host Environment: Linux 5.15.0-hardened #42-SMP' },
    { type: 'system', text: '========================================================================' },
    { type: 'output', text: 'Session initialized for operator: ' + (userProfile?.username || 'operator') },
    { type: 'output', text: 'Type "help" to see available terminal commands or "ls" to inspect files.' },
    { type: 'output', text: 'Type "tree" to visualize all challenge directories and source files.\n' }
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const username = userProfile?.username || 'operator';
  const promptHost = 'cyberstrike-node';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  const normalizePath = (pathStr: string, current: string): string => {
    let target = pathStr.trim();
    if (!target) return current;

    if (target.startsWith('~')) {
      target = target.replace('~', '/home/operator');
    }

    if (!target.startsWith('/')) {
      target = current === '/' ? `/${target}` : `${current}/${target}`;
    }

    // Resolve . and ..
    const parts = target.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        resolved.pop();
      } else {
        resolved.push(p);
      }
    }
    return '/' + resolved.join('/');
  };

  const getPrompt = () => {
    const displayDir = cwd.startsWith('/home/operator')
      ? cwd.replace('/home/operator', '~')
      : cwd;
    return `${username}@${promptHost}:${displayDir}$ `;
  };

  const executeCommand = (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    sound.playClick();
    const prompt = getPrompt();

    // Record in history
    setHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const newOutputs = [...outputLines, { type: 'input' as const, text: `${prompt}${trimmed}` }];

    const [cmd, ...args] = trimmed.split(/\s+/);
    const argStr = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'clear':
      case 'cls':
        setOutputLines([]);
        setInput('');
        return;

      case 'help':
        newOutputs.push({
          type: 'output',
          text: `SUPPORTED TERMINAL UTILITIES:
  ls [-la] [path]  : List directory entries, permissions, and byte sizes
  cd [path]        : Change current working directory (e.g. cd challenges/web)
  pwd              : Print absolute path of current working directory
  cat <file>       : Output content of text, source, or challenge file
  whoami           : Display authenticated operator identity and role
  id               : Print user identification and group credentials
  tree             : Render visual directory hierarchy of challenge assets
  file <path>      : Determine file type and signature
  strings <path>   : Extract printable characters from binaries or dumps
  grep <str> <f>   : Search for regex or string inside a file
  head/tail <f>    : Display beginning or end lines of a file
  uname [-a]       : Print kernel and system architecture information
  date             : Print current arena timestamp
  env              : Display system environment variables
  echo <text> [>f] : Echo text or write output to a file
  submit <flag>    : Submit a recovered flag directly (e.g. submit flag{...})
  clear            : Clear the terminal console buffer`
        });
        break;

      case 'whoami':
        newOutputs.push({
          type: 'output',
          text: `${username} (${userProfile?.role || 'player'}${userProfile?.badgeTitle ? ` - ${userProfile.badgeTitle}` : ''})`
        });
        break;

      case 'id':
        newOutputs.push({
          type: 'output',
          text: `uid=1000(${username}) gid=1000(operators) groups=1000(operators),27(sudo-recon),1337(ctf-player)`
        });
        break;

      case 'pwd':
        newOutputs.push({ type: 'output', text: cwd });
        break;

      case 'uname':
        newOutputs.push({
          type: 'output',
          text: args.includes('-a')
            ? 'Linux cyberstrike-core 5.15.0-89-generic #99-Ubuntu SMP x86_64 GNU/Linux'
            : 'Linux'
        });
        break;

      case 'date':
        newOutputs.push({ type: 'output', text: new Date().toUTCString() });
        break;

      case 'env':
        newOutputs.push({
          type: 'output',
          text: `USER=${username}
HOME=/home/operator
SHELL=/bin/bash
TERM=xterm-256color
CTF_ARENA=CyberStrike_2026
CREDITS_BALANCE=${userProfile?.tokens ?? 250}
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ROLE=${userProfile?.role || 'player'}
TEAM=${userProfile?.teamName || 'Solo Operator'}`
        });
        break;

      case 'cd': {
        const targetPath = args[0] ? normalizePath(args[0], cwd) : '/home/operator';
        const node = fs[targetPath];

        if (!node) {
          newOutputs.push({ type: 'error', text: `cd: no such file or directory: ${args[0]}` });
        } else if (node.type !== 'dir') {
          newOutputs.push({ type: 'error', text: `cd: not a directory: ${args[0]}` });
        } else {
          setCwd(targetPath);
        }
        break;
      }

      case 'ls':
      case 'dir': {
        const isLa = args.some(a => a.startsWith('-') && a.includes('l'));
        const targetArg = args.find(a => !a.startsWith('-')) || '';
        const targetDir = normalizePath(targetArg, cwd);
        const dirNode = fs[targetDir];

        if (!dirNode) {
          newOutputs.push({ type: 'error', text: `ls: cannot access '${targetArg || cwd}': No such file or directory` });
          break;
        }

        if (dirNode.type === 'file') {
          newOutputs.push({ type: 'output', text: targetArg || cwd });
          break;
        }

        // Collect direct children
        const prefix = targetDir === '/' ? '/' : `${targetDir}/`;
        const entries: Array<{ name: string; node: FileNode }> = [];

        Object.keys(fs).forEach(path => {
          if (path.startsWith(prefix) && path !== targetDir) {
            const rel = path.slice(prefix.length);
            if (!rel.includes('/')) {
              entries.push({ name: rel, node: fs[path] });
            }
          }
        });

        if (entries.length === 0) {
          newOutputs.push({ type: 'output', text: '(directory is empty)' });
        } else if (isLa) {
          const lines = entries.map(e => {
            const typeChar = e.node.type === 'dir' ? 'd' : '-';
            const sizeStr = e.node.size.toString().padStart(6, ' ');
            const displayName = e.node.type === 'dir' ? `${e.name}/` : e.name;
            return `${e.node.perms}  1 operator operators ${sizeStr} ${e.node.updated}  ${displayName}`;
          });
          newOutputs.push({ type: 'output', text: lines.join('\n') });
        } else {
          const names = entries.map(e => (e.node.type === 'dir' ? `${e.name}/` : e.name));
          newOutputs.push({ type: 'output', text: names.join('    ') });
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          newOutputs.push({ type: 'error', text: 'cat: missing operand' });
          break;
        }

        const filePath = normalizePath(args[0], cwd);
        const fileNode = fs[filePath];

        if (!fileNode) {
          newOutputs.push({ type: 'error', text: `cat: ${args[0]}: No such file or directory` });
        } else if (fileNode.type === 'dir') {
          newOutputs.push({ type: 'error', text: `cat: ${args[0]}: Is a directory` });
        } else {
          newOutputs.push({ type: 'output', text: fileNode.content || '(empty file)' });

          // Check if file contains a flag pattern
          const flagMatch = fileNode.content?.match(/flag\{[a-zA-Z0-9_!@#$%^&*+-]+\}/);
          if (flagMatch) {
            sound.playSuccess();
            newOutputs.push({
              type: 'success',
              text: `[!] Flag detected in file output: ${flagMatch[0]} (Type "submit ${flagMatch[0]}" to claim points!)`
            });
          }
        }
        break;
      }

      case 'strings': {
        if (!args[0]) {
          newOutputs.push({ type: 'error', text: 'strings: missing operand' });
          break;
        }
        const filePath = normalizePath(args[0], cwd);
        const fileNode = fs[filePath];
        if (!fileNode || fileNode.type === 'dir') {
          newOutputs.push({ type: 'error', text: `strings: '${args[0]}': No such file` });
        } else {
          const content = fileNode.content || '';
          const printable = content.match(/[A-Za-z0-9_{}\-.:/ ]{4,}/g) || [];
          newOutputs.push({
            type: 'output',
            text: printable.slice(0, 30).join('\n') || 'No ASCII strings located.'
          });
        }
        break;
      }

      case 'file': {
        if (!args[0]) {
          newOutputs.push({ type: 'error', text: 'file: missing operand' });
          break;
        }
        const filePath = normalizePath(args[0], cwd);
        const fileNode = fs[filePath];
        if (!fileNode) {
          newOutputs.push({ type: 'error', text: `file: cannot open '${args[0]}' (No such file or directory)` });
        } else if (fileNode.type === 'dir') {
          newOutputs.push({ type: 'output', text: `${args[0]}: directory` });
        } else if (fileNode.isExecutable) {
          newOutputs.push({ type: 'output', text: `${args[0]}: ELF 64-bit LSB executable, x86-64, dynamically linked, stripped` });
        } else if (filePath.endsWith('.py') || filePath.endsWith('.js') || filePath.endsWith('.c')) {
          newOutputs.push({ type: 'output', text: `${args[0]}: ASCII text with program code` });
        } else {
          newOutputs.push({ type: 'output', text: `${args[0]}: ASCII text` });
        }
        break;
      }

      case 'tree': {
        const root = '/home/operator/challenges';
        const lines: string[] = ['/home/operator/challenges'];

        Object.keys(fs)
          .filter(k => k.startsWith(root) && k !== root)
          .sort()
          .forEach(k => {
            const rel = k.replace(root + '/', '');
            const depth = rel.split('/').length;
            const name = rel.split('/').pop();
            const indent = '  '.repeat(depth);
            const isDir = fs[k].type === 'dir';
            lines.push(`${indent}├── ${name}${isDir ? '/' : ''}`);
          });

        newOutputs.push({ type: 'output', text: lines.join('\n') });
        break;
      }

      case 'grep': {
        if (args.length < 2) {
          newOutputs.push({ type: 'error', text: 'grep: usage: grep <pattern> <file>' });
          break;
        }
        const pattern = args[0];
        const filePath = normalizePath(args[1], cwd);
        const fileNode = fs[filePath];
        if (!fileNode || fileNode.type === 'dir') {
          newOutputs.push({ type: 'error', text: `grep: ${args[1]}: No such file` });
        } else {
          const lines = (fileNode.content || '').split('\n');
          const matched = lines.filter(l => l.toLowerCase().includes(pattern.toLowerCase()));
          if (matched.length > 0) {
            newOutputs.push({ type: 'output', text: matched.join('\n') });
          } else {
            newOutputs.push({ type: 'output', text: `(no occurrences of "${pattern}" found)` });
          }
        }
        break;
      }

      case 'head':
      case 'tail': {
        if (!args[0]) {
          newOutputs.push({ type: 'error', text: `${cmd}: missing file operand` });
          break;
        }
        const filePath = normalizePath(args[0], cwd);
        const fileNode = fs[filePath];
        if (!fileNode || fileNode.type === 'dir') {
          newOutputs.push({ type: 'error', text: `${cmd}: ${args[0]}: No such file` });
        } else {
          const lines = (fileNode.content || '').split('\n');
          const slice = cmd === 'head' ? lines.slice(0, 10) : lines.slice(-10);
          newOutputs.push({ type: 'output', text: slice.join('\n') });
        }
        break;
      }

      case 'echo': {
        if (argStr.includes('>')) {
          const [textPart, filePart] = argStr.split('>');
          const text = textPart.trim().replace(/^["']|["']$/g, '');
          const targetFile = normalizePath(filePart.trim(), cwd);
          setFs(prev => ({
            ...prev,
            [targetFile]: {
              type: 'file',
              perms: '-rw-r--r--',
              size: text.length,
              updated: 'Just now',
              content: text
            }
          }));
          newOutputs.push({ type: 'output', text: `Written ${text.length} bytes to ${filePart.trim()}` });
        } else {
          newOutputs.push({ type: 'output', text: argStr.replace(/^["']|["']$/g, '') });
        }
        break;
      }

      case 'submit': {
        const flag = args[0];
        if (!flag) {
          newOutputs.push({ type: 'error', text: 'Usage: submit <flag>  (e.g. submit flag{...})' });
          break;
        }

        // Locate challenge matching the flag
        const targetChallenge = challenges.find(c => c.flag.trim().toLowerCase() === flag.trim().toLowerCase());
        if (targetChallenge) {
          const success = onSubmitFlag(targetChallenge.id, flag.trim());
          if (success) {
            sound.playSuccess();
            newOutputs.push({
              type: 'success',
              text: `[+] FLAG ACCEPTED! Challenge: "${targetChallenge.title}" (+${targetChallenge.points} points awarded to your scoreboard!)`
            });
          } else {
            newOutputs.push({
              type: 'output',
              text: `[*] Flag already solved for "${targetChallenge.title}".`
            });
          }
        } else {
          sound.playError();
          newOutputs.push({
            type: 'error',
            text: '[-] Invalid flag. Check spelling, casing, or inspect challenge hints.'
          });
        }
        break;
      }

      default:
        newOutputs.push({
          type: 'error',
          text: `bash: ${cmd}: command not found. Type 'help' for available commands.`
        });
        break;
    }

    setOutputLines(newOutputs);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab autocompletion
      const parts = input.split(' ');
      const lastWord = parts[parts.length - 1];
      if (!lastWord) return;

      const children = Object.keys(fs)
        .filter(p => p.startsWith(cwd === '/' ? `/${lastWord}` : `${cwd}/${lastWord}`))
        .map(p => p.split('/').pop() || '');

      if (children.length === 1) {
        parts[parts.length - 1] = children[0];
        setInput(parts.join(' '));
      }
    }
  };

  const jumpToChallenge = (challengeId: string) => {
    sound.playClick();
    const challengeDir = Object.keys(fs).find(k => fs[k].challengeId === challengeId && fs[k].type === 'dir');
    if (challengeDir) {
      setCwd(challengeDir);
      executeCommand('ls -la');
    }
  };

  const handleCopyLogs = () => {
    const text = outputLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950/95 backdrop-blur-md flex flex-col' : ''}`}>
      {/* Shell Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>CyberStrike Host Shell</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                TTY1 (LIVE)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive terminal for exploring challenge artifacts, inspecting source code, and submitting flags.
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Challenge Quick Selector */}
          <select
            value={selectedQuickChallenge}
            onChange={e => {
              const val = e.target.value;
              setSelectedQuickChallenge(val);
              if (val) jumpToChallenge(val);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Jump to Challenge Dir...</option>
            {challenges.map(c => (
              <option key={c.id} value={c.id}>
                [{c.category}] {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => executeCommand('tree')}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
            title="Visualize challenge tree"
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">tree</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
            title="Copy terminal buffer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">copy</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setOutputLines([]);
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">clear</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono transition-colors"
            title={isFullscreen ? 'Minimize' : 'Maximize'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Terminal Screen */}
      <div className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'flex-1' : 'min-h-[520px] max-h-[640px]'}`}>
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-semibold text-slate-200">bash — {username}@{promptHost}:{cwd}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>x86_64</span>
            <span>ANSI UTF-8</span>
          </div>
        </div>

        {/* Scrollable Output Buffer */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 text-slate-300 selection:bg-emerald-500/30 cursor-text"
        >
          {outputLines.map((line, idx) => (
            <div
              key={idx}
              className={`leading-relaxed whitespace-pre-wrap break-all ${
                line.type === 'input'
                  ? 'text-emerald-400 font-semibold'
                  : line.type === 'error'
                  ? 'text-rose-400'
                  : line.type === 'success'
                  ? 'text-emerald-300 font-bold bg-emerald-950/40 p-2 rounded border border-emerald-500/40'
                  : line.type === 'system'
                  ? 'text-indigo-400/90'
                  : 'text-slate-300'
              }`}
            >
              {line.text}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-1.5 pt-1 text-emerald-400">
            <span className="font-bold select-none">{getPrompt()}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-slate-100 placeholder-slate-700"
            />
          </div>
          <div ref={endRef} />
        </div>

        {/* Terminal Bottom Command Shortcuts Bar */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">Quick run:</span>
            <button
              onClick={() => executeCommand('ls -la')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              ls -la
            </button>
            <button
              onClick={() => executeCommand('whoami')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              whoami
            </button>
            <button
              onClick={() => executeCommand('pwd')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              pwd
            </button>
            <button
              onClick={() => executeCommand('cat README.md')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              cat README.md
            </button>
            <button
              onClick={() => executeCommand('cd challenges')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              cd challenges
            </button>
            <button
              onClick={() => executeCommand('tree')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              tree
            </button>
          </div>

          <div className="text-slate-500 hidden sm:block">
            <span>Tab: autocomplete · Up/Down: history</span>
          </div>
        </div>
      </div>
    </div>
  );
};
