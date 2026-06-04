import React from 'react';

const ConfigurationForm = ({ config, setConfig }) => {
  return (
    <div className="glass-panel">
      <h2>⚙️ Parameters</h2>
      
      <div className="form-group">
        <label>Word Size (w) in bits</label>
        <select 
          className="input-field"
          value={config.w} 
          onChange={(e) => setConfig({...config, w: parseInt(e.target.value)})}
        >
          <option value={16}>16-bit (w=16)</option>
          <option value={32}>32-bit (w=32)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Rounds (r) [0-255]</label>
        <input 
          type="number" 
          className="input-field"
          min="0" max="255"
          value={config.r} 
          onChange={(e) => setConfig({...config, r: parseInt(e.target.value)})} 
        />
      </div>

      <div className="form-group">
        <label>Key Length (b) in bytes</label>
        <input 
          type="number" 
          className="input-field"
          min="0" max="255"
          value={config.b} 
          onChange={(e) => setConfig({...config, b: parseInt(e.target.value)})} 
        />
        <span className="form-note">
          Requires exactly {config.b * 2} hexadecimal characters.
        </span>
      </div>
    </div>
  );
};

export default ConfigurationForm;