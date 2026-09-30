import React, { useState } from 'react';
import { Terminal, Shield, Play, RotateCcw, CheckCircle2, Lock, Zap } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onFlagFound: (flag: string) => void;
}

const SECRET_FLAG = 'flag{p4dd1ng_0r4cl3_c0mpu73d_byt3_by_byt3_8829}';
const TARGET_PLAINTEXT = 'byte_by_byt3_8829'; // 16 bytes for target block

export const PaddingOracleSandbox: React.FC<Props> = ({ onFlagFound }) => {
  // 16-byte hex representation of target block C_0
  const originalBlockHex = 'a84f91b2c3d4e5f60718293a4b5c6d7e';
  const [candidateHex, setCandidateHex] = useState<string>(originalBlockHex);
  const [oracleStatus, setOracleStatus] = useState<{ code: number; message: string; valid: boolean } | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<string[]>(new Array(16).fill('??'));
  const [submittedPlaintext, setSubmittedPlaintext] = useState<string>('');
  const [verifyNotice, setVerifyNotice] = useState<string>('');

  const testPaddingOracle = (hexVal: string) => {
    sound.playClick();
    const clean = hexVal.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length !== 32) {
      sound.playError();
      setOracleStatus({
        code: 400,
        message: 'Invalid ciphertext length: must be exactly 16 bytes (32 hex characters)',
        valid: false
      });
      return;
    }

    const trailingByte = parseInt(clean.slice(-2), 16);

    // Specific byte that satisfies PKCS#7 0x01 padding when last byte is mutated
    // 0x3b satisfies: 0x3b ^ 0x01 = 0x3a, 0x3a ^ 0x7e = 0x44
    if (trailingByte === 0x3b) {
      sound.playSuccess();
      setOracleStatus({
        code: 200,
        message: 'HTTP 200 OK — Decrypted plaintext ends with valid PKCS#7 padding (0x01)! Intermediate I[15] = 0x3B ⊕ 0x01 = 0x3A. Plaintext P[15] = 0x3A ⊕ 0x7E = 0x39 (\'9\')',
        valid: true
      });
      // Update byte 15
      setDecryptedBytes(prev => {
        const n = [...prev];
        n[15] = '9';
        return n;
      });
    } else if (trailingByte === 0x7e) {
      sound.playSuccess();
      setOracleStatus({
        code: 200,
        message: 'HTTP 200 OK — Identity block (original ciphertext): valid final block padding.',
        valid: true
      });
    } else {
      sound.playError();
      setOracleStatus({
        code: 500,
        message: `HTTP 500 Internal Error — javax.crypto.BadPaddingException for trailing byte 0x${trailingByte.toString(16).padStart(2, '0').toUpperCase()}`,
        valid: false
      });
    }
  };

  const handleVerifyFullBlock = () => {
    sound.playClick();
    if (submittedPlaintext.trim() === TARGET_PLAINTEXT) {
      sound.playSuccess();
      setVerifyNotice(`SUCCESS! Target CBC block plaintext authenticated. Flag: ${SECRET_FLAG}`);
      onFlagFound(SECRET_FLAG);
    } else {
      sound.playError();
      setVerifyNotice('INCORRECT: Plaintext does not match target block decryption.');
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Cryptographic Architecture Card */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-sm">AES-128-CBC Padding Oracle Side-Channel</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Vaudenay Attack
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-300">Target Ciphertext Block (C_1):</div>
            <div className="font-mono text-amber-400 break-all">{originalBlockHex}</div>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-300">Mathematical Invariant:</div>
            <div className="text-slate-300">P[k] = I[k] ⊕ C_0[k], where I[k] = C'_0[k] ⊕ pad_byte</div>
          </div>
        </div>
      </div>

      {/* Manual Oracle Query Probe */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-300 font-bold text-xs">Ciphertext Manipulation Oracle Probe:</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={candidateHex}
            onChange={e => setCandidateHex(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            placeholder="16-byte hex C'_{i-1} block (32 hex characters)..."
          />
          <button
            onClick={() => testPaddingOracle(candidateHex)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            Probe Oracle
          </button>
        </div>

        {oracleStatus && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              oracleStatus.valid
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>{oracleStatus.message}</span>
          </div>
        )}
      </div>

      {/* Decryption Verification */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="text-slate-200 font-bold text-xs">Submit Decrypted 16-Byte Plaintext Block</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={submittedPlaintext}
            onChange={e => setSubmittedPlaintext(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            placeholder="e.g. byte_by_byt3_8829"
          />
          <button
            onClick={handleVerifyFullBlock}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
          >
            Authenticate Plaintext
          </button>
        </div>

        {verifyNotice && (
          <div className={`p-3 rounded-lg border text-xs ${verifyNotice.startsWith('SUCCESS') ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
            {verifyNotice}
          </div>
        )}
      </div>
    </div>
  );
};
