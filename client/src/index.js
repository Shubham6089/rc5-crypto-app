import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This finds the <div id="root"></div> in your index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// This takes your entire App component and injects it into that div
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);