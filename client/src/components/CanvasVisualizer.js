import React, { useEffect, useRef, useState } from 'react';

const CanvasVisualizer = ({ simulationData }) => {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(-1); // -1 is Key Expansion View, 0+ are rounds

  // Reset to Key Expansion view whenever new data comes in
  useEffect(() => { setStep(-1); }, [simulationData]);

  useEffect(() => {
    if (!simulationData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawGrid = () => {
      ctx.strokeStyle = '#F1F5F9'; // Soft slate-50 for a clean, subtle grid
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

      // --- PHASE 1: Key Expansion Visualizer ---
      if (step === -1) {
        ctx.font = 'bold 24px Inter';
        ctx.fillStyle = '#0F172A'; // Dark Navy Title
        ctx.textAlign = 'center';
        ctx.fillText(`Key Expansion (S-Array)`, canvas.width / 2, 40);
        
        ctx.font = '14px Inter';
        ctx.fillStyle = '#64748B'; // Muted slate subtitle
        ctx.fillText(`The Secret Key was mixed with Magic Constants to create ${simulationData.sArray.length} subkeys.`, canvas.width / 2, 70);

        ctx.font = '16px JetBrains Mono';
        ctx.textAlign = 'left'; // Forces text to align normally
        const cols = 4;
        
        simulationData.sArray.forEach((val, i) => {
          const x = 70 + (i % cols) * 180; // Spread out the columns
          const y = 120 + Math.floor(i / cols) * 40;
          
          ctx.fillStyle = '#64748B'; // Slate gray for the index (S[0])
          ctx.fillText(`S[${i}]`, x, y);
          
          ctx.fillStyle = '#0F172A'; // Bold navy for the hex value
          ctx.fillText(val.toUpperCase(), x + 60, y); // Pushed the hex value to the right
        });
        return;
      }

      // --- PHASE 2: Round Simulation ---
      const currentRound = simulationData.rounds[step] || simulationData.rounds[0];
      const isDecrypt = simulationData.mode === 'decrypt';
      
      ctx.font = 'bold 20px Inter';
      ctx.fillStyle = '#0F172A'; // Dark Navy
      ctx.textAlign = 'center';
      ctx.fillText(`Round ${currentRound.roundIndex} (Mode: ${simulationData.mode.toUpperCase()})`, canvas.width / 2, 50);

      // Block A
      ctx.shadowBlur = 0; // Removed neon glow
      ctx.fillStyle = '#FFFFFF'; // Clean white background
      ctx.strokeStyle = '#CBD5E1'; // Slate-300 border
      ctx.lineWidth = 2;
      ctx.fillRect(150, 120, 200, 80);
      ctx.strokeRect(150, 120, 200, 80);
      
      ctx.fillStyle = '#64748B'; // Muted label
      ctx.font = '14px Inter';
      ctx.fillText('Block A (Hex)', 250, 145);
      
      ctx.fillStyle = '#0F172A'; // Bold Navy value
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.fillText(currentRound.A.toUpperCase(), 250, 175);

      // Block B
      ctx.fillStyle = '#FFFFFF'; 
      ctx.strokeStyle = '#CBD5E1'; 
      ctx.lineWidth = 2;
      ctx.fillRect(450, 120, 200, 80);
      ctx.strokeRect(450, 120, 200, 80);

      ctx.fillStyle = '#64748B'; 
      ctx.font = '14px Inter';
      ctx.fillText('Block B (Hex)', 550, 145);
      
      ctx.fillStyle = '#0F172A'; 
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.fillText(currentRound.B.toUpperCase(), 550, 175);

      // Math Formulas (Changes based on Encrypt/Decrypt)
      ctx.fillStyle = '#64748B'; // Muted slate for formulas
      ctx.font = '16px JetBrains Mono';
      if (isDecrypt) {
        ctx.fillText(`B = ((B - S[2i+1]) >>> A) ⊕ A`, canvas.width / 2, 280);
        ctx.fillText(`A = ((A - S[2i]) >>> B) ⊕ B`, canvas.width / 2, 320);
      } else {
        ctx.fillText(`A = ((A ⊕ B) ≪ B) + S[2i]`, canvas.width / 2, 280);
        ctx.fillText(`B = ((B ⊕ A) ≪ A) + S[2i+1]`, canvas.width / 2, 320);
      }
    };

    drawState();
  }, [simulationData, step]);

  if (!simulationData) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '25px' }}>
      <div className="panel-header">
        <div className="panel-title">
           <span style={{ color: 'var(--text-muted)' }}>→</span> INTERNAL VISUALIZATION (ECB)
        </div>
      </div>
      
      {/* 
        THE MOBILE FIX: 
        1. width: 100% prevents the box from breaking the phone screen.
        2. overflowX: 'auto' enables horizontal scrolling.
        3. WebkitOverflowScrolling makes the swiping smooth on iPhones.
      */}
      <div 
        className="canvas-wrapper" 
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          marginBottom: '20px',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '10px' // Space for the scrollbar
        }}
      >
        {/* minWidth: '800px' forces it to stay large so text remains readable */}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          style={{ display: 'block', minWidth: '800px', margin: '0 auto' }} 
        />
      </div>
      
      <div className="canvas-controls" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
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