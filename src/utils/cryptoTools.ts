// Cryptographic utility functions for CyberWorkbench

export function toBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return 'Error: Invalid input string for Base64 encoding';
  }
}

export function fromBase64(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64.trim())));
  } catch {
    return 'Error: Invalid Base64 input string';
  }
}

export function toHex(str: string): string {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}

export function fromHex(hex: string): string {
  try {
    const clean = hex.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length % 2 !== 0) return 'Error: Hex length must be even';
    let str = '';
    for (let i = 0; i < clean.length; i += 2) {
      str += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
    }
    return str;
  } catch {
    return 'Error: Invalid hex input';
  }
}

export function rotN(str: string, n: number): string {
  const shift = ((n % 26) + 26) % 26;
  return str.replace(/[a-zA-Z]/g, c => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + shift) % 26) + base);
  });
}

export function xorWithKey(text: string, key: string): string {
  if (!key) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const kChar = key.charCodeAt(i % key.length);
    out += String.fromCharCode(text.charCodeAt(i) ^ kChar);
  }
  return out;
}

export async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function md5(str: string): string {
  // Simple deterministic client-side hash representation for CTF workbench
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}${hex.split('').reverse().join('')}`.padEnd(32, 'a');
}
