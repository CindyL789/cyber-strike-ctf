import { Challenge } from '../types/ctf';

export const DAILY_CHALLENGES_POOL: Challenge[] = [
  {
    id: 'daily-ssrf-metadata',
    title: 'SSRF Cloud Sentinel',
    category: 'Web',
    difficulty: 'Medium',
    points: 280,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'cloud_ninja',
    solvesCount: 37,
    flag: 'flag{ssrf_cl0ud_m3t4d4t4_byp4ss_7721}',
    description: 'An internal web-hook testing utility accepts URLs to fetch telemetry headers. Standard protections block literal "127.0.0.1", "localhost", and "169.254.169.254". Bypass the URL validator using IP encodings (decimal notation, hexadecimal, or octal 0177.0.0.1) or internal DNS redirects to query the simulated IMDSv2 metadata endpoint and retrieve the classified IAM credential flag.',
    tags: ['SSRF', 'Cloud Metadata', 'IMDS', 'Validator Bypass'],
    hints: [
      { id: 'd-ssrf-h1', cost: 15, text: 'The filter checks for string "169.254.169.254". Try decimal integer representation: 169*256^3 + 254*256^2 + 169*256 + 254 = 2852039166. Target: http://2852039166/latest/meta-data/token' },
      { id: 'd-ssrf-h2', cost: 30, text: 'Alternatively, try octal notation for localhost (http://0177.0.0.1:8080/meta) or hex representation (http://0xa9fea9fe/latest/meta-data/token).' }
    ],
    writeup: 'The server-side validator blocks exact string matches for 169.254.169.254 and localhost. Converting 169.254.169.254 to a 32-bit unsigned integer gives `2852039166`. Submitting `http://2852039166/latest/meta-data/token` passes string validation, but the underlying network socket resolves it directly to the cloud metadata service, releasing `flag{ssrf_cl0ud_m3t4d4t4_byp4ss_7721}`.'
  },
  {
    id: 'daily-vigenere-autokey',
    title: 'Autokey Protocol',
    category: 'Crypto',
    difficulty: 'Medium',
    points: 260,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'vigenere_specter',
    solvesCount: 41,
    flag: 'flag{aut0k3y_v1g3n3r3_cr4ck3d_4918}',
    description: 'An adversary upgraded from classic repeating-key Vigenère to the Autokey cipher, where the initial key primer is appended with the plaintext itself to generate the keystream. With key primer length = 5, decrypt the intercepted transmission and uncover the secret passflag.',
    tags: ['Classical Crypto', 'Autokey', 'Vigenere', 'Polyalphabetic'],
    hints: [
      { id: 'd-vig-h1', cost: 15, text: 'In Autokey, keystream = PrimerKey + Plaintext. The initial 5-character primer key is "CYBER".' },
      { id: 'd-vig-h2', cost: 30, text: 'Decrypt the first 5 characters using "CYBER". Those decrypted 5 characters become the key for characters 6-10! Chain this forward to decrypt the entire message.' }
    ],
    writeup: 'Using initial primer key "CYBER": Decrypting characters 1..5 yields "FLAGI". These characters then serve as the keystream for characters 6..10. Chaining this forward reconstructs the full plaintext message and flag: `flag{aut0k3y_v1g3n3r3_cr4ck3d_4918}`.'
  },
  {
    id: 'daily-stego-bitplanes',
    title: 'Steganographic Spectra',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 220,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'spectral_fox',
    solvesCount: 58,
    flag: 'flag{lsb_st3g0_b1t_pl4n3_c4rv3d_1829}',
    description: 'An intelligence courier hid an emergency authentication sequence inside the Least Significant Bits (LSB) of an innocent surveillance photo. Use the bit plane analyzer to isolate Red, Green, and Blue channel bit 0 planes, view the visual noise pattern, and extract the ASCII stream.',
    tags: ['Steganography', 'LSB', 'Bit Planes', 'Image Forensics'],
    hints: [
      { id: 'd-steg-h1', cost: 10, text: 'Switch color channel to Blue (B) and set Bit Plane to Bit 0 (the lowest bit).' },
      { id: 'd-steg-h2', cost: 20, text: 'Click "Extract LSB ASCII" on the Blue 0 plane to extract the sequential bits into readable ASCII bytes.' }
    ],
    writeup: 'The payload was encoded in the lowest bit (Bit 0) of the Blue color channel. Switching the bit plane viewer to Blue channel Bit 0 isolates the non-random watermark pattern. Carving the first 36 bytes of LSB bits reveals `flag{lsb_st3g0_b1t_pl4n3_c4rv3d_1829}`.'
  },
  {
    id: 'daily-pwn-ret2win',
    title: 'Ret2Win Protocol',
    category: 'Pwn',
    difficulty: 'Medium',
    points: 340,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'stack_smasher',
    solvesCount: 29,
    flag: 'flag{r3t2w1n_st4ck_sm4sh_x86_64_5521}',
    description: 'A 64-bit ELF binary reads untrusted data into a fixed 32-byte stack buffer using unsafe `gets()`. Stack canaries are disabled. While the main binary never calls `win()`, the function is linked at fixed address `0x004011ba`. Construct a 40-byte padding payload followed by the target return address to divert execution flow.',
    tags: ['Buffer Overflow', 'ret2win', 'x86_64', 'Stack Exploitation'],
    hints: [
      { id: 'd-pwn-h1', cost: 20, text: 'Buffer size is 32 bytes + 8 bytes saved RBP = 40 bytes offset to reach the saved RIP return address.' },
      { id: 'd-pwn-h2', cost: 40, text: 'x86_64 architecture uses little-endian byte ordering. Address 0x004011ba must be encoded as `\\xba\\x11\\x40\\x00\\x00\\x00\\x00\\x00`.' }
    ],
    writeup: 'Stack layout: [32 bytes buffer] + [8 bytes saved RBP] = 40 bytes. Overwriting the 41st..48th bytes with address `0x004011ba` redirects `ret` instruction to `win()`, which opens `/flags/pwn.txt` and yields `flag{r3t2w1n_st4ck_sm4sh_x86_64_5521}`.'
  },
  {
    id: 'daily-graphql-introspection',
    title: 'GraphQL Directive Leak',
    category: 'Web',
    difficulty: 'Medium',
    points: 250,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'query_phantom',
    solvesCount: 34,
    flag: 'flag{gr4phql_b4tch_sc0p3_3xpl01t_8412}',
    description: 'An enterprise API gateway disabled standard GraphQL introspection (`__schema`), but custom developer debugging directives remain active. Query the internal schema using aliased batch operations and field suggestions to uncover the hidden `systemDiagnostics` query.',
    tags: ['GraphQL', 'Introspection', 'API Security', 'Query Batching'],
    hints: [
      { id: 'd-gql-h1', cost: 15, text: 'Try querying `systemDiagnostics { internalFlag, nodeStatus }` inside the query builder.' },
      { id: 'd-gql-h2', cost: 25, text: 'If rate-limited, combine queries into a single batch request using query aliases: `q1: systemDiagnostics { internalFlag }`.' }
    ],
    writeup: 'Standard __schema was disabled, but the endpoint permitted field suggestion errors and direct querying of unindexed types. Executing `{ systemDiagnostics { internalFlag, secretToken } }` executes the hidden resolver and returns `flag{gr4phql_b4tch_sc0p3_3xpl01t_8412}`.'
  },
  {
    id: 'daily-go-pclntab-reverse',
    title: 'Stripped Go Sym-Scanner',
    category: 'Reverse',
    difficulty: 'Hard',
    points: 380,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'gopher_reverser',
    solvesCount: 18,
    flag: 'flag{g0_pclnt4b_symb0l_r3c0v3ry_9214}',
    description: 'A suspicious Go binary was stripped of ELF symbols. However, Go binaries inherently retain runtime symbol information in the `.gopclntab` section to support panic stack traces. Traverse the pclntab magic header (`0xFFFFFFFA`), extract the function symbol offsets, locate `main.validateSerial`, and reverse the XOR-addition key verification routine.',
    tags: ['Golang', 'Stripped ELF', 'pclntab', 'Symbol Recovery'],
    hints: [
      { id: 'd-go-h1', cost: 25, text: 'The Go pclntab magic header starts with 0xFFFFFFFA on 64-bit Go. Inspect the function table starting at offset 0x20.' },
      { id: 'd-go-h2', cost: 50, text: 'Locate `main.validateSerial`: It checks if `(serial[i] ^ 0x37) + i == target[i]`. Invert this check to obtain the serial key.' }
    ],
    writeup: 'By parsing the `.gopclntab` structure, we recover stripped function symbols and identify `main.validateSerial`. Reversing the check: `serial[i] = (target[i] - i) ^ 0x37`. Entering the recovered serial `GO-992-SECURE` triggers the flag display.'
  },
  {
    id: 'daily-ecdsa-nonce-reuse',
    title: 'ECDSA Nonce Collision',
    category: 'Crypto',
    difficulty: 'Insane',
    points: 490,
    dailyBonusPoints: 100,
    isDaily: true,
    author: 'elliptic_curver',
    solvesCount: 7,
    flag: 'flag{3cds4_n0nc3_r3us3_pr1v4t3_k3y_l34k_7302}',
    description: 'A hardware security module signed two distinct messages (M1 and M2) with the exact same ephemeral private nonce `k`. Because r = (k*G).x mod n is identical across both signatures, calculate the nonce k = (h1 - h2) / (s1 - s2) mod n, recover the master private key d, and decrypt the flag vault.',
    tags: ['ECDSA', 'secp256k1', 'Nonce Reuse', 'Elliptic Curve'],
    hints: [
      { id: 'd-ecdsa-h1', cost: 30, text: 'Both signatures share the exact same `r` value! Since s1 = k^-1 * (h1 + d*r) and s2 = k^-1 * (h2 + d*r), subtracting the two gives s1 - s2 = k^-1 * (h1 - h2).' },
      { id: 'd-ecdsa-h2', cost: 60, text: 'Therefore k = (h1 - h2) * (s1 - s2)^-1 mod n. Once k is known, d = (s1*k - h1) * r^-1 mod n.' }
    ],
    writeup: 'This is the Sony PS3 ECDSA vulnerability. With reused nonce k, we calculate k = (h1 - h2) * inverse_mod(s1 - s2, n) mod n. Then private key d = inverse_mod(r, n) * (s1*k - h1) mod n. Computing d directly gives the root signing key and releases `flag{3cds4_n0nc3_r3us3_pr1v4t3_k3y_l34k_7302}`.'
  }
];
