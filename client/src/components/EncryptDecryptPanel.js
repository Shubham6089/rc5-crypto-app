import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';

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

const EncryptDecryptPanel = ({ config, setConfig, setSimulationData }) => {
  const [action, setAction] = useState('encrypt'); 
  const [cipherMode, setCipherMode] = useState('CBC'); 
  const [inputType, setInputType] = useState('text');
  
  const [inputA, setInputA] = useState('00000000');
  const [inputB, setInputB] = useState('00000000');
  const [longInput, setLongInput] = useState(''); 
  const [ivHex, setIvHex] = useState('0000000000000000'); 
  const [keyHex, setKeyHex] = useState('000102030405060708090A0B0C0D0E0F');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const fileInputRef = useRef(null);

  // --- UPDATED QR SCANNER: Now absorbs the image data from the URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') === 'true') {
      setAction('decrypt');
      setCipherMode(params.get('cipherMode') || 'CBC');
      setKeyHex(params.get('key') || '');
      setInputType(params.get('isImage') === 'true' ? 'image' : 'text');
      
      if (setConfig) {
        setConfig({
          w: parseInt(params.get('w')) || config.w,
          r: parseInt(params.get('r')) || config.r,
          b: parseInt(params.get('b')) || config.b
        });
      }

      if (params.get('cipherMode') === 'ECB') {
        setInputA(params.get('cipherA') || '00000000');
        setInputB(params.get('cipherB') || '00000000');
      } else {
        // We now directly inject the massive image cipher from the URL!
        setLongInput(params.get('cipher') || '');
        setIvHex(params.get('iv') || '0000000000000000');
      }

      toast.info("📱 Intercepted! Parameters & Data loaded automatically.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHexInput = (setter) => (e) => { setter(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()); setShowQR(false); };
  const handleTextInput = (setter) => (e) => { setter(e.target.value); setShowQR(false); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large! Please use an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLongInput(reader.result); 
      toast.success("File loaded successfully!");
      setShowQR(false);
    };
    
    if (action === 'decrypt') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/generate-key`, { bytes: config.b });
      setKeyHex(response.data.key.toUpperCase());
      toast.success("Secure Key Generated!");
    } catch (error) { toast.error("Key generation failed."); }
  };

  const handleAction = async () => {
    setIsLoading(true);
    setShowQR(false); 
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
        setResult({ isCBC: true, outputData: finalOutputData, executionTimeMs: response.data.executionTimeMs, sArray: response.data.sArray || null });
        setSimulationData(null); 
        toast.success(`CBC Bulk ${action}ion Complete!`);
      }
    } catch (error) { toast.error(`${action} failed. Your file might be too large.`); } 
    finally { setIsLoading(false); }
  };

  // --- UPDATED QR GENERATOR: Forces image data directly into the link ---
  const handleGenerateQR = () => {
    let url = `${window.location.origin}/?share=true&cipherMode=${cipherMode}&key=${keyHex}&w=${config.w}&r=${config.r}&b=${config.b}&isImage=${inputType === 'image'}`;
    
    if (cipherMode === 'ECB') {
      url += `&cipherA=${result.ciphertextA}&cipherB=${result.ciphertextB}`;
    } else {
      url += `&cipher=${result.outputData}&iv=${ivHex}`;
    }
    
    setShareUrl(url);
    setShowQR(true);
  };

  const downloadReport = () => {
    if (!result) return;
    
    if (inputType === 'image' && action === 'encrypt') {
      const blob = new Blob([result.outputData], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Encrypted_Image_Data_${Date.now()}.txt`;
      link.click();
      toast.info("Encrypted Data File downloaded! (Use this if the QR fails)");
      return;
    }

    let reportContent = `=========================================\n      RC5-${config.w}/${config.r}/${config.b} CRYPTOGRAPHIC REPORT\n=========================================\nMode: ${cipherMode} (${action.toUpperCase()})\nExecution Time: ${result.executionTimeMs} ms\n\n--- CONFIGURATION ---\nWord Size (w): ${config.w} bits\nRounds (r): ${config.r}\nKey Length (b): ${config.b} bytes\nSecret Key: ${keyHex}\n`;

    if (cipherMode === 'ECB') {
      reportContent += `\n--- INPUTS (HEX) ---\nBlock A: ${inputA}\nBlock B: ${inputB}\n\n--- OUTPUTS (HEX) ---\nBlock A: ${action === 'encrypt' ? result.ciphertextA : result.plaintextA}\nBlock B: ${action === 'encrypt' ? result.ciphertextB : result.plaintextB}\n`;
    } else {
      reportContent += `\nInitialization Vector (IV): ${ivHex}\n\n--- INPUT ---\n${longInput.substring(0, 50)}...\n\n--- OUTPUT ---\n${result.outputData.substring(0, 50)}...\n`;
    }
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RC5_${cipherMode}_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <>
      <div className="glass-panel">
        <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
          <div className="panel-title" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <span><span style={{ color: 'var(--text-muted)' }}>→</span> ENCRYPTION ENGINE</span>
            
            <div className="toggle-container" style={{ background: 'var(--bg-body)', padding: '5px 10px', borderRadius: '20px' }}>
              <span className="toggle-label" style={{ color: inputType === 'text' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setInputType('text'); setLongInput(''); setResult(null); setShowQR(false);}}>Text</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={inputType === 'image'} onChange={() => {setInputType(inputType === 'text' ? 'image' : 'text'); setLongInput(''); setResult(null); setShowQR(false);}} />
                <span className="slider"></span>
              </label>
              <span className="toggle-label" style={{ color: inputType === 'image' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setInputType('image'); setLongInput(''); setResult(null); setShowQR(false);}}>Image</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', width: '100%' }}>
            <div className="toggle-container">
              <span className="toggle-label" style={{ color: action === 'encrypt' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setAction('encrypt'); setResult(null); setLongInput(''); setShowQR(false);}}>Encrypt</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={action === 'decrypt'} onChange={() => {setAction(action === 'encrypt' ? 'decrypt' : 'encrypt'); setResult(null); setLongInput(''); setShowQR(false);}} />
                <span className="slider"></span>
              </label>
              <span className="toggle-label" style={{ color: action === 'decrypt' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setAction('decrypt'); setResult(null); setLongInput(''); setShowQR(false);}}>Decrypt</span>
            </div>
            
            {inputType === 'text' && (
              <div className="toggle-container">
                <span className="toggle-label" style={{ color: cipherMode === 'ECB' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setCipherMode('ECB'); setResult(null); setShowQR(false);}}>ECB Mode</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={cipherMode === 'CBC'} onChange={() => {setCipherMode(cipherMode === 'ECB' ? 'CBC' : 'ECB'); setResult(null); setShowQR(false);}} />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label" style={{ color: cipherMode === 'CBC' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => {setCipherMode('CBC'); setResult(null); setShowQR(false);}}>CBC Mode</span>
              </div>
            )}
          </div>
        </div>

        {inputType === 'text' ? (
          cipherMode === 'ECB' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group"><label>{action === 'encrypt' ? 'Plaintext A' : 'Ciphertext A'} (Hex)</label><input type="text" className="input-field" value={inputA} onChange={handleHexInput(setInputA)} /></div>
              <div className="form-group"><label>{action === 'encrypt' ? 'Plaintext B' : 'Ciphertext B'} (Hex)</label><input type="text" className="input-field" value={inputB} onChange={handleHexInput(setInputB)} /></div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>{action === 'encrypt' ? 'TYPE YOUR MESSAGE (Standard Text)' : 'PASTE YOUR CIPHERTEXT (Hex)'}</label>
                <textarea className="input-field" rows="3" value={longInput} onChange={action === 'encrypt' ? handleTextInput(setLongInput) : handleHexInput(setLongInput)} />
              </div>
              <div className="form-group"><label>Initialization Vector (IV - Hex)</label><input type="text" className="input-field" value={ivHex} onChange={handleHexInput(setIvHex)} /></div>
            </>
          )
        ) : (
          <>
            <div className="form-group">
              <label>{action === 'encrypt' ? 'UPLOAD TINY IMAGE (Under 100KB for QR Code to work)' : 'WAITING FOR QR SCAN...'}</label>
              
              {action === 'encrypt' && (
                <>
                  <div 
                    style={{ border: '2px dashed var(--border-light)', padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--bg-body)' }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {longInput ? '✅ Tiny Image Loaded!' : '📁 Click here to select a TINY image'}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </>
              )}
              
              {longInput && longInput.startsWith('data:image') && (
                 <img src={longInput} alt="Preview" style={{ marginTop: '15px', maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-light)', margin: '15px auto', display: 'block' }} />
              )}
            </div>
            <div className="form-group"><label>Initialization Vector (IV - Hex)</label><input type="text" className="input-field" value={ivHex} onChange={handleHexInput(setIvHex)} /></div>
          </>
        )}

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Secret Key (Hex)
            <span style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }} onClick={handleGenerateKey}>⚡ Generate</span>
          </label>
          <input type="text" className="input-field" value={keyHex} onChange={handleHexInput(setKeyHex)} />
        </div>

        <button className="btn-primary" onClick={handleAction} disabled={isLoading || (inputType === 'image' && !longInput && action === 'encrypt')}>
          {isLoading ? '⏳ PROCESSING...' : `EXECUTE RC5 ${action === 'encrypt' ? 'ENCRYPTION' : 'DECRYPTION'}`}
        </button>

        {result && (
          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginTop: '0', color: 'var(--primary)', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>✅ {cipherMode} {action === 'encrypt' ? 'Encryption' : 'Decryption'} Complete</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{result.executionTimeMs} ms</span>
            </h3>
            
            {result.isCBC ? (
              <div style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '15px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {action === 'encrypt' ? 'Encrypted Data:' : 'Decrypted Output:'}
                </div>
                
                {action === 'decrypt' && inputType === 'image' && result.outputData.startsWith('data:image') ? (
                  <img src={result.outputData} alt="Decrypted Secret" style={{ maxWidth: '100%', borderRadius: '8px', border: '2px solid var(--primary)' }} />
                ) : (
                  <div style={{ maxHeight: '100px', overflowY: 'auto', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                    {action === 'encrypt' ? result.outputData.toUpperCase() : result.outputData}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', fontFamily: 'var(--font-mono)' }}>
                <div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Result A:</div>{action === 'encrypt' ? result.ciphertextA.toUpperCase() : result.plaintextA.toUpperCase()}</div>
                <div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Result B:</div>{action === 'encrypt' ? result.ciphertextB.toUpperCase() : result.plaintextB.toUpperCase()}</div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }} onClick={downloadReport}>
                📄 Download Backup File
              </button>
              
              {action === 'encrypt' && (
                <button style={{ flex: 1, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }} onClick={handleGenerateQR}>
                  📱 Force Image into QR
                </button>
              )}
            </div>

            {showQR && (
              <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px', backgroundColor: 'var(--bg-surface)', border: '2px dashed var(--primary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '15px' }}>
                  Warning: If you used a large image, this QR will be unreadable!<br/>Scan to magically transmit the image.
                </p>
                <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <QRCodeCanvas value={shareUrl} size={256} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {result && result.sArray && (
         <div className="glass-panel" style={{ marginTop: '25px', padding: '0', overflow: 'hidden' }}>
          <div className="panel-header" style={{ padding: '20px', marginBottom: '0', borderBottom: '1px solid var(--border-light)' }}>
            <div className="panel-title">KEY EXPANSION VISUALIZATION</div>
          </div>
          
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Formula / Operation</th>
                  <th>Resulting Subkey (Hex)</th>
                </tr>
              </thead>
              <tbody>
                {result.sArray.map((val, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'active' : ''}>
                    <td>{i}</td>
                    <td>S[{i}] = S[{i > 0 ? i - 1 : 0}] + Q_w</td>
                    <td style={{ color: 'var(--text-main)' }}>0x{val.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default EncryptDecryptPanel;