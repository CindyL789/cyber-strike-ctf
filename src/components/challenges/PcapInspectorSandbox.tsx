import React, { useState } from 'react';
import { Terminal, Network, Search, CheckCircle2, Filter, Copy, Check } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{pc4p_p4ck3t_str34m_huttp_3xf1l_617}';

export const PcapInspectorSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [filterStr, setFilterStr] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<number | null>(null);
  const [submittedFlag, setSubmittedFlag] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [verifyNotice, setVerifyNotice] = useState<string>('');

  const packets = [
    { no: 1, time: '0.000', src: '10.0.0.12', dst: '1.1.1.1', proto: 'DNS', info: 'Standard query 0x12a A exfil.remote-telemetry.org' },
    { no: 2, time: '0.015', src: '1.1.1.1', dst: '10.0.0.12', proto: 'DNS', info: 'Standard query response 0x12a A 198.51.100.22' },
    { no: 3, time: '0.021', src: '10.0.0.12', dst: '10.0.0.1', proto: 'ARP', info: 'Who has 10.0.0.1? Tell 10.0.0.12' },
    { no: 7, time: '0.045', src: '10.0.0.12', dst: '198.51.100.22', proto: 'TCP', info: '49152 → 80 [SYN] Seq=0 Win=64240' },
    { no: 8, time: '0.046', src: '198.51.100.22', dst: '10.0.0.12', proto: 'TCP', info: '80 → 49152 [SYN, ACK] Seq=0 Ack=1' },
    { no: 9, time: '0.047', src: '10.0.0.12', dst: '198.51.100.22', proto: 'TCP', info: '49152 → 80 [ACK] Seq=1 Ack=1' },
    { no: 14, time: '0.089', src: '10.0.0.12', dst: '10.0.0.50', proto: 'SMB2', info: 'Tree Connect Request Tree: \\\\STORAGE\\IPC$' },
    { no: 18, time: '0.120', src: '10.0.0.12', dst: '198.51.100.22', proto: 'HTTP', info: 'POST /sync/report HTTP/1.1 (multipart/form-data)' },
    { no: 24, time: '0.190', src: '198.51.100.22', dst: '10.0.0.12', proto: 'HTTP', info: 'HTTP/1.1 200 OK (application/json)' }
  ];

  const filteredPackets = packets.filter(p => {
    if (!filterStr.trim()) return true;
    const f = filterStr.trim().toLowerCase();
    return (
      p.proto.toLowerCase().includes(f) ||
      p.info.toLowerCase().includes(f) ||
      p.src.toLowerCase().includes(f) ||
      p.dst.toLowerCase().includes(f)
    );
  });

  const handleCopyBlob = () => {
    sound.playClick();
    navigator.clipboard.writeText('ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    sound.playClick();
    if (submittedFlag.trim() === SECRET_FLAG) {
      sound.playSuccess();
      setVerifyNotice(`SUCCESS: Exfiltrated flag recovered! Points ready to award.`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setVerifyNotice('INCORRECT: Flag does not match the decoded stream.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Filter Toolbar */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
        <Filter className="w-4 h-4 text-emerald-400" />
        <span className="text-slate-400 text-xs">Protocol Filter:</span>
        <input
          type="text"
          value={filterStr}
          onChange={e => setFilterStr(e.target.value)}
          placeholder="e.g. HTTP, POST, DNS..."
          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
        />
        {filterStr && (
          <button
            onClick={() => setFilterStr('')}
            className="px-2 py-1 text-slate-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Packet List */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
          <span>dump_094.pcap Packet List</span>
          <span>{filteredPackets.length} frames visible</span>
        </div>
        <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
          {filteredPackets.map(pkt => (
            <div
              key={pkt.no}
              onClick={() => {
                sound.playClick();
                setSelectedStream(pkt.no === 18 ? 3 : null);
              }}
              className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 ${
                selectedStream === 3 && pkt.no === 18 ? 'bg-indigo-950/40 border-l-2 border-indigo-400' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 w-6">#{pkt.no}</span>
                <span className="text-emerald-400 w-16 font-bold">{pkt.proto}</span>
                <span className="text-slate-300">{pkt.src} → {pkt.dst}</span>
              </div>
              <span className="text-slate-400 text-[11px] truncate max-w-sm">{pkt.info}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Follow Stream Box */}
      {selectedStream === 3 ? (
        <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-3">
          <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
            <span>Follow TCP Stream #3 (HTTP POST Payload):</span>
            <span className="text-[10px] text-slate-500">Port 80 Reassembly</span>
          </div>

          <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div>POST /sync/report HTTP/1.1</div>
            <div>Host: exfil.remote-telemetry.org</div>
            <div>Content-Type: multipart/form-data; boundary=---------------------------974767299852498929531610575</div>
            <div className="text-amber-300 pt-2 flex items-center justify-between">
              <span>upload_blob=ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==</span>
              <button
                onClick={handleCopyBlob}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Blob'}</span>
              </button>
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            Hint: Copy the Base64 blob into the Cyber Workbench (or your local shell: <code className="text-emerald-400">echo "..." | base64 -d</code>) to decode the flag.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
          Click on an anomalous transmission in the packet table above to follow the stream.
        </div>
      )}

      {/* Flag Verification */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
        <label className="text-slate-200 font-bold text-xs">Verify Decoded Flag:</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={submittedFlag}
            onChange={e => setSubmittedFlag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            placeholder="flag{...}"
          />
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Check Flag
          </button>
        </div>
        {verifyNotice && (
          <div className={`p-2.5 rounded border text-xs ${verifyNotice.startsWith('SUCCESS') ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
            {verifyNotice}
          </div>
        )}
      </div>
    </div>
  );
};
