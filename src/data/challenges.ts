import { Challenge, TeamScore, ActivityEvent } from '../types/ctf';

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'blind-sqli-time-oracle',
    title: 'Operation Blind Sight',
    category: 'Web',
    difficulty: 'Hard',
    points: 450,
    author: 'sql_phantom',
    solvesCount: 8,
    flag: 'flag{bl1nd_b00l34n_sql1_3xf1ltr4t10n_9941}',
    description: 'A hardened intelligence directory endpoint verifies agent identifiers without reflecting SQL errors or query results. The server returns HTTP 200 (CONFIRMED) if rows are returned, and HTTP 404 (NOT_FOUND) otherwise. Construct a true Boolean blind SQL injection payload to exfiltrate the secret flag from classified_vault character by character.',
    tags: ['Blind SQLi', 'Boolean Oracle', 'Exfiltration', 'Binary Search'],
    hints: [
      { id: 'bsqli-h1', cost: 25, text: 'Test boolean conditions using: AG-007\' AND 1=1 -- (HTTP 200) vs AG-007\' AND 1=2 -- (HTTP 404).' },
      { id: 'bsqli-h2', cost: 50, text: 'Use SUBSTR(flag, pos, 1) = \'c\' or ASCII(SUBSTR(flag, pos, 1)) > val to extract characters one at a time, or use the automated exfiltration runner.' }
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
    tags: ['AES-CBC', 'Padding Oracle', 'PKCS#7', 'Side-Channel', 'Vaudenay'],
    hints: [
      { id: 'pad-h1', cost: 30, text: 'In CBC mode, plaintext P_i = Decrypt(C_i) ^ C_{i-1}. By manipulating the last byte of C_{i-1}, you can trigger valid PKCS#7 padding (0x01).' },
      { id: 'pad-h2', cost: 60, text: 'When the oracle reports valid padding for modified byte C\'_{i-1}[15], Intermediate byte I[15] = C\'_{i-1}[15] ^ 0x01. Then original Plaintext P[15] = I[15] ^ C_{i-1}[15].' }
    ],
    writeup: 'This is Vaudenay\'s classic CBC Padding Oracle attack. By adjusting the trailing byte of the preceding ciphertext block until the decryption routine produces valid PKCS#7 padding (ending in 0x01), we calculate the intermediate state byte I = C\' ^ 0x01. XORing I with the original ciphertext block immediately yields the true plaintext byte.'
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
    description: 'An internal diagnostic daemon passes untrusted user input directly to printf(user_buffer) without format specifiers. Inspect the 32-bit stack frames using %p to locate the buffer parameter offset, then construct an arbitrary memory write exploit using %n to overwrite target_auth_level at fixed memory address 0x0804C028 with value 0x1337.',
    tags: ['Format String', '%n Arbitrary Write', 'Stack Exploitation', 'Memory Corruption'],
    hints: [
      { id: 'fmt-h1', cost: 25, text: 'Send %p.%p.%p.%p.%p.%p.%p to leak stack values. Notice that the 7th parameter reflects your input buffer.' },
      { id: 'fmt-h2', cost: 50, text: 'Prefix your payload with target address \\x28\\xc0\\x04\\x08 (4 bytes). We need to write 0x1337 = 4919 bytes. Since 4 bytes are printed, pad with %4915c and write using %7$n.' }
    ],
    writeup: 'The format string flaw allows arbitrary memory write via `%n`. User input starts at stack offset 7. We place address 0x0804C028 at the start of our payload, output 4915 additional characters (`%4915c`), and write the total byte count (4919 = 0x1337) to the address at offset 7 with `%7$n`. The daemon detects target_auth_level == 0x1337 and grants root shell.'
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
    description: 'Incident responders acquired physical RAM dump incident_host09.raw from a compromised enterprise server. Utilize the Volatility 3 framework to identify rogue network connections, locate the hollowed svchost.exe process (PAGE_EXECUTE_READWRITE injection), carve process memory, and extract the exfiltrated command-and-control flag.',
    tags: ['Volatility', 'Memory Dump', 'Process Hollowing', 'Threat Hunting'],
    hints: [
      { id: 'vol-h1', cost: 20, text: 'Run windows.netscan to spot an anomalous outbound connection on port 4444 to C2 IP 198.51.100.77 associated with PID 4820.' },
      { id: 'vol-h2', cost: 40, text: 'Use windows.malfind --pid 4820 to verify injected shellcode with PAGE_EXECUTE_READWRITE. Then carve memory with windows.memdump --pid 4820.' }
    ],
    writeup: 'Using `windows.netscan` reveals PID 4820 (svchost.exe) connected to 198.51.100.77:4444. Running `windows.malfind --pid 4820` confirms reflective PE injection. Running `windows.memdump --pid 4820` dumps the carved process memory; searching the memory stream reveals the C2 beacon header containing X-Exfil-Token.'
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
    tags: ['RSA', 'Cube Root Attack', 'Low Exponent', 'Cryptanalysis'],
    hints: [
      { id: 'rsa-h1', cost: 20, text: 'In textbook RSA, ciphertext c = m^e mod n. If the message m is small enough such that m^e < n, the modulus reduction never wraps around!' },
      { id: 'rsa-h2', cost: 40, text: 'When m^3 < n, c = m^3 exactly in regular integer arithmetic. Use an integer cube root calculator on ciphertext c, then convert the BigInt result to ASCII.' }
    ],
    writeup: 'Because public exponent e = 3 and the message is short without padding, m^3 < n. Therefore c mod n is simply m^3. By taking the exact mathematical cube root of c as a BigInt, we retrieve m directly without factoring n.'
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
    description: 'You have gained an unprivileged shell as guest on target machine ctf-node-07. Enumerate the filesystem for SUID binaries with improper path sanitization, hijack the environment, and escalate privileges to read /root/flag.txt.',
    tags: ['SUID', 'Privilege Escalation', 'Linux Shell', 'Environment Hijack'],
    hints: [
      { id: 'pwn-h1', cost: 20, text: 'Run find / -perm -u=s 2>/dev/null or look in /usr/local/bin to find custom SUID binaries.' },
      { id: 'pwn-h2', cost: 40, text: 'Run strings /usr/local/bin/sys-backup. Notice it executes tar without an absolute path. Create a malicious tar script in /tmp, export PATH=/tmp:$PATH, and execute the backup tool.' }
    ],
    writeup: 'Enumeration reveals `/usr/local/bin/sys-backup` has SUID permissions (owned by root). Running strings on it reveals `tar -czf /var/backups/data.tar.gz /home/guest`. Because it calls `tar` instead of `/bin/tar`, crafting `/tmp/tar` with `cat /root/flag.txt` and prepending `/tmp` to PATH executes the malicious script with root privileges.'
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
    tags: ['Prototype Pollution', 'Client-side', 'Logic Flaw', 'Object.prototype'],
    hints: [
      { id: 'proto-h1', cost: 25, text: 'Look at how the recursive deepMerge operates: it walks keys recursively without blacklisting __proto__ or constructor.' },
      { id: 'proto-h2', cost: 50, text: 'Send a JSON payload that sets {"__proto__": {"isAdmin": true, "accessLevel": 99}}. Check how empty objects inherit these prototype properties.' }
    ],
    writeup: 'The server-side JSON merger iterates keys without filtering `__proto__`. Injecting `{"__proto__": {"isAdmin": true}}` pollutes JavaScript Object.prototype, which causes subsequently instantiated permission check objects `{}` to automatically evaluate `auth.isAdmin === true`.'
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
    tags: ['Assembly', 'Registers', 'x86 Reverse', 'Keygen'],
    hints: [
      { id: 'rev-h1', cost: 15, text: 'Trace the instructions in order: MOV EAX, [serial], XOR EAX, 0x5A, ROL EAX, 3, ADD EAX, 0x1337.' },
      { id: 'rev-h2', cost: 30, text: 'The target comparison is CMP EAX, 0xD4B2. Reverse the operations backwards from 0xD4B2: subtract 0x1337, rotate right by 3, XOR with 0x5A.' }
    ],
    writeup: 'The verification algorithm performs: result = (((input ^ 0x5A) <<< 3) + 0x1337) & 0xFFFF. Inverting this: Step 1: 0xD4B2 - 0x1337 = 0xC17B. Step 2: Rotate Right 3 bits = 0x782F. Step 3: XOR 0x5A = 0x7875 (30837 in decimal). Entering 30837 passes verification and releases the flag.'
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
    description: 'Network security monitors captured an anomalous egress spike. We have extracted the packet capture stream dump_094.pcap. Apply protocol filtering, reconstruct the TCP streams, and locate the exfiltrated multipart transmission.',
    tags: ['PCAP', 'Wireshark', 'Network Forensics', 'Stream Following'],
    hints: [
      { id: 'pcap-h1', cost: 15, text: 'Filter the capture by protocol "HTTP" or search for POST requests in the filter bar.' },
      { id: 'pcap-h2', cost: 25, text: 'Inspect the HTTP POST to /sync/report in frame #18. Click "Follow Stream" to view the base64 encoded multipart file attachment.' }
    ],
    writeup: 'Filtering for HTTP traffic reveals an outbound POST request to `/sync/report`. Examining the raw stream reveals an exfiltrated parameter `upload_blob` containing Base64 encoded data. Decoding `ZmxhZ3twYzRwX3A0Y2szdF9zdHIzNG1faHV0dHBfM3hmMWxfNjE3fQ==` recovers the flag.'
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
    description: 'A classified intelligence vault relies on JSON Web Tokens for API authorization. Current session grants only guest permissions. Investigate the token validation mechanism, exploit the algorithm confusion vulnerability, and elevate your identity to root admin to access /api/v2/vault/flag.',
    tags: ['JWT', 'Alg:None', 'Privilege Escalation', 'Auth Bypass'],
    hints: [
      { id: 'jwt-h1', cost: 15, text: 'Inspect the JWT header: alg is set to "HS256". Many vulnerable JWT libraries accept "none" as a valid algorithm.' },
      { id: 'jwt-h2', cost: 30, text: 'Change the header {"alg": "none", "typ": "JWT"}, modify payload role to "admin", and strip off the third signature segment (keep the trailing dot).' }
    ],
    writeup: 'Vulnerable JWT parsers fail to reject the "none" algorithm. By altering the token header to `{"alg":"none","typ":"JWT"}` and modifying payload fields `role: "admin"` and `isAdmin: true`, then sending `header.payload.` with an empty signature, the server authenticates the client as root administrator.'
  },
  {
    id: 'xor-frequency-breaker',
    title: 'Ghost Cipher',
    category: 'Crypto',
    difficulty: 'Medium',
    points: 180,
    author: 'krypt0s',
    solvesCount: 51,
    flag: 'flag{x0r_c1ph3r_br0k3n_v14_fr3qu3ncy_881}',
    description: 'We intercepted an encrypted transmission from a covert telemetry channel. Our signal intelligence confirms the ciphertext was masked using single-byte XOR encryption. Use the frequency analyzer and key slider to break the cipher and read the secret.',
    tags: ['XOR', 'Frequency Analysis', 'Classical Crypto', 'Known Plaintext'],
    hints: [
      { id: 'xor-h1', cost: 10, text: 'Every character in the ASCII flag was XORed with the exact same 1-byte value (0–255).' },
      { id: 'xor-h2', cost: 20, text: 'The known plaintext prefix must begin with "flag{". Try XORing the first ciphertext byte 0x2d with ASCII \'f\' (0x66) to calculate the key.' }
    ],
    writeup: 'Since C = P ^ K, K = C ^ P. Taking the first byte of ciphertext 0x2d (45) and XORing with known prefix \'f\' (0x66 = 102): 45 ^ 102 = 75 (0x4B). Applying key 0x4B (75) to the entire stream instantly yields the decrypted flag.'
  },
  {
    id: 'ret2win-rop-buffer-overflow',
    title: 'Stack Smash Vanguard',
    category: 'Pwn',
    difficulty: 'Hard',
    points: 380,
    author: 'rop_sorcerer',
    solvesCount: 9,
    flag: 'flag{r0p_ch41n_r3t2w1n_st4ck_sm4sh_8831}',
    description: 'A 64-bit ELF binary runs an unbounds gets() call inside function vuln(). Binary protections confirm No Canary, but Non-Executable stack (NX/DEP) is enabled. Calculate the 72-byte buffer offset to overwrite the saved return address on the stack, locate win() at 0x401196, and align the stack to 16 bytes using a dummy ret gadget.',
    tags: ['Buffer Overflow', 'ret2win', 'ROP', 'x86_64', 'Stack Alignment'],
    hints: [
      { id: 'rop-h1', cost: 20, text: 'Use pattern create/offset: buffer is 64 bytes, followed by 8 bytes of saved RBP. Total offset to RIP is 72 bytes.' },
      { id: 'rop-h2', cost: 40, text: 'In 64-bit Ubuntu GLIBC, system() inside win() requires RSP to be 16-byte aligned. Prefix the win address 0x401196 with a standalone "ret" gadget (0x40101a).' }
    ],
    writeup: 'The buffer offset is 72 bytes (`A` * 72). Because Ubuntu x86_64 ABI requires 16-byte stack alignment prior to `movaps` instructions in GLIBC, calling `win()` directly causes a SIGSEGV. We construct payload: `72 bytes padding + 0x40101a (ret) + 0x401196 (win)`. Executing this jumps to win() with an aligned stack and executes the shell.'
  },
  {
    id: 'ssrf-cloud-metadata-pivot',
    title: 'Cloud Mirage',
    category: 'Web',
    difficulty: 'Hard',
    points: 400,
    author: 'cloud_intruder',
    solvesCount: 12,
    flag: 'flag{ssrf_cl0ud_m3t4d4t4_14m_p1v0t_9012}',
    description: 'An automated web hook preview microservice validates and downloads external avatars. The developer attempted to block private RFC 1918 subnets, but failed to block cloud metadata endpoints or handle decimal IP representations. Pivot through the SSRF to fetch the internal cloud instance metadata token.',
    tags: ['SSRF', 'Cloud Metadata', 'Bypass Filter', 'IAM Pivoting'],
    hints: [
      { id: 'ssrf-h1', cost: 25, text: 'Cloud metadata lives at 169.254.169.254. The server also requires the header "Metadata-Flavor: Google".' },
      { id: 'ssrf-h2', cost: 50, text: 'The naive regex only checks "127.0.0.1" and "localhost". You can access 169.254.169.254 directly or via decimal integer 2852039166.' }
    ],
    writeup: 'The preview bot fetches user-supplied URLs. Supplying `http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token` with header `Metadata-Flavor: Google` bypasses the simple RFC1918 filter and causes the internal service to dump the root service account OAuth token containing the flag.'
  },
  {
    id: 'stego-bitplanes-recovery',
    title: 'Shadow Spectrum',
    category: 'Forensics',
    difficulty: 'Hard',
    points: 340,
    author: 'stego_phantom',
    solvesCount: 15,
    flag: 'flag{st3g0_l34st_s1gn1f1c4nt_b1t_c4rv3d_771}',
    description: 'A covert operative transmitted an innocent-looking surveillance photograph. Steganographic analysis shows least-significant-bit (LSB) variance across the red and blue channel bitplanes. Demux the raw color bitplanes, isolate plane 0, and reconstruct the hidden ASCII archive.',
    tags: ['Steganography', 'LSB', 'Bitplanes', 'Image Forensics'],
    hints: [
      { id: 'stego-h1', cost: 20, text: 'Switch color channel mode to "Red Channel, Bit 0" in the bitplane viewer.' },
      { id: 'stego-h2', cost: 40, text: 'The payload begins at byte 0x40 with standard magic bytes PK\\x03\\x04. Extract the continuous bitstream to recover the embedded archive.' }
    ],
    writeup: 'Examining the image in the Bitplane Inspector reveals non-random structured noise in Red Plane 0. Extracting the least significant bits across the first 2048 pixels and reconstructing into bytes reveals a zip archive holding secret.txt with the flag.'
  },
  {
    id: 'vigenere-autokey-breaker',
    title: 'The Polyalphabetic Enigma',
    category: 'Crypto',
    difficulty: 'Hard',
    points: 360,
    author: 'poly_crypt',
    solvesCount: 13,
    flag: 'flag{v1g3n3r3_4ut0k3y_c1ph3r_cr4ck3d_4512}',
    description: 'An intercepted diplomatic message was encrypted using an Autokey Vigenere cipher, where the key is initialized with a secret codeword and then continued using the plaintext itself. Break the autokey cipher by guessing the known flag header and propagating the key chain backwards.',
    tags: ['Vigenere', 'Autokey', 'Polyalphabetic', 'Known Plaintext'],
    hints: [
      { id: 'vig-h1', cost: 20, text: 'Unlike standard repeating-key Vigenere, autokey uses Key = Word + Plaintext. Knowing that Plaintext begins with "flag{" reveals the first 5 characters of the key!' },
      { id: 'vig-h2', cost: 40, text: 'Once you recover the 4-letter seed keyword "ZEUS", each decrypted plaintext letter becomes the key for subsequent characters.' }
    ],
    writeup: 'In an autokey cipher: C[i] = (P[i] + K[i]) mod 26. Since P starts with "flag", K[0..3] = (C[0..3] - P[0..3]) mod 26 = "ZEUS". Once the 4-character seed is recovered, the decrypted plaintext characters automatically feed into the key queue to decrypt the remainder of the ciphertext.'
  },
  {
    id: 'operation-ghostwire-ret2libc',
    title: 'Operation Ghostwire',
    category: 'Pwn',
    difficulty: 'Nightmare',
    points: 600,
    author: 'canary_slayer',
    solvesCount: 2,
    flag: 'flag{gh0stw1r3_c4n4ry_l34k_r3t2l1bc_sh3ll_9934}',
    description: 'A hardened 64-bit microservice daemon is protected by full binary defenses: Stack Canaries, Non-Executable Stack (NX/DEP), and Position Independent Executables (PIE with ASLR). First, leak the random stack canary and libc base offset via a crafted format-specifier payload. Second, construct a multi-stage ret2libc ROP chain to call system("/bin/sh") without triggering __stack_chk_fail.',
    tags: ['PIE Bypass', 'Canary Leak', 'ret2libc', 'ROP Chains', 'ASLR'],
    hints: [
      { id: 'gw-h1', cost: 35, text: 'Probe format offset %11$p to leak the __stack_chk_guard canary value (always ends in \\x00) and offset %15$p to leak __libc_start_main_ret.' },
      { id: 'gw-h2', cost: 70, text: 'Calculate libc base = leaked_libc - 0x29D90. Then locate system() at base + 0x50D70, pop rdi; ret at base + 0x2A3E5, and "/bin/sh" string at base + 0x1D8678. Ensure RSP is 16-byte aligned!' }
    ],
    writeup: 'Stage 1: Leaking parameters: sending `%11$p.%15$p` leaks the 64-bit stack canary and `__libc_start_main+240`. Subtracting libc offset gives libc base. Stage 2: Buffer overflow reaches canary at offset 40, followed by 8 bytes saved RBP, then RIP. We preserve the canary value, place `pop rdi; ret`, pointer to `/bin/sh`, a `ret` for 16-byte alignment, and call `system()`. This yields an interactive root shell.'
  },
  {
    id: 'the-quantum-lattice-ecdsa',
    title: 'The Quantum Lattice',
    category: 'Crypto',
    difficulty: 'Nightmare',
    points: 650,
    author: 'lattice_monk',
    solvesCount: 1,
    flag: 'flag{lll_l4tt1c3_r3duct10n_b14s3d_n0nc3_pwn_7721}',
    description: 'An embedded hardware security module (HSM) signs critical telemetry messages using ECDSA over secp256k1. A hardware glitch causes the ephemeral nonce generator k to leak its upper 8 bits (they are consistently fixed to 0x00). Given 4 valid signatures (r_i, s_i, h_i), formulate a Hidden Number Problem (HNP), construct a Closest Vector Problem (CVP) lattice matrix, and run the Lenstra-Lenstra-Lovász (LLL) basis reduction to recover the private key.',
    tags: ['ECDSA', 'Biased Nonce', 'LLL Reduction', 'Lattice Cryptanalysis', 'secp256k1'],
    hints: [
      { id: 'lat-h1', cost: 40, text: 'ECDSA equation: s = k^-1 * (h + r * d) mod n, meaning k = s^-1 * (h + r * d) mod n. Since k < 2^248 (upper 8 bits zero), this is a classic Hidden Number Problem.' },
      { id: 'lat-h2', cost: 80, text: 'Build an (m+1) x (m+1) lattice with basis vectors encoding t_i = r_i * s_i^-1 mod n and u_i = h_i * s_i^-1 mod n. The shortest vector in the LLL-reduced basis directly discloses private key d.' }
    ],
    writeup: 'Because nonces have 8 known high zero bits (biased nonce vulnerability), we map the ECDSA signature equations into an integer lattice representing the Hidden Number Problem. Executing the LLL lattice reduction algorithm finds the unique shortest vector corresponding to private scalar d = 0x8F4A2C... Verifying against public key releases the master decryption key.'
  },
  {
    id: 'shadow-kernel-polymorphic',
    title: 'Shadow Kernel',
    category: 'Reverse',
    difficulty: 'Nightmare',
    points: 620,
    author: 'poly_specter',
    solvesCount: 2,
    flag: 'flag{p0lym0rph1c_s3lf_m0d1fy1ng_c0d3_cr4ck3d_551}',
    description: 'A classified espionage implant mutates its own executable pages at runtime using mprotect(PROT_READ|PROT_WRITE|PROT_EXEC). Every 16 instructions, a polymorphic decryptor routine unrolls an XOR rolling key to decode the next basic block while checking for debugger breakpoints (0xCC / ptrace). Neutralize the anti-debugging checks, extract the dynamic mutation keystream, and reconstruct the final validation algorithm.',
    tags: ['Self-Modifying', 'Polymorphic', 'Anti-Debug', 'mprotect', 'Dynamic Reversal'],
    hints: [
      { id: 'pk-h1', cost: 35, text: 'Notice the ptrace(PTRACE_TRACEME) call at 0x401050 and the INT 3 scanner that checks code checksums. Patch the anti-debug return value to 0x0.' },
      { id: 'pk-h2', cost: 70, text: 'The polymorphic decryptor loop XORs the next page with: K_{i+1} = (K_i * 0x5DEECE66D + 0xB) & 0xFF. Trace the PRNG state after 3 mutation rounds to reveal the key comparison array.' }
    ],
    writeup: 'The implant uses self-modifying code pages decoded on-the-fly. By bypassing the `ptrace` detection routine and tracing the dynamic instruction stream, we observe that at cycle 48, the decoded routine compares input bytes against the decrypted table `[0x88, 0x1F, 0x4B, 0x92, 0xEE, 0x73, 0x05, 0xCA]`. Inverting the round transformation yields the valid passcode.'
  },
  {
    id: 'zero-click-deserialization',
    title: 'Phantom Payload',
    category: 'Web',
    difficulty: 'Nightmare',
    points: 580,
    author: 'rce_phantom',
    solvesCount: 3,
    flag: 'flag{pyth0n_p1ckl3_g4dg3t_ch41n_rc3_8819}',
    description: 'A high-throughput distributed message worker processes serialized state snapshots via an unauthenticated WebSocket queue. The service decodes binary pickle streams with a restrictive unpickler that bans `os.system` and `subprocess`. Construct a multi-gadget reduction chain using `posix.spawnlp` or `builtins.getattr` and `builtins.exec` to bypass the namespace filter and execute a remote command.',
    tags: ['Deserialization', 'Pickle RCE', 'Filter Bypass', 'Gadget Chain', 'WebSockets'],
    hints: [
      { id: 'pick-h1', cost: 35, text: 'The custom find_class() hook blocks "os" and "subprocess", but permits "builtins" and "posix".' },
      { id: 'pick-h2', cost: 70, text: 'Craft a pickle bytecode stream that resolves builtins.getattr or posix.popen to run `/bin/cat /vault/flag.txt` and pipe output into the worker telemetry stream.' }
    ],
    writeup: 'The blacklist-based unpickler blocks direct `os.system`. By crafting raw pickle opcodes (GLOBAL "posix" "popen", STRING "/bin/cat /vault/flag.txt", TUPLE1, REDUCE, METHOD "read", REDUCE), the payload executes with the privileges of the message broker worker without tripping the prohibited module filter.'
  },
  {
    id: 'bgp-hijack-tls13-downgrade',
    title: 'Dark Fiber Intercept',
    category: 'Forensics',
    difficulty: 'Nightmare',
    points: 590,
    author: 'packet_necromancer',
    solvesCount: 2,
    flag: 'flag{tls13_k3y_sch3dul3_d0wngr4d3_d3crypt3d_612}',
    description: 'State-sponsored threat actors performed a BGP prefix hijack, intercepting high-assurance TLS 1.3 traffic. Forensic investigators seized memory dumps and network pcap streams. The target client was manipulated via a version downgrade probe. Extract the ClientRandom, ServerRandom, and Client Early Traffic Secret, reconstruct the TLS 1.3 HKDF Key Schedule, and decrypt the Application Data stream.',
    tags: ['TLS 1.3', 'HKDF Key Schedule', 'BGP Hijack', 'Traffic Decryption', 'Cryptanalysis'],
    hints: [
      { id: 'tls-h1', cost: 35, text: 'Locate the TLS 1.3 Client Hello in frame 42. Note the ClientRandom (32 bytes) and cipher suite TLS_AES_128_GCM_SHA256.' },
      { id: 'tls-h2', cost: 70, text: 'Carve the PreSharedKey or ECDHE public key from the Client Hello key_share extension. Combine with the private scalar recovered from core dump memory to derive Master Secret via HKDF-Extract.' }
    ],
    writeup: 'Using the captured ephemeral Diffie-Hellman share from the pcap along with the carved private key from the server memory dump, we compute the shared secret Z. We feed Z through HKDF-Extract and HKDF-Expand-Label to derive client_application_traffic_secret_0 and server_application_traffic_secret_0. Feeding the derived AES-GCM keys into the packet stream decrypts the inner HTTP/2 POST containing the classified token.'
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
    categoryBreakdown: { Web: 450, Crypto: 500, Reverse: 460, Forensics: 420, Pwn: 480 }
  },
  {
    id: 'team-kernel-panic',
    name: 'KernelPanic',
    avatar: 'KP',
    score: 1620,
    solves: 7,
    lastSolveTime: '11m ago',
    categoryBreakdown: { Web: 400, Crypto: 300, Reverse: 250, Forensics: 340, Pwn: 380 }
  },
  {
    id: 'team-cipher-knights',
    name: 'CipherKnights',
    avatar: 'CK',
    score: 1390,
    solves: 6,
    lastSolveTime: '18m ago',
    categoryBreakdown: { Web: 200, Crypto: 500, Reverse: 250, Forensics: 220, Pwn: 0 }
  },
  {
    id: 'team-null-squad',
    name: 'NullSquad',
    avatar: 'NS',
    score: 1180,
    solves: 5,
    lastSolveTime: '27m ago',
    categoryBreakdown: { Web: 350, Crypto: 180, Reverse: 460, Forensics: 0, Pwn: 0 }
  },
  {
    id: 'team-byte-brigade',
    name: 'ByteBrigade',
    avatar: 'BB',
    score: 950,
    solves: 4,
    lastSolveTime: '35m ago',
    categoryBreakdown: { Web: 200, Crypto: 300, Reverse: 0, Forensics: 220, Pwn: 0 }
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
    challengeTitle: "The Oracle's Echo",
    category: 'Crypto',
    points: 500,
    timestamp: '4m ago',
    isFirstBlood: true
  },
  {
    id: 'act-2',
    teamName: 'KernelPanic',
    challengeTitle: 'Operation Blind Sight',
    category: 'Web',
    points: 450,
    timestamp: '11m ago',
    isFirstBlood: true
  },
  {
    id: 'act-3',
    teamName: 'CipherKnights',
    challengeTitle: 'Echo Chamber',
    category: 'Pwn',
    points: 480,
    timestamp: '18m ago',
    isFirstBlood: true
  },
  {
    id: 'act-4',
    teamName: 'NullSquad',
    challengeTitle: 'Enigma Core',
    category: 'Reverse',
    points: 460,
    timestamp: '27m ago',
    isFirstBlood: true
  },
  {
    id: 'act-5',
    teamName: 'ByteBrigade',
    challengeTitle: 'Ghost in the RAM',
    category: 'Forensics',
    points: 420,
    timestamp: '35m ago',
    isFirstBlood: true
  }
];
