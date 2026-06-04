import React, { useEffect, useRef, useState } from 'react';

const CanvasVisualizer = ({ simulationData }) => {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(-1);

  useEffect(() => { setStep(-1); }, [simulationData]);

  useEffect(() => {
    if (!simulationData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Hardcoding ultra-bright colors to override any browser defaults
    const COLOR_WHITE = '#FFFFFF';
    const COLOR_BLUE = '#60A5FA'; // Bright cyber blue
    const COLOR_MUTED = '#94A3B8'; // Light slate
    const COLOR_GRID = '#334155'; // Visible grid lines

    const drawGrid = () => {
      ctx.strokeStyle = COLOR_GRID; 
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }
    };

    const drawState = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      // --- PHASE 1: Key Expansion View ---
      if (step === -1) {
        ctx.font = 'bold 24px sans-serif'; // Using safe fallback fonts
        ctx.fillStyle = COLOR_WHITE; 
        ctx.textAlign = 'center';
        ctx.fillText(`Key Expansion (S-Array)`, canvas.width / 2, 40);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = COLOR_MUTED; 
        ctx.fillText(`The Secret Key was mixed with Magic Constants to create ${simulationData.sArray.length} subkeys.`, canvas.width / 2, 70);

        ctx.font = '16px monospace';
        ctx.textAlign = 'left'; 
        const cols = 4;
        
        simulationData.sArray.forEach((val, i) => {
          const x = 70 + (i % cols) * 180; 
          const y = 120 + Math.floor(i / cols) * 40;
          
          ctx.fillStyle = COLOR_MUTED; 
          ctx.fillText(`S[${i}]`, x, y);
          
          ctx.fillStyle = COLOR_BLUE; 
          ctx.fillText(val.toUpperCase(), x + 60, y); 
        });
        return;
      }

      // --- PHASE 2: Round Simulation View ---
      const currentRound = simulationData.rounds[step] || simulationData.rounds[0];
      const isDecrypt = simulationData.mode === 'decrypt';
      
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = COLOR_WHITE; 
      ctx.textAlign = 'center';
      ctx.fillText(`Round ${currentRound.roundIndex} (Mode: ${simulationData.mode.toUpperCase()})`, canvas.width / 2, 50);

      // Block A
      ctx.fillStyle = '#0F172A'; // Very dark background for the box
      ctx.strokeStyle = COLOR_BLUE; 
      ctx.lineWidth = 2;
      ctx.fillRect(150, 120, 200, 80);
      ctx.strokeRect(150, 120, 200, 80);
      
      ctx.fillStyle = COLOR_MUTED; 
      ctx.font = '14px sans-serif';
      ctx.fillText('Block A (Hex)', 250, 145);
      
      ctx.fillStyle = COLOR_WHITE; 
      ctx.font = 'bold 20px monospace';
      ctx.fillText(currentRound.A.toUpperCase(), 250, 175);

      // Block B
      ctx.fillStyle = '#0F172A'; 
      ctx.strokeStyle = COLOR_BLUE; 
      ctx.lineWidth = 2;
      ctx.fillRect(450, 120, 200, 80);
      ctx.strokeRect(450, 120, 200, 80);

      ctx.fillStyle = COLOR_MUTED; 
      ctx.font = '14px sans-serif';
      ctx.fillText('Block B (Hex)', 550, 145);
      
      ctx.fillStyle = COLOR_WHITE; 
      ctx.font = 'bold 20px monospace';
      ctx.fillText(currentRound.B.toUpperCase(), 550, 175);

      // Math Formulas
      ctx.fillStyle = COLOR_MUTED; 
      ctx.font = '16px monospace';
      if (isDecrypt) {
        ctx.fillText(`B = ((B - S[2i+1]) >>> A) ⊕ A`, canvas.width / 2, 280);
        ctx.fillText(`A = ((A - S[2i]) >>> B) ⊕ B`, canvas.width / 2, 320);
      } else {
        ctx.fillText(`A = ((A ⊕ B) ≪ B) + S[2i]`, canvas.width / 2, 280);
        ctx.fillText(`B = ((B ⊕ A) ≪ A) + S[2i+1]`, canvas.width / 2, 320);
      }
    };

    // Small delay ensures fonts and layout are ready before drawing
    setTimeout(drawState, 50);

  }, [simulationData, step]);

  if (!simulationData) return null;

  return (
    // Added boxSizing and maxWidth to prevent mobile stretching
    <div className="glass-panel" style={{ marginTop: '25px', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">
           <span style={{ color: 'var(--text-muted)' }}>→</span> INTERNAL VISUALIZATION (ECB)
        </div>
      </div>
      
      {/* Bulletproof Mobile Scroll Wrapper */}
      <div 
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          marginBottom: '20px',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '10px'
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          style={{ display: 'block', minWidth: '800px', margin: '0 auto', backgroundColor: 'transparent' }} 
        />
      </div>
      
      <div className="canvas-controls" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', textTransform: 'uppercase' }} 
          onClick={() => setStep(Math.max(-1, step - 1))}
        >
          ◀ Previous Step
        </button>
        <button 
          style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', textTransform: 'uppercase' }} 
          onClick={() => setStep(Math.min(simulationData.rounds.length - 1, step + 1))}
        >
          Next Step ▶
        </button>
      </div>
    </div>
  );
};

export default CanvasVisualizer;