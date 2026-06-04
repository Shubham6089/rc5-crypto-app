import React, { useEffect, useRef, useState } from 'react';

const CanvasVisualizer = ({ simulationData }) => {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(-1);

  useEffect(() => { setStep(-1); }, [simulationData]);

  useEffect(() => {
    if (!simulationData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawGrid = () => {
      ctx.strokeStyle = '#2d3748'; // Subtle dark slate grid lines
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
        ctx.font = 'bold 24px Inter';
        ctx.fillStyle = '#f8fafc'; // Crisp White
        ctx.textAlign = 'center';
        ctx.fillText(`Key Expansion (S-Array)`, canvas.width / 2, 40);
        
        ctx.font = '14px Inter';
        ctx.fillStyle = '#94a3b8'; // Muted Slate
        ctx.fillText(`The Secret Key was mixed with Magic Constants to create ${simulationData.sArray.length} subkeys.`, canvas.width / 2, 70);

        ctx.font = '16px JetBrains Mono';
        ctx.textAlign = 'left'; 
        const cols = 4;
        
        simulationData.sArray.forEach((val, i) => {
          const x = 70 + (i % cols) * 180; 
          const y = 120 + Math.floor(i / cols) * 40;
          
          ctx.fillStyle = '#94a3b8'; // Muted Slate for index
          ctx.fillText(`S[${i}]`, x, y);
          
          ctx.fillStyle = '#3b82f6'; // Cyber Blue for the Hex value
          ctx.fillText(val.toUpperCase(), x + 60, y); 
        });
        return;
      }

      // --- PHASE 2: Round Simulation View ---
      const currentRound = simulationData.rounds[step] || simulationData.rounds[0];
      const isDecrypt = simulationData.mode === 'decrypt';
      
      ctx.font = 'bold 20px Inter';
      ctx.fillStyle = '#f8fafc'; // Crisp White
      ctx.textAlign = 'center';
      ctx.fillText(`Round ${currentRound.roundIndex} (Mode: ${simulationData.mode.toUpperCase()})`, canvas.width / 2, 50);

      // Block A
      ctx.fillStyle = '#1a222f'; // Dark surface panel
      ctx.strokeStyle = '#3b82f6'; // Cyber blue border
      ctx.lineWidth = 2;
      ctx.fillRect(150, 120, 200, 80);
      ctx.strokeRect(150, 120, 200, 80);
      
      ctx.fillStyle = '#94a3b8'; // Muted label
      ctx.font = '14px Inter';
      ctx.fillText('Block A (Hex)', 250, 145);
      
      ctx.fillStyle = '#f8fafc'; // Crisp White value
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.fillText(currentRound.A.toUpperCase(), 250, 175);

      // Block B
      ctx.fillStyle = '#1a222f'; 
      ctx.strokeStyle = '#3b82f6'; 
      ctx.lineWidth = 2;
      ctx.fillRect(450, 120, 200, 80);
      ctx.strokeRect(450, 120, 200, 80);

      ctx.fillStyle = '#94a3b8'; 
      ctx.font = '14px Inter';
      ctx.fillText('Block B (Hex)', 550, 145);
      
      ctx.fillStyle = '#f8fafc'; 
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.fillText(currentRound.B.toUpperCase(), 550, 175);

      // Math Formulas
      ctx.fillStyle = '#94a3b8'; // Muted slate for formulas
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
      
      <div className="canvas-wrapper" style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <canvas ref={canvasRef} width={800} height={400} style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} />
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