import React, { useState, useMemo } from 'react';
import { Network, Filter, ArrowRight, CheckCircle2, Copy, FileText, Search } from 'lucide-react';
import { sound } from '../../utils/audio';
import { fromBase64 } from '../../utils/cryptoTools';

interface Props {
  onFlagFound?: (flag: string) => void;
}

interface Packet {
  no: number;
  time: string;
  source: string;
  destination: string;
  protocol: 'TCP' | 'HTTP' | 'DNS' | 'TLS';
  length: number;
  info: string;
  streamId?: number;
  payload?: string;
}

const PACKETS: Packet[] = [
  { no: 1, time: '0.000000', source: '192.168.1.105', destination: '8.8.8.8', protocol: 'DNS', length: 78, info: 'Standard query 0x1a2b A sync.internal-corp.net' },
  { no: 2, time: '0.012431', source: '8.8.8.8', destination: '192.168.1.105', protocol: 'DNS', length: 94, info: 'Standard query response 0x1a2b A 45.33.32.156' },
  { no: 3, time: '0.045112', source: '192.168.1.105', destination: '45.33.32.156', protocol: 'TCP', length: 66, info: '54210 → 80 [SYN] Seq=0 Win=64240 Len=0', streamId: 0 },
  { no: 4, time: '0.078219', source: '45.33.32.156', destination: '192.168.1.105', protocol: 'TCP', length: 66, info: '80 → 54210 [SYN, ACK] Seq=0 Ack=1 Win=65160', streamId: 0 },
  { no: 5, time: '0.078301', source: '192.168.1.105', destination: '45.33.32.156', protocol: 'TCP', length: 54, info: '54210 → 80 [ACK] Seq=1 Ack=1 Win=64240', streamId: 0 },
  { no: 6, time: '0.082104', source: '192.168.1.105', destination: '45.33.32.156', protocol: 'HTTP', length: 245, info: 'GET /status HTTP/1.1', streamId: 0, payload: 'GET /status HTTP/1.1\r\nHost: sync.internal-corp.net\r\nUser-Agent: Mozilla/5.0\r\n\r\n' },
  { no: 7, time: '0.114201', source: '45.33.32.156', destination: '192.168.1.105', protocol: 'HTTP', length: 182, info: 'HTTP/1.1 200 OK (text/plain)', streamId: 0, payload: 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 15\r\n\r\nAgent connected\n' },
  { no: 8, time: '0.189400', source: '192.168.1.105', destination: '10.0.0.1', protocol: 'DNS', length: 82, info: 'Standard query 0x3c9f A updates.gateway.local' },
  { no: 9, time: '0.245102', source: '192.168.1.105', destination: '45.33.32.156', protocol: 'TCP', length: 66, info: '54212 → 80 [SYN] Seq=0 Win=64240', streamId: 1 },
  { no: 10, time: '0.278912', source: '45.33.32.156', destination: '192.168.1.105', protocol: 'TCP', length: 66, info: '80 → 54212 [SYN, ACK] Seq=0 Ack=1', streamId: 1 },
  { no: 11, time: '0.312040', source: '192.168.1.105', destination: '45.33.32.156', protocol: 'HTTP', length: 612, info: 'POST /sync/report HTTP/1.1 (application/x-www-form-urlencoded)', streamId: 1, payload: 'POST /sync/report HTTP/1.1\r\nHost: sync.internal-corp.net\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 128\r\n\r\nsession_id=990184&action=exfiltrate_vault&upload_blob=ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ%3D%3D' },
  { no: 12, time: '0.354109', source: '45.33.32.156', destination: '192.168.1.105', protocol: 'HTTP', length: 156, info: 'HTTP/1.1 202 Accepted', streamId: 1, payload: 'HTTP/1.1 202 Accepted\r\nContent-Length: 22\r\n\r\nPayload saved to disk.\n' }
];

const FLAG = 'flag{pc4p_p4ck3t_str34m_huttp_3xf1l_617}';

export const PcapInspectorSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [filterText, setFilterText] = useState('http');
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(PACKETS[10]); // default select POST packet
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);

  const filteredPackets = useMemo(() => {
    if (!filterText.trim()) return PACKETS;
    const q = filterText.toLowerCase().trim();
    return PACKETS.filter(p =>
      p.protocol.toLowerCase().includes(q) ||
      p.info.toLowerCase().includes(q) ||
      p.source.includes(q) ||
      p.destination.includes(q)
    );
  }, [filterText]);

  const handleSelectPacket = (packet: Packet) => {
    sound.playClick();
    setSelectedPacket(packet);
  };

  const handleDecodeExfil = () => {
    sound.playClick();
    const base64Str = 'ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==';
    const result = fromBase64(base64Str);
    setDecodedPayload(result);
    if (result === FLAG) {
      sound.playSuccess();
      if (onFlagFound) onFlagFound(FLAG);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <Network className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">Wireshark Protocol Analyzer: dump_094.pcap</div>
          <div className="text-xs text-slate-400">
            Total Packets: 12 · Target Anomalies: Outbound exfiltration streams
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5 text-sky-400" />
          <span>Display Filter:</span>
        </div>
        <div className="flex-1 relative min-w-[200px]">
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="e.g. http, tcp, dns..."
            className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>
        <div className="flex items-center gap-1">
          {['all', 'http', 'dns', 'tcp'].map(proto => (
            <button
              key={proto}
              onClick={() => {
                setFilterText(proto === 'all' ? '' : proto);
                sound.playClick();
              }}
              className={`px-2.5 py-1 rounded font-mono text-xs uppercase ${
                (proto === 'all' && filterText === '') || filterText.toLowerCase() === proto
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      {/* Packet Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2 px-3 w-12">No.</th>
                <th className="py-2 px-3 w-20">Time</th>
                <th className="py-2 px-3 w-28">Source</th>
                <th className="py-2 px-3 w-28">Destination</th>
                <th className="py-2 px-3 w-16">Proto</th>
                <th className="py-2 px-3 w-14">Len</th>
                <th className="py-2 px-3">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredPackets.map(p => {
                const isSelected = selectedPacket?.no === p.no;
                const isHttp = p.protocol === 'HTTP';
                return (
                  <tr
                    key={p.no}
                    onClick={() => handleSelectPacket(p)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-950/80 text-sky-200 font-medium'
                        : isHttp
                        ? 'bg-emerald-950/20 hover:bg-slate-900 text-slate-300'
                        : 'hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-slate-500">{p.no}</td>
                    <td className="py-1.5 px-3 text-slate-400">{p.time}</td>
                    <td className="py-1.5 px-3 text-slate-300">{p.source}</td>
                    <td className="py-1.5 px-3 text-slate-300">{p.destination}</td>
                    <td className="py-1.5 px-3">
                      <span className={`font-bold ${isHttp ? 'text-emerald-400' : 'text-sky-400'}`}>
                        {p.protocol}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-500">{p.length}</td>
                    <td className="py-1.5 px-3 truncate max-w-xs">{p.info}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Packet Inspector */}
      {selectedPacket && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">
              Packet #{selectedPacket.no} Details
            </span>
            {selectedPacket.streamId !== undefined && (
              <button
                onClick={() => {
                  setShowStreamModal(true);
                  sound.playClick();
                }}
                className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs font-sans flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Follow TCP Stream #{selectedPacket.streamId}</span>
              </button>
            )}
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div>
              <span className="text-slate-500">Ethernet II, Src: </span>02:42:c0:a8:01:69,{' '}
              <span className="text-slate-500">Dst: </span>02:42:2d:21:20:9c
            </div>
            <div>
              <span className="text-slate-500">Internet Protocol Version 4, Src: </span>
              {selectedPacket.source}, <span className="text-slate-500">Dst: </span>
              {selectedPacket.destination}
            </div>
            <div>
              <span className="text-slate-500">Transmission Control Protocol, Stream: </span>
              {selectedPacket.streamId ?? 'N/A'}
            </div>
          </div>

          {selectedPacket.payload && (
            <div className="pt-2">
              <div className="text-xs text-slate-400 mb-1 font-mono">Payload Segment:</div>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-300 break-all whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedPacket.payload}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TCP Stream Follower Modal / Drawer */}
      {showStreamModal && (
        <div className="p-4 bg-slate-900 border border-sky-600/40 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Follow TCP Stream #1 (Client ↔ Server Transcript)
            </span>
            <button
              onClick={() => setShowStreamModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              [Close]
            </button>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs space-y-2 text-rose-300">
            <div>POST /sync/report HTTP/1.1</div>
            <div>Host: sync.internal-corp.net</div>
            <div>User-Agent: StealthClient/1.0</div>
            <div>Content-Type: application/x-www-form-urlencoded</div>
            <div className="pt-2 text-amber-300 font-bold">
              upload_blob=ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ%3D%3D
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDecodeExfil}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors font-sans"
            >
              <span>Decode upload_blob Base64</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {decodedPayload && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
              <span className="text-emerald-400 font-semibold text-xs font-mono">
                Decoded: {decodedPayload}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(decodedPayload);
                  sound.playClick();
                }}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium flex items-center gap-1 font-sans"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
