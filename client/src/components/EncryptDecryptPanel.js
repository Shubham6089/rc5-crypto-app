import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const textToHex = (text) => Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
const hexToText = (hex) => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    let charCode = parseInt(hex.substr(i, 2), 16);
    if (charCode !== 0) str += String.fromCharCode(charCode); 
  }
  return str;
};

const EncryptDecryptPanel = ({ config, setSimulationData }) => {
  const [action, setAction] = useState('encrypt'); 
  const [cipherMode, setCipherMode] = useState('CBC'); 
  
  const [inputA, setInputA] = useState('00000000');
  const [inputB, setInputB] = useState('00000000');
  const [longInput, setLongInput] = useState(''); 
  const [ivHex, setIvHex] = useState('0000000000000000'); 
  const [keyHex, setKeyHex] = useState('000102030405060708090A0B0C0D0E0F');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleHexInput = (setter) => (e) => setter(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase());
  const handleTextInput = (setter) => (e) => setter(e.target.value); 

  const handleGenerateKey = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/generate-key`, { bytes: config.b });
      setKeyHex(response.data.key.toUpperCase());
      toast.success("Secure Key Generated!");
    } catch (error) { toast.error("Key generation failed."); }
  };

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (cipherMode === 'ECB') {
        const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
        const payload = action === 'encrypt' 
          ? { plaintextA: inputA, plaintextB: inputB, keyHex, w: config.w, r: config.r, b: config.b }
          : { ciphertextA: inputA, ciphertextB: inputB, keyHex, w: config.w, r: config.r, b: config.b };
          
        const response = await axios.post(`${API_URL}${endpoint}`, payload);
        setResult(response.data);
        setSimulationData({ totalRounds: config.r, rounds: response.data.history, sArray: response.data.sArray, mode: action });
        toast.success(`ECB ${action}ion Complete!`);
      } else {
        const endpoint = action === 'encrypt' ? '/api/encrypt-cbc' : '/api/decrypt-cbc';
        const hexPayload = action === 'encrypt' ? textToHex(longInput) : longInput;
        
        const payload = action === 'encrypt'
          ? { plaintextHex: hexPayload, keyHex, ivHex, w: config.w, r: config.r, b: config.b }
          : { ciphertextHex: hexPayload, keyHex, ivHex, w: config.w, r: config.r, b: config.b };
          
        const response = await axios.post(`${API_URL}${endpoint}`, payload);
        
        let finalOutputData = action === 'encrypt' ? response.data.ciphertext : hexToText(response.data.plaintext);
        setResult({ isCBC: true, outputData: finalOutputData, executionTimeMs: response.data.executionTimeMs });
        setSimulationData(null); 
        toast.success(`CBC Bulk ${action}ion Complete!`);
      }
    } catch (error) { toast.error(`${action} failed. Check backend connection.`); } 
    finally { setIsLoading(false); }
  };

  const downloadReport = () => {
    if (!result) return;
    
    let reportContent = `=========================================
      RC5-${config.w}/${config.r}/${config.b} CRYPTOGRAPHIC REPORT
=========================================
Mode: ${cipherMode} (${action.toUpperCase()})
Execution Time: ${result.executionTimeMs} ms

--- CONFIGURATION ---
Word Size (w): ${config.w} bits
Rounds (r): ${config.r}
Key Length (b): ${config.b} bytes
Secret Key: ${keyHex}
`;

    if (cipherMode === 'ECB') {
      reportContent += `
--- INPUTS (HEX) ---
Block A: ${inputA}
Block B: ${inputB}

--- OUTPUTS (HEX) ---
Block A: ${action === 'encrypt' ? result.ciphertextA : result.plaintextA}
Block B: ${action === 'encrypt' ? result.ciphertextB : result.plaintextB}

--- EXPANDED SUBKEY ARRAY (S) ---
${result.sArray.map((s, i) => `S[${i}]: ${s}`).join('\n')}
`;
    } else {
      reportContent += `
Initialization Vector (IV): ${ivHex}

--- INPUT ---
${longInput}

--- OUTPUT ---
${result.outputData}
`;
    }
    reportContent += `=========================================`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RC5_${cipherMode}_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="glass-panel">
      {/* Used the new button-group class here */}
      <div className="button-group">
        <button className={action === 'encrypt' ? 'btn-primary' : 'btn-outline'} onClick={() => {setAction('encrypt'); setResult(null); setLongInput('');}}>Encrypt</button>
        <button className={action === 'decrypt' ? 'btn-primary' : 'btn-outline'} onClick={() => {setAction('decrypt'); setResult(null); setLongInput('');}}>Decrypt</button>
      </div>

      <div className="button-group">
        <button className={cipherMode === 'ECB' ? 'btn-outline' : 'btn-outline'} style={{borderColor: cipherMode === 'ECB' ? 'var(--accent-primary)' : ''}} onClick={() => {setCipherMode('ECB'); setResult(null);}}>ECB Mode (Visual)</button>
        <button className={cipherMode === 'CBC' ? 'btn-outline' : 'btn-outline'} style={{borderColor: cipherMode === 'CBC' ? 'var(--accent-primary)' : ''}} onClick={() => {setCipherMode('CBC'); setResult(null);}}>CBC Mode (Bulk Message)</button>
      </div>

      {cipherMode === 'ECB' ? (
        /* Used the new input-grid class here */
        <div className="input-grid">
          <div className="form-group"><label>{action === 'encrypt' ? 'Plaintext A' : 'Ciphertext A'} (Hex)</label><input type="text" className="input-field" value={inputA} onChange={handleHexInput(setInputA)} /></div>
          <div className="form-group"><label>{action === 'encrypt' ? 'Plaintext B' : 'Ciphertext B'} (Hex)</label><input type="text" className="input-field" value={inputB} onChange={handleHexInput(setInputB)} /></div>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>{action === 'encrypt' ? 'Type your message (Standard Text)' : 'Paste your Ciphertext (Hex)'}</label>
            <textarea className="input-field" rows="3" value={longInput} onChange={action === 'encrypt' ? handleTextInput(setLongInput) : handleHexInput(setLongInput)} />
          </div>
          <div className="form-group">
            <label>Initialization Vector (IV - Hex)</label>
            <input type="text" className="input-field" value={ivHex} onChange={handleHexInput(setIvHex)} />
          </div>
        </>
      )}

      <div className="form-group">
        {/* Used the new key-label-row class here */}
        <label className="key-label-row">
          Secret Key (Hex)
          <span style={{ cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={handleGenerateKey}>⚡ Generate</span>
        </label>
        <input type="text" className="input-field" value={keyHex} onChange={handleHexInput(setKeyHex)} />
      </div>

      <button className="btn-primary" onClick={handleAction} disabled={isLoading}>
        {isLoading ? '⏳ Processing...' : `Execute ${cipherMode} ${action === 'encrypt' ? 'Encryption' : 'Decryption'}`}
      </button>

      {result && (
        <div className="results-box">
          <h3>✅ {cipherMode} {action === 'encrypt' ? 'Encryption' : 'Decryption'} Complete</h3>
          {result.isCBC ? (
            <div className="result-row">
              <span className="result-label">
                {action === 'encrypt' ? 'Encrypted Hex: ' : 'Decrypted Message: '}<br/><br/>
                <span style={{color: action === 'encrypt' ? 'var(--accent-primary)' : 'var(--success)', fontSize: '1.1rem'}}>{result.outputData}</span>
              </span>
            </div>
          ) : (
            <>
              <div className="result-row"><span className="result-label">Result A:</span><span className="result-value">{action === 'encrypt' ? result.ciphertextA : result.plaintextA}</span></div>
              <div className="result-row"><span className="result-label">Result B:</span><span className="result-value">{action === 'encrypt' ? result.ciphertextB : result.plaintextB}</span></div>
            </>
          )}
          <div className="result-row" style={{marginTop: '15px'}}><span className="result-label">Execution Time:</span><span className="result-value">{result.executionTimeMs} ms</span></div>
          
          <button className="btn-outline" style={{ marginTop: '20px', width: '100%' }} onClick={downloadReport}>
            📄 Download Detailed Report
          </button>
        </div>
      )}
    </div>
  );
};

export default EncryptDecryptPanel;