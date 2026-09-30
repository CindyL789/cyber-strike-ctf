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
  Info
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

const INITIAL_FS: Record<string, FileNode> = {
  '/home/operator': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:00' },
  '/home/operator/README.md': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 512,
    updated: 'Sep 30 08:01',
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
    updated: 'Sep 30 08:15',
    content: `OPERATOR FIELD NOTES:
- Hard challenges require multi-stage exploitation.
- Blind SQLi returns HTTP 200 vs 404: use boolean condition testing.
- AES-CBC padding oracle allows decrypting byte-by-byte via C'[15] ^ 0x01.
- In x86_64 ret2win, remember 16-byte stack alignment with a dummy 'ret' gadget.
`
  },

  '/home/operator/challenges': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },

  // Web
  '/home/operator/challenges/web': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },
  '/home/operator/challenges/web/blind-sqli': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:10',
    challengeId: 'blind-sqli-time-oracle'
  },
  '/home/operator/challenges/web/blind-sqli/api_verify.php': {
    type: 'file',
    perms: '-rwxr-xr-x',
    size: 1120,
    updated: 'Sep 30 08:10',
    challengeId: 'blind-sqli-time-oracle',
    content: `<?php
// Classified Agent Verification
$id = $_POST['agent_id'];
$query = "SELECT status FROM secret_agents WHERE agent_id = '$id'";
$res = $db->query($query);
if ($res && $res->num_rows > 0) {
    http_response_code(200);
    echo json_encode(["status" => "CONFIRMED"]);
} else {
    http_response_code(404);
    echo json_encode(["status" => "NOT_FOUND"]);
}
?>`
  },

  // Crypto
  '/home/operator/challenges/crypto': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },
  '/home/operator/challenges/crypto/padding-oracle': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:12',
    challengeId: 'cbc-padding-oracle-attack'
  },
  '/home/operator/challenges/crypto/padding-oracle/auth_token.bin': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 32,
    updated: 'Sep 30 08:12',
    challengeId: 'cbc-padding-oracle-attack',
    content: `[AES-128-CBC Encrypted Token Block]
C0 (IV): a8 4f 91 b2 c3 d4 e5 f6 07 18 29 3a 4b 5c 6d 7e
C1:      5e 21 f0 9b a4 c2 d1 83 94 01 28 39 40 19 28 41
`
  },

  // Reverse
  '/home/operator/challenges/reverse': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },
  '/home/operator/challenges/reverse/enigma-vm': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:14',
    challengeId: 'custom-bytecode-vm-reversal'
  },
  '/home/operator/challenges/reverse/enigma-vm/dongle.bc': {
    type: 'file',
    perms: '-rwxr-xr-x',
    size: 28,
    updated: 'Sep 30 08:14',
    challengeId: 'custom-bytecode-vm-reversal',
    isExecutable: true,
    content: `10 00 22 42 51 09 60 1A 10 01 35 02 51 8E 60 1A 10 03 48 13 51 4A 60 1A 77 00 FF FF`
  },

  // Pwn
  '/home/operator/challenges/pwn': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },
  '/home/operator/challenges/pwn/format-string': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:16',
    challengeId: 'format-string-stack-arbitrary-write'
  },
  '/home/operator/challenges/pwn/format-string/echo_server.c': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 450,
    updated: 'Sep 30 08:16',
    challengeId: 'format-string-stack-arbitrary-write',
    content: `#include <stdio.h>
int target_auth_level = 0; // At address 0x0804C028

void vuln() {
    char buf[128];
    read(0, buf, sizeof(buf));
    printf(buf); // VULNERABLE: Direct printf without %s!
    if (target_auth_level == 0x1337) {
        system("/bin/sh");
    }
}
`
  },

  // Forensics
  '/home/operator/challenges/forensics': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 08:05' },
  '/home/operator/challenges/forensics/volatility': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:18',
    challengeId: 'memory-dump-volatility-forensics'
  },
  '/home/operator/challenges/forensics/volatility/case_notes.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 320,
    updated: 'Sep 30 08:18',
    challengeId: 'memory-dump-volatility-forensics',
    content: `CASE IR-2026-904:
Image: incident_host09.raw
Suspect anomalous outbound connection on port 4444.
Use windows.netscan and windows.malfind to detect injected shellcode.
Carve memory space with windows.memdump to recover exfiltrated C2 tokens.
`
  },

  // Nightmare Tier Challenges Filesystem Nodes
  '/home/operator/challenges/pwn/ghostwire': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:30',
    challengeId: 'operation-ghostwire-ret2libc'
  },
  '/home/operator/challenges/pwn/ghostwire/telemetry_service.c': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 1420,
    updated: 'Sep 30 08:30',
    challengeId: 'operation-ghostwire-ret2libc',
    content: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void vulnerable_function() {
    char buffer[40];
    printf("[*] Enter diagnostic string: ");
    // Format string leak occurs in diagnostic handler
    // Buffer overflow occurs via unbounded gets()
    gets(buffer);
}

int main() {
    vulnerable_function();
    return 0;
}`
  },
  '/home/operator/challenges/crypto/quantum-lattice': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:30',
    challengeId: 'the-quantum-lattice-ecdsa'
  },
  '/home/operator/challenges/crypto/quantum-lattice/hnp_solver.py': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 1650,
    updated: 'Sep 30 08:30',
    challengeId: 'the-quantum-lattice-ecdsa',
    content: `# Hidden Number Problem (HNP) Solver for secp256k1
# Ephemeral nonce k has 8 most significant bits zero (k < 2^248)
# Construct 5x5 Kannan CVP lattice and apply fplll/LLL reduction.
import sys

def build_lattice(signatures, n, B):
    # Matrix dimension = m + 1
    # Shortest vector discloses private scalar d
    pass`
  },
  '/home/operator/challenges/reverse/shadow-kernel': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:30',
    challengeId: 'shadow-kernel-polymorphic'
  },
  '/home/operator/challenges/reverse/shadow-kernel/implant_notes.txt': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 680,
    updated: 'Sep 30 08:30',
    challengeId: 'shadow-kernel-polymorphic',
    content: `POLYMORPHIC IMPLANT ANALYSIS:
1. Anti-debugging: calls ptrace(PTRACE_TRACEME) at start. Must patch return to 0.
2. Software breakpoints (0xCC) detected via page CRC32 scan.
3. Decryptor mutation loop: K_{i+1} = (K_i * 0x5DEECE66D + 0xB) & 0xFF.
4. Final validation routine unlocks at cycle 48.`
  },
  '/home/operator/challenges/web/pickle-deserialization': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:30',
    challengeId: 'zero-click-deserialization'
  },
  '/home/operator/challenges/web/pickle-deserialization/broker_worker.py': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 1100,
    updated: 'Sep 30 08:30',
    challengeId: 'zero-click-deserialization',
    content: `import pickle
import io

class RestrictedUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Prohibit os, subprocess, sys
        if module in ["os", "subprocess", "socket", "sys"]:
            raise pickle.UnpicklingError("Banned module: " + module)
        return super().find_class(module, name)

# Worker processes incoming payloads via RestrictedUnpickler`
  },
  '/home/operator/challenges/forensics/tls-bgp': {
    type: 'dir',
    perms: 'drwxr-xr-x',
    size: 4096,
    updated: 'Sep 30 08:30',
    challengeId: 'bgp-hijack-tls13-downgrade'
  },
  '/home/operator/challenges/forensics/tls-bgp/bgp_intercept.log': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 780,
    updated: 'Sep 30 08:30',
    challengeId: 'bgp-hijack-tls13-downgrade',
    content: `[ALERT] BGP Hijack ASN 64512 -> 198.51.100.0/24.
Captured TLS 1.3 Handshake in Frame 42:
- ClientRandom: 0x1a2b3c4d5e6f708192a3b4c5d6e7f809...
- Cipher Suite: TLS_AES_128_GCM_SHA256
- KeyShare: Curve25519 Ephemeral Share Carved
- Server Private Scalar carved from memory: 0x9924a1b0...`
  },

  // /etc
  '/etc': { type: 'dir', perms: 'drwxr-xr-x', size: 4096, updated: 'Sep 30 07:00' },
  '/etc/os-release': {
    type: 'file',
    perms: '-rw-r--r--',
    size: 190,
    updated: 'Sep 30 07:00',
    content: `NAME="CyberStrike CTF Linux"
VERSION="2026.3 (Hardened Arena)"
ID=cyberstrike
PRETTY_NAME="CyberStrike Security OS 2026"
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
            <span>Up/Down: history · submit &lt;flag&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
};
