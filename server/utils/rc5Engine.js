/**
 * RC5 Algorithm Implementation 
 * Supports dynamic w (16 or 32), r, and b.
 */

// Magic constants for w=16
const P16 = 0xB7E1;
const Q16 = 0x9E37;

// Magic constants for w=32
const P32 = 0xB7E15163;
const Q32 = 0x9E3779B9;

// Helper to get the correct modulo mask based on w
const getMask = (w) => (w === 16) ? 0xFFFF : 0xFFFFFFFF;

// Circular Left Shift
const rotl = (x, y, w) => {
    const shift = y & (w - 1);
    const mask = getMask(w);
    return (((x << shift) | (x >>> (w - shift))) & mask) >>> 0;
};

// Circular Right Shift
const rotr = (x, y, w) => {
    const shift = y & (w - 1);
    const mask = getMask(w);
    return (((x >>> shift) | (x << (w - shift))) & mask) >>> 0;
};

const keyExpansion = (keyBuffer, w, r) => {
    const b = keyBuffer.length;
    const u = w / 8;
    const c = Math.ceil(Math.max(b, 1) / u);
    const L = new Uint32Array(c);
    const mask = getMask(w);

    // Select Magic Constants based on w
    const P = w === 16 ? P16 : P32;
    const Q = w === 16 ? Q16 : Q32;

    // Copy key into L
    for (let i = b - 1; i >= 0; i--) {
        L[Math.floor(i / u)] = ((L[Math.floor(i / u)] << 8) + keyBuffer[i]) & mask;
    }

    const t = 2 * (r + 1);
    const S = new Uint32Array(t);
    S[0] = P;
    for (let i = 1; i < t; i++) {
        S[i] = (S[i - 1] + Q) & mask;
    }

    let i = 0, j = 0, A = 0, B = 0;
    const mixRounds = 3 * Math.max(t, c);

    for (let k = 0; k < mixRounds; k++) {
        A = S[i] = rotl((S[i] + A + B) & mask, 3, w);
        B = L[j] = rotl((L[j] + A + B) & mask, (A + B) & mask, w);
        i = (i + 1) % t;
        j = (j + 1) % c;
    }

    return S;
};

const encryptBlock = (ptA, ptB, S, w, r) => {
    const mask = getMask(w);
    
    let A = (ptA + S[0]) & mask;
    let B = (ptB + S[1]) & mask;
    let history = [{ roundIndex: 0, A: (A >>> 0).toString(16), B: (B >>> 0).toString(16) }];

    for (let i = 1; i <= r; i++) {
        A = (rotl((A ^ B) & mask, B, w) + S[2 * i]) & mask;
        B = (rotl((B ^ A) & mask, A, w) + S[2 * i + 1]) & mask;
       history.push({ roundIndex: i, A: (A >>> 0).toString(16), B: (B >>> 0).toString(16) });
    
    }

    return { A, B, history };
};

module.exports = { keyExpansion, encryptBlock };
// Add this below encryptBlock
const decryptBlock = (ctA, ctB, S, w, r) => {
    const mask = getMask(w);
    let A = ctA & mask;
    let B = ctB & mask;
    
    // History array for the visualizer (running in reverse)
    let history = [{ roundIndex: r + 1, A: (A >>> 0).toString(16), B: (B >>> 0).toString(16) }];

    for (let i = r; i > 0; i--) {
        B = (rotr((B - S[2 * i + 1]) & mask, A, w) ^ A) & mask;
        A = (rotr((A - S[2 * i]) & mask, B, w) ^ B) & mask;
        history.push({ roundIndex: i, A: (A >>> 0).toString(16), B: (B >>> 0).toString(16) });
    }

    B = (B - S[1]) & mask;
    A = (A - S[0]) & mask;
    history.push({ roundIndex: 0, A: (A >>> 0).toString(16), B: (B >>> 0).toString(16) });

    return { A, B, history };
};

// UPDATE your exports to include all three!
module.exports = { keyExpansion, encryptBlock, decryptBlock };
// Add these below decryptBlock

const encryptCBC = (hexData, keyBuffer, ivHex, w, r) => {
    const S = keyExpansion(keyBuffer, w, r);
    const blockSize = w === 16 ? 4 : 8; 
    
    let prevA = parseInt(ivHex.substring(0, blockSize), 16) || 0;
    let prevB = parseInt(ivHex.substring(blockSize, blockSize*2), 16) || 0;
    
    let ciphertext = '';
    
    for (let i = 0; i < hexData.length; i += blockSize * 2) {
        const chunk = hexData.substring(i, i + blockSize * 2).padEnd(blockSize * 2, '0');
        let ptA = parseInt(chunk.substring(0, blockSize), 16);
        let ptB = parseInt(chunk.substring(blockSize, blockSize * 2), 16);
        
        ptA = (ptA ^ prevA) >>> 0;
        ptB = (ptB ^ prevB) >>> 0;
        
        const { A, B } = encryptBlock(ptA, ptB, S, w, r);
        
        // FIX: Added >>> 0 to prevent minus signs in the CBC string
        ciphertext += (A >>> 0).toString(16).padStart(blockSize, '0') + (B >>> 0).toString(16).padStart(blockSize, '0');
        
        prevA = A; 
        prevB = B;
    }
    return ciphertext;
};

const decryptCBC = (hexData, keyBuffer, ivHex, w, r) => {
    const S = keyExpansion(keyBuffer, w, r);
    const blockSize = w === 16 ? 4 : 8; 
    
    let prevA = parseInt(ivHex.substring(0, blockSize), 16) || 0;
    let prevB = parseInt(ivHex.substring(blockSize, blockSize*2), 16) || 0;
    let plaintext = '';
    
    // Sanitize input to remove any accidentally pasted hyphens
    const cleanHex = hexData.replace(/[^0-9A-Fa-f]/g, '');

    for (let i = 0; i < cleanHex.length; i += blockSize * 2) {
        const chunk = cleanHex.substring(i, i + blockSize * 2).padEnd(blockSize * 2, '0');
        let ctA = parseInt(chunk.substring(0, blockSize), 16);
        let ctB = parseInt(chunk.substring(blockSize, blockSize * 2), 16);
        
        const { A, B } = decryptBlock(ctA, ctB, S, w, r);
        
        let ptA = (A ^ prevA) >>> 0;
        let ptB = (B ^ prevB) >>> 0;
        
        // FIX: Added >>> 0 here as well
        plaintext += (ptA >>> 0).toString(16).padStart(blockSize, '0') + (ptB >>> 0).toString(16).padStart(blockSize, '0');
        
        prevA = ctA; 
        prevB = ctB;
    }
    return plaintext;
};

module.exports = { keyExpansion, encryptBlock, decryptBlock, encryptCBC, decryptCBC };