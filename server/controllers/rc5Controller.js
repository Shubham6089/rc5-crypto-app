const crypto = require('crypto');
const { keyExpansion, encryptBlock, decryptBlock, encryptCBC,decryptCBC} = require('../utils/rc5Engine');
exports.encryptData = (req, res) => {
    const { plaintextA, plaintextB, keyHex, w, r, b } = req.body;
    try {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== b) throw new Error(`Expected ${b} bytes, got ${keyBuffer.length}.`);
        
        const S = keyExpansion(keyBuffer, w, r);
        const ptA = parseInt(plaintextA, 16);
        const ptB = parseInt(plaintextB, 16);
        
        const startTime = process.hrtime();
        const { A, B, history } = encryptBlock(ptA, ptB, S, w, r);
        const diff = process.hrtime(startTime);
        const hexPadding = w === 16 ? 4 : 8;

        res.json({
            ciphertextA: (A >>> 0).toString(16).padStart(hexPadding, '0'),
            ciphertextB: (B >>> 0).toString(16).padStart(hexPadding, '0'),
            executionTimeMs: (diff[0] * 1e9 + diff[1]) / 1e6,
            history,
            sArray: Array.from(S).map(val => (val >>> 0).toString(16).padStart(hexPadding, '0')) // Send S-Array
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.decryptData = (req, res) => {
    const { ciphertextA, ciphertextB, keyHex, w, r, b } = req.body;
    try {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== b) throw new Error(`Expected ${b} bytes, got ${keyBuffer.length}.`);
        
        const S = keyExpansion(keyBuffer, w, r);
        const ctA = parseInt(ciphertextA, 16);
        const ctB = parseInt(ciphertextB, 16);
        
        const startTime = process.hrtime();
        const { A, B, history } = decryptBlock(ctA, ctB, S, w, r);
        const diff = process.hrtime(startTime);
        const hexPadding = w === 16 ? 4 : 8;

        res.json({
            plaintextA: (A >>> 0).toString(16).padStart(hexPadding, '0'),
            plaintextB: (B >>> 0).toString(16).padStart(hexPadding, '0'),
            executionTimeMs: (diff[0] * 1e9 + diff[1]) / 1e6,
            history,
            sArray: Array.from(S).map(val => (val >>> 0).toString(16).padStart(hexPadding, '0')) // Send S-Array
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.generateKey = (req, res) => {
    const { bytes } = req.body;
    res.json({ key: crypto.randomBytes(bytes).toString('hex') });
};
exports.encryptCBCData = (req, res) => {
    const { plaintextHex, keyHex, ivHex, w, r, b } = req.body;
    try {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== b) throw new Error(`Expected ${b} bytes for key.`);

        const startTime = process.hrtime();
        // Call the CBC math engine
        const ciphertext = encryptCBC(plaintextHex, keyBuffer, ivHex, w, r);
        const diff = process.hrtime(startTime);

        res.json({
            ciphertext: ciphertext,
            executionTimeMs: (diff[0] * 1e9 + diff[1]) / 1e6
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.decryptCBCData = (req, res) => {
    const { ciphertextHex, keyHex, ivHex, w, r, b } = req.body;
    try {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== b) throw new Error(`Expected ${b} bytes for key.`);
        
        const startTime = process.hrtime();
        const { decryptCBC } = require('../utils/rc5Engine'); // ensure imported
        const plaintext = decryptCBC(ciphertextHex, keyBuffer, ivHex, w, r);
        const diff = process.hrtime(startTime);

        res.json({
            plaintext: plaintext,
            executionTimeMs: (diff[0] * 1e9 + diff[1]) / 1e6
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};