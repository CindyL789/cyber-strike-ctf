import React, { useState } from 'react';
import { Terminal, HardDrive, Play, Search, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{m3m0ry_v0l4t1l1ty_h0ll0w1ng_4pt_8314}';

export const MemoryForensicsSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [cmdInput, setCmdInput] = useState<string>('');
  const [outputBuffer, setOutputBuffer] = useState<string[]>([
    'Volatility 3 Framework 2.4.1',
    'Investigating RAM Capture: incident_host09.raw (Windows 10 Build 19041 x64)',
    'Type Volatility 3 plugins e.g. windows.netscan, windows.pslist, windows.malfind --pid <PID>, windows.memdump --pid <PID>'
  ]);

  const runVolCommand = (cmd: string) => {
    sound.playClick();
    const clean = cmd.trim();
    const newLines = [...outputBuffer, `$ ${clean}`];

    if (clean.includes('windows.netscan') || clean.includes('netscan')) {
      newLines.push(
        'Offset          Proto   Local Address          Foreign Address        State      PID    Owner',
        '0xfa80018a1010  TCPv4   10.0.2.15:49158        198.51.100.77:4444     ESTABLISHED 4820   svchost.exe',
        '0xfa8001923040  TCPv4   0.0.0.0:135            0.0.0.0:0              LISTENING   884    svchost.exe',
        '0xfa8001a11090  TCPv4   0.0.0.0:445            0.0.0.0:0              LISTENING   4      System',
        '[*] ANOMALY: PID 4820 (svchost.exe) connected to untrusted public IP 198.51.100.77 on C2 port 4444!'
      );
    } else if (clean.includes('windows.pslist') || clean.includes('pslist')) {
      newLines.push(
        'PID     PPID    ImageFileName   Offset(V)          Threads  Handles  CreateTime',
        '4       0       System          0xfa8001a0a040     132      -        2026-09-29 18:02:11',
        '884     620     svchost.exe     0xfa8001b22010     24       310      2026-09-29 18:02:40',
        '4820    884     svchost.exe     0xfa8001f99080     1        18       2026-09-29 19:14:02',
        '[*] Note: PID 4820 spawned suspiciously late with only 1 thread.'
      );
    } else if (clean.includes('windows.malfind') || clean.includes('malfind')) {
      newLines.push(
        'PID: 4820 Process: svchost.exe',
        '0x00000000021a0000  4d 5a 90 00 03 00 00 00  MZ..............',
        '0x00000000021a0010  04 00 00 00 ff ff 00 00  ................',
        'Protection: PAGE_EXECUTE_READWRITE',
        '[*] ALERT: Unmapped PE injection detected in svchost.exe PID 4820! Process hollowing confirmed.'
      );
    } else if (clean.includes('windows.memdump') || clean.includes('memdump') || clean.includes('carve')) {
      sound.playSuccess();
      newLines.push(
        '[*] Writing carved address space for PID 4820 to pid.4820.dmp...',
        '[*] Scanning memory stream for C2 exfiltration tokens...',
        '----------------------------------------------------------------------',
        'FOUND HTTP C2 BEACON HEADER:',
        'POST /beacon/v2/telemetry HTTP/1.1',
        'Host: 198.51.100.77:4444',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        `X-Exfil-Token: ${SECRET_FLAG}`,
        '----------------------------------------------------------------------',
        '[+] FLAG DISCOVERED IN CARVED MEMORY SPACE!'
      );
      onFlagFound(SECRET_FLAG);
    } else {
      newLines.push(`volatility3: unknown plugin or command syntax: "${clean}". Try windows.netscan or windows.malfind.`);
    }

    setOutputBuffer(newLines);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Evidence Banner */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Volatility 3 Incident Forensics Shell</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Raw Physical RAM Dump
          </span>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed">
          Incident Response acquired <code className="text-emerald-400">incident_host09.raw</code> following anomalous outbound network beacons. Use Volatility plugins to investigate rogue connections and carved process memory.
        </div>
      </div>

      {/* Interactive Command Prompt */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 select-none">$</span>
          <input
            type="text"
            value={cmdInput}
            onChange={e => setCmdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runVolCommand(cmdInput)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="vol -f incident_host09.raw windows.netscan"
          />
          <button
            onClick={() => runVolCommand(cmdInput)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute</span>
          </button>
        </div>

        {/* Quick Plugin Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500">Plugins:</span>
          <button
            onClick={() => {
              setCmdInput('vol -f incident_host09.raw windows.netscan');
              runVolCommand('vol -f incident_host09.raw windows.netscan');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            windows.netscan
          </button>
          <button
            onClick={() => {
              setCmdInput('vol -f incident_host09.raw windows.pslist');
              runVolCommand('vol -f incident_host09.raw windows.pslist');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            windows.pslist
          </button>
          <button
            onClick={() => {
              setCmdInput('vol -f incident_host09.raw windows.malfind --pid ');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            windows.malfind
          </button>
          <button
            onClick={() => {
              setCmdInput('vol -f incident_host09.raw windows.memdump --pid ');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            windows.memdump
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Volatility Shell Execution Stream:
        </div>
        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1 text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap">
          {outputBuffer.map((line, i) => (
            <div
              key={i}
              className={
                line.includes('FLAG') || line.includes('X-Exfil-Token')
                  ? 'text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded border border-emerald-500/40'
                  : line.includes('ALERT') || line.includes('ANOMALY')
                  ? 'text-amber-400 font-semibold'
                  : line.startsWith('$')
                  ? 'text-indigo-300 font-bold'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
