const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    operationType: { type: String, enum: ['ENCRYPT', 'DECRYPT'], required: true },
    plaintext: { type: String, required: true },
    ciphertext: { type: String, required: true },
    keyUsed: { type: String, required: true },
    rounds: { type: Number, default: 12 },
    timestamp: { type: Date, default: Date.now },
    executionTimeMs: { type: Number }
});

module.exports = mongoose.model('History', historySchema);