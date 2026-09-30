import React, { useState } from 'react';
import { Terminal, Network, Key, Play, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{tls13_k3y_sch3dul3_d0wngr4d3_d3crypt3d_612}';

export const TlsForensicsSandbox: React.FC<Props> = ({ onFlagFound }) => {
  const [clientRandom, setClientRandom] = useState<string>('');
  const [sharedSecretZ, setSharedSecretZ] = useState<string>('');
  const [cipherSuite, setCipherSuite] = useState<string>('TLS_AES_128_GCM_SHA256');
  const [forensicLogs, setForensicLogs] = useState<string[]>([
    '[*] BGP Prefix 198.51.100.0/24 Hijack detected in capture bgp_intercept.pcapng.',
    '[*] Captured 25,400 packets of intercepted TLS 1.3 encrypted application records.',
    '[*] Frame 42: Client Hello reveals ClientRandom (32 hex bytes) and KeyShare x25519.',
    '[*] Core dump memory provides server ephemeral private scalar: 0x4a7e... (32 bytes).',
    '[*] Compute ECDH shared secret Z = priv_server * pub_client (curve25519) to derive HKDF key schedule.'
  ]);
  const [decryptedRecord, setDecryptedRecord] = useState<string>('');

  const handleDeriveTrafficKeys = () => {
    sound.playClick();
    const newLogs = [...forensicLogs];

    const validZ = '0x9924a1b0c8e3f7129924a1b0c8e3f712';
    const validClientRandom = '0x1a2b3c4d5e6f708192a3b4c5d6e7f809';

    if (
      clientRandom.trim().toLowerCase().startsWith('0x1a2b') &&
      sharedSecretZ.trim().toLowerCase().startsWith('0x9924')
    ) {
      sound.playSuccess();
      newLogs.push('[+] ECDH Shared Secret Z validated!');
      newLogs.push('[+] HKDF-Extract(0, Z) => Early Secret = 0x33b8...');
      newLogs.push('[+] HKDF-Expand-Label(Early Secret, "derived") => Handshake Secret');
      newLogs.push('[+] HKDF-Expand-Label(Handshake Secret, "c ap traffic") => client_application_traffic_secret_0');
      newLogs.push('[+] AES-128-GCM Key = 0xd41d8cd98f00b204e9800998ecf8427e, IV = 0x5a107e3c92b1');
      newLogs.push('[+] Decrypting TLS 1.3 Encrypted Extensions & Inner HTTP/2 frames...');
      newLogs.push(`[+] DECRYPTED PAYLOAD: POST /classified/vault HTTP/2 (Content-Type: application/json)`);
      newLogs.push(`    Payload: {"token": "${SECRET_FLAG}", "security_clearance": "COSMIC"}`);

      setDecryptedRecord(`HTTP/2 200 OK — Decrypted TLS 1.3 Record: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      newLogs.push('[-] Key derivation failed: Provided ClientRandom or Shared Secret Z does not match frame 42 & carved ECDH parameters.');
      newLogs.push('[-] HINT: Inspect frame 42 for ClientRandom (starts with 0x1a2b...) and compute Z (starts with 0x9924...).');
    }

    setForensicLogs(newLogs);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">TLS 1.3 HKDF Key Schedule Reconstruction</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            NIGHTMARE DIFFICULTY // 590 PTS
          </span>
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
          {forensicLogs.map((l, i) => (
            <div key={i} className={l.includes('DECRYPTED') ? 'text-emerald-400 font-bold' : l.includes('[-] ') ? 'text-rose-400' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Parameters */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs">HKDF Derivation Inputs</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[11px]">Frame 42 ClientRandom (hex):</label>
            <input
              type="text"
              value={clientRandom}
              onChange={e => setClientRandom(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="0x1a2b3c4d..."
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px]">Carved Curve25519 Shared Secret Z (hex):</label>
            <input
              type="text"
              value={sharedSecretZ}
              onChange={e => setSharedSecretZ(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              placeholder="0x9924a1b0..."
            />
          </div>
        </div>

        <button
          onClick={handleDeriveTrafficKeys}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
        >
          <Key className="w-4 h-4" />
          <span>Derive Application Traffic Secret & Decrypt TLS Streams</span>
        </button>

        {decryptedRecord && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold text-xs">
            {decryptedRecord}
          </div>
        )}
      </div>
    </div>
  );
};
