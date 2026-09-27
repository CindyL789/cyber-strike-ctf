import React, { useState } from 'react';
import { Terminal, Shield, Play, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, HardDrive, Search, FileText, Activity } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound?: (flag: string) => void;
}

export const MemoryForensicsSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const FLAG = 'flag{m3m0ry_v0l4t1l1ty_h0ll0w1ng_4pt_8314}';
  const [activeCommand, setActiveCommand] = useState<string>('vol -f incident_host09.raw windows.pslist');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [evidenceStep, setEvidenceStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Volatility command execution engine
  const executeCommand = (cmd: string) => {
    sound.playClick();
    const cleanCmd = cmd.trim();
    const lines: string[] = [];
    lines.push(`analyst@ir-workstation:~$ ${cleanCmd}`);

    if (cleanCmd.includes('pslist') || cleanCmd.includes('pstree')) {
      lines.push('Volatility 3 Framework 2.4.1');
      lines.push('PID\tPPID\tImageFileName\tOffset(V)\tThreads\tHandles\tSessionId\tCreateTime');
      lines.push('4\t0\tSystem\t\t0xfa800102\t124\t---\t---\t2026-09-27 08:00:12');
      lines.push('344\t4\tsmss.exe\t0xfa800188\t4\t32\t---\t2026-09-27 08:00:14');
      lines.push('488\t460\tcsrss.exe\t0xfa800210\t11\t540\t0\t2026-09-27 08:00:17');
      lines.push('564\t552\tservices.exe\t0xfa800311\t18\t312\t0\t2026-09-27 08:00:19');
      lines.push('576\t552\tlsass.exe\t0xfa800420\t8\t1140\t0\t2026-09-27 08:00:20');
      lines.push('880\t564\tsvchost.exe\t0xfa800530\t24\t480\t0\t2026-09-27 08:00:22');
      lines.push('1412\t564\tsvchost.exe\t0xfa800640\t19\t390\t0\t2026-09-27 08:00:25');
      lines.push('4820\t564\tsvchost.exe\t0xfa800990\t3\t94\t0\t2026-09-27 08:44:11 [*Anomalous Threads*]');
      lines.push('5108\t1412\texplorer.exe\t0xfa800a10\t56\t1840\t1\t2026-09-27 08:01:05');
      if (evidenceStep < 2) setEvidenceStep(2);
    } else if (cleanCmd.includes('netscan')) {
      lines.push('Volatility 3 Framework 2.4.1');
      lines.push('Offset\tProto\tLocalAddress\t\tForeignAddress\t\tState\t\tPID\tOwner\tCreated');
      lines.push('0xfa80011\tTCPv4\t192.168.1.105:135\t0.0.0.0:0\t\tLISTENING\t880\tsvchost.exe\t08:00:22');
      lines.push('0xfa80022\tTCPv4\t192.168.1.105:445\t0.0.0.0:0\t\tLISTENING\t4\tSystem\t\t08:00:12');
      lines.push('0xfa80099\tTCPv4\t192.168.1.105:49182\t198.51.100.77:4444\tESTABLISHED\t4820\tsvchost.exe\t08:44:19 [ALERT]');
      lines.push('0xfa800aa\tTCPv4\t192.168.1.105:51201\t52.96.166.130:443\tESTABLISHED\t5108\texplorer.exe\t08:01:45');
      lines.push('');
      lines.push('[*] ALERT: Suspicious outbound connection detected to remote C2 server 198.51.100.77:4444 spawned by PID 4820.');
      if (evidenceStep < 3) setEvidenceStep(3);
    } else if (cleanCmd.includes('malfind')) {
      lines.push('Volatility 3 Framework 2.4.1 - Scanning VAD Protections');
      lines.push('Process: svchost.exe Pid: 4820 Address: 0x00400000');
      lines.push('Vad Tag: VadS Protection: PAGE_EXECUTE_READWRITE [HIGH ANOMALY]');
      lines.push('Hex Dump:');
      lines.push('00400000  4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00  |MZ..............|');
      lines.push('00400010  fc e8 82 00 00 00 60 89  e5 31 c0 64 8b 50 30 8b  |......`..1.d.P0.|');
      lines.push('00400020  52 0c 8b 52 14 8b 72 28  0f b7 4a 26 31 ff 31 c0  |R..R..r(..J&1.1.|');
      lines.push('Disassembly:');
      lines.push('00400010  fc            cld');
      lines.push('00400011  e882000000    call 0x400098');
      lines.push('00400016  60            pushad');
      lines.push('00400017  89e5          mov ebp, esp');
      lines.push('[*] INJECTION CONFIRMED: Process Hollowing with injected reflective PE executable in PID 4820.');
      if (evidenceStep < 4) setEvidenceStep(4);
    } else if (cleanCmd.includes('memdump') || cleanCmd.includes('strings') || cleanCmd.includes('dumpfiles')) {
      lines.push('Volatility 3 Framework 2.4.1 - Carving Process Memory [PID: 4820]');
      lines.push('Writing carved memory segment to pid.4820.dmp (size: 14.2 MB)... DONE');
      lines.push('Searching memory stream for exfiltration payloads and authorization tokens...');
      lines.push('[FOUND] Memory offset 0x0041F9B0:');
      lines.push(`POST /c2/beacon HTTP/1.1\\r\\nHost: 198.51.100.77\\r\\nX-Exfil-Token: ${FLAG}\\r\\n`);
      lines.push(`[SUCCESS] Exfiltrated memory flag extracted: ${FLAG}`);
      setIsCompleted(true);
      sound.playSuccess();
      if (onFlagFound) {
        onFlagFound(FLAG);
      }
    } else {
      lines.push(`vol: command not recognized: "${cleanCmd}". Available commands: windows.pslist, windows.netscan, windows.malfind, windows.memdump`);
    }

    setTerminalOutput(lines);
  };

  const handleRunPreset = (cmd: string) => {
    setActiveCommand(cmd);
    executeCommand(cmd);
  };

  const handleReset = () => {
    sound.playClick();
    setActiveCommand('vol -f incident_host09.raw windows.pslist');
    setTerminalOutput([]);
    setEvidenceStep(1);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header Info */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono font-semibold text-emerald-400">
            <HardDrive className="w-4 h-4" />
            <span>Target: Volatility 3 Memory Forensic Workbench (incident_host09.raw)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Analyze physical memory dump acquired from an APT intrusion. Correlate anomalous processes (<code className="text-cyan-300">pslist</code>), detect hidden C2 network sockets (<code className="text-amber-300">netscan</code>), identify hollowed VAD code injection (<code className="text-rose-300">malfind</code>), and carve process memory (<code className="text-emerald-300">memdump</code>) to recover the exfiltrated secret.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Investigation Progress:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-semibold border ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
            }`}
          >
            {isCompleted ? 'FLAG RECOVERED' : `PHASE ${evidenceStep} / 4`}
          </span>
        </div>
      </div>

      {/* Investigation Stepper / Evidence Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <button
          onClick={() => handleRunPreset('vol -f incident_host09.raw windows.pslist')}
          className={`p-2.5 rounded border text-left transition-colors ${
            evidenceStep >= 1 ? 'bg-slate-900 border-cyan-500/40 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span>Step 1</span>
            {evidenceStep > 1 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
          <div className="font-bold">windows.pslist</div>
          <div className="text-[10px] text-slate-400 truncate">Scan active PIDs</div>
        </button>

        <button
          onClick={() => handleRunPreset('vol -f incident_host09.raw windows.netscan')}
          className={`p-2.5 rounded border text-left transition-colors ${
            evidenceStep >= 2 ? 'bg-slate-900 border-cyan-500/40 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span>Step 2</span>
            {evidenceStep > 2 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
          <div className="font-bold">windows.netscan</div>
          <div className="text-[10px] text-slate-400 truncate">Detect C2 port 4444</div>
        </button>

        <button
          onClick={() => handleRunPreset('vol -f incident_host09.raw windows.malfind --pid 4820')}
          className={`p-2.5 rounded border text-left transition-colors ${
            evidenceStep >= 3 ? 'bg-slate-900 border-cyan-500/40 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span>Step 3</span>
            {evidenceStep > 3 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
          <div className="font-bold">windows.malfind</div>
          <div className="text-[10px] text-slate-400 truncate">Confirm VAD Hollowing</div>
        </button>

        <button
          onClick={() => handleRunPreset('vol -f incident_host09.raw windows.memdump --pid 4820')}
          className={`p-2.5 rounded border text-left transition-colors ${
            isCompleted ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span>Step 4</span>
            {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
          <div className="font-bold">windows.memdump</div>
          <div className="text-[10px] text-slate-400 truncate">Carve Secret Flag</div>
        </button>
      </div>

      {/* Volatility Command Line */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Volatility 3 Interactive CLI</span>
        </label>

        <form
          onSubmit={e => {
            e.preventDefault();
            executeCommand(activeCommand);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={activeCommand}
            onChange={e => setActiveCommand(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute Plugin</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Reset Terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Terminal Output */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Forensics Workstation Output Stream</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Volatility 3.x Framework</span>
        </div>

        <div className="bg-black/90 rounded p-3 font-mono text-xs space-y-1 h-52 overflow-y-auto border border-slate-800/80">
          {terminalOutput.length === 0 ? (
            <div className="text-slate-600 italic">Select an investigation step or run a Volatility plugin above.</div>
          ) : (
            terminalOutput.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('[SUCCESS]') || log.includes('flag{')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('[ALERT]') || log.includes('HIGH ANOMALY')
                    ? 'text-rose-400 font-bold'
                    : log.includes('ALERT:') || log.includes('INJECTION CONFIRMED')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>

        {/* Flag Recovered Banner */}
        {isCompleted && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Forensics Evidence Recovered</span>
              </div>
              <div className="font-mono text-xs text-emerald-200 select-all">{FLAG}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
