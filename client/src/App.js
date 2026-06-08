import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfigurationForm from './components/ConfigurationForm';
import EncryptDecryptPanel from './components/EncryptDecryptPanel';
import CanvasVisualizer from './components/CanvasVisualizer';
import IndiaClock from './components/IndiaClock'; 
import './App.css';

const App = () => {
  const [rc5Config, setRc5Config] = useState({ w: 32, r: 12, b: 16 });
  const [simulationData, setSimulationData] = useState(null);

  return (
    <div className="app-container">
      <ToastContainer theme="light" position="bottom-right" />
      
      <header className="app-header">
        <IndiaClock /> 
        <h1>RC5 Cryptography Visualizer</h1>
        <p>Interactive Parameterized Block Cipher Simulation</p>
      </header>
      
      <main>
        <div className="main-grid">
          <section>
            <ConfigurationForm config={rc5Config} setConfig={setRc5Config} />
          </section>
          
          <section>
            {/* NEW: setConfig={setRc5Config} is now passed down to allow the QR code to update parameters */}
            <EncryptDecryptPanel 
              config={rc5Config} 
              setConfig={setRc5Config} 
              setSimulationData={setSimulationData} 
            />
          </section>
        </div>
        
        <section>
          <CanvasVisualizer simulationData={simulationData} />
        </section>
      </main>
    </div>
  );
};

export default App;