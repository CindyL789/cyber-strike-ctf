import { Challenge, TeamScore, ActivityEvent } from '../types/ctf';

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'sqli-auth-bypass',
    title: 'The Admin Gate',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    author: 'd0rK_mast3r',
    solvesCount: 42,
    flag: 'flag{sql_1nj3ct10n_m4st3r_992}',
    description: 'An internal mission control portal has been exposed. Security audits suggest the legacy authentication endpoint executes unsanitized SQL queries directly against the user database. Bypass the credentials check to access the command console and recover the flag.',
    tags: ['SQLi', 'Authentication Bypass', 'Database'],
    hints: [
      { id: 'sqli-h1', cost: 10, text: 'Look at the backend SQL query template provided in the debug console: SELECT * FROM operators WHERE user = \'...\' AND pass = \'...\'' },
      { id: 'sqli-h2', cost: 20, text: 'Try injecting a condition that always evaluates to true, followed by a SQL comment sequence such as \' OR \'1\'=\'1\' --' }
    ],
    writeup: 'The application formats input directly into the query string: SELECT * FROM operators WHERE user = \'{username}\' AND pass = \'{password}\'. Supplying `admin\' OR \'1\'=\'1\' --` as the username causes the server to ignore password verification because the OR condition evaluates to TRUE and the rest of the query is commented out.'
  },
  {
    id: 'jwt-tamper-bypass',
    title: 'Token of Trust',
    category: 'Web',
    difficulty: 'Medium',
    points: 200,
    author: 'cipher_wraith',
    solvesCount: 28,
    flag: 'flag{jwt_n0n3_4lg_auth_byp4ss_718}',
    description: 'A classified intelligence vault relies on JSON Web Tokens for API authorization. Current session grants only guest permissions. Investigate the token validation mechanism, exploit the algorithm confusion vulnerability, and elevate your identity to root admin to access `/api/v2/vault/flag`.',
    tags: ['JWT', 'Alg:None', 'Privilege Escalation'],
    hints: [
      { id: 'jwt-h1', cost: 15, text: 'Inspect the JWT header: alg is set to "HS256". Many vulnerable JWT libraries accept "none" as a valid algorithm.' },
      { id: 'jwt-h2', cost: 30, text: 'Change the header {"alg": "none", "typ": "JWT"}, modify payload role to "admin", and strip off the third signature segment (keep the trailing dot).' }
    ],
    writeup: 'Vulnerable JWT parsers fail to reject the "none" algorithm. By altering the token header to `{"alg":"none","typ":"JWT"}` and modifying payload fields `role: "admin"` and `isAdmin: true`, then sending `header.payload.` with an empty signature, the server authenticates the client as root administrator.'
  },
  {
    id: 'prototype-pollution-sandbox',
    title: 'Contaminated Object',
    category: 'Web',
    difficulty: 'Hard',
    points: 350,
    author: 'v8_specter',
    solvesCount: 14,
    flag: 'flag{pr0t0_p0llut10n_r00t_c0ntr0l_412}',
    description: 'A cloud configuration parser dynamically merges user-supplied JSON payload into server setting objects using an unvalidated recursive merge routine. Exploit JavaScript prototype pollution to inject properties into Object.prototype and hijack the authorization check.',
    tags: ['Prototype Pollution', 'Client-side', 'Logic Flaw'],
    hints: [
      { id: 'proto-h1', cost: 25, text: 'Look at how the recursive deepMerge operates: it walks keys recursively without blacklisting __proto__ or constructor.' },
      { id: 'proto-h2', cost: 50, text: 'Send a JSON payload that sets `{"__proto__": {"isAdmin": true, "accessLevel": 99}}`. Check how empty objects inherit these prototype properties.' }
    ],
    writeup: 'The server-side JSON merger iterates keys without filtering `__proto__`. Injecting `{"__proto__": {"isAdmin": true}}` pollutes JavaScript Object.prototype, which causes subsequently instantiated permission check objects `{}` to automatically evaluate `auth.isAdmin === true`.'
  },
  {
    id: 'xor-frequency-breaker',
    title: 'Ghost Cipher',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 120,
    author: 'krypt0s',
    solvesCount: 51,
    flag: 'flag{x0r_c1ph3r_br0k3n_v14_fr3qu3ncy_881}',
    description: 'We intercepted an encrypted transmission from a covert telemetry channel. Our signal intelligence confirms the ciphertext was masked using single-byte XOR encryption. Use the frequency analyzer and key slider to break the cipher and read the secret.',
    tags: ['XOR', 'Frequency Analysis', 'Classical Crypto'],
    hints: [
      { id: 'xor-h1', cost: 10, text: 'Every character in the ASCII flag was XORed with the exact same 1-byte value (0–255).' },
      { id: 'xor-h2', cost: 20, text: 'The known plaintext prefix must begin with "flag{". Try XORing the first ciphertext byte `0x2d` with ASCII \'f\' (0x66) to calculate the key.' }
    ],
    writeup: 'Since C = P ^ K, K = C ^ P. Taking the first byte of ciphertext 0x2d (45) and XORing with known prefix \'f\' (0x66 = 102): 45 ^ 102 = 75 (0x4B). Applying key 0x4B (75) to the entire stream instantly yields the decrypted flag.',
    initialState: {
      ciphertextHex: '2d272a2c30337b3914287a3b2378391429397b20782514357a7f142d39783a36782528321473737a36'
    }
  },
  {
    id: 'rsa-cube-root-weakness',
    title: "Hastad's Whisper",
    category: 'Crypto',
    difficulty: 'Hard',
    points: 300,
    author: 'euler_shade',
    solvesCount: 19,
    flag: 'flag{sm4ll_exp0n3nt_cub3_r00t_rsa_543}',
    description: 'A critical communications satellite generated an RSA public key with a tiny public exponent e = 3. Even worse, the plaintext flag was encrypted without PKCS#1 padding. Recover the original message without factoring the 2048-bit modulus.',
    tags: ['RSA', 'Cube Root Attack', 'Low Exponent'],
    hints: [
      { id: 'rsa-h1', cost: 20, text: 'In textbook RSA, ciphertext c = m^e mod n. If the message m is small enough such that m^e < n, the modulus reduction never wraps around!' },
      { id: 'rsa-h2', cost: 40, text: 'When m^3 < n, c = m^3 exactly in regular integer arithmetic. Use an integer cube root calculator on ciphertext c, then convert the BigInt result to ASCII.' }
    ],
    writeup: 'Because public exponent e = 3 and the message is short without padding, m^3 < n. Therefore c mod n is simply m^3. By taking the exact mathematical cube root of c as a BigInt, we retrieve m directly without factoring n.'
  },
  {
    id: 'reverse-disassembler-crackme',
    title: 'Disassembly Protocol',
    category: 'Reverse',
    difficulty: 'Medium',
    points: 250,
    author: 'radare_eye',
    solvesCount: 22,
    flag: 'flag{r3v_4ss3mbly_cr4ckm3_pwn3d_334}',
    description: 'An embedded licensing binary enforces key validation inside a stripped routine. Step through the simulated x86 assembly instructions, inspect virtual registers (EAX, EBX, ECX) and memory, and reverse the verification logic to crack the passkey.',
    tags: ['Assembly', 'Registers', 'x86 Reverse'],
    hints: [
      { id: 'rev-h1', cost: 15, text: 'Trace the instructions in order: `MOV EAX, [serial]`, `XOR EAX, 0x5A`, `ROL EAX, 3`, `ADD EAX, 0x1337`.' },
      { id: 'rev-h2', cost: 30, text: 'The target comparison is `CMP EAX, 0xD4B2`. Reverse the operations backwards from 0xD4B2: subtract 0x1337, rotate right by 3, XOR with 0x5A.' }
    ],
    writeup: 'The verification algorithm performs: result = (((input ^ 0x5A) <<< 3) + 0x1337) & 0xFFFF. Inverting this: Step 1: 0xD4B2 - 0x1337 = 0xC17B. Step 2: Rotate Right 3 bits = 0x782F. Step 3: XOR 0x5A = 0x7875 (30837 in decimal). Entering 30837 passes verification and releases the flag.'
  },
  {
    id: 'js-deobfuscator-packer',
    title: 'The Obfuscated Sentinel',
    category: 'Reverse',
    difficulty: 'Easy',
    points: 150,
    author: 'obf_hunter',
    solvesCount: 46,
    flag: 'flag{d30bfusc4t3_js_unp4ck3d_902}',
    description: 'A suspicious client-side validation script was recovered from a phishing payload. It has been heavily packed with hex-escaped strings, dictionary rotations, and dynamic evaluation wrapper functions. Deobfuscate the script to recover the hidden authorization key.',
    tags: ['JavaScript', 'Deobfuscation', 'String Arrays'],
    hints: [
      { id: 'js-h1', cost: 10, text: 'Inspect the string lookup table `_0x4a12`. Notice how all encoded strings are indexed via an offset function.' },
      { id: 'js-h2', cost: 20, text: 'You can execute the decoder function in the interactive workbench or replace the indexed calls with their evaluated string values.' }
    ],
    writeup: 'The script uses a standard array rotation and dictionary lookup. Resolving the function calls: `_0x1b2c(0x0)` decodes to "validate", `_0x1b2c(0x1)` decodes to "admin_token", and the embedded secret comparison string directly holds `flag{d30bfusc4t3_js_unp4ck3d_902}`.'
  },
  {
    id: 'pcap-stream-exfiltration',
    title: 'Exfiltration In Plain Sight',
    category: 'Forensics',
    difficulty: 'Medium',
    points: 220,
    author: 'shark_fin',
    solvesCount: 31,
    flag: 'flag{pc4p_p4ck3t_str34m_huttp_3xf1l_617}',
    description: 'Network security monitors captured an anomalous egress spike. We have extracted the packet capture stream `dump_094.pcap`. Apply protocol filtering, reconstruct the TCP streams, and locate the exfiltrated multipart transmission.',
    tags: ['PCAP', 'Wireshark', 'Network Forensics'],
    hints: [
      { id: 'pcap-h1', cost: 15, text: 'Filter the capture by protocol "HTTP" or search for POST requests in the filter bar.' },
      { id: 'pcap-h2', cost: 25, text: 'Inspect the HTTP POST to `/sync/report` in frame #18. Click "Follow Stream" to view the base64 encoded multipart file attachment.' }
    ],
    writeup: 'Filtering for HTTP traffic reveals an outbound POST request to `/sync/report`. Examining the raw stream reveals an exfiltrated parameter `upload_blob` containing Base64 encoded data. Decoding `ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==` recovers the flag.'
  },
  {
    id: 'hex-magic-bytes-repair',
    title: 'Corrupted Artifact',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 130,
    author: 'byte_carver',
    solvesCount: 48,
    flag: 'flag{h3x_c0rrupt_m4g1c_byt3s_f1x3d_109}',
    description: 'An attacker deliberately zeroed out the file header of a critical evidence graphic, preventing image viewers from parsing it. Use the live hex editor to restore the standard PNG magic signature bytes and render the recovered graphic.',
    tags: ['Hex Editor', 'File Signatures', 'Carving'],
    hints: [
      { id: 'hex-h1', cost: 10, text: 'Standard PNG files must always begin with an 8-byte magic header: 89 50 4E 47 0D 0A 1A 0A.' },
      { id: 'hex-h2', cost: 20, text: 'In the Hex Editor, edit the first 4 bytes currently set to `00 00 00 00` and replace them with `89 50 4E 47`, then click "Repair Header".' }
    ],
    writeup: 'The first 4 bytes were overwritten with null bytes `00 00 00 00`. Modifying offset 0x00 to the official PNG file signature `89 50 4E 47` allows the image renderer to correctly decode the chunks and display the embedded visual watermark.'
  },
  {
    id: 'linux-suid-privesc',
    title: 'Zero to Root',
    category: 'Pwn',
    difficulty: 'Hard',
    points: 320,
    author: 'kernel_panic',
    solvesCount: 16,
    flag: 'flag{su1d_p4th_h1j4ck_r00t_sh3ll_901}',
    description: 'You have gained an unprivileged shell as `guest` on target machine `ctf-node-07`. Enumerate the filesystem for SUID binaries with improper path sanitization, hijack the environment, and escalate privileges to read `/root/flag.txt`.',
    tags: ['SUID', 'Privilege Escalation', 'Linux Shell'],
    hints: [
      { id: 'pwn-h1', cost: 20, text: 'Run `find / -perm -u=s 2>/dev/null` or look in `/usr/local/bin` to find custom SUID binaries.' },
      { id: 'pwn-h2', cost: 40, text: 'Run `strings /usr/local/bin/sys-backup`. Notice it executes `tar` without an absolute path. Create a malicious `tar` script in `/tmp`, export `PATH=/tmp:$PATH`, and execute the backup tool.' }
    ],
    writeup: 'Enumeration reveals `/usr/local/bin/sys-backup` has SUID permissions (owned by root). Running strings on it reveals `tar -czf /var/backups/data.tar.gz /home/guest`. Because it calls `tar` instead of `/bin/tar`, crafting `/tmp/tar` with `cat /root/flag.txt` and prepending `/tmp` to PATH executes the malicious script with root privileges.'
  },
  {
    id: 'blind-sqli-time-oracle',
    title: 'Operation Blind Sight',
    category: 'Web',
    difficulty: 'Hard',
    points: 450,
    author: 'sql_phantom',
    solvesCount: 8,
    flag: 'flag{bl1nd_b00l34n_sql1_3xf1ltr4t10n_9941}',
    description: 'A hardened military intelligence directory endpoint verifies agent identifiers without reflecting SQL errors or result rows. The application returns HTTP 200 (CONFIRMED) if rows are returned, and HTTP 404 (NOT_FOUND) otherwise. Construct a true Boolean blind SQL injection payload to exfiltrate the secret flag from `classified_vault` byte by byte.',
    tags: ['Blind SQLi', 'Boolean Oracle', 'Exfiltration'],
    hints: [
      { id: 'bsqli-h1', cost: 25, text: 'Test boolean conditions using: `AG-007\' AND 1=1 --` (HTTP 200) vs `AG-007\' AND 1=2 --` (HTTP 404).' },
      { id: 'bsqli-h2', cost: 50, text: 'Use `SUBSTR(flag, pos, 1) = \'char\'` or `ASCII(SUBSTR(flag, pos, 1)) > ascii_val` to extract characters one at a time, or use the automated exfiltration engine.' }
    ],
    writeup: 'The server executes: SELECT status FROM secret_agents WHERE agent_id = \'{input}\'. Since no query results or errors are returned, we perform Boolean-based blind extraction. Testing `AG-007\' AND (SELECT SUBSTR(flag, 1, 1) FROM classified_vault) = \'f\' --` returns HTTP 200 (TRUE). Repeating this for each position extracts `flag{bl1nd_b00l34n_sql1_3xf1ltr4t10n_9941}`.'
  },
  {
    id: 'cbc-padding-oracle-attack',
    title: "The Oracle's Echo",
    category: 'Crypto',
    difficulty: 'Insane',
    points: 500,
    author: 'vaudenay_ghost',
    solvesCount: 4,
    flag: 'flag{p4dd1ng_0r4cl3_c0mpu73d_byt3_by_byt3_8829}',
    description: 'An encrypted authorization ticket protected by AES-128-CBC is checked by an internal microservice. While you do not hold the AES decryption key, the server leaks a cryptographic side-channel: invalid PKCS#7 padding triggers a 500 Bad Padding exception, while valid padding returns 200 OK. Conduct a byte-by-byte padding oracle attack to reconstruct the plaintext.',
    tags: ['AES-CBC', 'Padding Oracle', 'PKCS#7', 'Side-Channel'],
    hints: [
      { id: 'pad-h1', cost: 30, text: 'In CBC mode, plaintext P_i = Decrypt(C_i) ^ C_{i-1}. By manipulating the last byte of C_{i-1}, you can trigger valid PKCS#7 padding (0x01).' },
      { id: 'pad-h2', cost: 60, text: 'When the oracle reports valid padding for modified byte C\'_{i-1}[15], Intermediate byte I[15] = C\'_{i-1}[15] ^ 0x01. Then original Plaintext P[15] = I[15] ^ C_{i-1}[15].' }
    ],
    writeup: 'This is Vaudenay\'s classic CBC Padding Oracle attack. By adjusting the trailing byte of the preceding ciphertext block until the decryption routine produces valid PKCS#7 padding (ending in 0x01), we calculate the intermediate state byte I = C\' ^ 0x01. XORing I with the original ciphertext block immediately yields the true plaintext.'
  },
  {
    id: 'custom-bytecode-vm-reversal',
    title: 'Enigma Core',
    category: 'Reverse',
    difficulty: 'Insane',
    points: 460,
    author: 'vm_architect',
    solvesCount: 6,
    flag: 'flag{vm_byt3c0d3_d1s4ss3mbl3r_pwn3d_491}',
    description: 'A classified licensing dongle is protected by a proprietary virtual machine. Rather than standard x86 instructions, it interprets custom 8-bit bytecode featuring custom opcodes (LOAD, XOR, ROR, ADD, CMP, JNZ). Disassemble the virtual machine bytecode, solve the algebraic constraints on the 8-byte key, and unlock the vault.',
    tags: ['Custom VM', 'Bytecode', 'Disassembly', 'Algebraic Constraints'],
    hints: [
      { id: 'vm-h1', cost: 25, text: 'Trace the PC from 0x00: byte 0 is loaded, XORed with 0x42, and compared against 0x09. Therefore Key[0] = 0x09 ^ 0x42 = \'K\'.' },
      { id: 'vm-h2', cost: 50, text: 'Byte 1 is rotated right by 2 bits and compared with 0x8E. Rotating 0x8E left by 2 bits gives 0x38 (\'8\'). Continue solving constraints for all 8 positions to get serial K8-7X9P!.' }
    ],
    writeup: 'Reverse engineering the VM bytecode reveals 6 algebraic constraints on the input serial: Byte 0: K (0x4B ^ 0x42 = 0x09); Byte 1: 8 (0x38 ROR 2 = 0x8E); Byte 2: - (0x2D); Byte 3: 7 (0x37 + 0x13 = 0x4A); Byte 4: X (0x58 ^ 0x55 = 0x0D); Byte 5: 9 (0x39 - 0x20 = 0x19). Executing with valid serial K8-7X9P! reaches opcode 0x77 UNLOCK_VAULT.'
  },
  {
    id: 'format-string-stack-arbitrary-write',
    title: 'Echo Chamber',
    category: 'Pwn',
    difficulty: 'Insane',
    points: 480,
    author: 'libc_destroyer',
    solvesCount: 5,
    flag: 'flag{fmt_str_4rb1tr4ry_wr1t3_st4ck_h4ck_672}',
    description: 'An internal diagnostic daemon passes untrusted user input directly to `printf(user_buffer)` without format specifiers. Inspect the 32-bit stack frames using `%p` to locate the buffer parameter offset, then construct an arbitrary memory write exploit using `%n` to overwrite `target_auth_level` at fixed memory address `0x0804C028` with value `0x1337`.',
    tags: ['Format String', '%n Arbitrary Write', 'Stack Exploitation', 'Memory Corruption'],
    hints: [
      { id: 'fmt-h1', cost: 25, text: 'Send `%p.%p.%p.%p.%p.%p.%p` to leak stack values. Notice that the 7th parameter reflects your input buffer.' },
      { id: 'fmt-h2', cost: 50, text: 'Prefix your payload with target address `\\x28\\xc0\\x04\\x08` (4 bytes). We need to write 0x1337 = 4919 bytes. Since 4 bytes are printed, pad with `%4915c` and write using `%7$n`.' }
    ],
    writeup: 'The format string flaw allows arbitrary memory write via `%n`. User input starts at stack offset 7. We place address 0x0804C028 at the start of our payload (`\\x28\\xc0\\x04\\x08`), output 4915 additional characters (`%4915c`), and write the total byte count (4919 = 0x1337) to the address at offset 7 with `%7$n`. The daemon detects target_auth_level == 0x1337 and grants root shell.'
  },
  {
    id: 'memory-dump-volatility-forensics',
    title: 'Ghost in the RAM',
    category: 'Forensics',
    difficulty: 'Hard',
    points: 420,
    author: 'dfir_sentinel',
    solvesCount: 11,
    flag: 'flag{m3m0ry_v0l4t1l1ty_h0ll0w1ng_4pt_8314}',
    description: 'Incident responders acquired physical RAM dump `incident_host09.raw` from a compromised enterprise server. Utilize the Volatility 3 framework to identify rogue network connections, locate the hollowed `svchost.exe` process (PAGE_EXECUTE_READWRITE injection), carve process memory, and extract the exfiltrated command-and-control flag.',
    tags: ['Volatility', 'Memory Dump', 'Process Hollowing', 'Threat Hunting'],
    hints: [
      { id: 'vol-h1', cost: 20, text: 'Run `windows.netscan` to spot an anomalous outbound connection on port 4444 to C2 IP 198.51.100.77 associated with PID 4820.' },
      { id: 'vol-h2', cost: 40, text: 'Use `windows.malfind --pid 4820` to verify injected shellcode with PAGE_EXECUTE_READWRITE. Then carve memory with `windows.memdump --pid 4820`.' }
    ],
    writeup: 'Using `windows.netscan` reveals PID 4820 (svchost.exe) connected to 198.51.100.77:4444. Running `windows.malfind --pid 4820` confirms reflective PE injection. Running `windows.memdump --pid 4820` dumps the carved process memory; searching the memory stream reveals the C2 beacon header containing `X-Exfil-Token: flag{m3m0ry_v0l4t1l1ty_h0ll0w1ng_4pt_8314}`.'
  }
];

export const INITIAL_TEAMS: TeamScore[] = [
  {
    id: 'team-binary-guild',
    name: 'BinaryGuild',
    avatar: 'BG',
    score: 1840,
    solves: 8,
    lastSolveTime: '4m ago',
    categoryBreakdown: { Web: 300, Crypto: 420, Reverse: 400, Forensics: 350, Pwn: 370 }
  },
  {
    id: 'team-kernel-panic',
    name: 'KernelPanic',
    avatar: 'KP',
    score: 1620,
    solves: 7,
    lastSolveTime: '11m ago',
    categoryBreakdown: { Web: 450, Crypto: 300, Reverse: 250, Forensics: 300, Pwn: 320 }
  },
  {
    id: 'team-cipher-knights',
    name: 'CipherKnights',
    avatar: 'CK',
    score: 1390,
    solves: 6,
    lastSolveTime: '18m ago',
    categoryBreakdown: { Web: 300, Crypto: 420, Reverse: 400, Forensics: 270, Pwn: 0 }
  },
  {
    id: 'team-null-squad',
    name: 'NullSquad',
    avatar: 'NS',
    score: 1180,
    solves: 5,
    lastSolveTime: '27m ago',
    categoryBreakdown: { Web: 300, Crypto: 120, Reverse: 400, Forensics: 360, Pwn: 0 }
  },
  {
    id: 'team-byte-brigade',
    name: 'ByteBrigade',
    avatar: 'BB',
    score: 950,
    solves: 4,
    lastSolveTime: '35m ago',
    categoryBreakdown: { Web: 200, Crypto: 420, Reverse: 200, Forensics: 130, Pwn: 0 }
  },
  {
    id: 'team-user',
    name: 'GhostProtocol',
    avatar: 'GP',
    score: 0,
    solves: 0,
    lastSolveTime: 'None',
    categoryBreakdown: { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 },
    isUser: true
  }
];

export const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-1',
    teamName: 'BinaryGuild',
    challengeTitle: 'Zero to Root',
    category: 'Pwn',
    points: 320,
    timestamp: '4m ago',
    isFirstBlood: true
  },
  {
    id: 'act-2',
    teamName: 'KernelPanic',
    challengeTitle: 'Contaminated Object',
    category: 'Web',
    points: 350,
    timestamp: '11m ago'
  },
  {
    id: 'act-3',
    teamName: 'CipherKnights',
    challengeTitle: "Hastad's Whisper",
    category: 'Crypto',
    points: 300,
    timestamp: '18m ago',
    isFirstBlood: true
  },
  {
    id: 'act-4',
    teamName: 'NullSquad',
    challengeTitle: 'Disassembly Protocol',
    category: 'Reverse',
    points: 250,
    timestamp: '27m ago'
  },
  {
    id: 'act-5',
    teamName: 'ByteBrigade',
    challengeTitle: 'Exfiltration In Plain Sight',
    category: 'Forensics',
    points: 220,
    timestamp: '35m ago'
  }
];
