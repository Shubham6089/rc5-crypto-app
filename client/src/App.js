import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfigurationForm from './components/ConfigurationForm';
import EncryptDecryptPanel from './components/EncryptDecryptPanel';
import CanvasVisualizer from './components/CanvasVisualizer';
import ErrorBoundary from './components/ErrorBoundary';
import IndiaClock from './components/IndiaClock'; // ADD THIS IMPORT
import './App.css';

const App = () => {
  const [rc5Config, setRc5Config] = useState({ w: 32, r: 12, b: 16 });
  const [simulationData, setSimulationData] = useState(null);

  return (
    <div className="app-container">
      {/* Change theme="dark" to theme="light" */}
      <ToastContainer theme="light" position="bottom-right" />
      
      <header className="app-header">
        <IndiaClock /> 
        <h1>RC5 Cryptography Visualizer</h1>
        <p>Interactive Parameterized Block Cipher Simulation</p>
      </header>
      
      <main>
        <div className="main-grid">
          <section><ConfigurationForm config={rc5Config} setConfig={setRc5Config} /></section>
          <section><EncryptDecryptPanel config={rc5Config} setSimulationData={setSimulationData} /></section>
        </div>
        
        <section>
          <ErrorBoundary>
            <CanvasVisualizer simulationData={simulationData} />
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
};

export default App;